import express from "express";
import Customer from "../../models/restaurant/Customer.js";

const router = express.Router();

// GET all customers
router.get("/", async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 }).populate("orders");
        res.status(200).json(customers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET customer by ID
router.get("/:id", async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id).populate("orders");
        if (!customer) return res.status(404).json({ message: "Customer not found" });
        res.status(200).json(customer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new customer
router.post("/", async (req, res) => {
    try {
        const existingPhone = await Customer.findOne({ phone: req.body.phone });
        if (existingPhone) {
            return res.status(400).json({ error: "A customer with this phone number already exists." });
        }
        
        if (req.body.email && req.body.email.trim() !== "") {
            const existingEmail = await Customer.findOne({ email: req.body.email });
            if (existingEmail) {
                return res.status(400).json({ error: "A customer with this email address already exists." });
            }
        }

        const customer = new Customer(req.body);
        await customer.save();
        res.status(201).json(customer);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "Duplicate entry detected (email or phone)." });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT update customer
router.put("/:id", async (req, res) => {
    try {
        const existingPhone = await Customer.findOne({ phone: req.body.phone, _id: { $ne: req.params.id } });
        if (existingPhone) {
            return res.status(400).json({ error: "Another customer is already using this phone number." });
        }
        
        if (req.body.email && req.body.email.trim() !== "") {
            const existingEmail = await Customer.findOne({ email: req.body.email, _id: { $ne: req.params.id } });
            if (existingEmail) {
                return res.status(400).json({ error: "Another customer is already using this email address." });
            }
        }

        const updated = await Customer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        res.status(200).json(updated);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "Duplicate entry detected (email or phone)." });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE customer
router.delete("/:id", async (req, res) => {
    try {
        await Customer.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Customer deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
