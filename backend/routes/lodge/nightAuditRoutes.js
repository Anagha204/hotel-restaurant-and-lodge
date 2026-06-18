import express from "express";
import NightAudit from "../../models/lodge/NightAudit.js";

const router = express.Router();

// GET all audits
router.get("/", async (req, res) => {
    try {
        const audits = await NightAudit.find().sort({ date: -1 });
        res.json(audits);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET by date
router.get("/:date", async (req, res) => {
    try {
        const audit = await NightAudit.findOne({ date: req.params.date });
        if (audit) {
            res.json(audit);
        } else {
            res.status(404).json({ message: "No audit found for this date" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE or UPDATE audit (Run Audit)
router.post("/", async (req, res) => {
    try {
        const { date, totalRoomsOccupied, totalRevenue, status, closedBy } = req.body;

        let existing = await NightAudit.findOne({ date });

        if (existing) {
            existing.totalRoomsOccupied = totalRoomsOccupied;
            existing.totalRevenue = totalRevenue;
            existing.status = status || existing.status;
            existing.closedBy = closedBy || existing.closedBy;
            await existing.save();
            return res.json(existing);
        }

        const newAudit = new NightAudit({
            date,
            totalRoomsOccupied,
            totalRevenue,
            status,
            closedBy
        });
        const saved = await newAudit.save();
        res.json(saved);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
