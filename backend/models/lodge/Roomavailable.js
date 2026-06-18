import mongoose from "mongoose";

const RoomavailabilitySchema = new mongoose.Schema({
    roomNumber: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: {
        type: String,
        enum: ["Available", "Occupied", "Reserved"],
        default: "Available"
    }
}, { timestamps: true });

export default mongoose.model("Roomavailability", RoomavailabilitySchema);