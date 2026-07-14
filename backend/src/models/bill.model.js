const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
    {
        resident: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        billingPeriod: {
            type: String,
            required: true, // e.g. "July 2026"
            trim: true,
        },
        category: {
            type: String,
            enum: ["maintenance", "water", "electricity", "other"],
            default: "maintenance",
        },
        status: {
            type: String,
            enum: ["unpaid", "paid"],
            default: "unpaid",
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

billSchema.pre(/^find/, function() { this.where({ isDeleted: { $ne: true } }); });

module.exports = mongoose.model("bill", billSchema);
