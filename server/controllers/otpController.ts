import { Request, Response } from "express";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import OTP from "../models/OTP.js";
import User from "../models/User.js";
import { generateOTP, sendPhoneOTP, sendEmailOTP } from "../services/otpService.js";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "30d") as SignOptions["expiresIn"];
const signToken = (id: string) => jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const PHONE_REGEX = /^(\+91|91)?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── POST /api/auth/otp/send ───────────────────────────────────────────────────
export const sendOTP = async (req: Request, res: Response) => {
    try {
        const { identifier, type, purpose, name } = req.body;
        console.log(`[OTP-SEND] type=${type} purpose=${purpose} identifier=${identifier}`);

        if (!identifier || !type || !purpose) {
            return res.status(400).json({ success: false, message: "identifier, type, and purpose required" });
        }
        if (!["phone", "email"].includes(type)) {
            return res.status(400).json({ success: false, message: "type must be phone or email" });
        }
        if (!["login", "register"].includes(purpose)) {
            return res.status(400).json({ success: false, message: "purpose must be login or register" });
        }
        if (type === "phone" && process.env.PHONE_OTP_ENABLED !== "yes") {
            return res.status(400).json({ success: false, message: "Phone OTP is not enabled" });
        }
        if (type === "email" && process.env.EMAIL_OTP_ENABLED !== "yes") {
            return res.status(400).json({ success: false, message: "Email OTP is not enabled" });
        }

        const normalizedId = type === "email"
    ? identifier.toLowerCase().trim()
    : identifier.replace(/\D/g, "").slice(-10); // always exactly 10 digits

        console.log(`[OTP-SEND] normalizedId: ${normalizedId}, length: ${normalizedId.length}`);

        if (type === "email" && !EMAIL_REGEX.test(normalizedId)) {
            return res.status(400).json({ success: false, message: "Enter a valid email address" });
        }
        if (type === "phone" && normalizedId.length !== 10) {
            return res.status(400).json({ success: false, message: "Enter a valid 10-digit Indian mobile number" });
        }

        // Rate limit: 1 OTP per minute
        const recent = await OTP.findOne({
            identifier: normalizedId,
            type,
            createdAt: { $gt: new Date(Date.now() - 60_000) },
        });
        if (recent) {
            return res.status(429).json({ success: false, message: "Please wait 1 minute before requesting another OTP" });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60_000);

        await OTP.deleteMany({ identifier: normalizedId, type });
        await OTP.create({ identifier: normalizedId, type, otp, purpose, name: name?.trim(), expiresAt });

        console.log(`[OTP-SEND] Generated OTP: ${otp} for ${normalizedId} (DEV LOG — remove in prod)`);

        const sent = type === "phone"
            ? await sendPhoneOTP(normalizedId, otp)
            : await sendEmailOTP(normalizedId, otp, name);

        if (!sent) {
            return res.status(500).json({ success: false, message: "Failed to send OTP. Please check server config." });
        }

        const maskedId = type === "email"
            ? `${normalizedId.split("@")[0].slice(0, 3)}***@${normalizedId.split("@")[1]}`
            : `+91 ****${normalizedId.slice(-4)}`;

        return res.json({ success: true, message: `OTP sent to ${maskedId}` });
    } catch (err: any) {
        console.error("[OTP-SEND] Error:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ── POST /api/auth/otp/verify ─────────────────────────────────────────────────
export const verifyOTP = async (req: Request, res: Response) => {
    try {
        const { identifier, type, otp, purpose, name } = req.body;
        console.log(`[OTP-VERIFY] type=${type} purpose=${purpose} otp=${otp}`);

        if (!identifier || !type || !otp || !purpose) {
            return res.status(400).json({ success: false, message: "identifier, type, otp, and purpose required" });
        }

        const normalizedId = type === "email"
            ? identifier.toLowerCase().trim()
            : identifier.replace(/\D/g, "").slice(-10);

        const record = await OTP.findOne({
            identifier: normalizedId,
            type,
            purpose,
            verified: false,
            expiresAt: { $gt: new Date() },
        });

        if (!record) {
            return res.status(400).json({ success: false, message: "OTP expired or not found. Request a new one." });
        }

        if (record.attempts >= 5) {
            await OTP.deleteOne({ _id: record._id });
            return res.status(400).json({ success: false, message: "Too many incorrect attempts. Request a new OTP." });
        }

        if (record.otp !== otp.toString().trim()) {
            record.attempts += 1;
            await record.save();
            const remaining = 5 - record.attempts;
            return res.status(400).json({
                success: false,
                message: remaining > 0
                    ? `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
                    : "Too many incorrect attempts. Request a new OTP.",
            });
        }

        // OTP correct
        record.verified = true;
        await record.save();
        await OTP.deleteOne({ _id: record._id });

        // Find or create user
        const fieldKey = type === "email" ? "email" : "phone";
        let user = await User.findOne({ [fieldKey]: normalizedId });

        if (!user) {
            const userName = name?.trim() || record.name || (type === "email" ? normalizedId.split("@")[0] : "User");
            const userData: any = {
                name: userName,
                email: type === "email" ? normalizedId : `phone_${normalizedId}@a2scinemas.app`,
                password: `otp_${Date.now()}_${Math.random()}`,
                authMethod: type === "phone" ? "phone_otp" : "email_otp",
            };
            if (type === "phone") userData.phone = normalizedId;
            user = await User.create(userData);
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "Account is blocked" });
        }

        const token = signToken(user._id.toString());
        return res.json({
            success: true,
            token,
            data: { _id: user._id, name: user.name, email: user.email, role: user.role, image: (user as any).image },
        });
    } catch (err: any) {
        console.error("[OTP-VERIFY] Error:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
};