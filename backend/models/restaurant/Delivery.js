import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    address: { type: String, required: true },
    riderName: { type: String, default: "Unassigned" },
    riderPhone: { type: String },
    status: { 
        type: String, 
        enum: ["Pending", "Assigned", "Out for Delivery", "Delivered", "Cancelled"], 
        default: "Pending" 
    },
    estimatedTime: { type: String }
}, { timestamps: true });

export default mongoose.model("Delivery", deliverySchema);
