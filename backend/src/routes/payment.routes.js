const express = require("express");
const { body } = require("express-validator");
const paymentController = require("../controllers/payment.controller");
const { authenticate, authorizeRoles } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validation.middleware");

const router = express.Router();

router.use(authenticate);

// Admin-only record payment with validation
router.post(
    "/", 
    authorizeRoles("admin"), 
    [
        body("bill").isMongoId().withMessage("Valid bill ID is required"),
        body("amountPaid").isFloat({ min: 0 }).withMessage("Amount paid must be a positive number"),
        body("paymentMethod").isIn(["online", "cash", "cheque"]).withMessage("Payment method must be 'online', 'cash' or 'cheque'"),
        body("transactionId").optional().trim(),
        validateRequest
    ],
    paymentController.recordPayment
);

// Retrieve payment records
router.get("/", paymentController.getPayments);

module.exports = router;
