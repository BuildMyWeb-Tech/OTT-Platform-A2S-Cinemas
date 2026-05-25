import Razorpay from "razorpay";
import crypto from "crypto";
import { Request, Response } from "express";
import Movie from "../models/Movie.js";
import Purchase from "../models/Purchase.js";
import License from "../models/License.js";
import User from "../models/User.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// POST /api/payment/create-order
export const createOrder = async (req: Request, res: Response) => {
    try {
        const { movieId } = req.body;
        if (!movieId) return res.status(400).json({ success: false, message: "movieId is required" });

        const movie = await Movie.findById(movieId);
        if (!movie || !movie.isActive)
            return res.status(404).json({ success: false, message: "Movie not found or inactive" });

        // Check if already has active license
        const existingLicense = await License.findOne({ user: req.user._id, movie: movieId });
        if (existingLicense && existingLicense.isValid()) {
            return res.status(400).json({
                success: false,
                message: "You already have an active license for this movie",
                expiresAt: existingLicense.expiryDate,
            });
        }

        const amountInPaise = Math.round(movie.price * 100);

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            notes: {
                movieId: movieId.toString(),
                userId: req.user._id.toString(),
            },
        });

        // Create pending purchase record
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + movie.expiryDays);

        const purchase = await Purchase.create({
            user: req.user._id,
            movie: movieId,
            razorpayOrderId: order.id,
            amountPaid: movie.price,
            expiryDate,
            status: "pending",
        });

        res.json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                purchaseId: purchase._id,
                movieTitle: movie.title,
                key: process.env.RAZORPAY_KEY_ID,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/payment/verify
export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: "Missing payment fields" });
        }

        // HMAC signature verification
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }

        // Update purchase to active
        const purchase = await Purchase.findOne({ razorpayOrderId: razorpay_order_id });
        if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });

        purchase.razorpayPaymentId = razorpay_payment_id;
        purchase.status = "active";
        await purchase.save();

        // Delete old license if any (re-purchase scenario)
        await License.findOneAndDelete({ user: purchase.user, movie: purchase.movie });

        // Create new license
        const license = await License.create({
            user: purchase.user,
            movie: purchase.movie,
            purchase: purchase._id,
            expiryDate: purchase.expiryDate,
        });

        // Add movie to user's purchasedMovies
        await User.findByIdAndUpdate(purchase.user, {
            $addToSet: { purchasedMovies: purchase.movie },
        });

        res.json({
            success: true,
            message: "Payment verified. License activated.",
            data: {
                licenseId: license._id,
                expiryDate: license.expiryDate,
                movieId: purchase.movie,
            },
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};