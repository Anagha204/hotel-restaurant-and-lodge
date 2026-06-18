import { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export default function Dashboard() {
  const { mode } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    roomsCleaning: 0,
    roomServiceOrders: 0,
    occupiedRooms: 0,
    totalRooms: 0,
    billsPending: 0,
    checkInsToday: 0,
    pendingVerifications: 0,
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
      const [statsRes, lowRes] = await Promise.all([
        axios.get(`${BASE_URL}/dashboard/stats`),
        axios.get(`${BASE_URL}/inventory/low`)
      ]);

      setStats({
        ...statsRes.data,
        lowStockItems: lowRes.data.length // 🔥 FORCE CORRECT VALUE
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
          <h2 className="page-title text-danger">Admin Dashboard</h2>
          <p className="text-muted d-flex align-items-center gap-2">
            <i className="bi bi-house-door-fill"></i>
            <span>Home</span>
            <i className="bi bi-chevron-right"></i>
            <i className="bi bi-building"></i>
            <span>
              {mode === "lodge" ? "Lodge Dashboard" : "Restaurant Dashboard"}
            </span>
          </p>
        </div>

        {/* DYNAMIC BUTTON BASED ON MODE */}
        {mode === "lodge" ? (
          <button className="btn btn-warning" onClick={() => navigate("/booking")}>
            + New Booking
          </button>
        ) : (
          <button className="btn btn-warning" onClick={() => navigate("/orders")}>
            + New Order
          </button>
        )}
      </div>

      {/* CARDS - FIRST ROW */}
      <div className="row">
        {mode === "lodge" ? (
          <>
            <Card
              title="Total Revenue"
              value={`₹${(stats.totalRevenue || 0).toLocaleString("en-IN")}`}
              icon="bi-cash"
            />
            <Card
              title="Occupied Rooms"
              value={`${stats.occupiedRooms || 0} / ${stats.totalRooms || 0}`}
              icon="bi-door-open"
            />
            <Card title="Check-ins Today" value={stats.checkInsToday || 0} icon="bi-box-arrow-in-right" />
            <Card title="Pending Verifications" value={stats.pendingVerifications || 0} icon="bi-shield-exclamation" />
          </>
        ) : (
          <>
            <Card title="Total Sales" value={`₹${(stats.totalSales || 0).toLocaleString("en-IN")}`} icon="bi-cash-stack" />
            <Card title="Orders Today" value={stats.ordersToday || 0} icon="bi-basket" />
            <Card title="Active Tables" value={`${stats.activeTables || 0} / ${stats.totalTables || 0}`} icon="bi-grid" />
            <Card title="Pending Orders" value={stats.pendingOrders || 0} icon="bi-hourglass" />
          </>
        )}
      </div>

      {/* CARDS - SECOND ROW */}
      <div className="row mt-3">
        {mode === "lodge" ? (
          <>
            <Card title="Rooms Cleaning" value={stats.roomsCleaning || 0} icon="bi-bucket-fill" />
            <Card title="Room Service Orders" value={stats.roomServiceOrders || 0} icon="bi-box-seam-fill" />
            <Card title="Bills Pending" value={stats.billsPending || 0} icon="bi-receipt" />
          </>
        ) : (
          <>
            <Card title="Kitchen Active Orders" value={stats.kitchenActiveOrders || 0} icon="bi-fire" />
            <Card title="Low Stock Items" value={stats.lowStockItems || 0} icon="bi-exclamation-triangle" />
          </>
        )}
      </div>

      {/* TABLE + QUICK ACTIONS */}
      <div className="row mt-4">
        <div className="col-md-8">
          <div className="card card-premium">
            <div className="card-header bg-danger text-white">
              {mode === "lodge" ? "Recent Activities" : "Recent Orders"}
            </div>

            <div className="p-3 d-flex flex-column gap-2">

              {mode === "lodge" ? (
                (stats.recentBookings || []).length > 0 ? (
                  stats.recentBookings.map((b) => (
                    <div
                      key={b._id}
                      className="p-3 rounded shadow-sm d-flex justify-content-between"
                      style={{ background: "#fff", borderLeft: "5px solid red" }}
                    >
                      <div>
                        <h6>👤 {b.guest?.name || "Guest"}</h6>
                        <small>
                          🛏 Room {b.room?.roomNumber || "—"} | {b.status}
                        </small>
                      </div>

                      <div className="text-success fw-bold">
                        ₹{b.room?.price || 0}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted text-center py-4">
                    No recent bookings
                  </div>
                )
              ) : (
                (stats.recentOrders || []).length > 0 ? (
                  stats.recentOrders.map((o) => (
                    <div
                      key={o._id}
                      className="p-3 rounded shadow-sm d-flex justify-content-between"
                      style={{ background: "#fff", borderLeft: "5px solid #007bff" }}
                    >
                      <div>
                        <h6>🍔 Order #{o._id.toString().slice(-6).toUpperCase()}</h6>
                        <small className="text-muted">
                          {o.orderType} | {o.status} | {o.paymentStatus}
                        </small>
                      </div>
                      <div className="text-success fw-bold">
                        ₹{o.totalAmount || 0}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted text-center py-4">
                    No recent orders
                  </div>
                )
              )}

            </div>
          </div>
        </div>

        {/* RIGHT QUICK ACTIONS */}
        <div className="col-md-4">
          <div className="card card-premium">
            <div className="card-header bg-warning">Quick Actions</div>
            <div className="p-3 d-flex flex-column gap-2">
              {mode === "lodge" ? (
                <>

                  <button className="btn btn-light" onClick={() => navigate("/room")}>
                    <i className="bi bi-building"></i> Rooms
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/guest")}>
                    <i className="bi bi-people"></i>  Guest
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/booking")}>
                    <i className="bi bi-calendar-check"></i> Bookings
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/checkin")}>
                    <i className="bi bi-arrow-left-right"></i> Checkin_Checkout
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/housekeeping")}>
                    <i className="bi bi-bucket me-2"></i> HouseKeeping
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/room-service")}>
                    <i className="bi bi-basket me-2"></i> Room Service
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/room-billing")}>
                    <i className="bi bi-receipt me-2"></i> Room Billing
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/amenity")}>
                    <i className="bi bi-gift me-2"></i> Amenity Management
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/room_avail")}>
                    <i className="bi bi-calendar-check me-2"></i> Room Availability
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-light" onClick={() => navigate("/tables")}>
                    <i className="bi bi-table"></i> Tables
                  </button>
                  {/* <button className="btn btn-light" onClick={() => navigate("/floor")}>
                    <i className="bi bi-grid-3x3-gap-fill"></i>  Floor Layout
                  </button> */}
                  <button className="btn btn-light" onClick={() => navigate("/menu")}>
                    <i className="bi bi-card-list"></i> Menu
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/orders")}>
                    <i className="bi bi-receipt"></i> Orders
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/kds")}>
                    <i className="bi bi-fork-knife"></i>  KDS
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/billing")}>
                    <i className="bi bi-receipt"></i> Billing
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/inventory")}>
                    <i className="bi bi-box-seam"></i> Inventory
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/supplier")}>
                    <i className="bi bi-truck"></i> Supplier
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/purchase")}>
                    <i className="bi bi-cart"></i> Purchase
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/reservation")}>
                    <i className="bi bi-calendar-check"></i> Reservation
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/customers")}>
                    <i className="bi bi-people"></i> Customers
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/deliveries")}>
                    <i className="bi bi-bicycle"></i> Delivery
                  </button>
                  <button className="btn btn-light" onClick={() => navigate("/restaurant-reports")}>
                    <i className="bi bi-bar-chart"></i> Reports
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* CARD COMPONENT - YOUR EXACT STYLE */
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