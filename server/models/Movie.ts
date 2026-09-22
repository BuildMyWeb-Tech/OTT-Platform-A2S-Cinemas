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
        // Movie-specific GST/tax in percent (e.g. 18). Legacy movies without it default to 0.
        taxPercentage: { type: Number, default: 0, min: 0, max: 100 },
        poster: { type: String, required: true },      // Cloudinary URL
        videoKey: { type: String, required: true, select: false },  // private S3 key — never returned by default
        trailerUrl: { type: String },                   // external link (e.g. YouTube) — mutually exclusive with teaserKey
        teaserKey: { type: String, select: false },     // private S3 key for an uploaded teaser (~90s), streamed via signed URL
        duration: { type: Number },                    // in minutes

        // Film details / metadata
        language: { type: String, trim: true },
        certification: { type: String, trim: true },    // e.g. "U", "U/A", "A"
        copyrightOwner: { type: String, trim: true },    // e.g. "© 2026 XYZ Productions. All rights reserved."

        // Scheduled release — hidden from public listings until this date/time passes.
        // Empty/absent = published immediately (subject to isActive as before).
        releaseDate: { type: Date },
        expiryDays: { type: Number, required: true, default: 30 },
        isFeatured: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },

        // Legacy single category ref — kept for backward compat
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

        // Cast & crew — optional, defaults to empty so existing movies keep working
        cast: [{
            name: { type: String, required: true, trim: true },
            role: { type: String, trim: true },   // character played, e.g. "Detective Rao"
        }],
        crew: [{
            name: { type: String, required: true, trim: true },
            role: { type: String, required: true, trim: true },  // job title, e.g. "Director"
        }],

        ratings: {
            average: { type: Number, default: 0, min: 0, max: 5 },
            count: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

// Text search index
// language_override: MongoDB's text index reserves the field named "language" by
// default for its own stemming rules, and only accepts a small fixed list of values
// (not e.g. "Tamil") — our own `language` field (film language, unrelated to text
// search) would otherwise collide with it. Point it at an unused field name instead.
movieSchema.index({ title: "text", description: "text" }, { language_override: "textSearchLanguage" });

// Performance indexes
movieSchema.index({ isActive: 1 });
movieSchema.index({ isFeatured: 1 });
movieSchema.index({ genre: 1 });
movieSchema.index({ categories: 1 });
movieSchema.index({ createdAt: -1 });

const Movie = mongoose.model<IMovie>("Movie", movieSchema);
export default Movie;
