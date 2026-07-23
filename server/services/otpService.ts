import nodemailer from "nodemailer";

export const generateOTP = (): string =>
    Math.floor(100000 + Math.random() * 900000).toString();

export const sendPhoneOTP = async (phone: string, otp: string): Promise<boolean> => {
    if (process.env.PHONE_OTP_ENABLED !== "yes") {
        console.log(`[OTP-PHONE] DISABLED — OTP for ${phone}: ${otp}`);
        return true;
    }
    try {
        const formattedPhone = phone.startsWith("+")
            ? phone.slice(1)
            : phone.startsWith("91") ? phone : `91${phone}`;

        const body = {
            template_id: process.env.MSG91_TEMPLATE_ID!,
            mobile: formattedPhone,
            authkey: process.env.MSG91_AUTH_KEY!,
            otp,
            sender: process.env.MSG91_SENDER_ID || "A2SCIN",
        };

        const res = await fetch("https://api.msg91.com/api/v5/otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json() as any;
        console.log("[OTP-PHONE] MSG91 response:", JSON.stringify(data));
        return data.type === "success" || res.ok;
    } catch (err: any) {
        console.error("[OTP-PHONE] Send failed:", err.message);
        return false;
    }
};

export const sendEmailOTP = async (email: string, otp: string, name?: string): Promise<boolean> => {
    if (process.env.EMAIL_OTP_ENABLED !== "yes") {
        console.log(`[OTP-EMAIL] DISABLED — OTP for ${email}: ${otp}`);
        return true;
    }
    try {
        console.log(`[OTP-EMAIL] Connecting to Brevo SMTP...`);
        console.log(`[OTP-EMAIL] Login: ${process.env.BREVO_SMTP_LOGIN}`);
        console.log(`[OTP-EMAIL] Key present: ${!!process.env.BREVO_SMTP_KEY}`);
        console.log(`[OTP-EMAIL] From: ${process.env.OTP_FROM_EMAIL}`);

        const transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.BREVO_SMTP_LOGIN!,
                pass: process.env.BREVO_SMTP_KEY!,
            },
            connectionTimeout: 10000,
            greetingTimeout: 8000,
        });

        // Verify connection before sending
        await transporter.verify();
        console.log(`[OTP-EMAIL] SMTP connection verified OK`);

        await transporter.sendMail({
            from: `"${process.env.OTP_FROM_NAME || "A2S Cinemas"}" <${process.env.OTP_FROM_EMAIL}>`,
            to: email,
            subject: `${otp} — Your A2S Cinemas verification code`,
            html: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0A0A0F;color:#fff;border-radius:12px;">
  <h1 style="color:#E50914;text-align:center;">🎬 A2S Cinemas</h1>
  <p style="color:#ccc;">Hi ${name || "there"},</p>
  <p style="color:#ccc;">Your verification code is:</p>
  <div style="text-align:center;margin:28px 0;">
    <span style="font-size:42px;font-weight:900;letter-spacing:12px;color:#fff;background:#1A1A22;padding:16px 28px;border-radius:12px;display:inline-block;">${otp}</span>
  </div>
  <p style="color:#888;text-align:center;">Expires in <strong style="color:#fff;">10 minutes</strong>. Do not share.</p>
</div>`,
        });
        console.log(`[OTP-EMAIL] Email sent successfully to ${email}`);
        return true;
    } catch (err: any) {
        console.error(`[OTP-EMAIL] FULL ERROR:`, err);
        console.error(`[OTP-EMAIL] Code: ${err.code}`);
        console.error(`[OTP-EMAIL] Message: ${err.message}`);
        return false;
    }
};