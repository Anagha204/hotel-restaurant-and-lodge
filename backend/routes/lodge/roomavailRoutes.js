import express from "express";
import Room from "../../models/lodge/Roomavailable.js";
const router = express.Router();

// GET by date
router.get("/:date", async (req, res) => {
    try {
        const data = await Room.find({ date: req.params.date });
        res.json(data);
    } catch (err) {
        res.status(500).json(err);
    }
});

// ADD or UPDATE room status
router.post("/", async (req, res) => {
    try {
        const { roomNumber, date, status } = req.body;

        let existing = await Room.findOne({ roomNumber, date });

        if (existing) {
            existing.status = status;
            await existing.save();
            return res.json(existing);
        }

        const newRoom = new Room(req.body);
        const saved = await newRoom.save();

        res.json(saved);

    } catch (err) {
        res.status(500).json(err);
    }
});

export default router;