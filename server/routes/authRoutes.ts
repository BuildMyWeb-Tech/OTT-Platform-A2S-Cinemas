import express from "express";
import { register, login, getMe, updateProfile, changePassword } from "../controllers/authController.js";
import { sendOTP, verifyOTP } from "../controllers/otpController.js";
import { protect } from "../middleware/auth.js";
import { loginRateLimiter, registerRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Password-based auth
router.post("/login", loginRateLimiter, login);
router.post("/register", registerRateLimiter, register);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// OTP-based auth
router.post("/otp/send", sendOTP);       // POST /api/auth/otp/send
router.post("/otp/verify", verifyOTP);   // POST /api/auth/otp/verify

console.log("[authRoutes] Routes registered:");
router.stack.forEach((r: any) => {
    if (r.route) {
        const methods = Object.keys(r.route.methods).join(",").toUpperCase();
        console.log(`  ${methods} /api/auth${r.route.path}`);
    }
});

export default router;