import express from "express";
import { getMyPurchases, getPurchase, getAllPurchases } from "../controllers/purchaseController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();
router.get("/my", protect, getMyPurchases);
router.get("/admin/all", protect, authorize("admin"), getAllPurchases);
router.get("/:id", protect, getPurchase);
export default router;