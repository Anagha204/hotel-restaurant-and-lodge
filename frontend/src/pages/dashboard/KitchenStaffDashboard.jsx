import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = `${window.API_BASE_URL}`

    ;

function Card({ title, value, icon }) {
    return (
        <div className="col-md-3">
            <div className="card card-premium p-3 d-flex justify-content-between align-items-center">
                <div>
                    <h6>{title}</h6>
                    <h4>{value}</h4>
                </div>
                {icon && <i className={`bi ${icon} fs-3`}></i>}
            </div>
        </div>
    );
}

export default function KitchenStaffDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pendingOrders: 0,
        preparingOrders: 0,
        completedOrders: 0,
        lowStockItems: 0,
        recentOrders: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch orders (primary)
            const ordersRes = await axios.get(`${BASE_URL}/orders`);

            let orders = ordersRes.data;
            if (orders && !Array.isArray(orders)) {
                orders = orders.data || orders.orders || [];
            }
            if (!Array.isArray(orders)) orders = [];

            // Fetch low stock inventory (optional – gracefully handle 404 or missing endpoint)
            let lowStockCount = 0;
            try {
                const inventoryRes = await axios.get(`${BASE_URL}/inventory/low`);
                let lowStock = inventoryRes.data;
                if (lowStock && !Array.isArray(lowStock)) {
                    lowStock = lowStock.data || lowStock.items || [];
                }
                lowStockCount = Array.isArray(lowStock) ? lowStock.length : 0;
            } catch (inventoryErr) {
                console.warn("Inventory endpoint not available or error:", inventoryErr.message);
                // Keep lowStockCount = 0 (dashboard still works)
            }

            // Count using orderStatus (case‑insensitive)
            const pending = orders.filter(o =>
                o.orderStatus && o.orderStatus.toLowerCase() === "pending"
            ).length;

            const preparing = orders.filter(o =>
                o.orderStatus && o.orderStatus.toLowerCase() === "preparing"
            ).length;

            const completed = orders.filter(o =>
                o.orderStatus && o.orderStatus.toLowerCase() === "completed"
            ).length;

            // Process recent orders (top 5) with readable item names
            const recentOrders = orders.slice(0, 5).map(order => {
                const displayItems = (order.items || []).map(item => {
                    let itemName = "Item";
                    if (item.menuItem) {
                        if (typeof item.menuItem === "object" && item.menuItem.name) {
                            itemName = item.menuItem.name;
                        } else if (typeof item.menuItem === "string") {
                            itemName = `Menu item ${item.menuItem.slice(-4)}`;
                        }
                    } else if (item.name) {
                        itemName = item.name;
                    }
                    return { name: itemName, quantity: item.quantity };
                });

                const orderStatus = order.orderStatus ? order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1).toLowerCase() : "Unknown";
                const statusLower = order.orderStatus ? order.orderStatus.toLowerCase() : "unknown";

                let badgeClass = "secondary";
                if (statusLower === "pending") badgeClass = "warning";
                else if (statusLower === "preparing") badgeClass = "info";
                else if (statusLower === "completed") badgeClass = "success";

                return {
                    ...order,
                    displayItems,
                    orderStatusDisplay: orderStatus,
                    badgeClass,
                    statusLower
                };
            });

            setStats({
                pendingOrders: pending,
                preparingOrders: preparing,
                completedOrders: completed,
                lowStockItems: lowStockCount,
                recentOrders: recentOrders
            });
            setError(null);
        } catch (err) {
            console.error("Error fetching kitchen stats:", err);
            setError("Failed to load dashboard data. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center p-5 text-muted">Loading dashboard...</div>;
    }

    if (error) {
        return (
            <div className="alert alert-danger m-4 d-flex justify-content-between align-items-center">
                <span>{error}</span>
                <button className="btn btn-sm btn-outline-danger" onClick={fetchStats}>
                    Retry
                </button>
            </div>
        );
    }

    const statusColor = (statusLower) =>
        statusLower === "pending" ? "#f8b500" : statusLower === "preparing" ? "#0dcaf0" : "#28a745";

    return (
        <>
            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="page-title text-danger">Kitchen Staff Dashboard</h2>
                    <p className="text-muted d-flex align-items-center gap-2">
                        <i className="bi bi-house-door-fill"></i>
                        <span>Home</span>
                        <i className="bi bi-chevron-right"></i>
                        <i className="bi bi-fire"></i>
                        <span>Kitchen</span>
                    </p>
                </div>
                <button className="btn btn-warning" onClick={() => navigate("/kds")}>
                    <i className="bi bi-fire me-1"></i> Open KDS
                </button>
            </div>

            {/* STATS CARDS */}
            <div className="row">
                <Card title="Pending Orders" value={stats.pendingOrders} icon="bi-hourglass-split" />
                <Card title="Preparing" value={stats.preparingOrders} icon="bi-fire" />
                <Card title="Completed Orders" value={stats.completedOrders} icon="bi-check-circle" />
                <Card title="Low Stock Items" value={stats.lowStockItems} icon="bi-exclamation-triangle" />
            </div>

            {/* RECENT ORDERS + QUICK ACTIONS */}
            <div className="row mt-4">
                <div className="col-md-8">
                    <div className="card card-premium">
                        <div className="card-header bg-danger text-white">
                            <i className="bi bi-receipt me-2"></i>Recent Orders
                        </div>
                        <div className="p-3 d-flex flex-column gap-2">
                            {stats.recentOrders.length > 0 ? (
                                stats.recentOrders.map((order) => (
                                    <div
                                        key={order._id}
                                        className="p-3 rounded shadow-sm d-flex justify-content-between"
                                        style={{ background: "#fff", borderLeft: `5px solid ${statusColor(order.statusLower)}` }}
                                    >
                                        <div className="flex-grow-1">
                                            <h6 className="mb-0">🍔 Order #{order._id.toString().slice(-6).toUpperCase()}</h6>
                                            <small className="text-muted">
                                                {order.orderType || "Dine In"} &nbsp;|&nbsp;
                                                <span className={`badge bg-${order.badgeClass} ms-1`}>
                                                    {order.orderStatusDisplay}
                                                </span>
                                            </small>
                                            <div className="mt-1">
                                                {order.displayItems.map((item, idx) => (
                                                    <small key={idx} className="d-block text-muted">
                                                        • {item.name} × {item.quantity}
                                                    </small>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-end align-self-start">
                                            <small className="text-success fw-bold">₹{order.totalAmount || 0}</small>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-muted text-center py-4">No recent orders</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* QUICK ACTIONS */}
                <div className="col-md-4">
                    <div className="card card-premium">
                        <div className="card-header bg-warning">
                            <i className="bi bi-lightning-charge-fill me-1"></i> Quick Actions
                        </div>
                        <div className="p-3 d-flex flex-column gap-2">
                            <button className="btn btn-warning" onClick={() => navigate("/kds")}>
                                <i className="bi bi-fire me-2"></i>Kitchen Display System (KDS)
                            </button>
                            <button className="btn btn-light" onClick={() => navigate("/orders")}>
                                <i className="bi bi-receipt me-2"></i>View All Orders
                            </button>
                            <button className="btn btn-light" onClick={() => navigate("/menu")}>
                                <i className="bi bi-card-list me-2"></i>View Menu
                            </button>
                            <button className="btn btn-light" onClick={() => navigate("/inventory")}>
                                <i className="bi bi-box-seam me-2"></i>Inventory
                            </button>
                        </div>
                    </div>

                    {/* KITCHEN TIPS */}
                    <div className="card card-premium mt-3">
                        <div className="card-header bg-warning">
                            <i className="bi bi-lightbulb-fill me-1"></i> Kitchen Tips
                        </div>
                        <div className="p-3">
                            <p className="text-muted small mb-2">
                                <strong>🔔 Reminder:</strong> Check the KDS regularly for incoming orders. Mark items as complete so the service team can deliver on time.
                            </p>
                            <p className="text-muted small mb-0">
                                <strong>📦 Stock alert:</strong> You currently have <strong className="text-danger">{stats.lowStockItems}</strong> low‑stock item{stats.lowStockItems !== 1 ? "s" : ""}. Check Inventory before starting your shift.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}