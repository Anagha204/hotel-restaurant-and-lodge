import mongoose from "mongoose";

const NightAuditSchema = new mongoose.Schema({
    date: { type: String, required: true },
    totalRoomsOccupied: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
    closedBy: { type: String, default: "System" }
}, { timestamps: true });

export default mongoose.model("NightAudit", NightAuditSchema);
