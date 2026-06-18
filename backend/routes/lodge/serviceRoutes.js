import express from "express";
const router = express.Router();
import Service from "../../models/lodge/Service.js";

// GET all services
router.get('/', async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new service (added to a room)
router.post('/', async (req, res) => {
    try {
        const { room, serviceName, charge } = req.body;
        const newService = new Service({
            room,
            serviceName,
            charge,
            status: 'Pending'
        });
        await newService.save();
        res.status(201).json(newService);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT update service status (e.g., mark as Billed)
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const service = await Service.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(service);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;