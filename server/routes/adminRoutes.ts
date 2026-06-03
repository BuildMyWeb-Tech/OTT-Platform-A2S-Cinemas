import express from "express";
import {
    getDashboardStats,
    getAllUsers,
    getUploadUrl,
    blockUser,
    unblockUser,
    getMovieAnalytics,
    exportMovieAnalytics,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, authorize("admin"));

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);
router.post("/upload-url", getUploadUrl);
router.get("/analytics/:movieId", getMovieAnalytics);
router.get("/analytics/:movieId/export", exportMovieAnalytics);

export default router;