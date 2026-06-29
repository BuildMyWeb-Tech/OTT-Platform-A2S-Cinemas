import { Request, Response } from "express";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "30d") as SignOptions["expiresIn"];

const signToken = (id: string) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ success: false, message: "Invalid input" });
        }
        if (!name.trim() || !email.trim() || !password) {
            return res.status(400).json({ success: false, message: "All fields required" });
        }
        if (!EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({ success: false, message: "Enter a valid email address" });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
        }
        const normalizedEmail = email.toLowerCase().trim();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }
        const user = await User.create({ name: name.trim(), email: normalizedEmail, password });
        const token = signToken(user._id.toString());
        return res.status(201).json({
            success: true, token,
            data: { _id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ success: false, message: "Invalid input" });
        }
        if (!email.trim() || !password)
            return res.status(400).json({ success: false, message: "Email and password required" });
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user || !(await user.comparePassword(password)))
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        if (user.isBlocked)
            return res.status(403).json({ success: false, message: "Account is blocked" });
        const token = signToken(user._id.toString());
        res.json({
            success: true, token,
            data: { _id: user._id, name: user.name, email: user.email, role: user.role, image: user.image },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { name, image } = req.body;
        if (name !== undefined && (typeof name !== "string" || !name.trim())) {
            return res.status(400).json({ success: false, message: "Name cannot be empty" });
        }
        const updateData: any = {};
        if (name !== undefined) updateData.name = name.trim();
        if (image !== undefined) updateData.image = image;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true, runValidators: false }
        ).select("-password");
        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    console.log("[changePassword] Controller entered");
    console.log("[changePassword] Body:", JSON.stringify(req.body));
    console.log("[changePassword] User ID:", req.user?._id);
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            console.log("[changePassword] Missing fields");
            return res.status(400).json({ success: false, message: "Both old and new password required" });
        }
        if (newPassword.length < 6) {
            console.log("[changePassword] Password too short");
            return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
        }
        const user = await User.findById(req.user._id).select("+password");
        if (!user) {
            console.log("[changePassword] User not found in DB");
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        console.log("[changePassword] Password match:", isMatch);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }
        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();
        console.log("[changePassword] Password updated successfully");
        res.json({ success: true, message: "Password updated successfully" });
    } catch (error: any) {
        console.error("[changePassword] Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};