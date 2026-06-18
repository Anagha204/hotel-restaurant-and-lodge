import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    floor: { type: Number, required: true },
    price: { type: Number, required: true },
    capacity: { type: Number, required: true },
    amenities: String,
    status: { type: String, enum: ['Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance'], default: 'Available' }
}, { timestamps: true });

export default mongoose.model("Room", roomSchema);