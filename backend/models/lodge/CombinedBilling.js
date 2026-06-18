import mongoose from "mongoose";

const combinedBillingSchema = new mongoose.Schema(
    {
        room: { type: String, required: true },
        guestName: { type: String, required: false, default: "Guest" },
        phone: { type: String, required: true },
        roomRent: { type: Number, default: 0 },
        restaurantCharges: { type: Number, default: 0 },
        roomService: { type: Number, default: 0 },
        laundry: { type: Number, default: 0 },
        extraServices: { type: Number, default: 0 },
        advancePayment: { type: Number, default: 0 },

        tax: { type: Number, default: 0 }, // percentage

        status: {
            type: String,
            enum: ["Pending", "Generated", "Paid"],
            default: "Pending"
        }
    },
    { timestamps: true }
);

export default mongoose.model("CombinedBilling", combinedBillingSchema);
