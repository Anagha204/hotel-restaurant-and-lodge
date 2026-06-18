import express from "express";
import RoomBill from "../../models/lodge/Roombilling.js";
import CombinedBill from "../../models/lodge/CombinedBilling.js";
import Room from "../../models/lodge/Rooms.js";

const router = express.Router();

// GET Summary Report
router.get("/summary", async (req, res) => {
    try {
        const dateParam = req.query.date;
        let billQuery = {};

        if (dateParam) {
            const startOfDay = new Date(dateParam);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(dateParam);
            endOfDay.setHours(23, 59, 59, 999);

            billQuery.createdAt = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        // Fetch all bills matching the query
        const roomBills = await RoomBill.find(billQuery);
        const combinedBills = await CombinedBill.find(billQuery);
        
        let totalRevenue = 0;
        let pendingPayments = 0;

        // Process Room Bills
        roomBills.forEach(b => {
             const subtotal = Number(b.roomRent || 0) + Number(b.foodCharges || 0) + Number(b.laundry || 0) + Number(b.extraServices || 0);
             const subPlusTax = subtotal + (subtotal * Number(b.tax || 0)) / 100;
             if (b.status === "Paid") {
                 totalRevenue += subPlusTax;
             } else {
                 pendingPayments += subPlusTax;
             }
        });

        // Process Combined Bills
        combinedBills.forEach(b => {
            const subtotal = Number(b.roomRent || 0) + Number(b.restaurantCharges || 0) + Number(b.roomService || 0) + Number(b.laundry || 0);
            const subPlusTax = subtotal + (subtotal * Number(b.tax || 0)) / 100;
            if (b.status === "Paid") {
                totalRevenue += subPlusTax;
            } else {
                pendingPayments += subPlusTax;
            }
       });

        // Fetch current room statuses from actual Rooms collection
        const dbRooms = await Room.find();
        
        // Count occupied vs available
        let occupied = 0;
        let available = 0;
        let reserved = 0;

        // Group by actual room status
        dbRooms.forEach(room => {
             if (room.status === "Occupied") {
                 occupied++;
             } else if (room.status === "Reserved") {
                 reserved++;
             } else {
                 // Treats 'Available', 'Cleaning', and 'Maintenance' as Available for the basic occupancy report
                 available++;
             }
        });

        res.json({
            revenue: {
                total: totalRevenue,
                pending: pendingPayments
            },
            occupancy: {
                occupied,
                available,
                reserved
            },
            totalBills: roomBills.length + combinedBills.length 
        });

    } catch (err) {
        console.error("REPORT ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET Bills report list
router.get("/bills", async (req, res) => {
    try {
        const bills = await RoomBill.find().sort({ createdAt: -1 });
        res.json(bills);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
