import express from "express";
import HK from "../../models/lodge/Housekeeping.js";

const router = express.Router();

/* =========================
   GET ALL TASKS
========================= */
router.get("/", async (req, res) => {
    try {
        const data = await HK.find().sort({ createdAt: -1 });
        res.json(data);
    } catch (err) {
        console.log("GET ERROR:", err);
        res.status(500).json(err);
    }
});

/* =========================
   ADD TASK
========================= */
router.post("/", async (req, res) => {
    try {
        console.log("BODY:", req.body);

        const task = new HK(req.body);
        await task.save();

        res.json(task);
    } catch (err) {
        console.log("POST ERROR:", err);
        res.status(500).json(err);
    }
});

/* =========================
   UPDATE TASK STATUS
========================= */
router.put("/:id", async (req, res) => {
    try {
        const updated = await HK.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json(err);
    }
});
/* =========================
   DELETE TASK
========================= */
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await HK.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ msg: "Not found" });
        }

        res.json({ msg: "Deleted successfully" });
    } catch (err) {
        console.log("DELETE ERROR:", err);
        res.status(500).json(err);
    }
});

export default router;