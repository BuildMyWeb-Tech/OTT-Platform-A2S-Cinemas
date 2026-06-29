import express from "express";
import { register, login, getMe, updateProfile, changePassword } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { loginRateLimiter, registerRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/login", loginRateLimiter, login);
router.post("/register", registerRateLimiter, register);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

// Debug: log before protect middleware runs
router.put("/change-password",
    (req, res, next) => {
        console.log(`[CHANGE-PWD] Route hit - Body keys: ${Object.keys(req.body).join(", ")}`);
        console.log(`[CHANGE-PWD] Auth header present: ${!!req.headers.authorization}`);
        next();
    },
    protect,
    (req, res, next) => {
        console.log(`[CHANGE-PWD] Passed protect - User: ${(req as any).user?._id}`);
        next();
    },
    changePassword
);

// Log all registered routes on startup
console.log("[authRoutes] Routes registered:");
router.stack.forEach((r: any) => {
    if (r.route) {
        const methods = Object.keys(r.route.methods).join(",").toUpperCase();
        console.log(`  ${methods} /api/auth${r.route.path}`);
    }
});

export default router;