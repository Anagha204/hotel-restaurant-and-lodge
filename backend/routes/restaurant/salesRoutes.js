import express from "express";
import Inventory from "../../models/restaurant/Inventory.js";

const router = express.Router();


// 👉 SELL ITEM (AUTO DEDUCT)
router.post("/sell", async (req, res) => {
  try {
    const { name, quantity } = req.body;

    const item = await Inventory.findOne({ name });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.stock < quantity) {
      return res.status(400).json({
        message: `Only ${item.stock} ${item.unit} available`
      });
    }

    // 🔥 DEDUCT STOCK
    item.stock -= quantity;
    await item.save();

    res.json({
      message: "Stock updated after sale",
      item
    });

  } catch (err) {
    res.status(500).json({ message: "Sale failed" });
  }
});

export default router;
