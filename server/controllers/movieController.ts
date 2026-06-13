import { Request, Response } from "express";
import mongoose from "mongoose";
import Movie from "../models/Movie.js";
import Category from "../models/Category.js";          // ← ADD THIS LINE
import { deleteFromS3 } from "../config/s3.js";
import Notification from "../models/Notification.js"

const validGenres = [
    "Action", "Drama", "Comedy", "Thriller", "Horror",
    "Romance", "SciFi", "Documentary", "Animation", "Other",
];

const isValidObjectId = (id: unknown): boolean =>
    typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

// ── GET /api/movies ───────────────────────────────────────────────────────────
export const getMovies = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, genre, search, featured, categoryId, category } = req.query;

        const query: any = { isActive: true };

        // Genre filter (backward compat)
        if (genre && genre !== "All") query.genre = genre;

        // Featured filter
        if (featured === "true") query.isFeatured = true;

        // Category filter — supports either ObjectId or slug
       // Category filter — supports either ObjectId or slug
const catFilter = categoryId || category;
if (catFilter) {
    const catFilterStr = String(catFilter);
    if (isValidObjectId(catFilterStr)) {
        query.$or = [
            { categories: catFilterStr },
            { categoryId: catFilterStr },
        ];
    } else {
        // Slug lookup — Category is now imported at top of file
        const cat = await Category.findOne({ slug: catFilterStr });
        if (cat) {
            query.$or = [
                { categories: cat._id },
                { categoryId: cat._id },
            ];
        } else {
            return res.json({
                success: true,
                data: [],
                pagination: { total: 0, page: Number(page), pages: 0 },
            });
        }
    }
}

        // Search — case-insensitive regex (fixes the search bug)
        // Falls back from $text to regex for reliability
        if (search && String(search).trim()) {
            const term = String(search).trim();
            const rx = new RegExp(term, "i");
            query.$or = [
                { title: rx },
                { description: rx },
                { genre: rx },
            ];
            // Remove any conflicting $text query
            delete query.$text;
        }

        const total = await Movie.countDocuments(query);

        const movies = await Movie.find(query)
            .select("-videoKey")
            .populate("categories", "name slug")
            .populate("categoryId", "name slug")
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .sort("-createdAt");

        res.json({
            success: true,
            data: movies,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error: any) {
        console.error("Get movies error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET /api/movies/search/suggestions ───────────────────────────────────────
// Auto-suggest as user types — returns just titles
export const getSearchSuggestions = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;

        if (!q || String(q).trim().length === 0) {
            return res.json({ success: true, data: [] });
        }

        const rx = new RegExp(String(q).trim(), "i");
        const movies = await Movie.find(
            { isActive: true, title: rx },
            { title: 1, poster: 1, price: 1 }
        )
            .limit(8)
            .sort("title");

        res.json({ success: true, data: movies });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET /api/movies/:id ───────────────────────────────────────────────────────
export const getMovie = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid movie ID" });
        }

        const movie = await Movie.findById(id)
            .select("-videoKey")
            .populate("categories", "name slug")
            .populate("categoryId", "name");

        if (!movie) {
            return res.status(404).json({ success: false, message: "Movie not found" });
        }

        // Fetch approved reviews for this movie
        const Review = (await import("../models/Review.js")).default;
        const reviews = await Review.find({ movieId: id, status: "approved" })
            .populate("userId", "name")
            .sort({ createdAt: -1 })
            .limit(10);

        const formattedReviews = reviews.map((r) => ({
            _id: r._id,
            rating: r.rating,
            comment: r.comment,
            userName: (r.userId as any)?.name ?? "User",
            createdAt: r.createdAt,
        }));

        res.json({
            success: true,
            data: {
                ...movie.toObject(),
                reviews: formattedReviews,
            },
        });
    } catch (error: any) {
        if (error.name === "CastError") {
            return res.status(400).json({ success: false, message: "Invalid movie ID" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── POST /api/movies ──────────────────────────────────────────────────────────
export const createMovie = async (req: Request, res: Response) => {
    try {
        if (!req.body.poster) {
            return res.status(400).json({ success: false, message: "Poster image is required" });
        }
        if (!req.body.videoKey) {
            return res.status(400).json({ success: false, message: "Video file is required" });
        }
        if (req.body.genre && !validGenres.includes(req.body.genre)) {
            return res.status(400).json({
                success: false,
                message: `Invalid genre. Must be one of: ${validGenres.join(", ")}`,
            });
        }

        // Validate categories array if provided
        if (req.body.categories) {
            const cats = Array.isArray(req.body.categories) ? req.body.categories : [req.body.categories];
            for (const cid of cats) {
                if (!isValidObjectId(cid)) {
                    return res.status(400).json({ success: false, message: `Invalid category ID: ${cid}` });
                }
            }
        }

        const movie = await Movie.create(req.body);

        // Populate categories for response
        await movie.populate("categories", "name slug");

// Create notification for new movie
        await Notification.create({
            title: "New Movie Added!",
            message: `${movie.title} is now available to watch.`,
            movieId: movie._id,
        });

        const movieResponse = movie.toObject();
        delete (movieResponse as any).videoKey;
        res.status(201).json({ success: true, data: movieResponse });
    } catch (error: any) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PUT /api/movies/:id ───────────────────────────────────────────────────────
export const updateMovie = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid movie ID" });
        }
        if (req.body.genre && !validGenres.includes(req.body.genre)) {
            return res.status(400).json({
                success: false,
                message: `Invalid genre. Must be one of: ${validGenres.join(", ")}`,
            });
        }

        const movie = await Movie.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        }).populate("categories", "name slug");

        if (!movie) {
            return res.status(404).json({ success: false, message: "Movie not found" });
        }

        const movieResponse = movie.toObject();
        delete (movieResponse as any).videoKey;
        res.json({ success: true, data: movieResponse });
    } catch (error: any) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── DELETE /api/movies/:id ────────────────────────────────────────────────────
export const deleteMovie = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid movie ID" });
        }

        const movie = await Movie.findById(id);
        if (!movie) {
            return res.status(404).json({ success: false, message: "Movie not found" });
        }

        if (movie.videoKey) {
            await deleteFromS3(movie.videoKey);
        }

        await Movie.findByIdAndDelete(id);
        res.json({ success: true, message: "Movie deleted" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PATCH /api/movies/:id/toggle ──────────────────────────────────────────────
export const toggleMovieStatus = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid movie ID" });
        }

        const movie = await Movie.findById(id);
        if (!movie) {
            return res.status(404).json({ success: false, message: "Movie not found" });
        }

        movie.isActive = !movie.isActive;
        await movie.save();

        res.json({
            success: true,
            data: movie,
            message: `Movie ${movie.isActive ? "enabled" : "disabled"}`,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};