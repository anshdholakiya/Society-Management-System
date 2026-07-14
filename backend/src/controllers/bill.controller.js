const billModel = require("../models/bill.model");
const userModel = require("../models/user.model");
const { logAction } = require("../utils/auditLogger");

// Create Maintenance Bill (Admin only)
async function createBill(req, res) {
    const { resident, amount, dueDate, billingPeriod, category = "maintenance" } = req.body;

    if (!resident || !amount || !dueDate || !billingPeriod) {
        return res.status(400).json({ message: "resident, amount, dueDate, and billingPeriod are required" });
    }

    const categories = ["maintenance", "water", "electricity", "other"];
    if (!categories.includes(category)) {
        return res.status(400).json({ message: "Invalid category value" });
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
        category,
    });

    await logAction("BILL_CREATED", req.user.id, `Created ${category} bill for ${targetResident.email} of amount INR ${amount} for ${billingPeriod}`, req);

    return res.status(201).json({
        success: true,
        message: "Bill created successfully",
        bill,
    });
}

// Bulk Generate Bills for all active residents (Admin only)
async function bulkGenerateBills(req, res) {
    const { amount, dueDate, billingPeriod, category = "maintenance" } = req.body;

    if (!amount || !dueDate || !billingPeriod) {
        return res.status(400).json({ message: "amount, dueDate, and billingPeriod are required" });
    }

    const categories = ["maintenance", "water", "electricity", "other"];
    if (!categories.includes(category)) {
        return res.status(400).json({ message: "Invalid category value" });
    }

    try {
        // Fetch all active residents
        const residents = await userModel.find({ role: "resident", isDeleted: false });
        if (residents.length === 0) {
            return res.status(400).json({ message: "No registered resident accounts found to bill" });
        }

        let createdCount = 0;
        let skippedCount = 0;

        for (const resident of residents) {
            // Check if active bill already exists for this resident + period + category
            const queryExisting = {
                resident: resident._id,
                billingPeriod,
                isDeleted: false,
            };
            if (category === "maintenance") {
                queryExisting.$or = [
                    { category: "maintenance" },
                    { category: { $exists: false } },
                    { category: null }
                ];
            } else {
                queryExisting.category = category;
            }

            const existing = await billModel.findOne(queryExisting);

            if (existing) {
                skippedCount++;
                continue;
            }

            await billModel.create({
                resident: resident._id,
                amount,
                dueDate,
                billingPeriod,
                category,
            });
            createdCount++;
        }

        await logAction("BILLS_BULK_GENERATED", req.user.id, `Bulk generated ${createdCount} maintenance bills for period: ${billingPeriod} (skipped ${skippedCount} duplicates)`, req);

        return res.status(201).json({
            success: true,
            message: `Bulk bill generation complete. Created: ${createdCount}, Skipped duplicates: ${skippedCount}`,
            createdCount,
            skippedCount,
        });
    } catch (err) {
        console.error("Bulk generate bills error:", err);
        return res.status(500).json({ message: "Failed to bulk generate bills: " + err.message });
    }
}

// Get Bills (Resident: own; Admin/Committee: all)
async function getBills(req, res) {
    const { status, category, resident, billingPeriod, page = 1, limit = 10 } = req.query;

    const query = { isDeleted: false };

    // Resident can only view their own bills
    if (req.user.role === "resident") {
        query.resident = req.user.id;
    } else {
        // Admin or Committee can filter by resident
        if (resident) query.resident = resident;
    }

    if (status) query.status = status;
    if (category) query.category = category;
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

    // Retraction rule check: cannot delete paid bills to prevent orphaned transaction metrics
    if (bill.status === "paid") {
        return res.status(400).json({ message: "Cannot delete a bill that has already been paid" });
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
    bulkGenerateBills,
    getBills,
    deleteBill,
};
