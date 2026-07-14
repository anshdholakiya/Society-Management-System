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
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("announcement", announcementSchema);
