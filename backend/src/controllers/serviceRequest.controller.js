const serviceRequestModel = require("../models/serviceRequest.model");
const { uploadToImageKit } = require("../services/imagekit.service");
const { logAction } = require("../utils/auditLogger");

// Submit Service Request (Resident only, with optional image upload)
async function createServiceRequest(req, res) {
    const { title, description, category, priority = "medium" } = req.body;

    if (!title || !description || !category) {
        return res.status(400).json({ message: "title, description, and category are required" });
    }

    let imageUrl = "";
    let imageKitFileId = "";

    if (req.file) {
        try {
            const uploadResult = await uploadToImageKit(req.file.buffer, `service_${Date.now()}_${req.file.originalname}`);
            imageUrl = uploadResult.url;
            imageKitFileId = uploadResult.fileId;
        } catch (uploadError) {
            console.error("ImageKit Service Request Controller Upload Error Details:", uploadError);
            return res.status(400).json({ 
                success: false, 
                message: "Image upload failed: " + uploadError.message 
            });
        }
    }

    const request = await serviceRequestModel.create({
        title,
        description,
        category,
        priority,
        imageUrl,
        imageKitFileId,
        raisedBy: req.user.id,
    });

    await logAction("SERVICE_REQUEST_CREATED", req.user.id, `Created service request: "${request.title}" (${request.category})`, req);

    return res.status(201).json({
        success: true,
        message: "Service request submitted successfully",
        request,
    });
}

// Get service requests (Resident: own only; Admin/Committee: all)
async function getServiceRequests(req, res) {
    const { status, category, search = "", page = 1, limit = 10 } = req.query;

    const query = { isDeleted: false };

    // Resident can only view their own requests
    if (req.user.role === "resident") {
        query.raisedBy = req.user.id;
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    const total = await serviceRequestModel.countDocuments(query);
    const requests = await serviceRequestModel.find(query)
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
        requests,
    });
}

// Process / Update Service Request Status & Comments (Admin/Committee)
async function updateServiceRequestStatus(req, res) {
    const { requestId } = req.params;
    const { status, assignedTo, comment } = req.body;

    if (!status && assignedTo === undefined && !comment) {
        return res.status(400).json({ message: "Either status, assignedTo, or comment is required to update" });
    }

    let request = await serviceRequestModel.findOne({ _id: requestId, isDeleted: false });
    if (!request) {
        return res.status(404).json({ message: "Service request not found" });
    }

    // Role check: Only Admin or Committee members can process requests
    const isAuthorized = req.user.role === "admin" || req.user.role === "committee_member";
    if (!isAuthorized) {
        return res.status(403).json({ message: "Forbidden: Only Admin or Committee members can update service requests" });
    }

    if (status) {
        request.status = status;
    }
    if (assignedTo !== undefined) {
        request.assignedTo = assignedTo || null;
    }
    if (comment && comment.trim()) {
        request.comments.push({
            user: req.user.id,
            comment: comment.trim(),
        });
    }

    await request.save();
    await logAction("SERVICE_REQUEST_UPDATED", req.user.id, `Updated service request "${request.title}" status to "${request.status}"`, req);

    // Populate full details before returning response
    request = await serviceRequestModel.findById(requestId)
        .populate("raisedBy", "fullName email unitNumber block phone")
        .populate("assignedTo", "fullName email designation phone")
        .populate("comments.user", "fullName role");

    return res.status(200).json({
        success: true,
        message: "Service request updated successfully",
        request,
    });
}

// Soft delete service request (Admin or Owner Resident)
async function deleteServiceRequest(req, res) {
    const { requestId } = req.params;

    const request = await serviceRequestModel.findOne({ _id: requestId, isDeleted: false });
    if (!request) {
        return res.status(404).json({ message: "Service request not found" });
    }

    const isOwner = request.raisedBy.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Forbidden: You cannot delete this service request" });
    }

    // Retraction business rule: Residents can only cancel/retract if the request is "open" or "assigned".
    // If it is in_progress, resolved, or closed, they cannot cancel it. Admins can delete at any status.
    if (isOwner && !isAdmin && ["in_progress", "resolved", "closed"].includes(request.status)) {
        return res.status(400).json({ 
            message: `Cannot retract request: This task is currently ${request.status.replace("_", " ")}.` 
        });
    }

    request.isDeleted = true;
    await request.save();

    await logAction("SERVICE_REQUEST_DELETED", req.user.id, `Soft-deleted service request "${request.title}"`, req);

    return res.status(200).json({
        success: true,
        message: "Service request deleted successfully",
    });
}

module.exports = {
    createServiceRequest,
    getServiceRequests,
    updateServiceRequestStatus,
    deleteServiceRequest,
};
