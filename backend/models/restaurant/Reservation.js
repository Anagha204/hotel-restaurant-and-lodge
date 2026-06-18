import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  name: String,
  phone: String,
  date: String,
  time: String,
  people: Number,

  // ✅ LINK VIA TABLE NUMBER (NOT ID)
  tableNumber: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    default: "Reserved"
  }
});

export default mongoose.model("Reservation", reservationSchema);