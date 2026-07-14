const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
// Load environment variables from backend/.env
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const userModel = require("../models/user.model");

async function seedAdmin() {
    try {
        if (!process.env.MONGO_URI) {
            console.error("Error: MONGO_URI is not defined in your environment variables.");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        const adminEmail = "ansh@example.com";
        const existingAdmin = await userModel.findOne({ email: adminEmail, isDeleted: false });

        if (existingAdmin) {
            console.log("\n================================================");
            console.log(`Admin user already exists in the database:`);
            console.log(`Email: ${existingAdmin.email}`);
            console.log(`Password: (previously configured password)`);
            console.log("================================================\n");
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash("admin123", 10);
        const admin = await userModel.create({
            fullName: "System Admin",
            email: adminEmail,
            password: hashedPassword,
            role: "admin",
            isActive: true
        });

        console.log("\n================================================");
        console.log("Admin user seeded successfully!");
        console.log(`Email: ${admin.email}`);
        console.log("Password: admin123");
        console.log("================================================\n");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin user:", error);
        process.exit(1);
    }
}

seedAdmin();
