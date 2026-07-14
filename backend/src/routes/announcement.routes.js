const express = require("express");
const { body } = require("express-validator");
const announcementController = require("../controllers/announcement.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validation.middleware");

const router = express.Router();

router.use(authenticate);

// Create announcement - Admin/Committee
router.post(
    "/", 
    authorizeRoles("admin", "committee_member"), 
    [
        body("title").trim().notEmpty().withMessage("Title is required"),
        body("content").trim().notEmpty().withMessage("Content is required"),
        body("targetAudience").optional().isIn(["all", "residents", "committee"]).withMessage("Target audience must be 'all', 'residents', or 'committee'"),
        validateRequest
    ],
    announcementController.createAnnouncement
);

// Get announcements - All authenticated users (audited internally by role target audience)
router.get("/", announcementController.getAnnouncements);

// Update - Admin/Committee publisher
router.patch(
    "/:announcementId", 
    authorizeRoles("admin", "committee_member"), 
    [
        body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
        body("content").optional().trim().notEmpty().withMessage("Content cannot be empty"),
        body("targetAudience").optional().isIn(["all", "residents", "committee"]).withMessage("Target audience must be 'all', 'residents', or 'committee'"),
        validateRequest
    ],
    announcementController.updateAnnouncement
);

// Delete - Admin/Committee publisher
router.delete("/:announcementId", authorizeRoles("admin", "committee_member"), announcementController.deleteAnnouncement);

module.exports = router;
