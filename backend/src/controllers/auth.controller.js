const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const { logAction } = require("../utils/auditLogger");

function buildToken(user) {
    return jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
    );
}

function setAuthCookie(res, token) {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
    });
}

async function registerUser(req, res) {
    return res.status(403).json({
        success: false,
        message: "Self-registration is disabled. Please contact the society administrator to register."
    });
}

async function loginUser(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "email and password are required" });
    }

    const user = await userModel.findOne({ email: email.toLowerCase(), isDeleted: false });

    if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid credentials or account deactivated" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = buildToken(user);
    setAuthCookie(res, token);

    // Audit Log
    await logAction("USER_LOGIN", user._id, `User logged in: ${user.email}`, req);

    return res.status(200).json({
        message: "Login successful",
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            phone: user.phone,
            unitNumber: user.unitNumber,
            block: user.block,
            ownershipStatus: user.ownershipStatus,
            designation: user.designation,
            isActive: user.isActive,
        },
    });
}

async function logoutUser(req, res) {
    const userId = req.user?.id;
    if (userId) {
        await logAction("USER_LOGOUT", userId, `User logged out`, req);
    }

    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });

    return res.status(200).json({ message: "Logout successful" });
}

async function getMe(req, res) {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user || user.isDeleted) {
        return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
        success: true,
        user,
    });
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
};