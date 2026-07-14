const complaintModel = require("../models/complaint.model");
const { uploadToImageKit, deleteFromImageKit } = require("../services/imagekit.service");
const { logAction } = require("../utils/auditLogger");

// Create Complaint (Resident only)
async function createComplaint(req, res) {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: "title and description are required" });
    }

    let imageUrl = "";
    let imageKitFileId = "";

    if (req.file) {
        try {
            const uploadResult = await uploadToImageKit(req.file.buffer, `complaint_${Date.now()}_${req.file.originalname}`);
            imageUrl = uploadResult.url;
            imageKitFileId = uploadResult.fileId;
        } catch (uploadError) {
            return res.status(500).json({ message: "Failed to upload image to cloud storage: " + uploadError.message });
        }
    }

    const complaint = await complaintModel.create({
        title,
        description,
        imageUrl,
        imageKitFileId,
        raisedBy: req.user.id,
    });

    await logAction("COMPLAINT_CREATED", req.user.id, `Created complaint: "${complaint.title}"`, req);

    return res.status(201).json({
        success: true,
        message: "Complaint registered successfully",
        complaint,
    });
}

// Get list of complaints (Resident: own only; Admin/Committee: all)
async function getComplaints(req, res) {
    const { status, assignedTo, search = "", page = 1, limit = 10 } = req.query;

    const query = { isDeleted: false };

    // RBAC check: Resident can only view their own complaints
    if (req.user.role === "resident") {
        query.raisedBy = req.user.id;
    } else {
        // Admins and Committee Members can filter by resident or assignee
        if (assignedTo) query.assignedTo = assignedTo;
    }

    if (status) query.status = status;
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    const total = await complaintModel.countDocuments(query);
    const complaints = await complaintModel.find(query)
        .populate("raisedBy", "fullName email unitNumber block phone")
        .populate("assignedTo", "fullName email designation phone")
        .populate("comments.user", "fullName role")
        .sort({ createdAt: -1 })
        .skip(skipCount)
        .limit(parseInt(limit));

    return res.status(200).json({
        success: true,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        complaints,
    });
}

// Assign Complaint to a Committee Member (Admin only)
async function assignComplaint(req, res) {
    const { complaintId } = req.params;
    const { assignedTo } = req.body; // ObjectId of committee member

    if (!assignedTo) {
        return res.status(400).json({ message: "assignedTo (user ID) is required" });
    }

    const complaint = await complaintModel.findOne({ _id: complaintId, isDeleted: false });
    if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.assignedTo = assignedTo;
    complaint.status = "assigned";
    await complaint.save();

    await logAction("COMPLAINT_ASSIGNED", req.user.id, `Assigned complaint "${complaint.title}" to user ${assignedTo}`, req);

    return res.status(200).json({
        success: true,
        message: "Complaint assigned successfully",
        complaint,
    });
}

// Update Complaint Status & Add Comments (Admin & Committee)
async function updateComplaintStatus(req, res) {
    const { complaintId } = req.params;
    const { status, comment } = req.body;

    if (!status && !comment) {
        return res.status(400).json({ message: "Either status or comment is required to update" });
    }

    const complaint = await complaintModel.findOne({ _id: complaintId, isDeleted: false });
    if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
    }

    // Role check: Admin or Committee Members can update
    const isAuthorized = req.user.role === "admin" || req.user.role === "committee_member";
    if (!isAuthorized) {
        return res.status(403).json({ message: "Forbidden: Only Admin or Committee members can resolve complaints" });
    }

    if (status) {
        complaint.status = status;
    }

    if (comment) {
        complaint.comments.push({
            user: req.user.id,
            comment: comment,
        });
    }

    await complaint.save();
    await logAction("COMPLAINT_UPDATED", req.user.id, `Updated complaint "${complaint.title}" status to "${complaint.status}"`, req);

    return res.status(200).json({
        success: true,
        message: "Complaint updated successfully",
        complaint,
    });
}

// Soft Delete Complaint (Admin or Resident who raised it)
async function deleteComplaint(req, res) {
    const { complaintId } = req.params;

    const complaint = await complaintModel.findOne({ _id: complaintId, isDeleted: false });
    if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
    }

    const isOwner = complaint.raisedBy.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Forbidden: You cannot delete this complaint" });
    }

    complaint.isDeleted = true;
    await complaint.save();

    await logAction("COMPLAINT_DELETED", req.user.id, `Soft-deleted complaint "${complaint.title}"`, req);

    return res.status(200).json({
        success: true,
        message: "Complaint deleted successfully",
    });
}

module.exports = {
    createComplaint,
    getComplaints,
    assignComplaint,
    updateComplaintStatus,
    deleteComplaint,
};
