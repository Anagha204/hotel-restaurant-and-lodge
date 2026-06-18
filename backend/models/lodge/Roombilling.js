import mongoose from "mongoose";

const roomBillSchema = new mongoose.Schema(
    {
        room: { type: String, required: true },

        roomRent: { type: Number, default: 0 },
        foodCharges: { type: Number, default: 0 },
        laundry: { type: Number, default: 0 },
        extraServices: { type: Number, default: 0 },

        tax: { type: Number, default: 0 }, // percentage

        status: {
            type: String,
            enum: ["Pending", "Generated", "Paid"],
            default: "Pending"
        }
    },
    { timestamps: true }
);

export default mongoose.model("RoomBill", roomBillSchema);