import express from "express";
import { getMovies, getMovie, createMovie, updateMovie, deleteMovie, toggleMovieStatus } from "../controllers/movieController.js";
import { protect, authorize } from "../middleware/auth.js";
import { upload, uploadPoster, uploadVideo } from "../middleware/upload.js";

const router = express.Router();
router.get("/", getMovies);
router.get("/:id", getMovie);
router.post("/", protect, authorize("admin"), upload.fields([{ name: "poster", maxCount: 1 }, { name: "video", maxCount: 1 }]), uploadPoster, uploadVideo, createMovie);
router.put("/:id", protect, authorize("admin"), upload.fields([{ name: "poster", maxCount: 1 }, { name: "video", maxCount: 1 }]), uploadPoster, uploadVideo, updateMovie);
router.delete("/:id", protect, authorize("admin"), deleteMovie);
router.patch("/:id/toggle", protect, authorize("admin"), toggleMovieStatus);
export default router;