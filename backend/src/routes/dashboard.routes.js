const express = require("express");
const dashboardController = require("../controllers/dashboard.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

// Admin-only dashboard statistics
router.get("/admin", authorizeRoles("admin"), dashboardController.getAdminDashboard);

// Resident dashboard statistics (Admins can also query, but scoped to resident context)
router.get("/resident", authorizeRoles("resident", "admin"), dashboardController.getResidentDashboard);

module.exports = router;
