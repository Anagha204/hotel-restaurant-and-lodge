import express from "express";
import Room from "../../models/lodge/Rooms.js";

const router = express.Router();

/* =========================
   GET ALL ROOMS
========================= */
router.get("/", async (req, res) => {
    try {
        console.log("GET ROOMS API HIT");

        const rooms = await Room.find().sort({ createdAt: -1 });

        res.status(200).json(rooms);
    } catch (err) {
        console.log("GET ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

/* =========================
   CREATE ROOM
========================= */
router.post("/", async (req, res) => {
    try {
        console.log("CREATE ROOM BODY:", req.body);

        const room = new Room(req.body);
        await room.save();

        res.status(201).json(room);
    } catch (err) {
        console.log("CREATE ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

/* =========================
   UPDATE ROOM
========================= */
router.put("/:id", async (req, res) => {
    try {
        const updatedRoom = await Room.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!updatedRoom) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.status(200).json(updatedRoom);
    } catch (err) {
        console.log("UPDATE ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

/* =========================
   DELETE ROOM
========================= */
router.delete("/:id", async (req, res) => {
    try {
        const deletedRoom = await Room.findByIdAndDelete(req.params.id);

        if (!deletedRoom) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.status(200).json({ message: "Deleted successfully" });
    } catch (err) {
        console.log("DELETE ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

export default router;