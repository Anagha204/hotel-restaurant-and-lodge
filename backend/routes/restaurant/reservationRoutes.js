import express from "express";
import Reservation from "../../models/restaurant/Reservation.js";

const router = express.Router();

console.log("✅ Reservation Routes Loaded");

// 👉 GET
router.get("/", async (req, res) => {
  try {
    const data = await Reservation.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reservations" });
  }
});

// 👉 ADD (FIXED)
router.post("/", async (req, res) => {
  try {
    const { tableNumber, date, time } = req.body;

    // ✅ VALIDATION
   if (!tableNumber || !date || !time || Number(tableNumber) <= 0) {
      return res.status(400).json({
        message: "Table, Date and Time are required",
      });
    }

    // ❌ CHECK DUPLICATE
    const existing = await Reservation.findOne({
      tableNumber,
      date,
      time,
      status: { $ne: "Completed" },
    });

    if (existing) {
      return res.status(400).json({
        message: "Table already booked for this time",
      });
    }

    // ✅ CREATE ONLY AFTER CHECK
    const newRes = new Reservation(req.body);

    const saved = await newRes.save();

    res.status(201).json(saved);

  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({ message: "Failed to add reservation" });
  }
});

// 👉 UPDATE
router.put("/:id", async (req, res) => {
  try {
    const { tableNumber, date, time } = req.body;

    // ❌ CHECK DUPLICATE (exclude current record)
    const existing = await Reservation.findOne({
      _id: { $ne: req.params.id },
      tableNumber,
      date,
      time,
      status: { $ne: "Completed" },
    });

    if (existing) {
      return res.status(400).json({
        message: "Table already booked for this time",
      });
    }

    const updated = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// 👉 DELETE
router.delete("/:id", async (req, res) => {
  try {
    await Reservation.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;

