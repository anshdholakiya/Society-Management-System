const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validation.middleware");

const router = express.Router();

router.post(
    "/register", 
    [
        body("fullName").trim().notEmpty().withMessage("Full name is required"),
        body("email").trim().isEmail().withMessage("Must be a valid email address").normalizeEmail(),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
        body("role").optional().isIn(["admin", "committee_member", "resident"]).withMessage("Invalid role specified"),
        body("phone").optional().trim(),
        body("unitNumber").optional().trim(),
        body("block").optional().trim(),
        body("ownershipStatus").optional().isIn(["owner", "tenant", ""]).withMessage("Invalid ownership status"),
        body("designation").optional().trim(),
        validateRequest
    ], 
    authController.registerUser
);

router.post(
    "/login", 
    [
        body("email").trim().isEmail().withMessage("Must be a valid email address").normalizeEmail(),
        body("password").notEmpty().withMessage("Password is required"),
        validateRequest
    ], 
    authController.loginUser
);

router.post("/logout", authenticate, authController.logoutUser);
router.get("/me", authenticate, authController.getMe);

module.exports = router;