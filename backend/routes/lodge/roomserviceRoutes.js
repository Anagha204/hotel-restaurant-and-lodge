import express from "express";
import RS from "../../models/lodge/Roomservice.js";

const router = express.Router();

// GET ALL
router.get("/", async (req, res) => {
  try {
    const data = await RS.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ADD
router.post("/", async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const order = new RS(req.body);
    await order.save();

    res.json(order);
  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).json(err);
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const updated = await RS.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await RS.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ msg: "Order not found" });
    }

    res.json({ msg: "Order deleted successfully" });
  } catch (err) {
    console.log("DELETE ERROR:", err);
    res.status(500).json(err);
  }
});

export default router;