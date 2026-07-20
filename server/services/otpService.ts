import nodemailer from "nodemailer";

// Generate 6-digit OTP
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// ── PHONE OTP via MSG91 ───────────────────────────────────────────────────────
export const sendPhoneOTP = async (phone: string, otp: string): Promise<boolean> => {
    const enabled = process.env.PHONE_OTP_ENABLED === "yes";
    if (!enabled) {
        console.log(`[OTP] Phone OTP disabled. OTP for ${phone}: ${otp}`);
        return true; // In dev mode, just log it
    }

    try {
        const authKey = process.env.MSG91_AUTH_KEY!;
        const templateId = process.env.MSG91_TEMPLATE_ID!;
        const senderId = process.env.MSG91_SENDER_ID || "A2SCIN";

        // Format phone — MSG91 needs country code prefix, no +
        const formattedPhone = phone.startsWith("+")
            ? phone.slice(1)
            : phone.startsWith("91")
                ? phone
                : `91${phone}`;

        const url = `https://api.msg91.com/api/v5/otp`;
        const body = {
            template_id: templateId,
            mobile: formattedPhone,
            authkey: authKey,
            otp: otp,
            sender: senderId,
        };

        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        console.log("[OTP] MSG91 response:", data);
        return data.type === "success" || res.ok;
    } catch (err) {
        console.error("[OTP] Phone OTP send failed:", err);
        return false;
    }
};

// ── EMAIL OTP via Brevo (SMTP) ────────────────────────────────────────────────
export const sendEmailOTP = async (email: string, otp: string, name?: string): Promise<boolean> => {
    const enabled = process.env.EMAIL_OTP_ENABLED === "yes";
    if (!enabled) {
        console.log(`[OTP] Email OTP disabled. OTP for ${email}: ${otp}`);
        return true;
    }

    try {
        const provider = process.env.EMAIL_OTP_PROVIDER || "brevo";

        let transporter: nodemailer.Transporter;

        if (provider === "brevo") {
            transporter = nodemailer.createTransport({
                host: "smtp-relay.brevo.com",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.BREVO_SMTP_LOGIN!, // your Brevo login email
                    pass: process.env.BREVO_SMTP_KEY!,   // Brevo SMTP key (not API key)
                },
            });
        } else {
            // Generic SMTP fallback
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST!,
                port: parseInt(process.env.SMTP_PORT || "587"),
                auth: {
                    user: process.env.SMTP_USER!,
                    pass: process.env.SMTP_PASS!,
                },
            });
        }

        const fromEmail = process.env.OTP_FROM_EMAIL || "noreply@a2scinemas.com";
        const fromName = process.env.OTP_FROM_NAME || "A2S Cinemas";
        const displayName = name || "there";

        await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: email,
            subject: `${otp} — Your A2S Cinemas verification code`,
            html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0A0A0F;color:#fff;border-radius:12px;">
                    <div style="text-align:center;margin-bottom:24px;">
                        <h1 style="color:#E50914;font-size:28px;margin:0;">🎬 A2S Cinemas</h1>
                    </div>
                    <p style="font-size:16px;color:#ccc;">Hi ${displayName},</p>
                    <p style="font-size:15px;color:#ccc;">Your verification code is:</p>
                    <div style="text-align:center;margin:28px 0;">
                        <span style="font-size:42px;font-weight:900;letter-spacing:12px;color:#fff;background:#1A1A22;padding:16px 28px;border-radius:12px;display:inline-block;">
                            ${otp}
                        </span>
                    </div>
                    <p style="font-size:13px;color:#888;text-align:center;">
                        This code expires in <strong style="color:#fff;">10 minutes</strong>.<br/>
                        Do not share this code with anyone.
                    </p>
                    <hr style="border:none;border-top:1px solid #222;margin:24px 0;"/>
                    <p style="font-size:12px;color:#555;text-align:center;">
                        If you did not request this, please ignore this email.
                    </p>
                </div>
            `,
        });

        console.log(`[OTP] Email sent to ${email}`);
        return true;
    } catch (err) {
        console.error("[OTP] Email OTP send failed:", err);
        return false;
    }
};