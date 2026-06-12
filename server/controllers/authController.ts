import { Request, Response } from "express";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "secret";

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "30d") as SignOptions["expiresIn"];

const signToken = (id: string) => {
    return jwt.sign(
        { id },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN,
        }
    );
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        // Reject non-string inputs — blocks NoSQL injection via object operators
        if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ success: false, message: "Invalid input" });
        }

        if (!name.trim() || !email.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields required",
            });
        }

        // Validate email format
        if (!EMAIL_REGEX.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid email address",
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existing = await User.findOne({ email: normalizedEmail });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
        });

        const token = signToken(user._id.toString());

        return res.status(201).json({
            success: true,
            token,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error: any) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Reject non-string inputs — blocks NoSQL injection via object operators like { $gt: "" }
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
            success: true,
            token,
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

        // Validate name if provided
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