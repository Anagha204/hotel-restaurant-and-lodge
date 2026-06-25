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

export default function CashierDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        checkInToday: 0,
        walkInBookings: 0,
        pendingPayments: 0,
        roomBillingPending: 0,
        recentBookings: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const [ordersRes, bookingsRes] = await Promise.all([
                axios.get(`${BASE_URL}/orders`).catch(() => ({ data: [] })),
                axios.get(`${BASE_URL}/bookings`).catch(() => ({ data: [] }))
            ]);

            const orders = ordersRes.data || [];
            const bookings = bookingsRes.data || [];

            const pending = orders.filter(o => o.paymentStatus === "pending").length;
            const totalRev = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
            const todayCheckIns = bookings.filter(b => b.status === "checked-in").length;
            const walkInCount = bookings.filter(b => b.bookingType === "walk-in").length;

            setStats({
                totalRevenue: totalRev,
                checkInToday: todayCheckIns,
                walkInBookings: walkInCount,
                pendingPayments: pending,
                roomBillingPending: bookings.filter(b => b.billStatus === "pending").length,
                recentBookings: bookings.slice(0, 5)
            });

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
                    <h2 className="page-title text-danger">Cashier Dashboard</h2>
                    <p className="text-muted d-flex align-items-center gap-2">
                        <i className="bi bi-house-door-fill"></i>
                        <span>Home</span>
                        <i className="bi bi-chevron-right"></i>
                        <i className="bi bi-cash-coin"></i>
                        <span>Billing & Payments</span>
                    </p>
                </div>
                <button className="btn btn-warning" onClick={() => navigate("/billing")}>
                    <i className="bi bi-plus-lg"></i> New Billing
                </button>
            </div>

            {/* STATS CARDS - ROW 1 */}
            <div className="row">
                <Card title="Total Revenue Today" value={`₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`} icon="bi-cash-stack" />
                <Card title="Check-ins Today" value={stats.checkInToday || 0} icon="bi-box-arrow-in-right" />
                <Card title="Walk-in Bookings" value={stats.walkInBookings || 0} icon="bi-person-plus" />
                <Card title="Pending Payments" value={stats.pendingPayments || 0} icon="bi-hourglass-split" />
            </div>

            {/* STATS CARDS - ROW 2 */}
            <div className="row mt-3">
                <Card title="Room Billing Pending" value={stats.roomBillingPending || 0} icon="bi-receipt" />
            </div>

            {/* TABLE + QUICK ACTIONS */}
            <div className="row mt-4">
                <div className="col-md-8">
                    <div className="card card-premium">
                        <div className="card-header bg-danger text-white">
                            <i className="bi bi-receipt"></i> Recent Bookings & Check-ins
                        </div>
                        <div className="p-3">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Guest Name</th>
                                            <th>Room</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Billing</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(stats.recentBookings || []).length > 0 ? (
                                            stats.recentBookings.map((booking) => (
                                                <tr key={booking._id}>
                                                    <td className="fw-bold">{booking.guest?.name || "N/A"}</td>
                                                    <td>{booking.room?.roomNumber || "—"}</td>
                                                    <td>
                                                        <small className="badge bg-info">
                                                            {booking.bookingType === "walk-in" ? "Walk-in" : "Booking"}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <span className={`badge bg-${booking.status === "checked-in" ? "success" : "warning"}`}>
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="btn btn-sm btn-outline-warning" onClick={() => navigate("/room-billing")}>
                                                            Bill
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center text-muted py-4">No recent bookings</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QUICK ACTIONS */}
                <div className="col-md-4">
                    <div className="card card-premium">
                        <div className="card-header bg-warning">Quick Actions</div>
                        <div className="p-3 d-flex flex-column gap-2">
                            <button className="btn btn-warning" onClick={() => navigate("/billing")}><i className="bi bi-cash-coin me-2"></i> Process Payment</button>
                            <button className="btn btn-light" onClick={() => navigate("/booking")}><i className="bi bi-calendar-check me-2"></i> Walk-in Booking</button>
                            <button className="btn btn-light" onClick={() => navigate("/checkin")}><i className="bi bi-arrow-left-right me-2"></i> Check-in / Check-out</button>
                            <button className="btn btn-light" onClick={() => navigate("/room-billing")}><i className="bi bi-receipt me-2"></i> Room Billing</button>
                            <button className="btn btn-light" onClick={() => navigate("/combined-billing")}><i className="bi bi-file-earmark-pdf me-2"></i> Combined Billing</button>
                            <button className="btn btn-light" onClick={() => navigate("/id-verification")}><i className="bi bi-person-badge me-2"></i> ID Verification</button>
                            <button className="btn btn-light" onClick={() => navigate("/orders")}><i className="bi bi-basket me-2"></i> Restaurant Orders</button>
                            <button className="btn btn-light" onClick={() => navigate("/guest")}><i className="bi bi-people me-2"></i> Guests</button>
                        </div>
                    </div>

                    {/* DAILY SUMMARY */}
                    <div className="card card-premium mt-3">
                        <div className="card-header bg-warning">Daily Summary</div>
                        <div className="p-3">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Total Revenue:</span>
                                <strong className="text-success">₹{(stats.totalRevenue || 0).toLocaleString("en-IN")}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Check-ins Today:</span>
                                <strong className="text-info">{stats.checkInToday || 0}</strong>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span className="text-muted">Pending Billing:</span>
                                <strong className="text-warning">{stats.pendingPayments || 0}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
