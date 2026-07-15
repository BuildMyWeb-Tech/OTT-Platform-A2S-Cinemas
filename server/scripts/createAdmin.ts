import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "../models/User.js";

const createAdmin = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Connected.");

        // Change these to your desired admin credentials
        const adminEmail = "admin@a2s.com";
        const adminPassword = "admin123456";
        const adminName = "A2S Admin";

        // Check if already exists
        const existing = await User.findOne({ email: adminEmail });
        if (existing) {
            // Just promote to admin if already registered
            existing.role = "admin";
            await existing.save();
            console.log("Existing user promoted to admin:", existing.email);
            process.exit(0);
        }

        // Create fresh admin user
        const admin = await User.create({
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: "admin",
        });

        console.log("Admin created successfully!");
        console.log("Email:   ", adminEmail);
        console.log("Password:", adminPassword);
        console.log("Role:    ", admin.role);
        console.log("ID:      ", admin._id);

        process.exit(0);
    } catch (err: any) {
        console.error("Failed:", err.message);
        process.exit(1);
    }
};

createAdmin();