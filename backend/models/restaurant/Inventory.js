import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  stock: { type: Number, required: true },
  min: { type: Number, default: 0 },
  unit: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Inventory", inventorySchema);
