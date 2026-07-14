const userModel = require("../models/user.model");
const complaintModel = require("../models/complaint.model");
const serviceRequestModel = require("../models/serviceRequest.model");
const billModel = require("../models/bill.model");
const paymentModel = require("../models/payment.model");
const auditLogModel = require("../models/auditLog.model");

// Admin Dashboard Summary
async function getAdminDashboard(req, res) {
    // 1. Total Residents and Committee members
    const totalResidents = await userModel.countDocuments({ role: "resident", isDeleted: false });
    const totalCommittee = await userModel.countDocuments({ role: "committee_member", isDeleted: false });

    // 2. Complaint counts
    const openComplaints = await complaintModel.countDocuments({ status: "open", isDeleted: false });
    const assignedComplaints = await complaintModel.countDocuments({ status: "assigned", isDeleted: false });
    const resolvedComplaints = await complaintModel.countDocuments({ status: "resolved", isDeleted: false });

    // 3. Service request counts
    const pendingRequests = await serviceRequestModel.countDocuments({ status: { $in: ["open", "assigned"] }, isDeleted: false });
    const progressRequests = await serviceRequestModel.countDocuments({ status: "in_progress", isDeleted: false });
    const completedRequests = await serviceRequestModel.countDocuments({ status: { $in: ["resolved", "closed"] }, isDeleted: false });

    // 4. Financial breakdown (Outstanding Bills & Collected Payments)
    const unpaidBillsAgg = await billModel.aggregate([
        { $match: { status: "unpaid", isDeleted: false } },
        { $group: { _id: null, totalOutstanding: { $sum: "$amount" } } }
    ]);
    const totalOutstanding = unpaidBillsAgg.length > 0 ? unpaidBillsAgg[0].totalOutstanding : 0;

    const collectedPaymentsAgg = await paymentModel.aggregate([
        { $group: { _id: null, totalCollected: { $sum: "$amountPaid" } } }
    ]);
    const totalCollected = collectedPaymentsAgg.length > 0 ? collectedPaymentsAgg[0].totalCollected : 0;

    // 5. Recent Audit Logs (latest 5)
    const recentAuditLogs = await auditLogModel.find()
        .populate("performedBy", "fullName email role")
        .sort({ createdAt: -1 })
        .limit(5);

    return res.status(200).json({
        success: true,
        stats: {
            users: {
                residents: totalResidents,
                committee: totalCommittee,
            },
            complaints: {
                open: openComplaints,
                assigned: assignedComplaints,
                resolved: resolvedComplaints,
                total: openComplaints + assignedComplaints + resolvedComplaints,
            },
            serviceRequests: {
                pending: pendingRequests,
                inProgress: progressRequests,
                completed: completedRequests,
                total: pendingRequests + progressRequests + completedRequests,
            },
            finance: {
                totalOutstanding,
                totalCollected,
            }
        },
        recentAuditLogs,
    });
}

// Resident Dashboard Summary
async function getResidentDashboard(req, res) {
    const residentId = req.user.id;

    // 1. Outstanding bills count & total amount
    const outstandingBills = await billModel.find({ resident: residentId, status: "unpaid", isDeleted: false });
    const outstandingCount = outstandingBills.length;
    const outstandingAmount = outstandingBills.reduce((sum, bill) => sum + bill.amount, 0);

    // 2. Recent payments (latest 3)
    const recentPayments = await paymentModel.find({ resident: residentId })
        .populate("bill", "billingPeriod")
        .sort({ createdAt: -1 })
        .limit(3);

    // 3. Active complaints (open or assigned, latest 3)
    const activeComplaints = await complaintModel.find({ 
        raisedBy: residentId, 
        status: { $in: ["open", "assigned"] },
        isDeleted: false 
    }).sort({ createdAt: -1 }).limit(3);

    return res.status(200).json({
        success: true,
        summary: {
            outstandingCount,
            outstandingAmount,
        },
        outstandingBills,
        recentPayments,
        activeComplaints,
    });
}

module.exports = {
    getAdminDashboard,
    getResidentDashboard,
};
