const bcrypt = require("bcryptjs");
const userModel = require("../models/user.model");
const { logAction } = require("../utils/auditLogger");

// Create Resident (Admin only)
async function createResident(req, res) {
    const { fullName, email, password, phone, unitNumber, block, ownershipStatus } = req.body;

    if (!fullName || !email || !password || !unitNumber || !block || !ownershipStatus) {
        return res.status(400).json({ message: "fullName, email, password, unitNumber, block, and ownershipStatus are required" });
    }

    const existingUser = await userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
        fullName,
        email,
        password: hashedPassword,
        role: "resident",
        phone,
        unitNumber,
        block,
        ownershipStatus,
    });

    await logAction("RESIDENT_CREATED", req.user.id, `Created resident user: ${user.email} (Unit: ${block}-${unitNumber})`, req);

    return res.status(201).json({
        success: true,
        message: "Resident created successfully",
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            phone: user.phone,
            unitNumber: user.unitNumber,
            block: user.block,
            ownershipStatus: user.ownershipStatus,
        },
    });
}

// Create Committee Member (Admin only)
async function createCommittee(req, res) {
    const { fullName, email, password, phone, designation } = req.body;

    if (!fullName || !email || !password || !designation) {
        return res.status(400).json({ message: "fullName, email, password, and designation are required" });
    }

    const existingUser = await userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
        fullName,
        email,
        password: hashedPassword,
        role: "committee_member",
        phone,
        designation,
    });

    await logAction("COMMITTEE_MEMBER_CREATED", req.user.id, `Created committee member: ${user.email} (${designation})`, req);

    return res.status(201).json({
        success: true,
        message: "Committee member created successfully",
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            phone: user.phone,
            designation: user.designation,
        },
    });
}

// Get Residents (Admin & Committee)
async function getResidents(req, res) {
    const { search = "", block = "", ownershipStatus = "", isActive, page = 1, limit = 10 } = req.query;

    const query = {
        role: "resident",
        isDeleted: false,
    };

    if (block) query.block = block;
    if (ownershipStatus) query.ownershipStatus = ownershipStatus;
    if (isActive !== undefined) query.isActive = isActive === "true";

    if (search) {
        query.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { unitNumber: { $regex: search, $options: "i" } },
        ];
    }

    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    const total = await userModel.countDocuments(query);
    const users = await userModel.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skipCount)
        .limit(parseInt(limit));

    return res.status(200).json({
        success: true,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        users,
    });
}

// Get Committee Members (All roles can view who the committee is)
async function getCommitteeMembers(req, res) {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = {
        role: "committee_member",
        isDeleted: false,
    };

    if (search) {
        query.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { designation: { $regex: search, $options: "i" } },
        ];
    }

    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    const total = await userModel.countDocuments(query);
    const users = await userModel.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skipCount)
        .limit(parseInt(limit));

    return res.status(200).json({
        success: true,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        users,
    });
}

// Update User details (Admin only, or user updating their own profile phone/password)
async function updateUser(req, res) {
    const { id } = req.params;
    const { fullName, phone, unitNumber, block, ownershipStatus, designation, isActive } = req.body;

    const user = await userModel.findById(id);
    if (!user || user.isDeleted) {
        return res.status(404).json({ message: "User not found" });
    }

    // Role verification: only Admin can update other users, or update status/unit details
    const isSelfUpdate = req.user.id === id;
    const isAdmin = req.user.role === "admin";

    if (!isSelfUpdate && !isAdmin) {
        return res.status(403).json({ message: "Forbidden: You do not have permission to update this user" });
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;

    // Admin-only updates
    if (isAdmin) {
        if (unitNumber !== undefined) user.unitNumber = unitNumber;
        if (block !== undefined) user.block = block;
        if (ownershipStatus !== undefined) user.ownershipStatus = ownershipStatus;
        if (designation !== undefined) user.designation = designation;
        if (isActive !== undefined) user.isActive = isActive;
    } else {
        // Residents / Committee cannot update administrative details
        if (unitNumber !== undefined || block !== undefined || ownershipStatus !== undefined || designation !== undefined || isActive !== undefined) {
            return res.status(403).json({ message: "Forbidden: Only admins can change administrative fields" });
        }
    }

    await user.save();
    await logAction("USER_UPDATED", req.user.id, `Updated details of user ${user.email}`, req);

    return res.status(200).json({
        success: true,
        message: "User updated successfully",
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

// Delete User (Soft Delete, Admin only)
async function deleteUser(req, res) {
    const { id } = req.params;

    const user = await userModel.findById(id);
    if (!user || user.isDeleted) {
        return res.status(404).json({ message: "User not found" });
    }

    user.isDeleted = true;
    user.isActive = false;
    await user.save();

    await logAction("USER_DELETED", req.user.id, `Soft-deleted user: ${user.email}`, req);

    return res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
}

module.exports = {
    createResident,
    createCommittee,
    getResidents,
    getCommitteeMembers,
    updateUser,
    deleteUser,
};
