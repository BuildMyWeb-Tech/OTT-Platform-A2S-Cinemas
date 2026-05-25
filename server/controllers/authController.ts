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

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields required",
            });
        }

        const existing = await User.findOne({ email });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        const user = await User.create({
            name,
            email,
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
        if (!email || !password)
            return res.status(400).json({ success: false, message: "Email and password required" });

        const user = await User.findOne({ email });
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
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, image },
            { new: true, runValidators: true }
        ).select("-password");
        res.json({ success: true, data: user });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};