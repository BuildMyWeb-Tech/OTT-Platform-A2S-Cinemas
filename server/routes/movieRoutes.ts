import express from "express";
import {
    getMovies,
    getMovie,
    getSearchSuggestions,
    createMovie,
    updateMovie,
    deleteMovie,
    toggleMovieStatus,
} from "../controllers/movieController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getMovies);
router.get("/search/suggestions", getSearchSuggestions);  // must be before /:id
router.get("/:id", getMovie);

// Admin only
router.post("/", protect, authorize("admin"), createMovie);
router.put("/:id", protect, authorize("admin"), updateMovie);
router.delete("/:id", protect, authorize("admin"), deleteMovie);
router.patch("/:id/toggle", protect, authorize("admin"), toggleMovieStatus);

export default router;
