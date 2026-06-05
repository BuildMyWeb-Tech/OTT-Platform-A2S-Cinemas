import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import { clerkClient } from "@clerk/express";

dotenv.config();

const makeAdmin = async () => {
  try {
    console.log("🔄 Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI as string);

    const email = process.env.ADMIN_EMAIL;

    if (!email) {
      throw new Error("ADMIN_EMAIL not set");
    }

    console.log("🔍 Searching user:", email);

    const user = await User.findOneAndUpdate(
      { email },
      { role: "admin" },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found in database");
    }

    console.log("✅ User promoted to admin:", user.email);

    if (user.clerkId) {
      await clerkClient.users.updateUserMetadata(user.clerkId, {
        publicMetadata: {
          role: "admin",
        },
      });

      console.log("✅ Clerk metadata updated");
    }

    console.log("🎉 ADMIN SETUP COMPLETE");
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Admin promotion failed:", err.message);
    process.exit(1);
  }
};

makeAdmin();