const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Route imports
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const complaintRoutes = require("./routes/complaint.routes");
const serviceRequestRoutes = require("./routes/serviceRequest.routes");
const billRoutes = require("./routes/bill.routes");
const paymentRoutes = require("./routes/payment.routes");
const announcementRoutes = require("./routes/announcement.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const auditRoutes = require("./routes/audit.routes");

// Middleware imports
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

// 1. HTTP Security Headers
app.use(helmet());

// 2. CORS setup with credentials (allows frontends to transmit HttpOnly session cookies)
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];
if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

// 3. JSON body parser and cookie parser
app.use(express.json());
app.use(cookieParser());

// Recursive function to strip keys starting with '$' or containing '.' (NoSQL Injection protection)
function sanitizeObject(obj) {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (/^\$/.test(key) || /\./.test(key)) {
                delete obj[key];
            } else {
                sanitizeObject(obj[key]);
            }
        }
    }
}

// 4. Custom Express-5 compatible NoSQL Sanitizer (modifies query in-place instead of replacing reference)
app.use((req, res, next) => {
    if (req.body) sanitizeObject(req.body);
    if (req.params) sanitizeObject(req.params);
    if (req.query) sanitizeObject(req.query);
    next();
});

// 5. Rate limiting for brute-force/DoS protection
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "test" ? 1000 : 200, // Higher request ceiling for test runs
    message: { message: "Too many requests from this IP, please try again after 15 minutes" },
});
app.use("/api", apiLimiter);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ message: "Society Management System API is running" });
});

// Route registration
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/dashboards", dashboardRoutes);
app.use("/api/audit-logs", auditRoutes);

// Global Error Handler (MUST be registered last)
app.use(errorHandler);

module.exports = app;
