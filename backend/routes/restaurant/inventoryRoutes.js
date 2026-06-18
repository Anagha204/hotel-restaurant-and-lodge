import express from "express";
import Inventory from "../../models/restaurant/Inventory.js";
import recipes from "../../utils/recipes.js";

const router = express.Router();

// 👉 GET ALL ITEMS
router.get("/", async (req, res) => {
  const items = await Inventory.find().sort({ createdAt: -1 });
  res.json(items);
});

// 👉 ADD ITEM
router.post("/", async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { name, stock, min, unit } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Name is required" });
    }

    if (stock === undefined || stock === "" || isNaN(stock)) {
      return res.status(400).json({ message: "Valid stock is required" });
    }

    const newItem = new Inventory({
      name: name.toLowerCase().trim(),
      stock: Number(stock),
      min: Number(min || 0),
      unit: unit || ""
    });

    await newItem.save();

    res.status(201).json(newItem);

  } catch (err) {
    console.error("🔥 REAL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

// 👉 DELETE ITEM
router.delete("/:id", async (req, res) => {
  await Inventory.findByIdAndDelete(req.params.id);
  res.json({ message: "Item deleted" });
});

// 👉 LOW STOCK ITEMS
router.get("/low", async (req, res) => {
  const items = await Inventory.find({
    $expr: { $lte: ["$stock", "$min"] }
  });

  res.json(items);
});

router.put("/reduce", async (req, res) => {
  try {
    const { itemName, qty } = req.body;

    if (!itemName || !qty) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const item = await Inventory.findOne({
      name: { $regex: new RegExp(`^${itemName}$`, "i") }
    });

    if (!item) {
      return res.status(400).json({ message: "Item not found: " + itemName });
    }

    if (item.stock < qty) {
      return res.status(400).json({ message: "Not enough stock" });
    }

    item.stock -= qty;

    await item.save();

    res.json({ message: "Stock updated" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

