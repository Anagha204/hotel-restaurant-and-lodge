import express from "express";
import Delivery from "../../models/restaurant/Delivery.js";
import Order from "../../models/restaurant/Order.js";

const router = express.Router();

// GET all active deliveries
router.get("/", async (req, res) => {
    try {
        const deliveries = await Delivery.find().sort({ createdAt: -1 }).populate("orderId");
        res.status(200).json(deliveries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create delivery (can be triggered when an order is marked for delivery)
router.post("/", async (req, res) => {
    try {
        const delivery = new Delivery(req.body);
        await delivery.save();
        res.status(201).json(delivery);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update status/assign rider
router.put("/:id", async (req, res) => {
    try {
        const updated = await Delivery.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.status(200).json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE delivery
router.delete("/:id", async (req, res) => {
    try {
        await Delivery.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Delivery record deleted." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
