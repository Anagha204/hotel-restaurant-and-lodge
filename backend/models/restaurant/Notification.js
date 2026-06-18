
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    type: { type: String, required: true }, // 'Order', 'Inventory', 'Reservation', 'General', etc.
    message: { type: String, required: true },
    recipient: {
        type: String,
        default: "All"
    },
    senderRole: { type: String, default: "System" }, // Role of the sender, e.g., 'Admin', 'Manager'
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);