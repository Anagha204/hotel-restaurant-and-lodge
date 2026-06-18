import mongoose from "mongoose";

const guestSchema = new mongoose.Schema({
    name: String,
    mobile: String,
    address: String,
    idNumber: String,
    idProof: String,
    nationality: String,
    email: String
}, { timestamps: true });

export default mongoose.model("Guest", guestSchema);