import express from "express";
const router = express.Router();
import Checkin from "../../models/lodge/Checkin.js";
import Booking from "../../models/lodge/Booking.js";
import Room from "../../models/lodge/Rooms.js";

// GET all checkins
router.get('/', async (req, res) => {
    try {
        const checkins = await Checkin.find()
            .populate({
                path: 'booking',
                populate: [{ path: 'guest' }, { path: 'room' }]
            });
        res.json(checkins);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST check-in
router.post('/checkin', async (req, res) => {
    try {
        const { booking: bookingId, checkInTime, advancePayment, idVerified, notes } = req.body;
        const booking = await Booking.findById(bookingId).populate('room');
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        // Create check-in record
        const checkin = new Checkin({
            booking: booking._id,
            checkInTime,
            advancePayment,
            idVerified,
            notes
        });
        await checkin.save();

        // Update booking status
        booking.status = 'Checked-In';
        await booking.save();

        // Update room status to Occupied
        const room = await Room.findById(booking.room);
        if (room) {
            room.status = 'Occupied';
            await room.save();
            console.log(`Room ${room.roomNumber} status updated to Occupied (checked-in)`);
        }

        res.status(201).json(checkin);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST check-out
router.post('/checkout', async (req, res) => {
    try {
        const { checkinId, checkOutTime, restaurantCharges, otherCharges, totalAmount, balanceDue, paymentMode } = req.body;
        const checkin = await Checkin.findById(checkinId).populate({
            path: 'booking',
            populate: { path: 'room' }
        });
        if (!checkin) return res.status(404).json({ error: 'Check-in record not found' });

        // Update check-in record
        checkin.checkOutTime = checkOutTime;
        checkin.restaurantCharges = restaurantCharges;
        checkin.otherCharges = otherCharges;
        checkin.totalAmount = totalAmount;
        checkin.balanceDue = balanceDue;
        checkin.paymentMode = paymentMode;
        await checkin.save();

        // Update booking status
        checkin.booking.status = 'Checked-Out';
        await checkin.booking.save();

        // Update room status to Available
        const room = await Room.findById(checkin.booking.room._id);
        if (room) {
            room.status = 'Available';
            await room.save();
            console.log(`Room ${room.roomNumber} status updated to Available (checked-out)`);
        }

        res.json(checkin);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;