const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["admin", "committee_member", "resident"],
            default: "resident",
        },
        phone: {
            type: String,
            trim: true,
            default: "",
        },
        unitNumber: {
            type: String,
            trim: true,
            default: "",
        },
        block: {
            type: String,
            trim: true,
            default: "",
        },
        ownershipStatus: {
            type: String,
            enum: ["owner", "tenant", ""],
            default: "",
        },
        designation: {
            type: String,
            trim: true,
            default: "",
        },
        isActive: {
            type: Boolean,
            default: true,
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

userSchema.pre(/^find/, function() { this.where({ isDeleted: { $ne: true } }); });

module.exports = mongoose.model("user", userSchema);