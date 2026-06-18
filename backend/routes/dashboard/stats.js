import express from "express";
import RoomBill from "../../models/lodge/Roombilling.js";
import RoomService from "../../models/lodge/Roomservice.js";
import Housekeeping from "../../models/lodge/Housekeeping.js";
import Room from "../../models/lodge/Rooms.js";
import Booking from "../../models/lodge/Booking.js";
import Checkin from "../../models/lodge/Checkin.js";
import IdVerification from "../../models/lodge/IdVerification.js";
import CombinedBilling from "../../models/lodge/CombinedBilling.js";
import Order from "../../models/restaurant/Order.js";
import Table from "../../models/restaurant/Table.js";
// import Inventory from "../../models/restaurant/Inventory.js"; // Temporarily removed because Inventory model is empty

const router = express.Router();

router.get("/stats", async (req, res) => {
    try {
        console.log("Dashboard stats API called");

        // LODGE STATS
        const totalRooms = await Room.countDocuments();
        const occupiedRooms = await Room.countDocuments({ status: "Occupied" });
        const roomsCleaning = await Room.countDocuments({ status: "Cleaning" });
        const roomServiceOrders = await RoomService.countDocuments({
            status: { $in: ["Pending", "Sent to Kitchen", "Served"] }
        });

        const pendingRoomBills = await RoomBill.countDocuments({ status: "Pending" });
        const pendingCombinedBills = await CombinedBilling.countDocuments({ status: "Pending" });
        const billsPending = pendingRoomBills + pendingCombinedBills;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const checkInsToday = await Checkin.countDocuments({
            checkInTime: { $gte: today, $lte: endOfDay }
        });

        const pendingVerifications = await IdVerification.countDocuments({ status: "Pending" });

        const paidRoomBills = await RoomBill.find({ status: "Paid" });
        const paidCombinedBills = await CombinedBilling.find({ status: "Paid" });

        let totalRevenue = 0;
        paidRoomBills.forEach(b => {
            const subtotal = Number(b.roomRent || 0) + Number(b.foodCharges || 0) + Number(b.laundry || 0) + Number(b.extraServices || 0);
            totalRevenue += subtotal + (subtotal * Number(b.tax || 0)) / 100;
        });
        paidCombinedBills.forEach(b => {
            const subtotal = Number(b.roomRent || 0) + Number(b.restaurantCharges || 0) + Number(b.roomService || 0) + Number(b.laundry || 0);
            totalRevenue += subtotal + (subtotal * Number(b.tax || 0)) / 100;
        });

        const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("guest")
            .populate("room");


        // RESTAURANT STATS
        const todayOrders = await Order.find({ createdAt: { $gte: today, $lte: endOfDay } });
        const ordersToday = todayOrders.length;

        const totalSalesResult = await Order.aggregate([
            { $match: { paymentStatus: "Paid" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalSales = totalSalesResult[0]?.total || 0;

        const activeTables = await Table.countDocuments({ status: "Occupied" });
        const totalTables = await Table.countDocuments();

        const pendingOrders = await Order.countDocuments({ status: "Pending" });
        const kitchenActiveOrders = await Order.countDocuments({ status: "In Kitchen" });

        // Placeholder until Inventory model is implemented
        const lowStockItems = 0;

        const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);

        res.json({
            // Lodge
            totalRooms, occupiedRooms, roomsCleaning, roomServiceOrders,
            billsPending, checkInsToday, pendingVerifications, totalRevenue, recentBookings,

            // Restaurant
            totalSales, ordersToday, activeTables, totalTables,
            pendingOrders, kitchenActiveOrders, lowStockItems, recentOrders
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;