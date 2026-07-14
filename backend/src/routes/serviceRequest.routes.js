const express = require("express");
const { body } = require("express-validator");
const serviceRequestController = require("../controllers/serviceRequest.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validation.middleware");

const router = express.Router();

router.use(authenticate);

// Residents create service requests
router.post(
    "/", 
    authorizeRoles("resident"), 
    [
        body("title").trim().notEmpty().withMessage("Title is required"),
        body("description").trim().notEmpty().withMessage("Description is required"),
        body("category").trim().notEmpty().withMessage("Category is required"),
        validateRequest
    ],
    serviceRequestController.createServiceRequest
);

// Fetch requests
router.get("/", serviceRequestController.getServiceRequests);

// Admin/Committee update status and assignee
router.patch(
    "/:requestId", 
    authorizeRoles("admin", "committee_member"), 
    [
        body("status").optional().isIn(["pending", "approved", "rejected", "in_progress", "completed"]).withMessage("Invalid status value"),
        body("assignedTo").optional().custom((value) => {
            if (value && typeof value !== "string") {
                throw new Error("assignedTo must be a string user ID or null");
            }
            return true;
        }),
        validateRequest
    ],
    serviceRequestController.updateServiceRequestStatus
);

// Soft delete request
router.delete("/:requestId", serviceRequestController.deleteServiceRequest);

module.exports = router;
