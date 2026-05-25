import express from "express";
import { getStreamUrl } from "../controllers/streamController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.get("/:movieId", protect, getStreamUrl);
export default router;