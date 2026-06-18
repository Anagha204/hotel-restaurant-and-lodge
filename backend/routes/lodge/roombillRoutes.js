import express from "express";
import RoomBill from "../../models/lodge/Roombilling.js";

const router = express.Router();

/* GET ALL BILLS */
router.get("/", async (req, res) => {
    try {
        const bills = await RoomBill.find().sort({ createdAt: -1 });
        res.json(bills);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* CREATE BILL */
router.post("/", async (req, res) => {
    try {
        const bill = new RoomBill(req.body);
        await bill.save();
        res.json(bill);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* UPDATE STATUS */
router.put("/:id", async (req, res) => {
    try {
        const updated = await RoomBill.findByIdAndUpdate(
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
        await RoomBill.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ADD AMENITY TO BILL
router.post("/add-service", async (req, res) => {
    try {
        const { room, amount } = req.body;

        // ✅ USE CORRECT MODEL NAME
        let bill = await RoomBill.findOne({ room });

        if (bill) {
            bill.extraServices = (bill.extraServices || 0) + Number(amount);
            await bill.save();
            return res.json(bill);
        }

        const newBill = new RoomBill({
            room,
            roomRent: 0,
            foodCharges: 0,
            laundry: 0,
            extraServices: Number(amount),
            tax: 0,
            status: "Pending"
        });

        const saved = await newBill.save();
        res.json(saved);

    } catch (err) {
        console.log("ADD SERVICE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});
export default router;