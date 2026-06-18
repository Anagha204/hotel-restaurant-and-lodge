import express from "express";
import CombinedBilling from "../../models/lodge/CombinedBilling.js";

const router = express.Router();

/* GET ALL BILLS */
router.get("/", async (req, res) => {
    try {
        const bills = await CombinedBilling.find().sort({ createdAt: -1 });
        res.json(bills);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* CREATE BILL */
router.post("/", async (req, res) => {
    try {
        const bill = new CombinedBilling(req.body);
        await bill.save();
        res.json(bill);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* UPDATE BILL */
router.put("/:id", async (req, res) => {
    try {
        const updated = await CombinedBilling.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* DELETE BILL */
router.delete("/:id", async (req, res) => {
    try {
        await CombinedBilling.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
