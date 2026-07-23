import nodemailer from "nodemailer";

export const generateOTP = (): string =>
    Math.floor(100000 + Math.random() * 900000).toString();

// ── PHONE OTP via MSG91 ───────────────────────────────────────────────────────
export const sendPhoneOTP = async (phone: string, otp: string): Promise<boolean> => {
    if (process.env.PHONE_OTP_ENABLED !== "yes") {
        console.log(`[OTP-PHONE] DISABLED — OTP for ${phone}: ${otp}`);
        return true;
    }
    try {
        const digits = phone.replace(/\D/g, "");
        const formattedPhone = digits.length === 10 ? `91${digits}` : digits;
        console.log(`[OTP-PHONE] Sending to: ${formattedPhone}`);

        const payload = {
            template_id: process.env.MSG91_TEMPLATE_ID!,
            mobile: formattedPhone,
            authkey: process.env.MSG91_AUTH_KEY!,
            otp,
        };

        const res = await fetch("https://api.msg91.com/api/v5/otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "authkey": process.env.MSG91_AUTH_KEY!,
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json() as any;
        console.log(`[OTP-PHONE] MSG91 response:`, JSON.stringify(data));

        if (data.type === "success") return true;
        console.error(`[OTP-PHONE] Failed:`, data.message || JSON.stringify(data));
        return false;
    } catch (err: any) {
        console.error(`[OTP-PHONE] Error:`, err.message);
        return false;
    }
};

// ── EMAIL OTP via Brevo HTTP API (NOT SMTP — Render blocks SMTP ports) ────────
export const sendEmailOTP = async (email: string, otp: string, name?: string): Promise<boolean> => {
    if (process.env.EMAIL_OTP_ENABLED !== "yes") {
        console.log(`[OTP-EMAIL] DISABLED — OTP for ${email}: ${otp}`);
        return true;
    }
    try {
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            console.error(`[OTP-EMAIL] BREVO_API_KEY not set in ENV`);
            return false;
        }

        const fromEmail = process.env.OTP_FROM_EMAIL || "asmovies896@gmail.com";
        const fromName = process.env.OTP_FROM_NAME || "A2S Cinemas";

        console.log(`[OTP-EMAIL] Sending via Brevo HTTP API to: ${email}`);
        console.log(`[OTP-EMAIL] From: ${fromName} <${fromEmail}>`);
        console.log(`[OTP-EMAIL] API Key present: ${!!apiKey}`);

        const body = {
            sender: { name: fromName, email: fromEmail },
            to: [{ email, name: name || email }],
            subject: `${otp} — Your A2S Cinemas verification code`,
            htmlContent: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0A0A0F;color:#fff;border-radius:12px;">
  <h1 style="color:#E50914;text-align:center;margin-bottom:8px;">🎬 A2S Cinemas</h1>
  <p style="color:#ccc;margin-top:16px;">Hi ${name || "there"},</p>
  <p style="color:#ccc;">Your verification code is:</p>
  <div style="text-align:center;margin:32px 0;">
    <span style="font-size:46px;font-weight:900;letter-spacing:14px;color:#fff;background:#1A1A22;padding:18px 32px;border-radius:12px;display:inline-block;">${otp}</span>
  </div>
  <p style="color:#888;text-align:center;font-size:14px;">
    Expires in <strong style="color:#fff;">10 minutes</strong>.<br/>Do not share this code with anyone.
  </p>
  <hr style="border:none;border-top:1px solid #222;margin:24px 0;"/>
  <p style="color:#555;font-size:12px;text-align:center;">If you did not request this, please ignore this email.</p>
</div>`,
        };

        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey,
            },
            body: JSON.stringify(body),
        });

        const data = await res.json() as any;
        console.log(`[OTP-EMAIL] Brevo API response status: ${res.status}`);
        console.log(`[OTP-EMAIL] Brevo API response:`, JSON.stringify(data));

        if (res.status === 201 || res.ok) {
            console.log(`[OTP-EMAIL] Email sent successfully! MessageId: ${data.messageId}`);
            return true;
        }

        console.error(`[OTP-EMAIL] Brevo API error:`, JSON.stringify(data));
        return false;
    } catch (err: any) {
        console.error(`[OTP-EMAIL] Fetch error:`, err.message);
        return false;
    }
};