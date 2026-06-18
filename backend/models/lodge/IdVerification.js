import mongoose from "mongoose";

const idVerificationSchema = new mongoose.Schema({
    guest: { type: mongoose.Schema.Types.ObjectId, ref: "Guest", required: true },
    guestName: { type: String, required: true },   // denormalized for display
    phone: { type: String, required: true },
    roomNumber: { type: String, required: true },
    idType: { type: String, required: true },
    idNumber: { type: String, required: true },
    imageUrl: { type: String },
    status: { type: String, enum: ["Verified", "Pending", "Rejected"], default: "Pending" }
}, { timestamps: true });

export default mongoose.model("IdVerification", idVerificationSchema);