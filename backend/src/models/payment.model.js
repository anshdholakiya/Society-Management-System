const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        bill: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "bill",
            required: true,
        },
        resident: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        amountPaid: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentDate: {
            type: Date,
            default: Date.now,
        },
        paymentMethod: {
            type: String,
            enum: ["online", "cash", "cheque"],
            required: true,
        },
        transactionId: {
            type: String,
            trim: true,
            default: "",
        },
        recordedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true, // Typically the Admin
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("payment", paymentSchema);
