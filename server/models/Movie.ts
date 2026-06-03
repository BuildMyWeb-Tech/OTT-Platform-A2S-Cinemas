import mongoose, { Schema } from "mongoose";
import { IMovie } from "../types/index.js";

const movieSchema = new Schema<IMovie>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },

        // Kept for backward compatibility — still used in existing tests + seed data
        genre: {
            type: String,
            required: false,
            enum: ["Action", "Drama", "Comedy", "Thriller", "Horror", "Romance", "SciFi", "Documentary", "Animation", "Other"],
            default: "Other",
        },

        // Phase 9A — dynamic multi-category support
        categories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
            },
        ],

        price: { type: Number, required: true, min: 0 },
        poster: { type: String, required: true },      // Cloudinary URL
        videoKey: { type: String, required: true, select: false },  // private S3 key — never returned by default
        trailerUrl: { type: String },
        duration: { type: Number },                    // in minutes
        expiryDays: { type: Number, required: true, default: 30 },
        isFeatured: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },

        // Legacy single category ref — kept for backward compat
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

        ratings: {
            average: { type: Number, default: 0, min: 0, max: 5 },
            count: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

// Text search index
movieSchema.index({ title: "text", description: "text" });

// Performance indexes
movieSchema.index({ isActive: 1 });
movieSchema.index({ isFeatured: 1 });
movieSchema.index({ genre: 1 });
movieSchema.index({ categories: 1 });
movieSchema.index({ createdAt: -1 });

const Movie = mongoose.model<IMovie>("Movie", movieSchema);
export default Movie;
