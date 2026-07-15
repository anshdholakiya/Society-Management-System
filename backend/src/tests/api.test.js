const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const userModel = require("../models/user.model");
const billModel = require("../models/bill.model");

// Configure dotenv for the test runner to connect to MongoDB Atlas
require("dotenv").config();

const rand = Math.floor(Math.random() * 100000);
const testEmail = `tester_${rand}@society.com`;
let testUserId;
let testCookie;

beforeAll(async () => {
    // Connect to the Mongo cluster
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
    }
    // Seed test resident user directly in the DB
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await userModel.create({
        fullName: "Test User",
        email: testEmail,
        password: hashedPassword,
        role: "resident",
        unitNumber: "99",
        block: "T",
        ownershipStatus: "owner"
    });
    testUserId = user._id.toString();
});

afterAll(async () => {
    // Delete created test users to keep database clean
    await userModel.deleteMany({ email: /tester_/ });
    await mongoose.connection.close();
});

describe("🔒 Authentication API Integration Tests", () => {
    it("should reject public self-registration with a 403 response", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                fullName: "Other Test User",
                email: `tester_other_${rand}@society.com`,
                password: "password123",
                unitNumber: "100",
                block: "T",
                ownershipStatus: "owner"
            });

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain("Self-registration is disabled");
    });

    it("should login user and return a cookie", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: testEmail,
                password: "password123"
            });

        expect(res.statusCode).toBe(200);
        expect(res.headers["set-cookie"]).toBeDefined();
        testCookie = res.headers["set-cookie"][0];
    });

    it("should retrieve logged in user profile (/me)", async () => {
        const res = await request(app)
            .get("/api/auth/me")
            .set("Cookie", testCookie);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.email).toBe(testEmail);
    });
});

describe("💳 Payment Validation Tests", () => {
    it("should reject online payment recording if transactionId is missing (Patch 2)", async () => {
        // Elevate test user to admin to pass RBAC check for payment endpoints
        await userModel.updateOne({ _id: testUserId }, { role: "admin" });

        // Login again to refresh session token cookie with "admin" role
        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({
                email: testEmail,
                password: "password123"
            });
        const adminCookie = loginRes.headers["set-cookie"][0];

        // Create a mock resident and bill to pay against
        const resident = await userModel.create({
            fullName: "Mock Resident",
            email: `tester_res_${Date.now()}@society.com`,
            password: "password123",
            role: "resident",
            unitNumber: "101",
            block: "A",
            ownershipStatus: "owner"
        });

        const bill = await billModel.create({
            resident: resident._id,
            amount: 1500,
            dueDate: new Date(),
            billingPeriod: "Test Month"
        });

        // Attempt online payment without transactionId
        const res = await request(app)
            .post("/api/payments")
            .set("Cookie", adminCookie)
            .send({
                bill: bill._id.toString(),
                amountPaid: 1500,
                paymentMethod: "online",
                transactionId: "" // Missing!
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("transactionId is strictly required");

        // Clean up mock data from DB
        await billModel.findByIdAndDelete(bill._id);
        await userModel.findByIdAndDelete(resident._id);
    });
});
