import mongoose from "mongoose";

const roomServiceSchema = new mongoose.Schema({
  room: String,
  item: String,
  qty: Number,
  status: {
    type: String,
    enum: ["Pending", "Sent to Kitchen", "Served", "Added to Bill"],
    default: "Pending"
  }
}, { timestamps: true });

export default mongoose.model("Roomservice", roomServiceSchema);