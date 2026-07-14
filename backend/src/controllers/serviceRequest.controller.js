const serviceRequestModel = require("../models/serviceRequest.model");
const { logAction } = require("../utils/auditLogger");

// Submit Service Request (Resident only)
async function createServiceRequest(req, res) {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
        return res.status(400).json({ message: "title, description, and category are required" });
    }

    const request = await serviceRequestModel.create({
        title,
        description,
        category,
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

// Process / Update Service Request Status (Admin/Committee)
async function updateServiceRequestStatus(req, res) {
    const { requestId } = req.params;
    const { status, assignedTo } = req.body;

    if (!status && !assignedTo) {
        return res.status(400).json({ message: "Either status or assignedTo is required to update" });
    }

    const request = await serviceRequestModel.findOne({ _id: requestId, isDeleted: false });
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

    await request.save();
    await logAction("SERVICE_REQUEST_UPDATED", req.user.id, `Updated service request "${request.title}" status to "${request.status}"`, req);

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
