import express from "express";
import { getCategories, createCategory, updateCategory, deleteCategory, toggleCategory } from "../controllers/categoryController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();
router.get("/", getCategories);
router.post("/", protect, authorize("admin"), createCategory);
router.put("/:id", protect, authorize("admin"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);
router.patch("/:id/toggle", protect, authorize("admin"), toggleCategory);
export default router;