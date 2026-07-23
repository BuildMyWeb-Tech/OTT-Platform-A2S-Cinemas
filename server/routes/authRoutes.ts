import express from "express";
import { register, login, getMe, updateProfile, changePassword } from "../controllers/authController.js";
import { sendOTP, verifyOTP } from "../controllers/otpController.js";
import { protect } from "../middleware/auth.js";
import { loginRateLimiter, registerRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Password auth
router.post("/login", loginRateLimiter, login);
router.post("/register", registerRateLimiter, register);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// OTP auth
router.post("/otp/send", sendOTP);
router.post("/otp/verify", verifyOTP);

console.log("[authRoutes] Registered:");
router.stack.forEach((r: any) => {
    if (r.route) {
        const m = Object.keys(r.route.methods).join(",").toUpperCase();
        console.log(`  ${m} /api/auth${r.route.path}`);
    }
});

export default router;