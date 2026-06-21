import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// JSON request processing
app.use(express.json());

// In-memory token/OTP cache for security validation
// Keys: email.toLowerCase() -> { otp, expires }
const otpCache = new Map<string, { otp: string; expires: number }>();

// Helper function to obtain SMTP transporter or return simulated fallback
async function getMailerTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Golden Play Support" <support@goldenplay.com>';

  if (host && user && pass) {
    console.log(`[SMTP] Confirmed custom production credentials: ${host}:${port}`);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2"
      },
      connectionTimeout: 15000, // 15 seconds connection timeout
      greetingTimeout: 15000,   // 15 seconds greeting timeout
      socketTimeout: 20000      // 20 seconds socket timeout
    });
    return { transporter, from, type: "production" };
  }

  // Fallback immediately to simulated sandbox to prevent network call freezes
  return {
    transporter: null,
    from: '"Golden Play Simulator" <simulator@goldenplay.com>',
    type: "simulated"
  };
}

// 1. Health API Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Golden Play server active" });
});

// 2. Dispatch OTP / Reset Link
app.post("/api/auth/send-reset", async (req: any, res: any) => {
  try {
    const { email, username, origin } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: "Please supply a valid player email address." });
    }

    // Generate random 6-digit OTP verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes limit

    // Save in secure memory cache
    otpCache.set(email.toLowerCase().trim(), { otp, expires });

    const clientOrigin = origin || req.headers.origin || "http://localhost:3000";
    const resetUrl = `${clientOrigin}/?action=reset-password&email=${encodeURIComponent(email)}&otp=${otp}`;

    const mailConfig = await getMailerTransporter();

    const emailHtmlPayload = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #030712; color: #f3f4f6; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">GOLDEN PLAY</h1>
          <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1.5px;">Premium Player Portal</p>
        </div>
        
        <div style="background-color: #0b1329; border: 1px solid #1e3a8a; padding: 30px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #ffffff; font-size: 20px; margin-top: 0; font-weight: 700;">Password Change Request</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Hello Champion player <strong>${username || 'Player'}</strong>,</p>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">A reset request was submitted for your secure portal account. Use either of the validation choices below to complete your credential change:</p>
          
          <!-- Method 1: The Code -->
          <div style="margin: 30px 0; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px;">METHOD 1: Enter 6-Digit Verification PIN</p>
            <div style="font-size: 32px; font-weight: 800; color: #f59e0b; background-color: #030712; padding: 12px 24px; display: inline-block; border-radius: 8px; letter-spacing: 6px; border: 1px dashed #f59e0b;">
              ${otp}
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 5px;">Expires in 15 minutes</p>
          </div>

          <!-- Method 2: The Direct Link Button -->
          <div style="margin: 30px 0; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">METHOD 2: One-Click Instant Recovery Link</p>
            <a href="${resetUrl}" style="background-color: #f59e0b; color: #030712; padding: 12px 30px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 6px; display: inline-block; transition: all 0.2s;">
              Reset Password Online
            </a>
          </div>
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; line-height: 1.6; margin: 0 10%;">
          If you did not request a credential update, you can safely refuse or ignore this dispatch. Your active account secure key remains unchanged.
        </p>

        <div style="border-top: 1px solid #1e293b; margin-top: 30px; padding-top: 20px; text-align: center; color: #475569; font-size: 11px;">
          &copy; 2026 Golden Play. All Rights Reserved.
        </div>
      </div>
    `;

    // Try to send via real transporter if configured, otherwise fallback to local simulator immediately
    let smtpError: string | null = null;
    if (mailConfig.type === "production" && mailConfig.transporter) {
      try {
        await Promise.race([
          mailConfig.transporter.sendMail({
            from: mailConfig.from,
            to: email,
            subject: "🔑 Reset Your Golden Play Security Password",
            html: emailHtmlPayload
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP Timeout Connection Limit")), 15000))
        ]);

        return res.status(200).json({
          success: true,
          type: "production",
          message: "Security reset link successfully transmitted directly to user address."
        });
      } catch (err: any) {
        smtpError = err?.message || String(err);
        console.warn("[SMTP FAILURE] Falling back to local virtual simulator:", err);
      }
    }

    // Default simulated instant response
    return res.status(200).json({
      success: true,
      type: "simulated",
      message: "Virtual security outbox simulated with instant delivery.",
      emailRecipient: email,
      sentOtpCode: otp,
      resetUrl: resetUrl,
      htmlMessage: emailHtmlPayload,
      smtpError: smtpError
    });

  } catch (error: any) {
    console.error("Mail Dispatch Error:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to dispatch email securely." });
  }
});

// 3. Verify OTP code
app.post("/api/auth/verify-reset", (req: any, res: any) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, error: "Both email and OTP code are required for verification." });
  }

  const cached = otpCache.get(email.toLowerCase().trim());

  if (!cached) {
    return res.status(400).json({ success: false, error: "No active verification code session located for this user." });
  }

  if (Date.now() > cached.expires) {
    otpCache.delete(email.toLowerCase().trim());
    return res.status(400).json({ success: false, error: "Verification code has expired. Please claim a new OTP." });
  }

  if (cached.otp.trim() !== otp.trim()) {
    return res.status(400).json({ success: false, error: "Invalid verification code specified." });
  }

  // Clear cache after successful audit verification
  otpCache.delete(email.toLowerCase().trim());

  return res.json({
    success: true,
    message: "Information validated successfully."
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Golden Play Server] Online at http://127.0.0.1:${PORT}`);
  });
}

startServer();
