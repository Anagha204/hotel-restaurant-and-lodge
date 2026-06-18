import mongoose from "mongoose";

const hkSchema = new mongoose.Schema(
{
    room: { type: String, required: true },

    staff: { type: String, required: true },

    status: {
        type: String,
        enum: ["Dirty", "Cleaning", "Clean", "Maintenance"],
        default: "Dirty"
    },

    startedAt: {
    type: Date,
    default: null
},
completedAt: {
    type: Date,
    default: null
}
},
{ timestamps: true }
);

export default mongoose.model("Housekeeping", hkSchema);

