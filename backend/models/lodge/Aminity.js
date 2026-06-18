import mongoose from "mongoose";

const AminitySchema = new mongoose.Schema({
    room: { type: String, required: true },
    serviceName: { type: String, required: true },
    charge: { type: Number, required: true },
    status: {
        type: String,
        enum: ["Added", "Billed"],
        default: "Added"
    }
}, { timestamps: true });

export default mongoose.model("Aminity", AminitySchema);