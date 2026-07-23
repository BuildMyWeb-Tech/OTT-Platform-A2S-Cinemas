import nodemailer from "nodemailer";

export const generateOTP = (): string =>
    Math.floor(100000 + Math.random() * 900000).toString();

export const sendPhoneOTP = async (phone: string, otp: string): Promise<boolean> => {
    if (process.env.PHONE_OTP_ENABLED !== "yes") {
        console.log(`[OTP-PHONE] DISABLED — OTP for ${phone}: ${otp}`);
        return true;
    }
    try {
        // MSG91 needs full number with country code, no + prefix
        // Input is 10-digit: 9344095727 → send as 919344095727
        const digits = phone.replace(/\D/g, "");
        const formattedPhone = digits.length === 10 ? `91${digits}` : digits;

        console.log(`[OTP-PHONE] Sending to: ${formattedPhone}`);

        const payload = {
            template_id: process.env.MSG91_TEMPLATE_ID!,
            mobile: formattedPhone,
            authkey: process.env.MSG91_AUTH_KEY!,
            otp,
        };

        console.log(`[OTP-PHONE] Payload:`, JSON.stringify({ ...payload, authkey: "***" }));

        const res = await fetch("https://api.msg91.com/api/v5/otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "authkey": process.env.MSG91_AUTH_KEY!,
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json() as any;
        console.log(`[OTP-PHONE] MSG91 full response:`, JSON.stringify(data));

        if (data.type === "success") return true;

        // Log specific error for debugging
        console.error(`[OTP-PHONE] MSG91 error:`, data.message || data);
        return false;
    } catch (err: any) {
        console.error(`[OTP-PHONE] Fetch error:`, err.message);
        return false;
    }
};

export const sendEmailOTP = async (email: string, otp: string, name?: string): Promise<boolean> => {
    if (process.env.EMAIL_OTP_ENABLED !== "yes") {
        console.log(`[OTP-EMAIL] DISABLED — OTP for ${email}: ${otp}`);
        return true;
    }
    try {
        console.log(`[OTP-EMAIL] Connecting to Brevo...`);
        console.log(`[OTP-EMAIL] Login: ${process.env.BREVO_SMTP_LOGIN}`);
        console.log(`[OTP-EMAIL] From: ${process.env.OTP_FROM_EMAIL}`);

        const transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com",
            port: 465,
            secure: true,     // SSL on port 465
            auth: {
                user: process.env.BREVO_SMTP_LOGIN!,
                pass: process.env.BREVO_SMTP_KEY!,
            },
            connectionTimeout: 15000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });

        await transporter.verify();
        console.log(`[OTP-EMAIL] SMTP verified OK`);

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

        console.log(`[OTP-EMAIL] Sent to ${email} successfully`);
        return true;
    } catch (err: any) {
        console.error(`[OTP-EMAIL] FULL ERROR:`, err.message);
        console.error(`[OTP-EMAIL] Code: ${err.code}`);
        return false;
    }
};