import express from "express";
const router = express.Router();

// ✅ IMPORT MODEL (IMPORTANT: include .js)
import Aminity from "../../models/lodge/Aminity.js";


// ✅ GET all services
router.get("/", async (req, res) => {
    try {
        const data = await Aminity.find().sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        res.status(500).json(err);
    }
});


// ✅ ADD service
router.post("/", async (req, res) => {
    try {
        const newItem = new Aminity(req.body);
        const saved = await newItem.save();
        res.json(saved);
    } catch (err) {
        res.status(500).json(err);
    }
});


// ✅ UPDATE status
router.put("/:id", async (req, res) => {
    try {
        const updated = await Aminity.findByIdAndUpdate(
            req.params.id,
            { status: "Billed" }, // or req.body.status
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json(err);
    }
});


// ✅ DELETE
router.delete("/:id", async (req, res) => {
    try {
        await Aminity.findByIdAndDelete(req.params.id);
        res.json("Deleted");
    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;