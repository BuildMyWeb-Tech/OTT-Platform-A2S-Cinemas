import { Request, Response } from "express";
import License from "../models/License.js";
import Movie from "../models/Movie.js";
import { getCloudFrontSignedUrl } from "../config/s3.js";

// GET /api/stream/:movieId
export const getStreamUrl = async (req: Request, res: Response) => {
    try {
        const license = await License.findOne({
            user: req.user._id,
            movie: req.params.movieId,
        });

        if (!license || !license.isValid()) {
            return res.status(403).json({
                success: false,
                message: license ? "License expired. Please re-purchase to watch." : "No license found. Purchase to watch.",
                code: "LICENSE_REQUIRED",
                movieId: req.params.movieId,
            });
        }

        const movie = await Movie.findById(req.params.movieId);
        if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });

        const streamUrl = getCloudFrontSignedUrl(movie.videoKey, 14400); // 4-hour signed URL

        res.json({
            success: true,
            data: {
                streamUrl,
                expiresAt: new Date(Date.now() + 14400 * 1000),
                licenseExpiresAt: license.expiryDate,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};