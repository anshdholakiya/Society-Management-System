const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    comment: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const complaintSchema = new mongoose.Schema(
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
        imageUrl: {
            type: String,
            default: "",
        },
        imageKitFileId: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["open", "assigned", "resolved", "closed"],
            default: "open",
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
        comments: [commentSchema],
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

complaintSchema.pre(/^find/, function() { this.where({ isDeleted: { $ne: true } }); });

module.exports = mongoose.model("complaint", complaintSchema);
