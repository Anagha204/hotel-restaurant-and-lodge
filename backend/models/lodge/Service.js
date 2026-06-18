import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    room: { type: String, required: true },          // room number (e.g. "101")
    serviceName: { type: String, required: true },   // e.g. "Laundry"
    charge: { type: Number, required: true },        // amount in ₹
    status: { type: String, enum: ['Pending', 'Billed'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model("Service", serviceSchema);