const express = require("express");
const auditController = require("../controllers/audit.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

// Admin-only audit log viewer
router.get("/", authorizeRoles("admin"), auditController.getAuditLogs);

module.exports = router;
