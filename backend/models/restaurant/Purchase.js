import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    supplier: String,
    item: String,
    qty: Number,
    rate: Number,
    total: Number,
    status: {
      type: String,
      default: "Ordered"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Purchase", purchaseSchema);

