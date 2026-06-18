import express from "express";
import Order from "../../models/restaurant/Order.js";

const router = express.Router();

// GET reporting summary
router.get("/summary", async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0,0,0,0);
        const endOfDay = new Date();
        endOfDay.setHours(23,59,59,999);

        // Daily Sales
        const todayOrders = await Order.find({ 
            createdAt: { $gte: today, $lte: endOfDay },
            paymentStatus: "Paid"
        });
        const dailySales = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        // Monthly Sales
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthOrders = await Order.find({ 
            createdAt: { $gte: startOfMonth },
            paymentStatus: "Paid"
        });
        const monthlySales = monthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        // Item Sales Aggregation
        const allOrders = await Order.find({ paymentStatus: "Paid" }).populate("items.menuItem");
        const itemCounts = {};
        allOrders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    const name = item.menuItem?.name || item.name || "Unknown Item";
                    itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
                });
            }
        });
        const topItems = Object.entries(itemCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));



        // Sales Line Chart Data (Last 7 Days)
        const salesChartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const start = new Date(d);
            start.setHours(0,0,0,0);
            const end = new Date(d);
            end.setHours(23,59,59,999);
            
            const dayOrders = await Order.find({
                createdAt: { $gte: start, $lte: end },
                paymentStatus: "Paid"
            });
            const daySales = dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            
            salesChartData.push({
                date: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                sales: daySales,
                orderCount: dayOrders.length
            });
        }

        res.status(200).json({
            dailySales,
            monthlySales,
            totalOrdersToday: todayOrders.length,
            topItems,
            salesChartData
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
