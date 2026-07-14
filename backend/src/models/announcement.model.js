const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        publishedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        targetAudience: {
            type: String,
            enum: ["all", "residents", "committee"],
            default: "all",
        },
        targetBlock: {
            type: String,
            default: "", // Empty string means all blocks
        },
        priority: {
            type: String,
            enum: ["normal", "important", "urgent"],
            default: "normal",
        },
        expiresAt: {
            type: Date,
        },
        imageUrl: {
            type: String,
        },
        imageFileId: {
            type: String,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("announcement", announcementSchema);
