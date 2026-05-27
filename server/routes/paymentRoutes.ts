import express from "express";
import {
    createOrder,
    verifyPayment,
    handlePaymentCallback,
    servePaymentPage,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
console.log("paymentRoutes loaded");
router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.get("/pay/:orderId", servePaymentPage);
router.post("/callback", handlePaymentCallback);
router.get("/callback", handlePaymentCallback);

export default router;