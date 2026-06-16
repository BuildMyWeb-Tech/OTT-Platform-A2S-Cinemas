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
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = express.Router();

// Public — but optionalAuth populates req.user if a valid token is sent,
// so getMovieReviews can also return the caller's own pending/rejected review
router.get("/movie/:movieId", optionalAuth, getMovieReviews);

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