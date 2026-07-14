const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "in_progress", "completed"],
            default: "pending",
        },
        raisedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            default: null,
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

serviceRequestSchema.pre(/^find/, function() { this.where({ isDeleted: { $ne: true } }); });

module.exports = mongoose.model("serviceRequest", serviceRequestSchema);
