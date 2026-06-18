import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    guest: { type: mongoose.Schema.Types.ObjectId, ref: 'Guest', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    numberOfGuests: { type: Number, default: 1 },
    bookingType: { type: String, enum: ['Walk-in', 'Online', 'Advance Reservation'], default: 'Walk-in' },
    status: { type: String, enum: ['Confirmed', 'Pending', 'Cancelled', 'Checked-In', 'Checked-Out'], default: 'Confirmed' },
    notes: String,

    billingMode: {
        type: String,
        enum: ['nightly', 'fixed'],
        default: 'nightly'
    },
    fixedTotalAmount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);