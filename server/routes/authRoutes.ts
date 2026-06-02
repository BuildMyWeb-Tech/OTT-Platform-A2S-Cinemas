import express from "express";
import { register, login, getMe, updateProfile } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { loginRateLimiter, registerRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();
router.post("/login", loginRateLimiter, login);
router.post("/register", registerRateLimiter, register);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
export default router;