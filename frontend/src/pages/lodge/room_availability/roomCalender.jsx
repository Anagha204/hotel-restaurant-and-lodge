import axios from "axios";
import { useEffect, useState } from "react";

const STATUS_STYLES = {
    Available: { background: "#E8F5E9", color: "#2E7D32" },
    Occupied: { background: "#FFEBEE", color: "#C62828" },
    Reserved: { background: "#FFF8E1", color: "#F9A825" },
    Cleaning: { background: "#E3F2FD", color: "#1565C0" },
    Maintenance: { background: "#F3E5F5", color: "#6A1B9A" }
};

function getStatusStyle(status) {
    return STATUS_STYLES[status] || { background: "#ECEFF1", color: "#546E7A" };
}

export default function RoomCalendar() {
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState("All");

    useEffect(() => {
        fetchRooms();
        fetchBookings();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/room");
            setRooms(res.data);
        } catch (err) {
            console.error("Error fetching rooms:", err);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/booking");
            setBookings(res.data);
        } catch (err) {
            console.error("Error fetching bookings:", err);
        }
    };

    const updateRoomStatus = async (roomId, newStatus) => {
        try {
            await axios.put(`http://localhost:5000/api/room/${roomId}`, { status: newStatus });
            fetchRooms(); // Refresh the DB status
        } catch (err) {
            console.error("Error updating room status:", err);
            alert("Failed to update status");
        }
    };

    // Removing getStatusForRoom and getActiveBooking because we are now relying entirely on DB room.status


    // Compute status for every room once based purely on DB status
    const roomsWithStatus = rooms.map((room) => ({
        ...room,
        computedStatus: room.status || "Available",
    }));

    // Count per status for filter chips
    const statusCounts = roomsWithStatus.reduce((acc, r) => {
        acc[r.computedStatus] = (acc[r.computedStatus] || 0) + 1;
        return acc;
    }, {});

    const filtered =
        filterStatus === "All"
            ? roomsWithStatus
            : roomsWithStatus.filter((r) => r.computedStatus === filterStatus);

    return (
        <div className="container-fluid px-3 px-md-4 py-4">
            {/* ── Header ── */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">📅 Room Availability </h3>
                    <p
                        className="text-muted mb-0"
                        style={{ fontSize: "0.85rem", marginTop: "4px" }}
                    >
                        Auto‑calculated from active bookings •{" "}
                        {rooms.length} room{rooms.length !== 1 ? "s" : ""}
                    </p>
                </div>

                {/* Date Picker — styled like the "+ New Booking" area */}
                <div style={{ minWidth: "220px" }}>
                    <label className="text-muted fw-bold mb-1 d-block" style={{ fontSize: "0.82rem" }}>
                        Date
                    </label>
                    <input
                        type="date"
                        className="form-control"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{ borderRadius: "8px", border: "1px solid #ced4da" }}
                    />
                </div>
            </div>

            {/* ── Status Filter Chips (mirrors Bookings.jsx) ── */}
            <div className="d-flex flex-wrap gap-2 mb-4">
                {["All", ...Object.keys(STATUS_STYLES)].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        style={{
                            padding: "6px 18px",
                            borderRadius: "40px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "none",
                            background:
                                filterStatus === s
                                    ? "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)"
                                    : "#F0F2F5",
                            color: filterStatus === s ? "white" : "var(--text-muted)",
                        }}
                    >
                        {s}{" "}
                        {s !== "All" && `(${statusCounts[s] || 0})`}
                    </button>
                ))}
            </div>

            {/* ── Loading / Empty states ── */}
            {loading && <div className="text-center py-3">Loading...</div>}

            {rooms.length === 0 ? (
                <div className="card-premium shadow-sm border-0 p-4 text-center text-muted">
                    No rooms found. Please add rooms in the Room Management module.
                </div>
            ) : filtered.length === 0 ? (
                <div className="card-premium shadow-sm border-0 p-4 text-center text-muted">
                    No rooms match the selected filter.
                </div>
            ) : (
                /* ── Room Grid ── */
                <div className="row g-4">
                    {filtered.map((room) => {
                        const status = room.computedStatus;
                        const style = getStatusStyle(status);

                        return (
                            <div className="col-md-4 col-lg-3" key={room._id}>
                                <div className="card-premium shadow-sm border-0 h-100">
                                    {/* Card header — mirrors Bookings table header gradient */}
                                    <div
                                        className="card-header-gradient d-flex justify-content-between align-items-center"
                                        style={{
                                            background: "#C62828",
                                            borderBottom: `3px solid ${style.color}`,
                                            padding: "0.75rem 1rem",
                                        }}
                                    >
                                        {/* Avatar initial — mirrors guest avatar in Bookings */}
                                        <div className="d-flex align-items-center gap-2">
                                            <div
                                                style={{
                                                    width: "36px",
                                                    height: "36px",
                                                    borderRadius: "50%",
                                                    background:
                                                        "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
                                                    color: "white",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontWeight: 700,
                                                    fontSize: "0.85rem",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {room.roomNumber}
                                            </div>
                                            {/* <strong style={{ fontSize: "1rem" }}>
                                                Room {room.roomNumber}
                                            </strong> */}
                                        </div>

                                        {/* Status dropdown — manual updation */}
                                        <select
                                            value={status}
                                            onChange={(e) => updateRoomStatus(room._id, e.target.value)}
                                            style={{
                                                ...style,
                                                padding: "4px 24px 4px 12px",
                                                borderRadius: "40px",
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                border: `1px solid ${style.color}`,
                                                appearance: "none",
                                                cursor: "pointer",
                                                outline: "none",
                                                backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="%23${style.color.replace('#','')}" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>')`,
                                                backgroundRepeat: "no-repeat",
                                                backgroundPosition: "right 4px center"
                                            }}
                                        >
                                            <option value="Available">Available</option>
                                            <option value="Occupied">Occupied</option>
                                            <option value="Reserved">Reserved</option>
                                            <option value="Cleaning">Cleaning</option>
                                            <option value="Maintenance">Maintenance</option>
                                        </select>
                                    </div>

                                    {/* Card body */}
                                    <div className="card-body p-3">
                                        <div className="mb-3">
                                            <small className="text-muted">Type</small>
                                            <div className="fw-bold">{room.type}</div>
                                        </div>
                                        <div className="mb-3">
                                            <small className="text-muted">Floor</small>
                                            <div className="fw-bold">{room.floor ?? "—"}</div>
                                        </div>
                                        <div className="mb-3">
                                            <small className="text-muted">Base Price / Night</small>
                                            {/* Matches the red amount styling in Bookings */}
                                            <div
                                                className="fw-bold"
                                                style={{ color: "var(--red, #C62828)" }}
                                            >
                                                ₹{room.price}
                                            </div>
                                        </div>

                                        {/* Booking type chip removed as we now strictly rely on DB status */}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
