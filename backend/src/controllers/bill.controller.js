const billModel = require("../models/bill.model");
const userModel = require("../models/user.model");
const { logAction } = require("../utils/auditLogger");

// Create Maintenance Bill (Admin only)
async function createBill(req, res) {
    const { resident, amount, dueDate, billingPeriod } = req.body;

    if (!resident || !amount || !dueDate || !billingPeriod) {
        return res.status(400).json({ message: "resident, amount, dueDate, and billingPeriod are required" });
    }

    // Verify resident exists
    const targetResident = await userModel.findOne({ _id: resident, role: "resident", isDeleted: false });
    if (!targetResident) {
        return res.status(404).json({ message: "Target resident user not found" });
    }

    const bill = await billModel.create({
        resident,
        amount,
        dueDate,
        billingPeriod,
    });

    await logAction("BILL_CREATED", req.user.id, `Created maintenance bill for ${targetResident.email} of amount INR ${amount} for ${billingPeriod}`, req);

    return res.status(201).json({
        success: true,
        message: "Bill created successfully",
        bill,
    });
}

// Get Bills (Resident: own; Admin: all)
async function getBills(req, res) {
    const { status, resident, billingPeriod, page = 1, limit = 10 } = req.query;

    const query = { isDeleted: false };

    // Resident can only view their own bills
    if (req.user.role === "resident") {
        query.resident = req.user.id;
    } else {
        // Admin or Committee can filter by resident
        if (resident) query.resident = resident;
    }

    if (status) query.status = status;
    if (billingPeriod) query.billingPeriod = billingPeriod;

    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    const total = await billModel.countDocuments(query);
    const bills = await billModel.find(query)
        .populate("resident", "fullName email unitNumber block phone")
        .sort({ createdAt: -1 })
        .skip(skipCount)
        .limit(parseInt(limit));

    return res.status(200).json({
        success: true,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        bills,
    });
}

// Soft Delete Bill (Admin only)
async function deleteBill(req, res) {
    const { billId } = req.params;

    const bill = await billModel.findOne({ _id: billId, isDeleted: false });
    if (!bill) {
        return res.status(404).json({ message: "Bill not found" });
    }

    bill.isDeleted = true;
    await bill.save();

    await logAction("BILL_DELETED", req.user.id, `Soft-deleted bill ID: ${billId} of amount ${bill.amount}`, req);

    return res.status(200).json({
        success: true,
        message: "Bill deleted successfully",
    });
}

module.exports = {
    createBill,
    getBills,
    deleteBill,
};
