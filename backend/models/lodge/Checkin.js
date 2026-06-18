import mongoose from "mongoose";

const checkinSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    checkInTime: { type: Date, default: Date.now },
    checkOutTime: Date,
    advancePayment: {
        type: Number,
        default: 0,
        // ✅ Round to nearest integer before saving
        set: function (v) {
            return Math.round(Number(v));
        },
        // ✅ Round when reading from database
        get: function (v) {
            return Math.round(v);
        }
    },
    idVerified: { type: Boolean, default: false },
    notes: String,
    restaurantCharges: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    paymentMode: { type: String, default: 'Cash' }
}, {
    timestamps: true,

    toJSON: { getters: true },
    toObject: { getters: true }
});

export default mongoose.model('Checkin', checkinSchema);