const auditLogModel = require("../models/auditLog.model");

// Retrieve Audit Logs (Admin only)
async function getAuditLogs(req, res) {
    const { action, performedBy, page = 1, limit = 20 } = req.query;

    const query = {};

    if (action) query.action = action;
    if (performedBy) query.performedBy = performedBy;

    const skipCount = (parseInt(page) - 1) * parseInt(limit);
    const total = await auditLogModel.countDocuments(query);
    const logs = await auditLogModel.find(query)
        .populate("performedBy", "fullName email role")
        .sort({ createdAt: -1 })
        .skip(skipCount)
        .limit(parseInt(limit));

    return res.status(200).json({
        success: true,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        logs,
    });
}

module.exports = {
    getAuditLogs,
};
