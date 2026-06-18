import express from "express";
const router = express.Router();
import Booking from "../../models/lodge/Booking.js";
import updateRoomStatusForBooking from "../../utils/updateRoomStatus.js";

// GET all bookings
router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('guest')
            .populate('room');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single booking
router.get('/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('guest')
            .populate('room');
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST new booking
router.post('/', async (req, res) => {
    try {
        console.log("Incoming booking data:", req.body); // 👈 DEBUG

        const { guest, room, checkIn, checkOut } = req.body;

        // ✅ VALIDATION (VERY IMPORTANT)
        if (!guest || !room || !checkIn || !checkOut) {
            return res.status(400).json({
                error: "Missing required fields (guest, room, dates)"
            });
        }

        const booking = new Booking(req.body);
        await booking.save();

        await updateRoomStatusForBooking(
            booking.room,
            booking._id,
            booking.status,
            booking.checkIn,
            booking.checkOut
        );

        const populated = await Booking.findById(booking._id)
            .populate('guest')
            .populate('room');

        res.status(201).json(populated);

    } catch (err) {
        console.error("❌ Booking save error:", err); // 👈 VERY IMPORTANT
        res.status(400).json({ error: err.message });
    }
});

// PUT update booking
router.put('/:id', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        // Update room status
        await updateRoomStatusForBooking(
    booking.room,
    booking._id,
    booking.status,
    booking.checkIn,
    booking.checkOut
);
        const populated = await Booking.findById(booking._id)
            .populate('guest')
            .populate('room');
        res.json(populated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE booking
router.delete('/:id', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });
        // Update room status (booking deleted)
        await updateRoomStatusForBooking(
    booking.room?._id || booking.room,
    booking._id,
    booking.status,
    booking.checkIn,
    booking.checkOut,
    true   // 🔥 REQUIRED
);
        res.json({ message: 'Booking deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;