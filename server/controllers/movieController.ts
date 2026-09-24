import { Request, Response } from "express";
import mongoose from "mongoose";
import { parseTaxInput, withPricing } from "../utils/pricing.js";
import Movie from "../models/Movie.js";
import Category from "../models/Category.js";
import { deleteFromS3 } from "../config/s3.js";
import Notification from "../models/Notification.js";
import { sendPushToAllUsers } from "../services/pushService.js";

const validGenres = [
    "Action", "Drama", "Comedy", "Thriller", "Horror",
    "Romance", "SciFi", "Documentary", "Animation", "Other",
];

const isValidObjectId = (id: unknown): boolean =>
    typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

// Drops blank/malformed rows so a stray empty form row can't create junk cast/crew entries.
const sanitizePeopleList = (
    list: unknown,
    { roleRequired }: { roleRequired: boolean }
): { name: string; role?: string }[] | undefined => {
    if (list === undefined) return undefined;
    if (!Array.isArray(list)) return [];
    return list
        .map((entry: any) => ({
            name: typeof entry?.name === "string" ? entry.name.trim() : "",
            role: typeof entry?.role === "string" ? entry.role.trim() : "",
        }))
        .filter((entry) => entry.name && (!roleRequired || entry.role));
};

// A movie with a future releaseDate is hidden from public discovery until that
// moment passes. Admins always see everything regardless of this filter.
export const notYetReleasedExcluded = () => ({
    $or: [
        { releaseDate: { $exists: false } },
        { releaseDate: null },
        { releaseDate: { $lte: new Date() } },
    ],
});

const isAdminReq = (req: Request) => (req as any).user?.role === "admin";

// ── GET /api/movies ───────────────────────────────────────────────────────────
export const getMovies = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, genre, search, featured, categoryId, category } = req.query;

        const query: any = { isActive: true };
        if (!isAdminReq(req)) {
            query.$and = [notYetReleasedExcluded()];
        }

        // Genre filter (backward compat)
        if (genre && genre !== "All") query.genre = genre;

        // Featured filter
        if (featured === "true") query.isFeatured = true;

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
                // Slug lookup — Category is imported at top of file
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

        // Search — case-insensitive, regex-safe
        if (search && String(search).trim()) {
            const term = String(search).trim();
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape regex metacharacters
            const rx = new RegExp(escaped, "i");
            query.$or = [
                { title: rx },
                { description: rx },
                { genre: rx },
            ];
            delete query.$text;
        }

        const total = await Movie.countDocuments(query);

        // Performance: only populate "categories" — "categoryId" is the legacy
        // single-category field no longer rendered anywhere on the client,
        // so populating it was doing a redundant join lookup per movie on
        // every single list request (Home, Browse, Admin movies list).
        const movies = await Movie.find(query)
            .select("-videoKey")
            .populate("categories", "name slug")
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
export const getSearchSuggestions = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;

        if (!q || String(q).trim().length === 0) {
            return res.json({ success: true, data: [] });
        }

        const term = String(q).trim();
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const rx = new RegExp(escaped, "i");
        const movies = await Movie.find(
            { isActive: true, title: rx, ...notYetReleasedExcluded() },
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
            .select("-videoKey +teaserKey")
            .populate("categories", "name slug");

        if (!movie) {
            return res.status(404).json({ success: false, message: "Movie not found" });
        }

        // Hide inactive / not-yet-released movies from non-admin requests
        const isAdmin = req.user?.role === "admin";
        const notYetReleased = !!movie.releaseDate && movie.releaseDate.getTime() > Date.now();
        if ((!movie.isActive || notYetReleased) && !isAdmin) {
            return res.status(404).json({ success: false, message: "Movie not found" });
        }

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

        const movieObj: any = movie.toObject();
        const hasTeaser = !!movieObj.teaserKey;
        delete movieObj.teaserKey; // private S3 key — never sent to the client

        res.json({
            success: true,
            data: {
                ...withPricing(movieObj),
                hasTeaser,
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

// ── GET /api/movies/:id/teaser — public, no license required ─────────────────
export const getTeaserUrl = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        if (!isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid movie ID" });
        }

        const movie = await Movie.findById(id).select("+teaserKey isActive");
        if (!movie || !movie.isActive || !movie.teaserKey) {
            return res.status(404).json({ success: false, message: "No teaser available for this movie" });
        }

        const { getCloudFrontSignedUrl } = await import("../config/s3.js");
        const streamUrl = getCloudFrontSignedUrl(movie.teaserKey, 3600); // short-lived — teaser only, not the full film

        res.json({ success: true, data: { streamUrl } });
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

        const tax = parseTaxInput(req.body.taxPercentage);
        if (tax.error) {
            return res.status(400).json({ success: false, message: tax.error });
        }
        if (tax.value !== undefined) req.body.taxPercentage = tax.value;
        else delete req.body.taxPercentage;

        const sanitizedCast = sanitizePeopleList(req.body.cast, { roleRequired: false });
        if (sanitizedCast !== undefined) req.body.cast = sanitizedCast;
        const sanitizedCrew = sanitizePeopleList(req.body.crew, { roleRequired: true });
        if (sanitizedCrew !== undefined) req.body.crew = sanitizedCrew;
        if (req.body.releaseDate === "") delete req.body.releaseDate;

        const movie = await Movie.create(req.body);

        // Populate categories for response
        await movie.populate("categories", "name slug");

        // Create notification for new movie
        await Notification.create({
            title: "New Movie Added!",
            message: `${movie.title} is now available to watch.`,
            movieId: movie._id,
        });
        sendPushToAllUsers("New Movie Added!", `${movie.title} is now available to watch.`, { movieId: String(movie._id) });

        const movieResponse = movie.toObject();
        delete (movieResponse as any).videoKey;
        res.status(201).json({ success: true, data: withPricing(movieResponse) });
    } catch (error: any) {
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ success: false, message: error.name === "CastError" ? "Invalid field value (check Release Date format)" : error.message });
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

        const tax = parseTaxInput(req.body.taxPercentage);
        if (tax.error) {
            return res.status(400).json({ success: false, message: tax.error });
        }
        if (tax.value !== undefined) req.body.taxPercentage = tax.value;
        else delete req.body.taxPercentage;

        const sanitizedCastUpdate = sanitizePeopleList(req.body.cast, { roleRequired: false });
        if (sanitizedCastUpdate !== undefined) req.body.cast = sanitizedCastUpdate;
        const sanitizedCrewUpdate = sanitizePeopleList(req.body.crew, { roleRequired: true });
        if (sanitizedCrewUpdate !== undefined) req.body.crew = sanitizedCrewUpdate;
        if (req.body.releaseDate === "") req.body.releaseDate = null;

        const movie = await Movie.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        }).populate("categories", "name slug");

        if (!movie) {
            return res.status(404).json({ success: false, message: "Movie not found" });
        }

        const movieResponse = movie.toObject();
        delete (movieResponse as any).videoKey;
        res.json({ success: true, data: withPricing(movieResponse) });
    } catch (error: any) {
        if (error.name === "ValidationError" || error.name === "CastError") {
            return res.status(400).json({ success: false, message: error.name === "CastError" ? "Invalid field value (check Release Date format)" : error.message });
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