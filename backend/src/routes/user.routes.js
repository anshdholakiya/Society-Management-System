const express = require("express");
const { body } = require("express-validator");
const userController = require("../controllers/user.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validation.middleware");

const router = express.Router();

// Apply authentication to all user routes
router.use(authenticate);

// Admin-only creation endpoints with validation
router.post(
    "/residents", 
    authorizeRoles("admin"), 
    [
        body("fullName").trim().notEmpty().withMessage("Full name is required"),
        body("email").trim().isEmail().withMessage("Must be a valid email address").normalizeEmail(),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
        body("unitNumber").trim().notEmpty().withMessage("Unit/Flat number is required"),
        body("block").trim().notEmpty().withMessage("Block/Wing is required"),
        body("ownershipStatus").isIn(["owner", "tenant"]).withMessage("Ownership status must be 'owner' or 'tenant'"),
        body("phone").optional().trim(),
        validateRequest
    ],
    userController.createResident
);

router.post(
    "/committee", 
    authorizeRoles("admin"), 
    [
        body("fullName").trim().notEmpty().withMessage("Full name is required"),
        body("email").trim().isEmail().withMessage("Must be a valid email address").normalizeEmail(),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
        body("designation").trim().notEmpty().withMessage("Committee designation is required"),
        body("phone").optional().trim(),
        validateRequest
    ],
    userController.createCommittee
);

// Listing endpoints
router.get("/residents", authorizeRoles("admin", "committee_member"), userController.getResidents);
router.get("/committee", userController.getCommitteeMembers);

// Update & Delete (Soft delete)
router.patch(
    "/:id", 
    [
        body("fullName").optional().trim().notEmpty().withMessage("Full name cannot be empty"),
        body("ownershipStatus").optional().isIn(["owner", "tenant", ""]).withMessage("Invalid ownership status"),
        body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
        validateRequest
    ],
    userController.updateUser
);

router.delete("/:id", authorizeRoles("admin"), userController.deleteUser);

module.exports = router;
