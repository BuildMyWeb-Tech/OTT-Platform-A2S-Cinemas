import mongoose, { Schema } from "mongoose";
import { IMovie } from "../types/index.js";

const movieSchema = new Schema<IMovie>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        genre: {
            type: String,
            required: true,
            enum: ["Action", "Drama", "Comedy", "Thriller", "Horror", "Romance", "SciFi", "Documentary", "Animation", "Other"],
            default: "Other",
        },
        price: { type: Number, required: true, min: 0 },
        poster: { type: String, required: true },         // public S3 URL
        videoKey: { type: String, required: true },       // private S3 key
        trailerUrl: { type: String },                     // optional public trailer
        duration: { type: Number },                       // in minutes
        expiryDays: { type: Number, required: true, default: 30 },
        isFeatured: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        ratings: {
            average: { type: Number, default: 0, min: 0, max: 5 },
            count: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

movieSchema.index({ title: "text", description: "text" });

const Movie = mongoose.model<IMovie>("Movie", movieSchema);
export default Movie;