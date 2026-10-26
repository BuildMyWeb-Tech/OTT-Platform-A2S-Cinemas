import { Request, Response } from "express";
import OTP from "../models/OTP.js";
import User from "../models/User.js";
import License from "../models/License.js";
import Review from "../models/Review.js";
import { generateOTP, sendEmailOTP } from "../services/otpService.js";
import { recalculateMovieRating } from "./reviewController.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_OK = { success: true, message: "If an account exists for this email, a verification code has been sent." };

// POST /api/auth/delete-account/request — public; emails a code to the account owner
export const requestAccountDeletion = async (req: Request, res: Response) => {
    try {
        const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase().trim() : "";
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ success: false, message: "Enter a valid email address" });
        }

        const user = await User.findOne({ email });
        // Same response whether or not the account exists; admins can never be deleted this way
        if (!user || user.role === "admin") return res.json(GENERIC_OK);

        const recent = await OTP.findOne({ identifier: email, type: "email", createdAt: { $gt: new Date(Date.now() - 60_000) } });
        if (recent) {
            return res.status(429).json({ success: false, message: "Please wait 1 minute before requesting another code" });
        }

        const otp = generateOTP();
        await OTP.deleteMany({ identifier: email, type: "email" });
        await OTP.create({ identifier: email, type: "email", otp, purpose: "delete", expiresAt: new Date(Date.now() + 10 * 60_000) });
        await sendEmailOTP(email, otp, user.name, true);

        return res.json(GENERIC_OK);
    } catch (error: any) {
        console.error("[delete-account/request] error:", error.message);
        return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
    }
};

// POST /api/auth/delete-account/confirm — public; the emailed code proves ownership, then data is deleted
export const confirmAccountDeletion = async (req: Request, res: Response) => {
    try {
        const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase().trim() : "";
        const code = String(req.body?.otp ?? "").trim();
        if (!EMAIL_REGEX.test(email) || !/^\d{6}$/.test(code)) {
            return res.status(400).json({ success: false, message: "Enter your email and the 6-digit code" });
        }

        const record = await OTP.findOne({ identifier: email, type: "email", purpose: "delete", expiresAt: { $gt: new Date() } });
        if (!record) {
            return res.status(400).json({ success: false, message: "Code expired or not found. Request a new one." });
        }
        if (record.attempts >= 5) {
            await OTP.deleteOne({ _id: record._id });
            return res.status(400).json({ success: false, message: "Too many incorrect attempts. Request a new code." });
        }
        if (record.otp !== code) {
            record.attempts += 1;
            await record.save();
            return res.status(400).json({ success: false, message: "Incorrect code" });
        }
        await OTP.deleteOne({ _id: record._id });

        const user = await User.findOne({ email });
        if (!user || user.role === "admin") {
            return res.status(400).json({ success: false, message: "Account not found" });
        }

        // Reviews are removed (affected movies' ratings recalculated), as are licenses and the profile.
        // Purchase/payment records are kept because tax and accounting law requires it; they no longer
        // link to any profile.
        const reviews = await Review.find({ userId: user._id }).select("movieId");
        const movieIds = [...new Set(reviews.map((r) => String(r.movieId)))];
        await Review.deleteMany({ userId: user._id });
        for (const id of movieIds) await recalculateMovieRating(id);
        await License.deleteMany({ user: user._id });
        await User.deleteOne({ _id: user._id });

        console.log(`[delete-account] account deleted: ${user._id}`);
        return res.json({ success: true, message: "Your account and personal data have been deleted." });
    } catch (error: any) {
        console.error("[delete-account/confirm] error:", error.message);
        return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
    }
};
