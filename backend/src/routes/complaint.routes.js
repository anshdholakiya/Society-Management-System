const express = require("express");
const { body } = require("express-validator");
const complaintController = require("../controllers/complaint.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validation.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.use(authenticate);

// Residents create complaints, upload image optionally
router.post(
    "/", 
    authorizeRoles("resident"), 
    upload.single("image"), 
    [
        body("title").trim().notEmpty().withMessage("Title is required"),
        body("description").trim().notEmpty().withMessage("Description is required"),
        validateRequest
    ], 
    complaintController.createComplaint
);

// Fetch complaints
router.get("/", complaintController.getComplaints);

// Assign complaint - Admin only
router.post(
    "/:complaintId/assign", 
    authorizeRoles("admin"), 
    [
        body("assignedTo").isMongoId().withMessage("Valid assignee user ID is required"),
        validateRequest
    ], 
    complaintController.assignComplaint
);

// Update status or comment - Admin/Committee
router.patch(
    "/:complaintId", 
    authorizeRoles("admin", "committee_member"), 
    [
        body("status").optional().isIn(["open", "assigned", "resolved", "closed"]).withMessage("Invalid status value"),
        body("comment").optional().trim().notEmpty().withMessage("Comment cannot be empty space"),
        validateRequest
    ], 
    complaintController.updateComplaintStatus
);

// Soft delete
router.delete("/:complaintId", complaintController.deleteComplaint);

module.exports = router;
