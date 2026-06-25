import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useApp } from "../../context/AppContext";

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

function SectionLabel({ label }) {
    return (
        <div className="col-12 mt-4 mb-1">
            <p className="text-muted fw-semibold mb-1"
                style={{ fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {label}
            </p>
            <hr className="mt-0 mb-2" />
        </div>
    );
}

export default function ManagerDashboard() {
    const navigate = useNavigate();
    const { mode } = useApp();
    const [stats, setStats] = useState({
        // Lodge fields
        totalRevenue: 0,
        occupiedRooms: 0,
        totalRooms: 0,
        checkInsToday: 0,
        pendingVerifications: 0,
        roomsCleaning: 0,
        roomServiceOrders: 0,
        billsPending: 0,
        recentBookings: [],
        // Restaurant fields
        totalSales: 0,
        ordersToday: 0,
        activeTables: 0,
        totalTables: 0,
        pendingOrders: 0,
        kitchenActiveOrders: 0,
        lowStockItems: 0,
        recentOrders: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const [statsRes, lowRes] = await Promise.all([
                axios.get(`${BASE_URL}/dashboard/stats`),
                axios.get(`${BASE_URL}/inventory/low`)
            ]);
            setStats({ ...statsRes.data, lowStockItems: lowRes.data.length });
            setLoading(false);
        } catch (err) {
            console.error("Error:", err);
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center p-5 text-muted">Loading dashboard...</div>;
    }

    return (
        <>
            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="page-title text-danger">Manager Dashboard</h2>
                    <p className="text-muted d-flex align-items-center gap-2">
                        <i className="bi bi-house-door-fill"></i>
                        <span>Home</span>
                        <i className="bi bi-chevron-right"></i>
                        <i className="bi bi-person-badge"></i>
                        <span>Manager Overview</span>
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary" onClick={() => navigate("/users")}>
                        <i className="bi bi-people-fill me-1"></i> View Users
                    </button>
                    {/* DYNAMIC BUTTON based on mode */}
                    {mode === "lodge" ? (
                        <button className="btn btn-warning" onClick={() => navigate("/booking")}>
                            <i className="bi bi-plus-lg me-1"></i> New Booking
                        </button>
                    ) : (
                        <button className="btn btn-warning" onClick={() => navigate("/orders")}>
                            <i className="bi bi-plus-lg me-1"></i> New Order
                        </button>
                    )}
                </div>
            </div>

            {/* CONDITIONAL CONTENT BASED ON MODE */}
            {mode === "lodge" ? (
                <>
                    {/* LODGE STATS */}
                    <div className="row">
                        <Card title="Total Revenue" value={`₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`} icon="bi-cash" />
                        <Card title="Occupied Rooms" value={`${stats.occupiedRooms || 0} / ${stats.totalRooms || 0}`} icon="bi-door-open" />
                        <Card title="Check-ins Today" value={stats.checkInsToday || 0} icon="bi-box-arrow-in-right" />
                        <Card title="Pending Verifications" value={stats.pendingVerifications || 0} icon="bi-shield-exclamation" />
                    </div>
                    <div className="row mt-3">
                        <Card title="Rooms Cleaning" value={stats.roomsCleaning || 0} icon="bi-bucket-fill" />
                        <Card title="Room Service Orders" value={stats.roomServiceOrders || 0} icon="bi-box-seam-fill" />
                        <Card title="Bills Pending" value={stats.billsPending || 0} icon="bi-receipt" />
                    </div>

                    {/* RECENT ACTIVITY + QUICK ACTIONS (LODGE) */}
                    <div className="row mt-4">
                        <div className="col-md-8">
                            <div className="card card-premium">
                                <div className="card-header bg-danger text-white">
                                    <i className="bi bi-clock-history me-2"></i>Recent Bookings
                                </div>
                                <div className="p-3 d-flex flex-column gap-2">
                                    {(stats.recentBookings || []).length > 0 ? (
                                        stats.recentBookings.map((b) => (
                                            <div key={b._id} className="p-3 rounded shadow-sm d-flex justify-content-between"
                                                style={{ background: "#fff", borderLeft: "5px solid red" }}>
                                                <div>
                                                    <h6 className="mb-0">👤 {b.guest?.name || "Guest"}</h6>
                                                    <small className="text-muted">
                                                        🛏 Room {b.room?.roomNumber || "—"} &nbsp;|&nbsp; {b.status}
                                                    </small>
                                                </div>
                                                <div className="text-success fw-bold align-self-center">
                                                    ₹{b.room?.price || 0}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-muted text-center py-3">No recent bookings</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card card-premium">
                                <div className="card-header bg-warning">
                                    <i className="bi bi-lightning-charge-fill me-1"></i> Quick Actions
                                </div>
                                <div className="p-3 d-flex flex-column gap-2">
                                    <button className="btn btn-light" onClick={() => navigate("/room")}>
                                        <i className="bi bi-building me-2"></i>Rooms
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/guest")}>
                                        <i className="bi bi-people me-2"></i>Guests
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/booking")}>
                                        <i className="bi bi-calendar-check me-2"></i>Bookings
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/checkin")}>
                                        <i className="bi bi-arrow-left-right me-2"></i>Check-in / Check-out
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/housekeeping")}>
                                        <i className="bi bi-bucket me-2"></i>Housekeeping
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/room-service")}>
                                        <i className="bi bi-basket me-2"></i>Room Service
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/room-billing")}>
                                        <i className="bi bi-receipt me-2"></i>Room Billing
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/amenity")}>
                                        <i className="bi bi-gift me-2"></i>Amenity Management
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/room_avail")}>
                                        <i className="bi bi-calendar2-week me-2"></i>Room Availability
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                // RESTAURANT MODE
                <>
                    {/* RESTAURANT STATS */}
                    <div className="row">
                        <Card title="Total Sales" value={`₹${(stats.totalSales || 0).toLocaleString("en-IN")}`} icon="bi-cash-stack" />
                        <Card title="Orders Today" value={stats.ordersToday || 0} icon="bi-basket" />
                        <Card title="Active Tables" value={`${stats.activeTables || 0} / ${stats.totalTables || 0}`} icon="bi-grid" />
                        <Card title="Pending Orders" value={stats.pendingOrders || 0} icon="bi-hourglass" />
                    </div>
                    <div className="row mt-3">
                        <Card title="Kitchen Active Orders" value={stats.kitchenActiveOrders || 0} icon="bi-fire" />
                        <Card title="Low Stock Items" value={stats.lowStockItems || 0} icon="bi-exclamation-triangle" />
                    </div>

                    {/* RECENT ACTIVITY + QUICK ACTIONS (RESTAURANT) */}
                    <div className="row mt-4">
                        <div className="col-md-8">
                            <div className="card card-premium">
                                <div className="card-header bg-danger text-white">
                                    <i className="bi bi-receipt me-2"></i>Recent Restaurant Orders
                                </div>
                                <div className="p-3 d-flex flex-column gap-2">
                                    {(stats.recentOrders || []).length > 0 ? (
                                        stats.recentOrders.map((o) => (
                                            <div key={o._id} className="p-3 rounded shadow-sm d-flex justify-content-between"
                                                style={{ background: "#fff", borderLeft: "5px solid #007bff" }}>
                                                <div>
                                                    <h6 className="mb-0">🍔 Order #{o._id.toString().slice(-6).toUpperCase()}</h6>
                                                    <small className="text-muted">
                                                        {o.orderType} &nbsp;|&nbsp; {o.status} &nbsp;|&nbsp; {o.paymentStatus}
                                                    </small>
                                                </div>
                                                <div className="text-success fw-bold align-self-center">
                                                    ₹{o.totalAmount || 0}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-muted text-center py-3">No recent orders</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card card-premium">
                                <div className="card-header bg-warning">
                                    <i className="bi bi-lightning-charge-fill me-1"></i> Quick Actions
                                </div>
                                <div className="p-3 d-flex flex-column gap-2">
                                    <button className="btn btn-light" onClick={() => navigate("/tables")}>
                                        <i className="bi bi-table me-2"></i>Tables
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/menu")}>
                                        <i className="bi bi-card-list me-2"></i>Menu
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/orders")}>
                                        <i className="bi bi-receipt me-2"></i>Orders
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/kds")}>
                                        <i className="bi bi-fire me-2"></i>KDS
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/billing")}>
                                        <i className="bi bi-cash-coin me-2"></i>Billing
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/inventory")}>
                                        <i className="bi bi-box-seam me-2"></i>Inventory
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/supplier")}>
                                        <i className="bi bi-truck me-2"></i>Supplier
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/purchase")}>
                                        <i className="bi bi-cart me-2"></i>Purchase
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/reservation")}>
                                        <i className="bi bi-calendar-check me-2"></i>Reservation
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/customers")}>
                                        <i className="bi bi-people me-2"></i>Customers
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/deliveries")}>
                                        <i className="bi bi-bicycle me-2"></i>Delivery
                                    </button>
                                    <button className="btn btn-light" onClick={() => navigate("/restaurant-reports")}>
                                        <i className="bi bi-bar-chart me-2"></i>Reports
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}