import { Request, Response } from "express";
import Movie from "../models/Movie.js";
import { deleteFromS3 } from "../config/s3.js";

export const getMovies = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, genre, search, featured } = req.query;
        const query: any = { isActive: true };
        if (genre) query.genre = genre;
        if (featured) query.isFeatured = true;
        if (search) query.$text = { $search: search as string };

        const total = await Movie.countDocuments(query);
        const movies = await Movie.find(query)
            .select("-videoKey") // never expose private video key in list
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .sort("-createdAt");

        res.json({
            success: true,
            data: movies,
            pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMovie = async (req: Request, res: Response) => {
    try {
        const movie = await Movie.findById(req.params.id).select("-videoKey").populate("categoryId", "name");
        if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });
        res.json({ success: true, data: movie });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createMovie = async (req: Request, res: Response) => {
    try {
        if (!req.body.poster)
            return res.status(400).json({ success: false, message: "Poster image is required" });
        if (!req.body.videoKey)
            return res.status(400).json({ success: false, message: "Video file is required" });

        const validGenres = ["Action", "Drama", "Comedy", "Thriller", "Horror", "Romance", "SciFi", "Documentary", "Animation", "Other"];
        if (req.body.genre && !validGenres.includes(req.body.genre)) {
            return res.status(400).json({ success: false, message: `Invalid genre. Must be one of: ${validGenres.join(", ")}` });
        }

        const movie = await Movie.create(req.body);
        res.status(201).json({ success: true, data: movie });
    } catch (error: any) {
        // Catch Mongoose validation errors and return 400 instead of 500
        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateMovie = async (req: Request, res: Response) => {
    try {
        const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });
        res.json({ success: true, data: movie });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMovie = async (req: Request, res: Response) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });

        // Delete files from S3
        if (movie.videoKey) await deleteFromS3(movie.videoKey);

        await Movie.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Movie deleted" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleMovieStatus = async (req: Request, res: Response) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });
        movie.isActive = !movie.isActive;
        await movie.save();
        res.json({ success: true, data: movie, message: `Movie ${movie.isActive ? "enabled" : "disabled"}` });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};