const express = require("express");
const { body } = require("express-validator");
const serviceRequestController = require("../controllers/serviceRequest.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validation.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.use(authenticate);

// Residents create service requests (optional ImageKit file upload)
router.post(
    "/", 
    authorizeRoles("resident"),
    upload.single("image"),
    [
        body("title").trim().notEmpty().withMessage("Title is required"),
        body("description").trim().notEmpty().withMessage("Description is required"),
        body("category").trim().notEmpty().withMessage("Category is required"),
        body("priority").optional().isIn(["low", "medium", "high"]).withMessage("Invalid priority value"),
        validateRequest
    ],
    serviceRequestController.createServiceRequest
);

// Fetch requests (role filtered in controller)
router.get("/", serviceRequestController.getServiceRequests);

// Admin/Committee update status and assignee or comments
router.patch(
    "/:requestId", 
    authorizeRoles("admin", "committee_member"), 
    [
        body("status").optional().isIn(["open", "assigned", "in_progress", "resolved", "closed"]).withMessage("Invalid status value"),
        body("assignedTo").optional().custom((value) => {
            if (value && typeof value !== "string") {
                throw new Error("assignedTo must be a string user ID or null");
            }
            return true;
        }),
        body("comment").optional().trim().notEmpty().withMessage("Comment cannot be empty space"),
        validateRequest
    ],
    serviceRequestController.updateServiceRequestStatus
);

// Soft delete request
router.delete("/:requestId", serviceRequestController.deleteServiceRequest);

module.exports = router;
