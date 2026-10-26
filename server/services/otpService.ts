
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

export const sendEmailOTP = async (
    email: string,
    otp: string,
    name?: string,
    forDeletion = false
): Promise<boolean> => {
    if (process.env.EMAIL_OTP_ENABLED !== "yes") {
        console.log(`[OTP-EMAIL] DISABLED — OTP for ${email}: ${otp}`);
        return true;
    }
    try {
        const displayName = name || "there";
        const fromName = process.env.OTP_FROM_NAME || "A2S Cinemas";
        const fromEmail = process.env.OTP_FROM_EMAIL || "noreply@a2scinemas.com";

        // Tapping the code opens a page with a working "Copy" button (email clients block JS)
        let apiBase = (process.env.BASE_URL || "https://ott-platform-a2s-cinemas-bsy1.onrender.com/api").replace(/\/+$/, "");
        if (!apiBase.endsWith("/api")) apiBase += "/api";
        const copyUrl = `${apiBase}/auth/otp-copy?c=${encodeURIComponent(otp)}`;

        // Split OTP into individual digits for display
        const digits = otp.split("").join(" &nbsp; ");

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#0A0A0F;border-radius:16px;overflow:hidden;max-width:520px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#E50914;padding:24px 32px;text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:2px;">
                🎬 A2S CINEMAS
              </p>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.8);letter-spacing:1px;">
                STREAMING PLATFORM
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 24px;">
              <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;">
                Hi ${displayName},
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#aaaaaa;line-height:1.6;">
                ${forDeletion
                  ? `You requested to <strong style="color:#ffffff;">permanently delete</strong> your A2S Cinemas account. Enter the code below on the deletion page to confirm. If this was not you, ignore this email and nothing will be deleted.`
                  : `You requested a one-time verification code to sign in to your <strong style="color:#ffffff;">A2S Cinemas</strong> account. Use the code below to complete your login.`}
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 28px;">
                    <div style="display:inline-block;background:#1A1A2E;border:2px solid #E50914;border-radius:14px;padding:20px 36px;">
                      <p style="margin:0 0 6px;font-size:11px;color:#888888;letter-spacing:2px;text-transform:uppercase;">
                        Verification Code
                      </p>
                      <a href="${copyUrl}" style="display:block;margin:0;font-size:46px;font-weight:900;color:#ffffff;letter-spacing:14px;font-family:'Courier New',monospace;text-decoration:none;">${otp}</a>
                      <a href="${copyUrl}" style="display:inline-block;margin-top:14px;background:#E50914;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:10px 22px;border-radius:8px;">Tap to copy code</a>
                      <p style="margin:10px 0 0;font-size:11px;color:#666666;">
                        Tap the code, press Copy, then return to the app
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Info boxes -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="50%" style="padding:0 6px 0 0;">
                    <div style="background:#1A1A22;border-radius:10px;padding:14px;text-align:center;">
                      <p style="margin:0 0 4px;font-size:20px;">⏱</p>
                      <p style="margin:0;font-size:12px;font-weight:700;color:#ffffff;">Expires in</p>
                      <p style="margin:4px 0 0;font-size:11px;color:#888888;">10 minutes</p>
                    </div>
                  </td>
                  <td width="50%" style="padding:0 0 0 6px;">
                    <div style="background:#1A1A22;border-radius:10px;padding:14px;text-align:center;">
                      <p style="margin:0 0 4px;font-size:20px;">🔒</p>
                      <p style="margin:0;font-size:12px;font-weight:700;color:#ffffff;">Single use</p>
                      <p style="margin:4px 0 0;font-size:11px;color:#888888;">Do not share</p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <div style="background:#1A0A0A;border-left:3px solid #E50914;border-radius:6px;padding:14px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#cccccc;line-height:1.5;">
                  ⚠️ <strong style="color:#ffffff;">Didn't request this?</strong><br/>
                  If you did not request this code, please ignore this email.
                  Your account remains secure and no action is needed.
                </p>
              </div>

              <p style="margin:0;font-size:13px;color:#666666;line-height:1.5;text-align:center;">
                This code was sent to <strong style="color:#aaaaaa;">${email}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0D0D15;padding:20px 32px;border-top:1px solid #1a1a2e;text-align:center;">
              <p style="margin:0;font-size:12px;color:#444444;">
                © 2026 A2S Cinemas · All rights reserved
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#333333;">
                This is an automated message — please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
            `;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);

        let res: Response;
        try {
            res = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    "api-key": process.env.BREVO_API_KEY!,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify({
                    sender: { name: fromName, email: fromEmail },
                    to: [{ email }],
                    subject: `Your A2S Cinemas verification code: ${otp}`,
                    htmlContent,
                }),
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeoutId);
        }

        if (!res.ok) {
            const body = await res.text();
            console.error("[OTP-EMAIL] Brevo API rejected send:", { status: res.status, body });
            return false;
        }

        console.log(`[OTP-EMAIL] Sent to ${email}`);
        return true;
    } catch (err: any) {
        console.error("[OTP-EMAIL] Send failed:", {
            message: err.message,
            name: err.name,
            code: err.code,
        });
        return false;
    }
};