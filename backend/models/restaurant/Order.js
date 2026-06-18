import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    notes: String,
    itemStatus: {
        type: String,
        enum: ['Pending', 'Cooking', 'Ready', 'Served'],
        default: 'Pending',
    },
    statusUpdatedAt: {
        type: Date,
        default: Date.now,
    },
});

const orderSchema = new mongoose.Schema({
    orderType: {
        type: String,
        enum: ['Dine In', 'Takeaway', 'Delivery', 'Online order', 'Room Service'],
        required: true,
    },
    assignedRoom: { type: String, default: null },   // room number linked from ID verification
    guestName: { type: String, default: null },      // guest name for reference
    roomNumber: {
        type: String,
        required: function () { return this.orderType === 'Room Service'; }
    },
    table: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        required: function () { return this.orderType === 'Dine In'; }
    },
    customerName: String,
    customerPhone: String,
    deliveryAddress: String,
    items: [orderItemSchema],
    orderStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
        default: 'Pending',
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid'],
        default: 'Pending',
    },
    totalAmount: { type: Number, default: 0 },
    paymentMode: { type: String, default: 'Cash' },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    kitchenNotes: String,
}, {
    timestamps: true,   // automatically manages createdAt & updatedAt
});

export default mongoose.model('Order', orderSchema);