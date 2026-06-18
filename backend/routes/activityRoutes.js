import express from "express";
import ActivityLog from "../models/ActivityLog.js";

const router = express.Router();

// POST log activity
router.post("/log", async (req, res) => {
    const { user, action, details } = req.body;
    try {
        await ActivityLog.create({ user, action, details });
        res.json({ message: "Activity logged" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all logs
router.get("/", async (req, res) => {
    try {
        const logs = await ActivityLog.find().populate("user", "name email").sort({ timestamp: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;