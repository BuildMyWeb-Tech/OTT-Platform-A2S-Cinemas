import { Request, Response } from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Purchase from "../models/Purchase.js";
import Movie from "../models/Movie.js";

const isValidObjectId = (id: unknown): boolean =>
    typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

// Helper — recalculate and save movie average rating
async function recalculateMovieRating(movieId: string) {
    const result = await Review.aggregate([
        { $match: { movieId: new mongoose.Types.ObjectId(movieId) } },
        {
            $group: {
                _id: null,
                average: { $avg: "$rating" },
                count: { $sum: 1 },
            },
        },
    ]);

    const average = result[0]?.average ?? 0;
    const count = result[0]?.count ?? 0;

    await Movie.findByIdAndUpdate(movieId, {
        "ratings.average": Math.round(average * 10) / 10,
        "ratings.count": count,
    });
}

// ── POST /api/reviews ─────────────────────────────────────────────────────────
// Create or update own review — only purchased users
export const createReview = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        const { movieId, rating, comment } = req.body;

        if (!movieId || !rating) {
            return res.status(400).json({
                success: false,
                message: "movieId and rating are required",
            });
        }

        if (!isValidObjectId(movieId)) {
            return res.status(400).json({ success: false, message: "Invalid movie ID" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5",
            });
        }

        // Verify user has purchased this movie
        const purchase = await Purchase.findOne({
            user: userId,
            movie: movieId,
            status: { $in: ["active", "expired"] },
        });

        if (!purchase) {
            return res.status(403).json({
                success: false,
                message: "You must purchase this movie before reviewing it",
                code: "PURCHASE_REQUIRED",
            });
        }

        // Sanitize comment — strip HTML tags to prevent XSS
        const sanitizedComment = comment
        ? String(comment).replace(/<[^>]*>/g, "").trim().slice(0, 1000)
        : undefined;

        // Check if review already exists
        const existing = await Review.findOne({ movieId, userId });

        if (existing) {
            // Update existing review
            existing.rating = Number(rating);
            if (sanitizedComment !== undefined) {
                existing.comment = sanitizedComment;
                // Re-editing comment resets to pending — must be re-approved
                existing.status = "pending";
                existing.approvedBy = undefined;
                existing.approvedAt = undefined;
            }
            await existing.save();

            // Rating updates instantly — recalculate immediately
            await recalculateMovieRating(movieId);

            return res.json({
                success: true,
                data: existing,
                message: "Review updated. Comment is pending admin approval.",
            });
        }

        // Create new review
        const review = await Review.create({
            movieId,
            userId,
            rating: Number(rating),
            comment: sanitizedComment,
            status: "pending",
        });

        // Rating updates instantly
        await recalculateMovieRating(movieId);

        res.status(201).json({
            success: true,
            data: review,
            message: comment
                ? "Rating saved. Comment is pending admin approval."
                : "Rating saved.",
        });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this movie",
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET /api/reviews/movie/:movieId ───────────────────────────────────────────
// Public — approved reviews only
export const getMovieReviews = async (req: Request, res: Response) => {
    try {
        const { movieId } = req.params;

        if (!isValidObjectId(movieId)) {
            return res.status(400).json({ success: false, message: "Invalid movie ID" });
        }

        const { page = 1, limit = 10 } = req.query;
        const p = Math.max(1, Number(page));
        const l = Math.min(20, Math.max(1, Number(limit)));

        const total = await Review.countDocuments({
            movieId,
            status: "approved",
        });

        const reviews = await Review.find({ movieId, status: "approved" })
            .populate("userId", "name")
            .sort({ createdAt: -1 })
            .skip((p - 1) * l)
            .limit(l);

        // Shape response — only expose safe fields
        const formatted = reviews.map((r) => ({
            _id: r._id,
            rating: r.rating,
            comment: r.comment,
            userName: (r.userId as any)?.name ?? "User",
            createdAt: r.createdAt,
        }));

        res.json({
            success: true,
            data: formatted,
            pagination: { total, page: p, pages: Math.ceil(total / l) },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET /api/reviews/my/:movieId ──────────────────────────────────────────────
// Authenticated — user's own review for a movie
export const getMyReview = async (req: Request, res: Response) => {
    try {
        const { movieId } = req.params;
        const userId = req.user?._id;

        if (!isValidObjectId(movieId)) {
            return res.status(400).json({ success: false, message: "Invalid movie ID" });
        }

        const review = await Review.findOne({ movieId, userId });

        res.json({
            success: true,
            data: review ?? null,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET /api/reviews/admin/all ────────────────────────────────────────────────
// Admin — all reviews with filters
export const getAllReviews = async (req: Request, res: Response) => {
    try {
        const { status, page = 1, limit = 20, search, movieId } = req.query;
        const p = Math.max(1, Number(page));
        const l = Math.min(50, Math.max(1, Number(limit)));

        const query: any = {};
        if (status && status !== "all") query.status = status;
        if (movieId && isValidObjectId(String(movieId))) query.movieId = movieId;

        // Search by comment text
        if (search && String(search).trim()) {
            query.comment = new RegExp(String(search).trim(), "i");
        }

        const total = await Review.countDocuments(query);

        const reviews = await Review.find(query)
            .populate("userId", "name email")
            .populate("movieId", "title")
            .populate("approvedBy", "name")
            .sort({ createdAt: -1 })
            .skip((p - 1) * l)
            .limit(l);

        res.json({
            success: true,
            data: reviews,
            pagination: { total, page: p, pages: Math.ceil(total / l) },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PATCH /api/reviews/:id/approve ────────────────────────────────────────────
export const approveReview = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = req.user?._id;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid review ID" });
        }

        const review = await Review.findByIdAndUpdate(
            id,
            { status: "approved", approvedBy: adminId, approvedAt: new Date() },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        res.json({ success: true, data: review, message: "Review approved" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PATCH /api/reviews/:id/reject ─────────────────────────────────────────────
export const rejectReview = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid review ID" });
        }

        const review = await Review.findByIdAndUpdate(
            id,
            { status: "rejected", approvedBy: req.user?._id, approvedAt: new Date() },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        res.json({ success: true, data: review, message: "Review rejected" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PATCH /api/reviews/bulk ───────────────────────────────────────────────────
// Admin bulk approve or reject
export const bulkModerateReviews = async (req: Request, res: Response) => {
    try {
        const { ids, action } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "ids array is required" });
        }
        if (!["approve", "reject"].includes(action)) {
            return res.status(400).json({ success: false, message: "action must be approve or reject" });
        }

        const validIds = ids.filter((id) => isValidObjectId(id));
        const newStatus = action === "approve" ? "approved" : "rejected";

        await Review.updateMany(
            { _id: { $in: validIds } },
            {
                status: newStatus,
                approvedBy: req.user?._id,
                approvedAt: new Date(),
            }
        );

        res.json({
            success: true,
            message: `${validIds.length} review(s) ${newStatus}`,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── DELETE /api/reviews/:id ───────────────────────────────────────────────────
// User can delete own review, admin can delete any
export const deleteReview = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;
        const isAdmin = req.user?.role === "admin";

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid review ID" });
        }

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        if (!isAdmin && String(review.userId) !== String(userId)) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        const movieId = String(review.movieId);
        await Review.findByIdAndDelete(id);

        // Recalculate movie rating after deletion
        await recalculateMovieRating(movieId);

        res.json({ success: true, message: "Review deleted" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};