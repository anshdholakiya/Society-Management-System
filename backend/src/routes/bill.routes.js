const express = require("express");
const { body } = require("express-validator");
const billController = require("../controllers/bill.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validation.middleware");

const router = express.Router();

router.use(authenticate);

// Admin-only bill creation with input validations
router.post(
    "/", 
    authorizeRoles("admin"), 
    [
        body("resident").isMongoId().withMessage("Valid resident user ID is required"),
        body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
        body("dueDate").isISO8601().withMessage("Valid due date (ISO8601 format) is required"),
        body("billingPeriod").trim().notEmpty().withMessage("Billing period is required"),
        validateRequest
    ],
    billController.createBill
);

// Retrieve bills
router.get("/", billController.getBills);

// Soft delete bill - Admin only
router.delete("/:billId", authorizeRoles("admin"), billController.deleteBill);

module.exports = router;
