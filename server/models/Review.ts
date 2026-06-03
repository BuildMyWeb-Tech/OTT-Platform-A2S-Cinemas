import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
    movieId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
    status: "pending" | "approved" | "rejected";
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
    {
        movieId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Movie",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"],
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [1000, "Comment cannot exceed 1000 characters"],
        },
        // Rating is always approved instantly — only comment needs moderation
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        approvedAt: { type: Date },
    },
    { timestamps: true }
);

// One review per user per movie
reviewSchema.index({ movieId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ movieId: 1, status: 1 });
reviewSchema.index({ status: 1, createdAt: -1 });

const Review = mongoose.model<IReview>("Review", reviewSchema);
export default Review;