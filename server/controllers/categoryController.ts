import { Request, Response } from "express";
import mongoose from "mongoose";
import Category from "../models/Category.js";
import Movie from "../models/Movie.js";

// ── GET /api/categories ───────────────────────────────────────────────────────
// Public — only active categories, supports search + pagination
export const getCategories = async (req: Request, res: Response) => {
    try {
        const { search, page, limit, all } = req.query;

        // Admin asking for all (including inactive) — requires auth checked at route level
        const baseQuery: any = all === "true" ? {} : { isActive: true };

        if (search) {
            const rx = new RegExp(String(search).trim(), "i");
            baseQuery.$or = [{ name: rx }, { description: rx }];
        }

        // If pagination params provided, paginate; otherwise return all
        if (page && limit) {
            const p = Math.max(1, Number(page));
            const l = Math.min(50, Math.max(1, Number(limit)));
            const total = await Category.countDocuments(baseQuery);
            const categories = await Category.find(baseQuery)
                .sort({ name: 1 })
                .skip((p - 1) * l)
                .limit(l);

            return res.json({
                success: true,
                data: categories,
                pagination: { total, page: p, pages: Math.ceil(total / l), limit: l },
            });
        }

        const categories = await Category.find(baseQuery).sort({ name: 1 });
        return res.json({ success: true, data: categories });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── POST /api/categories ──────────────────────────────────────────────────────
export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }

        const category = await Category.create({ name: name.trim(), description: description?.trim() });
        res.status(201).json({ success: true, data: category });
    } catch (error: any) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Category name already exists" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PUT /api/categories/:id ───────────────────────────────────────────────────
export const updateCategory = async (req: Request, res: Response) => {
    try {
const id = String(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid category ID" });
        }

        const { name, description } = req.body;

        const update: any = {};
        if (name !== undefined) update.name = name.trim();
        if (description !== undefined) update.description = description.trim();

        // Recalculate slug if name changes
        if (update.name) {
            update.slug = update.name
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, "")
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-");
        }

        const category = await Category.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        });

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.json({ success: true, data: category });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Category name already exists" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── DELETE /api/categories/:id ────────────────────────────────────────────────
// Blocked if any movie uses this category
export const deleteCategory = async (req: Request, res: Response) => {
    try {
const id = String(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid category ID" });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        // Check if any movies reference this category
        const movieCount = await Movie.countDocuments({
            $or: [
                { categories: id },
                { categoryId: id },
            ],
        });

        if (movieCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete — ${movieCount} movie${movieCount > 1 ? "s" : ""} use this category`,
                movieCount,
            });
        }

        await Category.findByIdAndDelete(id);
        res.json({ success: true, message: "Category deleted" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── PATCH /api/categories/:id/toggle ─────────────────────────────────────────
export const toggleCategory = async (req: Request, res: Response) => {
    try {
const id = String(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid category ID" });
        }

        const cat = await Category.findById(id);
        if (!cat) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        cat.isActive = !cat.isActive;
        await cat.save();
        res.json({ success: true, data: cat });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET /api/categories/:id ───────────────────────────────────────────────────
export const getCategoryById = async (req: Request, res: Response) => {
    try {
const id = String(req.params.id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid category ID" });
        }

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.json({ success: true, data: category });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
