const express = require("express");
const { body } = require("express-validator");
const announcementController = require("../controllers/announcement.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validation.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.use(authenticate);

// Create announcement - Admin/Committee (optional ImageKit file upload)
router.post(
    "/", 
    authorizeRoles("admin", "committee_member"), 
    upload.single("image"),
    [
        body("title").trim().notEmpty().withMessage("Title is required"),
        body("content").trim().notEmpty().withMessage("Content is required"),
        body("targetAudience").optional().isIn(["all", "residents", "committee"]).withMessage("Target audience must be 'all', 'residents', or 'committee'"),
        body("targetBlock").optional().trim(),
        body("priority").optional().isIn(["normal", "important", "urgent"]).withMessage("Priority must be 'normal', 'important' or 'urgent'"),
        body("expiresAt").optional().isISO8601().toDate().custom(val => {
            if (val <= new Date()) {
                throw new Error("Expiry date must be in the future");
            }
            return true;
        }),
        validateRequest
    ],
    announcementController.createAnnouncement
);

// Get announcements - Scoped internally in controller by role
router.get("/", announcementController.getAnnouncements);

// Get single announcement details - Scoped internally in controller with ID guessing block validation
router.get("/:announcementId", announcementController.getAnnouncementDetails);

// Update announcement - Admin/Committee publisher
router.patch(
    "/:announcementId", 
    authorizeRoles("admin", "committee_member"), 
    [
        body("title").optional().trim().notEmpty().withMessage("Title cannot be empty"),
        body("content").optional().trim().notEmpty().withMessage("Content cannot be empty"),
        body("targetAudience").optional().isIn(["all", "residents", "committee"]).withMessage("Target audience must be 'all', 'residents', or 'committee'"),
        body("targetBlock").optional().trim(),
        body("priority").optional().isIn(["normal", "important", "urgent"]).withMessage("Priority must be 'normal', 'important' or 'urgent'"),
        body("expiresAt").optional().isISO8601().toDate().custom(val => {
            if (val <= new Date()) {
                throw new Error("Expiry date must be in the future");
            }
            return true;
        }),
        validateRequest
    ],
    announcementController.updateAnnouncement
);

// Delete announcement - Admin/Committee publisher
router.delete("/:announcementId", authorizeRoles("admin", "committee_member"), announcementController.deleteAnnouncement);

module.exports = router;
