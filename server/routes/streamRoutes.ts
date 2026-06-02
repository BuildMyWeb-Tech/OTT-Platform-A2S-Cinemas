import express from "express";
import { streamMovie } from "../controllers/streamController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.get("/:movieId", protect, streamMovie);
export default router;