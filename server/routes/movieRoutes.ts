import express from "express";
import {
    getMovies,
    getMovie,
    getSearchSuggestions,
    getTeaserUrl,
    createMovie,
    updateMovie,
    deleteMovie,
    toggleMovieStatus,
} from "../controllers/movieController.js";
import { protect, authorize } from "../middleware/auth.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = express.Router();

// Public routes — optionalAuth so admins see scheduled/unreleased movies too
router.get("/", optionalAuth, getMovies);
router.get("/search/suggestions", getSearchSuggestions);  // must be before /:id
router.get("/:id", optionalAuth, getMovie);
router.get("/:id/teaser", getTeaserUrl);  // public — no license required to preview a teaser

// Admin only
router.post("/", protect, authorize("admin"), createMovie);
router.put("/:id", protect, authorize("admin"), updateMovie);
router.delete("/:id", protect, authorize("admin"), deleteMovie);
router.patch("/:id/toggle", protect, authorize("admin"), toggleMovieStatus);

export default router;
