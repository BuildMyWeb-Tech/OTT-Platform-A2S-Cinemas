import { Request, Response } from "express";
import crypto from "crypto";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import OTP from "../models/OTP.js";
import User from "../models/User.js";
import { generateOTP, sendPhoneOTP, sendEmailOTP } from "../services/otpService.js";

const JWT_SECRET: Secret = process.env.JWT_SECRET as string;
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


        const sent = type === "phone"
            ? await sendPhoneOTP(normalizedId, otp)
            : await sendEmailOTP(normalizedId, otp, name);

        if (!sent) {
            return res.status(500).json({ success: false, message: "Unable to send OTP right now. Please try again in a moment." });
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
        const { identifier, type, otp, purpose, name, phone } = req.body;

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

        // New email: only the Sign Up flow may create an account, and it must carry a valid phone.
        // Checked before the OTP is consumed so the user can retry (e.g. switch to Sign Up) with the same code.
        if (type === "email") {
            const existing = await User.exists({ email: normalizedId });
            if (!existing) {
                if (purpose === "login") {
                    return res.status(404).json({ success: false, message: "No account found for this email. Please sign up first." });
                }
                const normalizedPhone = String(phone ?? "").replace(/\D/g, "").slice(-10);
                if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
                    return res.status(400).json({ success: false, message: "A valid 10-digit mobile number is required to sign up." });
                }
            }
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
            else if (phone) {
                const normalizedPhone = String(phone).replace(/\D/g, "").slice(-10);
                if (PHONE_REGEX.test(normalizedPhone)) userData.phone = normalizedPhone;
            }
            user = await User.create(userData);
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "Account is blocked" });
        }

        const token = signToken(user._id.toString());
        return res.json({
            success: true,
            token,
            data: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, image: (user as any).image },
        });
    } catch (err: any) {
        console.error("[OTP-VERIFY] Error:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }
};
// ── GET /api/auth/otp-copy?c=123456 ───────────────────────────────────────────
// Landing page for the code in the OTP email. Email clients strip JavaScript, so a
// tap on the code opens this page, where a button (a real user gesture) can write
// the code to the clipboard; the app then picks it up when it returns to the foreground.
export const otpCopyPage = (req: Request, res: Response) => {
    const code = String(req.query.c ?? "");
    if (!/^\d{6}$/.test(code)) {
        return res.status(400).type("text/plain").send("Invalid code");
    }
    const nonce = crypto.randomBytes(16).toString("base64");
    res.set({
        "Content-Security-Policy": `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'`,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex, nofollow",
    });
    res.type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>A2S Cinemas verification code</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0A0F;color:#fff;font-family:Arial,sans-serif;text-align:center}
.card{padding:32px 24px;max-width:340px;width:100%}
.code{font-family:'Courier New',monospace;font-size:44px;font-weight:900;letter-spacing:10px;background:#1A1A2E;border:2px solid #E50914;border-radius:14px;padding:18px 10px;margin:18px 0}
button{width:100%;background:#E50914;color:#fff;border:0;border-radius:12px;padding:16px;font-size:17px;font-weight:700}
p{color:#aaa;font-size:14px;line-height:1.5}
</style></head><body><div class="card">
<h2 style="margin:0">A2S Cinemas</h2>
<p>Your verification code</p>
<div class="code" id="code">${code}</div>
<button id="btn">Copy code</button>
<p id="msg">Tap the button, then go back to the A2S Cinemas app. It will fill the code for you.</p>
</div>
<script nonce="${nonce}">
var code=document.getElementById('code').textContent,msg=document.getElementById('msg'),btn=document.getElementById('btn');
function done(){btn.textContent='Copied \u2713';msg.textContent='Now switch back to the A2S Cinemas app \u2014 the code will be filled automatically.';}
function fallback(){var t=document.createElement('textarea');t.value=code;document.body.appendChild(t);t.select();try{document.execCommand('copy');done();}catch(e){msg.textContent='Could not copy automatically. Please touch and hold the code to copy it.';}document.body.removeChild(t);}
btn.addEventListener('click',function(){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(code).then(done,fallback);}else{fallback();}});
</script></body></html>`);
};
