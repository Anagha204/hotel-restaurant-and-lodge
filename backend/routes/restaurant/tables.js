import express from 'express';
import Table from '../../models/restaurant/Table.js';

const router = express.Router();

// GET all tables
router.get('/', async (req, res) => {
    try {
        const tables = await Table.find().sort({ tableNumber: 1 });
        res.json(tables);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new table
router.post('/', async (req, res) => {
    try {
        const table = new Table(req.body);
        const saved = await table.save();
        res.status(201).json(saved);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: `Table number ${req.body.tableNumber} already exists` });
        }
        res.status(500).json({ error: err.message });
    }
});

// PUT update table
router.put('/:id', async (req, res) => {
    try {
        const updated = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: 'Table not found' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put("/by-number/:tableNumber", async (req, res) => {
    try {
        const table = await Table.findOneAndUpdate(
            { tableNumber: req.params.tableNumber },
            { status: req.body.status },
            { new: true }
        );

        res.json(table);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE table
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Table.findByIdAndDelete(req.params.id); // permanent delete
        if (!deleted) return res.status(404).json({ error: 'Table not found' });
        res.json({ message: 'Table deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;