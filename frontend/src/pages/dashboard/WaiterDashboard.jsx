import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = `${window.API_BASE_URL}`

    ;

function Card({ title, value, icon, subtitle }) {
    return (
        <div className="col-md-3">
            <div className="card card-premium p-3 d-flex justify-content-between align-items-center">
                <div>
                    <h6>{title}</h6>
                    <h4>{value}</h4>
                    {subtitle && <small className="text-muted">{subtitle}</small>}
                </div>
                {icon && <i className={`bi ${icon} fs-3`}></i>}
            </div>
        </div>
    );
}

export default function WaiterDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pendingOrders: 0,
        readyForServing: 0,
        activeTables: 0,
        totalTables: 0,
        topFoodItem: { name: "—", count: 0 },
        recentOrders: [],
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
            const [ordersRes, tablesRes] = await Promise.all([
                axios.get(`${BASE_URL}/orders`),
                axios.get(`${BASE_URL}/tables`),
            ]);

            // Extract orders array
            let orders = ordersRes.data;
            if (orders && !Array.isArray(orders)) {
                orders = orders.data || orders.orders || [];
            }
            if (!Array.isArray(orders)) orders = [];

            // Extract tables array
            let tables = tablesRes.data;
            if (tables && !Array.isArray(tables)) {
                tables = tables.data || tables.tables || [];
            }
            if (!Array.isArray(tables)) tables = [];

            // 1. Count pending orders (orderStatus === 'Pending')
            const pending = orders.filter(o =>
                o.orderStatus && o.orderStatus.toLowerCase() === "pending"
            ).length;

            // 2. Count ready orders (orderStatus === 'Ready')
            const ready = orders.filter(o =>
                o.orderStatus && o.orderStatus.toLowerCase() === "ready"
            ).length;

            // 3. Active tables (status === 'Occupied')
            const active = tables.filter(t => t.status && t.status.toLowerCase() === "occupied").length;

            // 4. Compute highest ordered food item
            const itemCount = new Map(); // key: item name, value: total quantity
            orders.forEach(order => {
                (order.items || []).forEach(item => {
                    let itemName = "Unknown Item";
                    // Try to extract name from menuItem object or direct name field
                    if (item.menuItem) {
                        if (typeof item.menuItem === "object" && item.menuItem.name) {
                            itemName = item.menuItem.name;
                        } else if (typeof item.menuItem === "string") {
                            // If only ID, we can't get name – skip or use ID as fallback
                            itemName = item.menuItem.slice(-6);
                        }
                    } else if (item.name) {
                        itemName = item.name;
                    }
                    const quantity = item.quantity || 1;
                    const current = itemCount.get(itemName) || 0;
                    itemCount.set(itemName, current + quantity);
                });
            });

            let topItem = { name: "—", count: 0 };
            for (let [name, count] of itemCount.entries()) {
                if (count > topItem.count) {
                    topItem = { name, count };
                }
            }

            // 5. Prepare recent orders (top 5)
            const recentOrders = orders.slice(0, 5).map(order => {
                let displayTable = "N/A";
                if (order.table) {
                    if (typeof order.table === "object" && order.table.tableNumber) {
                        displayTable = order.table.tableNumber;
                    } else if (typeof order.table === "object" && order.table.number) {
                        displayTable = order.table.number;
                    } else if (typeof order.table === "string") {
                        displayTable = `Table ID: ${order.table.slice(-4)}`;
                    }
                }
                if (displayTable === "N/A" && order.roomNumber) {
                    displayTable = `Room ${order.roomNumber}`;
                }

                const displayItems = (order.items || []).map(item => {
                    let itemName = "Item";
                    if (item.menuItem) {
                        if (typeof item.menuItem === "object" && item.menuItem.name) {
                            itemName = item.menuItem.name;
                        } else if (typeof item.menuItem === "string") {
                            itemName = `Item ${item.menuItem.slice(-4)}`;
                        }
                    } else if (item.name) {
                        itemName = item.name;
                    }
                    return { name: itemName, quantity: item.quantity };
                });

                const statusLower = order.orderStatus ? order.orderStatus.toLowerCase() : "unknown";
                let badgeClass = "secondary";
                if (statusLower === "pending") badgeClass = "warning";
                else if (statusLower === "ready") badgeClass = "success";
                else if (statusLower === "completed") badgeClass = "info";
                else if (statusLower === "preparing") badgeClass = "primary";

                return {
                    ...order,
                    displayTable,
                    displayItems,
                    statusLower,
                    badgeClass,
                };
            });

            setStats({
                pendingOrders: pending,
                readyForServing: ready,
                activeTables: active,
                totalTables: tables.length,
                topFoodItem: topItem,
                recentOrders: recentOrders,
            });
            setError(null);
        } catch (err) {
            console.error("API Error:", err);
            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to load data. Is the backend running on port 5000?"
            );
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

    return (
        <>
            {/* HEADER – no lodge switch */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="page-title text-danger">Waiter Dashboard</h2>
                    <p className="text-muted d-flex align-items-center gap-2">
                        <i className="bi bi-house-door-fill"></i>
                        <span>Home</span>
                        <i className="bi bi-chevron-right"></i>
                        <i className="bi bi-people-fill"></i>
                        <span>Service</span>
                    </p>
                </div>
                <button className="btn btn-warning" onClick={() => navigate("/orders")}>
                    <i className="bi bi-plus-lg"></i> New Order
                </button>
            </div>

            {/* STATS CARDS */}
            <div className="row">
                <Card title="Pending Orders" value={stats.pendingOrders} icon="bi-hourglass-split" />
                <Card title="Ready for Serving" value={stats.readyForServing} icon="bi-check-circle" />
                <Card
                    title="Active Tables"
                    value={`${stats.activeTables} / ${stats.totalTables}`}
                    icon="bi-table"
                />
                <Card
                    title="Bestseller"
                    value={stats.topFoodItem.name}
                    // subtitle={`Ordered ${stats.topFoodItem.count} times`}
                    icon="bi-cup-straw"
                />
            </div>

            {/* RECENT ORDERS + QUICK ACTIONS */}
            <div className="row mt-4">
                <div className="col-md-8">
                    <div className="card card-premium">
                        <div className="card-header bg-danger text-white">
                            <i className="bi bi-receipt"></i> Recent Orders
                        </div>
                        <div className="p-3 d-flex flex-column gap-2">
                            {stats.recentOrders.length > 0 ? (
                                stats.recentOrders.map((order) => (
                                    <div
                                        key={order._id}
                                        className="p-3 rounded shadow-sm d-flex justify-content-between align-items-start"
                                        style={{
                                            background: "#fff",
                                            borderLeft: `5px solid ${order.statusLower === "ready" ? "#28a745" :
                                                order.statusLower === "pending" ? "#f8b500" : "#007bff"
                                                }`,
                                        }}
                                    >
                                        <div className="flex-grow-1">
                                            <h6>🍽 Order #{order._id.toString().slice(-6).toUpperCase()}</h6>
                                            <small className="text-muted">
                                                {order.displayTable} |{" "}
                                                <span className={`badge bg-${order.badgeClass}`}>
                                                    {order.orderStatus || "Unknown"}
                                                </span>
                                            </small>
                                            <div className="mt-2">
                                                {order.displayItems.map((item, idx) => (
                                                    <small key={idx} className="d-block">
                                                        • {item.name} x {item.quantity}
                                                    </small>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-end">
                                            <small className="text-success fw-bold d-block">₹{order.totalAmount || 0}</small>
                                            <button
                                                className="btn btn-sm btn-outline-warning mt-2"
                                                onClick={() => navigate(`/orders?edit=${order._id}`)}
                                            >
                                                {order.statusLower === "ready" ? "Serve" : "View"}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-muted text-center py-4">No recent orders found.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* QUICK ACTIONS – no lodge buttons */}
                <div className="col-md-4">
                    <div className="card card-premium">
                        <div className="card-header bg-warning">Quick Actions</div>
                        <div className="p-3 d-flex flex-column gap-2">
                            <button className="btn btn-light" onClick={() => navigate("/tables")}>
                                <i className="bi bi-table me-2"></i> Table Status
                            </button>
                            <button className="btn btn-light" onClick={() => navigate("/menu")}>
                                <i className="bi bi-card-list me-2"></i> View Menu
                            </button>
                            <button className="btn btn-light" onClick={() => navigate("/orders")}>
                                <i className="bi bi-receipt me-2"></i> Take Order
                            </button>
                            <button className="btn btn-light" onClick={() => navigate("/room-service")}>
                                <i className="bi bi-basket me-2"></i> Room Service
                            </button>
                            <button className="btn btn-light" onClick={() => navigate("/customers")}>
                                <i className="bi bi-people me-2"></i> Customers
                            </button>
                            <button className="btn btn-light" onClick={() => navigate("/reservation")}>
                                <i className="bi bi-calendar-check me-2"></i> Reservations
                            </button>
                            <button className="btn btn-light" onClick={() => navigate("/kds")}>
                                <i className="bi bi-fire me-2"></i> Kitchen Display
                            </button>
                        </div>
                    </div>

                    {/* SERVICE TIPS */}
                    <div className="card card-premium mt-3">
                        <div className="card-header bg-warning">Service Tips</div>
                        <div className="p-3">
                            <p className="text-muted small mb-2">
                                <strong>🔔 Reminder:</strong> Check orders marked as "Ready" and deliver promptly.
                            </p>
                            <p className="text-muted small mb-0">
                                <strong>💡 Note:</strong> Always confirm special requests with the kitchen.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}