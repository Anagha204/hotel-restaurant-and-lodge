import express from "express";
import Purchase from "../../models/restaurant/Purchase.js";
import Inventory from "../../models/restaurant/Inventory.js";

const router = express.Router();

// 👉 GET ALL PURCHASES
router.get("/", async (req, res) => {
  const data = await Purchase.find().sort({ createdAt: -1 });
  res.json(data);
});

// 👉 ADD PURCHASE
router.post("/", async (req, res) => {
  try {
    const { supplier, item, qty, rate } = req.body;

    const total = qty * rate;

    const purchase = new Purchase({
      supplier,
      item,
      qty,
      rate,
      total,
      status: "Ordered"
    });

    const saved = await purchase.save();
    res.status(201).json(saved);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 👉 UPDATE STATUS + INVENTORY LOGIC
router.put("/:id", async (req, res) => {
  try {
    console.log("👉 BODY:", req.body);
    console.log("👉 ID:", req.params.id);

    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const oldStatus = purchase.status;
    const newStatus = req.body?.status;

    if (!newStatus) {
      return res.status(400).json({ message: "Status is required" });
    }

    console.log("👉 OLD:", oldStatus, "NEW:", newStatus);

    // 🔥 HANDLE INVENTORY SAFELY
    if (newStatus === "Received" && oldStatus !== "Received") {

      let inventoryItem = await Inventory.findOne({ name: purchase.item });

      // ✅ create if not exists
      if (!inventoryItem) {
        inventoryItem = new Inventory({
          name: purchase.item,
          stock: 0,
          min: 0,
          unit: "pcs"
        });
      }

      inventoryItem.stock += Number(purchase.qty || 0);
      await inventoryItem.save();
    }

    // ✅ update status
    purchase.status = newStatus;
    await purchase.save();

    res.json(purchase);

  } catch (err) {
    console.error("🔥 ERROR:", err); // 👈 THIS WILL SHOW REAL ISSUE
    res.status(500).json({ message: err.message });
  }
});

// 👉 DELETE PURCHASE
router.delete("/:id", async (req, res) => {
  await Purchase.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// 👉 GET INVENTORY
router.get("/inventory/all", async (req, res) => {
  const data = await Inventory.find();
  res.json(data);
});

export default router;
