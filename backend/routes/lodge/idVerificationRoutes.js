import express from "express";
import IdVerification from "../../models/lodge/IdVerification.js";
import Room from "../../models/lodge/Rooms.js";

const router = express.Router();

// GET all IDs
router.get("/", async (req, res) => {
    try {
        const ids = await IdVerification.find().sort({ createdAt: -1 });
        res.json(ids);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET by room
router.get("/room/:roomNumber", async (req, res) => {
    try {
        const ids = await IdVerification.find({ roomNumber: req.params.roomNumber });
        res.json(ids);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADD NEW ID
router.post("/", async (req, res) => {
    try {
        const newId = new IdVerification(req.body);
        const saved = await newId.save();
        res.json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE ID STATUS
router.put("/:id", async (req, res) => {
    try {
        const updated = await IdVerification.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        
        if (req.body.status === "Verified" && updated.roomNumber) {
            await Room.findOneAndUpdate(
                { roomNumber: updated.roomNumber },
                { $set: { status: "Reserved" } }
            );
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE ID
router.delete("/:id", async (req, res) => {
    try {
        await IdVerification.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
