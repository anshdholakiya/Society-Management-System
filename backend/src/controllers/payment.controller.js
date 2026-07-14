const mongoose = require("mongoose");
const paymentModel = require("../models/payment.model");
const billModel = require("../models/bill.model");
const { logAction } = require("../utils/auditLogger");

// Record Payment (Admin manual cash/cheque entry, or Resident online gateway completion)
async function recordPayment(req, res) {
    const { bill: billId, amountPaid, paymentMethod, transactionId } = req.body;

    if (!billId || !amountPaid || !paymentMethod) {
        return res.status(400).json({ message: "bill (ID), amountPaid, and paymentMethod are required" });
    }

    const isResident = req.user.role === "resident";
    const isAdmin = req.user.role === "admin";

    // Gating check: Residents can only select 'online' method
    if (isResident && paymentMethod !== "online") {
        return res.status(400).json({ message: "Residents are only allowed to initiate online gateway payments." });
    }

    // Gating check: transactionId is required for online/cheque
    if (["online", "cheque"].includes(paymentMethod) && (!transactionId || !transactionId.trim())) {
        return res.status(400).json({ message: "transactionId is strictly required for online or cheque payment methods" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const bill = await billModel.findOne({ _id: billId, isDeleted: false }).session(session);
        if (!bill) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: "Bill not found" });
        }

        // Security ownership check: residents can only pay their own bills
        if (isResident && bill.resident.toString() !== req.user.id) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: "Forbidden: You cannot pay a bill belonging to another unit" });
        }

        // Double-payment protection: verify bill status is unpaid
        if (bill.status === "paid") {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "This bill has already been paid" });
        }

        // Mark the bill as paid
        bill.status = "paid";
        await bill.save({ session });

        // Record the payment
        const [payment] = await paymentModel.create(
            [
                {
                    bill: billId,
                    resident: bill.resident,
                    amountPaid,
                    paymentMethod,
                    transactionId: transactionId || "",
                    recordedBy: req.user.id,
                }
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        await logAction("PAYMENT_RECORDED", req.user.id, `Recorded payment of INR ${amountPaid} via ${paymentMethod} for resident ID ${bill.resident}`, req);

        return res.status(201).json({
            success: true,
            message: "Payment recorded successfully and bill status updated to paid",
            payment,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Payment recording transaction failed:", error);
        return res.status(500).json({ message: "Failed to record payment: " + error.message });
    }
}

// Get Payments (Resident: own; Admin/Committee: all)
async function getPayments(req, res) {
    const { resident, paymentMethod, page = 1, limit = 10 } = req.query;

    const query = {};

    // Resident can only view their own payments
    if (req.user.role === "resident") {
        query.resident = req.user.id;
    } else {
        // Admin or Committee can filter by resident
        if (resident) query.resident = resident;
    }

    if (paymentMethod) query.paymentMethod = paymentMethod;

    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    const total = await paymentModel.countDocuments(query);
    const payments = await paymentModel.find(query)
        .populate("resident", "fullName email unitNumber block phone")
        .populate("bill", "billingPeriod amount dueDate category")
        .populate("recordedBy", "fullName email role")
        .sort({ createdAt: -1 })
        .skip(skipCount)
        .limit(parseInt(limit));

    return res.status(200).json({
        success: true,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        payments,
    });
}

module.exports = {
    recordPayment,
    getPayments,
};
