import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import MenuItem from "../../models/restaurant/MenuItem.js";

const router = express.Router();

// ---------- Multer setup for image upload ----------
const uploadDir = "uploads/menu";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, "item-" + unique + ext);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"), false);
};
const upload = multer({ storage, fileFilter });
// ------------------------------------------------

// GET all menu items (populate category)
router.get("/", async (req, res) => {
    try {
        const items = await MenuItem.find().populate("category", "name").sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADD new menu item (with image upload)
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const { name, category, price, description, availability } = req.body;
        const imagePath = req.file ? "/" + req.file.path.replace(/\\/g, "/") : null;

        const newItem = new MenuItem({
            name,
            category,
            price,
            description,
            image: imagePath,
            availability: availability === "true" || availability === true
        });
        const saved = await newItem.save();
        res.status(201).json(saved);
    } catch (err) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE menu item – now allows category changes too
router.put("/:id", async (req, res) => {
    try {
        const allowedUpdates = ["name", "category", "price", "description", "availability"];
        const updates = {};
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        });
        const updated = await MenuItem.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );
        if (!updated) return res.status(404).json({ error: "Menu item not found" });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE image only (separate endpoint)
router.put("/:id/image", upload.single("image"), async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) return res.status(404).json({ error: "Item not found" });

        if (item.image && fs.existsSync("." + item.image)) {
            fs.unlinkSync("." + item.image);
        }

        const newImagePath = req.file ? "/" + req.file.path.replace(/\\/g, "/") : null;
        item.image = newImagePath;
        await item.save();
        res.json(item);
    } catch (err) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: err.message });
    }
});

// DELETE menu item (also removes image file)
router.delete("/:id", async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ error: "Menu item not found" });
        if (item.image && fs.existsSync("." + item.image)) {
            fs.unlinkSync("." + item.image);
        }
        res.json({ message: "Menu item deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;