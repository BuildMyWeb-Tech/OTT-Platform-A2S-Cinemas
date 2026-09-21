import mongoose, { Schema } from "mongoose";
import { IPurchase } from "../types/index.js";

const purchaseSchema = new Schema<IPurchase>(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
        razorpayOrderId: { type: String, required: true },
        razorpayPaymentId: { type: String },
        amountPaid: { type: Number, required: true }, // total charged (base + tax) for new orders
        // Financial snapshot at order time — never recalculated afterwards. Absent on legacy purchases.
        basePrice: { type: Number },
        taxPercentage: { type: Number },
        taxAmount: { type: Number },
        totalAmount: { type: Number },
        currency: { type: String, default: "INR" },
        purchaseDate: { type: Date, default: Date.now },
        expiryDate: { type: Date, required: true },
        status: { type: String, enum: ["pending", "active", "expired", "failed"], default: "pending" },
    },
    { timestamps: true }
);

const Purchase = mongoose.model<IPurchase>("Purchase", purchaseSchema);
export default Purchase;