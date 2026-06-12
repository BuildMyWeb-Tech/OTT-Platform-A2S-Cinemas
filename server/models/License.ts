import mongoose, { Schema } from "mongoose";
import { ILicense } from "../types/index.js";

const licenseSchema = new Schema<ILicense>(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
        purchase: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase", required: true },
        expiryDate: { type: Date, required: true },
        isRevoked: { type: Boolean, default: false },
        lastWatched: { type: Date },
        watchCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

licenseSchema.methods.isValid = function (): boolean {
    return !this.isRevoked && this.expiryDate > new Date();
};

licenseSchema.index({ user: 1, movie: 1 });

const License = mongoose.model<ILicense>("License", licenseSchema);
export default License;