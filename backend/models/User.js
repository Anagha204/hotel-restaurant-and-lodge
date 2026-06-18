import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("User", userSchema);