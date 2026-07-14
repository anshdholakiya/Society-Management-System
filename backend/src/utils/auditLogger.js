const AuditLog = require("../models/auditLog.model");

/**
 * Log a user action to the database asynchronously
 * @param {string} action - Action name (e.g. "USER_LOGIN", "BILL_CREATED")
 * @param {string} userId - ObjectId of the user performing the action
 * @param {string} details - Human-readable details or JSON payload details
 * @param {Object} [req] - Express request object to extract client IP address
 */
async function logAction(action, userId, details, req = null) {
    try {
        let ipAddress = "";
        if (req) {
            ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
        }

        // Create log entry asynchronously (do not block the thread)
        await AuditLog.create({
            action,
            performedBy: userId,
            details,
            ipAddress,
        });
    } catch (error) {
        // Log internally, but do not throw to avoid crashing the main application flow
        console.error("Audit Logging Error:", error);
    }
}

module.exports = {
    logAction,
};
