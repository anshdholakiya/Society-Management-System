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
        body("resident").isMongoId().withMessage("Valid resident ID is required"),
        body("amount").isNumeric().withMessage("Amount must be a number"),
        body("dueDate").isISO8601().toDate().withMessage("Valid due date is required"),
        body("billingPeriod").trim().notEmpty().withMessage("Billing period is required"),
        body("category").optional().isIn(["maintenance", "water", "electricity", "other"]).withMessage("Invalid category type"),
        validateRequest
    ],
    billController.createBill
);

// Admin-only bulk auto-generation
router.post(
    "/bulk",
    authorizeRoles("admin"),
    [
        body("amount").isNumeric().withMessage("Amount must be a number"),
        body("dueDate").isISO8601().toDate().withMessage("Valid due date is required"),
        body("billingPeriod").trim().notEmpty().withMessage("Billing period is required"),
        body("category").optional().isIn(["maintenance", "water", "electricity", "other"]).withMessage("Invalid category type"),
        validateRequest
    ],
    billController.bulkGenerateBills
);

// Retrieve bills
router.get("/", billController.getBills);

// Soft delete bill - Admin only
router.delete("/:billId", authorizeRoles("admin"), billController.deleteBill);

module.exports = router;
