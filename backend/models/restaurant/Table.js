import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
    tableNumber: { type: Number, required: true, unique: true },
    capacity: { type: Number, required: true, min: 1 },
    section: { type: String, enum: ['AC', 'Non AC', 'Outdoor'], default: 'Non AC' },
    status: {
        type: String,
        enum: ['Available', 'Occupied', 'Reserved', 'Cleaning'],
        default: 'Available'
    },
    isDeleted: { type: Boolean, default: false },
    // For visual layout (x, y coordinates in a grid)
    positionX: { type: Number, default: 0 },
    positionY: { type: Number, default: 0 },
    // Optional shape/size for visual
    width: { type: Number, default: 100 },
    height: { type: Number, default: 100 }
}, { timestamps: true });

export default mongoose.model('Table', tableSchema);