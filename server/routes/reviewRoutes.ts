import express from "express";
import {
    createReview,
    getMovieReviews,
    getMyReview,
    getAllReviews,
    approveReview,
    rejectReview,
    bulkModerateReviews,
    deleteReview,
} from "../controllers/reviewController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public
router.get("/movie/:movieId", getMovieReviews);

// Authenticated users
router.post("/", protect, createReview);
router.get("/my/:movieId", protect, getMyReview);
router.delete("/:id", protect, deleteReview);

// Admin only
router.get("/admin/all", protect, authorize("admin"), getAllReviews);
router.patch("/:id/approve", protect, authorize("admin"), approveReview);
router.patch("/:id/reject", protect, authorize("admin"), rejectReview);
router.patch("/bulk", protect, authorize("admin"), bulkModerateReviews);

export default router;