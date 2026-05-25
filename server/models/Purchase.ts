import mongoose, { Schema } from "mongoose";
import { IPurchase } from "../types/index.js";

const purchaseSchema = new Schema<IPurchase>(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
        razorpayOrderId: { type: String, required: true },
        razorpayPaymentId: { type: String },
        amountPaid: { type: Number, required: true },
        purchaseDate: { type: Date, default: Date.now },
        expiryDate: { type: Date, required: true },
        status: { type: String, enum: ["pending", "active", "expired", "failed"], default: "pending" },
    },
    { timestamps: true }
);

const Purchase = mongoose.model<IPurchase>("Purchase", purchaseSchema);
export default Purchase;