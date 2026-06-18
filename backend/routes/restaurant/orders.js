import express from "express";
import Order from "../../models/restaurant/Order.js";
import Table from "../../models/restaurant/Table.js";
import Customer from "../../models/restaurant/Customer.js";
import recipes from "../../utils/recipes.js";
import axios from "axios";

const router = express.Router();

// 🔥 COMMON FUNCTION (REUSE)
const reduceInventory = async (order) => {
  await order.populate("items.menuItem");

  for (let item of order.items) {
    if (!item.menuItem || !item.menuItem.name) continue;

    const key = item.menuItem.name
      .toLowerCase()
      .replace(/\s+/g, '');

    const recipe = recipes[key];
    if (!recipe) continue;

    for (let ing of recipe) {
      await axios.put("http://localhost:5000/api/inventory/reduce", {
        itemName: ing.name,
        qty: ing.qty * item.quantity
      });
    }
  }
};

// ========== GET all orders ==========
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("items.menuItem", "name price")
      .populate("table", "tableNumber section")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ✅ MARK MULTIPLE ORDERS AS PAID (MUST BE BEFORE /:id ROUTES) ==========
router.put("/mark-paid", async (req, res) => {
  try {
    const { orderIds, paymentMode, taxPercent, discountPercent, grandTotal } = req.body;

    if (!orderIds || !orderIds.length) {
      return res.status(400).json({ error: "No order IDs provided" });
    }

    await Order.updateMany(
      { _id: { $in: orderIds } },
      {
        paymentStatus: "Paid",
        paymentMode: paymentMode,
        tax: taxPercent,
        discount: discountPercent,
        totalAmount: grandTotal,
        paidAt: new Date()
      }
    );

    res.json({ message: `${orderIds.length} order(s) marked as paid` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== GET single order ==========
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.menuItem")
      .populate("table");

    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== CREATE ORDER (no table availability check) ==========
router.post("/", async (req, res) => {
  try {
    const { orderType, table } = req.body;

    // Only check existence, NOT status - any table allowed
    if (orderType === "Dine In" && table) {
      const foundTable = await Table.findById(table);
      if (!foundTable) return res.status(400).json({ error: "Table not found" });
      // ✅ No "Table not available" check
    }

    const newOrder = new Order(req.body);
    const saved = await newOrder.save();

    if (saved.orderType === "Dine In" && saved.table) {
      await Table.findByIdAndUpdate(saved.table, { status: "Occupied" });
    }

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== UPDATE order ==========
router.put("/:id", async (req, res) => {
  try {
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) return res.status(404).json({ error: "Order not found" });

    const isCompleting =
      existingOrder.orderStatus !== "Completed" &&
      req.body.orderStatus === "Completed";

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (isCompleting) {
      await reduceInventory(updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== UPDATE item status (KDS) ==========
router.put("/:orderId/items/:itemId/status", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const item = order.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.itemStatus = status;
    let allServed = false;

    if (status === "Served") {
      allServed = order.items.every(i => i.itemStatus === "Served");
      if (allServed) {
        order.orderStatus = "Completed";
        if (order.table) {
          await Table.findByIdAndUpdate(order.table, { status: "Available" });
        }
      }
    }

    await order.save();
    if (allServed && order.orderStatus === "Completed") {
      await reduceInventory(order);
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== CANCEL order ==========
router.put("/:id/cancel", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.orderStatus = "Cancelled";
    await order.save();

    if (order.table) {
      await Table.findByIdAndUpdate(order.table, { status: "Available" });
    }

    res.json({ message: "Order cancelled", order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== DELETE order ==========
router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.table) {
      await Table.findByIdAndUpdate(order.table, { status: "Available" });
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;