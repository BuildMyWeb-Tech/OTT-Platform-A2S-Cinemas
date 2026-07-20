import { Request, Response } from "express";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import OTP from "../models/OTP.js";
import User from "../models/User.js";
import { generateOTP, sendPhoneOTP, sendEmailOTP } from "../services/otpService.js";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "30d") as SignOptions["expiresIn"];

const signToken = (id: string) =>
    jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const PHONE_REGEX = /^(\+91|91)?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

// ── POST /api/auth/otp/send ───────────────────────────────────────────────────
export const sendOTP = async (req: Request, res: Response) => {
    try {
        const { identifier, type, purpose, name } = req.body;

        if (!identifier || !type || !purpose) {
            return res.status(400).json({ success: false, message: "identifier, type, and purpose are required" });
        }
        if (!["phone", "email"].includes(type)) {
            return res.status(400).json({ success: false, message: "type must be phone or email" });
        }
        if (!["login", "register"].includes(purpose)) {
            return res.status(400).json({ success: false, message: "purpose must be login or register" });
        }

        const normalizedId = type === "email"
            ? identifier.toLowerCase().trim()
            : identifier.replace(/\s/g, "");

        // Validate format
        if (type === "email" && !EMAIL_REGEX.test(normalizedId)) {
            return res.status(400).json({ success: false, message: "Enter a valid email address" });
        }
        if (type === "phone" && !PHONE_REGEX.test(normalizedId)) {
            return res.status(400).json({ success: false, message: "Enter a valid 10-digit Indian mobile number" });
        }

        // Check feature flags
        if (type === "phone" && process.env.PHONE_OTP_ENABLED !== "yes") {
            return res.status(400).json({ success: false, message: "Phone OTP is not enabled" });
        }
        if (type === "email" && process.env.EMAIL_OTP_ENABLED !== "yes") {
            return res.status(400).json({ success: false, message: "Email OTP is not enabled" });
        }

        // Rate limit: max 1 OTP per minute for same identifier
        const recentOTP = await OTP.findOne({
            identifier: normalizedId,
            type,
            createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
        });
        if (recentOTP) {
            return res.status(429).json({ success: false, message: "Please wait 1 minute before requesting another OTP" });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Delete any existing OTP for this identifier
        await OTP.deleteMany({ identifier: normalizedId, type });

        // Save OTP
        await OTP.create({
            identifier: normalizedId,
            type,
            otp,
            purpose,
            name: name?.trim(),
            expiresAt,
        });

        // Send OTP
        let sent = false;
        if (type === "phone") {
            sent = await sendPhoneOTP(normalizedId, otp);
        } else {
            sent = await sendEmailOTP(normalizedId, otp, name);
        }

        if (!sent) {
            return res.status(500).json({ success: false, message: "Failed to send OTP. Please try again." });
        }

        return res.json({
            success: true,
            message: type === "phone"
                ? `OTP sent to ${normalizedId.slice(-4).padStart(normalizedId.length, "*")}`
                : `OTP sent to ${normalizedId.split("@")[0].slice(0, 3)}***@${normalizedId.split("@")[1]}`,
        });
    } catch (err: any) {
        console.error("[sendOTP]", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /api/auth/otp/verify ─────────────────────────────────────────────────
export const verifyOTP = async (req: Request, res: Response) => {
    try {
        const { identifier, type, otp, purpose, name } = req.body;

        if (!identifier || !type || !otp || !purpose) {
            return res.status(400).json({ success: false, message: "identifier, type, otp, and purpose are required" });
        }

        const normalizedId = type === "email"
            ? identifier.toLowerCase().trim()
            : identifier.replace(/\s/g, "");

        // Find OTP record
        const record = await OTP.findOne({
            identifier: normalizedId,
            type,
            purpose,
            verified: false,
            expiresAt: { $gt: new Date() },
        });

        if (!record) {
            return res.status(400).json({ success: false, message: "OTP expired or not found. Please request a new one." });
        }

        // Check max attempts
        if (record.attempts >= MAX_ATTEMPTS) {
            await OTP.deleteOne({ _id: record._id });
            return res.status(400).json({ success: false, message: "Too many incorrect attempts. Please request a new OTP." });
        }

        // Verify OTP
        if (record.otp !== otp.trim()) {
            record.attempts += 1;
            await record.save();
            const remaining = MAX_ATTEMPTS - record.attempts;
            return res.status(400).json({
                success: false,
                message: remaining > 0
                    ? `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
                    : "Too many incorrect attempts. Please request a new OTP.",
            });
        }

        // OTP is correct — mark as verified
        record.verified = true;
        await record.save();

        // Handle register vs login
        if (purpose === "register") {
            // Check if already registered
            const fieldKey = type === "email" ? "email" : "phone";
            const existing = await User.findOne({ [fieldKey]: normalizedId });
            if (existing) {
               // Already exists — just log them in
const token = signToken(existing._id.toString());
await OTP.deleteOne({ _id: record._id });
return res.json({
    success: true,
    token,
    data: {
        _id: existing._id,
        name: existing.name,
        email: existing.email,
        role: existing.role,
    },
});
            }

           const userName = name?.trim() || record.name || (type === "email" ? normalizedId.split("@")[0] : "User");
const newUserData: any = {
    name: userName,
    email: type === "email" ? normalizedId : `${normalizedId}@phone.a2s`,
    password: `otp_${Date.now()}_${Math.random()}`,
    authMethod: type === "phone" ? "phone_otp" : "email_otp",
};
if (type === "phone") newUserData.phone = normalizedId;

const newUser = await User.create(newUserData);

const token = signToken(newUser._id.toString());
await OTP.deleteOne({ _id: record._id });

return res.status(201).json({
    success: true,
    token,
    data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
    },
});
        }

        // purpose === "login"
        const fieldKey = type === "email" ? "email" : "phone";
        const user = await User.findOne({ [fieldKey]: normalizedId });

        if (!user) {
            const userName = type === "email" ? normalizedId.split("@")[0] : "User";
const autoUserData: any = {
    name: userName,
    email: type === "email" ? normalizedId : `${normalizedId}@phone.a2s`,
    password: `otp_${Date.now()}_${Math.random()}`,
    authMethod: type === "phone" ? "phone_otp" : "email_otp",
};
if (type === "phone") autoUserData.phone = normalizedId;

const newUser = await User.create(autoUserData);
const token = signToken(newUser._id.toString());
await OTP.deleteOne({ _id: record._id });

return res.status(201).json({
    success: true,
    token,
    data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
    },
});
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "Account is blocked" });
        }

        const token = signToken(user._id.toString());
        await OTP.deleteOne({ _id: record._id });

        return res.json({
            success: true,
            token,
            data: { _id: user._id, name: user.name, email: user.email, role: user.role, image: user.image },
        });
    } catch (err: any) {
        console.error("[verifyOTP]", err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};