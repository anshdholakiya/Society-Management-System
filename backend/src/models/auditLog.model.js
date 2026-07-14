const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true,
            trim: true,
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        details: {
            type: String,
            required: true,
            trim: true,
        },
        ipAddress: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("auditLog", auditLogSchema);
