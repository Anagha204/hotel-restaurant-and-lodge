import express from "express";
import Category from "../../models/restaurant/Category.js";
import MenuItem from "../../models/restaurant/MenuItem.js";

const router = express.Router();

// GET all categories (sorted by name)
router.get("/", async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADD new category
router.post("/", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });
        const newCat = new Category({ name });
        const saved = await newCat.save();
        res.status(201).json(saved);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "Category name already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

// UPDATE category (only name)
router.put("/:id", async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });
        const updated = await Category.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ error: "Category not found" });
        res.json(updated);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "Category name already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE category – only if no menu items use it
router.delete("/:id", async (req, res) => {
    try {
        const itemsUsing = await MenuItem.countDocuments({ category: req.params.id });
        if (itemsUsing > 0) {
            return res.status(400).json({ error: `Cannot delete: ${itemsUsing} menu item(s) still use this category.` });
        }
        const deleted = await Category.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Category not found" });
        res.json({ message: "Category deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;