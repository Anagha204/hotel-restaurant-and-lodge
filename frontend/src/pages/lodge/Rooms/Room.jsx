import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const BASE_URL = `${window.API_BASE_URL}`

    ;

const EMPTY_ROOM = {
    roomNumber: "",
    type: "",
    price: "",
    capacity: "",
    amenities: "",
    status: "Available",
};

const STATUS_STYLES = {
    Available: { background: "#ecf4ed", color: "#2E7D32" },
    Occupied: { background: "#f8e6e9", color: "#C62828" },
    Reserved: { background: "#fcf8eb", color: "#fea30f" },
    Cleaning: { background: "#e3e8eb", color: "#24376e" },
    Maintenance: { background: "#fcedec", color: "#BF360C" },
};

const mapToHKStatus = (roomStatus) => {
    switch (roomStatus) {
        case "Available": return "Clean";
        case "Cleaning": return "Cleaning";
        case "Maintenance": return "Maintenance";
        case "Occupied": return "Dirty";
        case "Reserved": return "Clean";
        default: return "Dirty";
    }
};

// Computes numeric floor from room number (e.g., 101 → 1, 202 → 2)
const getNumericFloor = (roomNumber) => {
    const num = parseInt(roomNumber, 10);
    if (isNaN(num)) return 0;
    return Math.floor(num / 100);
};

// Converts numeric floor to a readable name for UI grouping
const getFloorDisplayName = (floorNum) => {
    switch (floorNum) {
        case 0: return "Ground Floor";
        case 1: return "First Floor";
        case 2: return "Second Floor";
        case 3: return "Third Floor";
        case 4: return "Fourth Floor";
        case 5: return "Fifth Floor";
        case 6: return "Sixth Floor";
        case 7: return "Seventh Floor";
        default: return floorNum > 0 ? `${floorNum}th Floor` : "Other";
    }
};

export default function Rooms() {
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [housekeepingTasks, setHousekeepingTasks] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("grid");

    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_ROOM);
    const [loading, setLoading] = useState(false);

    const fetchRooms = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/room`);
            setRooms(res.data);
        } catch {
            Swal.fire("Error", "Failed to load rooms", "error");
        }
    };

    const fetchHousekeeping = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/housekeeping`);
            setHousekeepingTasks(res.data);
        } catch {
            console.error("Failed to load housekeeping tasks");
        }
    };

    useEffect(() => {
        fetchRooms();
        fetchHousekeeping();
    }, []);

    useEffect(() => {
        let result = [...rooms];
        if (statusFilter !== "All") {
            result = result.filter(room => room.status === statusFilter);
        }
        if (searchTerm.trim() !== "") {
            const term = searchTerm.toLowerCase();
            result = result.filter(room =>
                room.roomNumber.toLowerCase().includes(term) ||
                room.type.toLowerCase().includes(term) ||
                (room.amenities && room.amenities.toLowerCase().includes(term))
            );
        }
        setFilteredRooms(result);
    }, [rooms, statusFilter, searchTerm]);

    const syncRoomStatusToHousekeeping = async (roomNumber, newRoomStatus) => {
        const task = housekeepingTasks.find(t => t.room == roomNumber);
        if (task) {
            const newHKStatus = mapToHKStatus(newRoomStatus);
            if (task.status !== newHKStatus) {
                try {
                    await axios.put(`${BASE_URL}/housekeeping/${task._id}`, { status: newHKStatus });
                    await fetchHousekeeping();
                } catch (err) {
                    console.error("Failed to sync housekeeping task", err);
                }
            }
        } else {
            if (newRoomStatus !== "Available") {
                try {
                    await axios.post(`${BASE_URL}/housekeeping`, {
                        room: roomNumber,
                        staff: "Auto-assigned",
                        status: mapToHKStatus(newRoomStatus)
                    });
                    await fetchHousekeeping();
                } catch (err) {
                    console.error("Failed to create housekeeping task", err);
                }
            }
        }
    };

    const openAddModal = () => {
        setForm(EMPTY_ROOM);
        setEditId(null);
        setShowModal(true);
    };

    const openEditModal = (room) => {
        setForm({
            roomNumber: room.roomNumber,
            type: room.type,
            price: room.price,
            capacity: room.capacity,
            amenities: room.amenities || "",
            status: room.status,
        });
        setEditId(room._id);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditId(null);
    };

    const handleSave = async () => {
        const { roomNumber, type, price, capacity, status } = form;
        if (!roomNumber || !type || !price || !capacity) {
            Swal.fire("Missing", "Please fill all required fields", "warning");
            return;
        }

        // Compute numeric floor (e.g., 101 → 1, 202 → 2)
        const floor = getNumericFloor(roomNumber);

        setLoading(true);
        try {
            const payload = {
                roomNumber,
                type,
                floor,            // send number
                price,
                capacity,
                amenities: form.amenities,
                status,
            };

            if (editId) {
                const oldRoom = rooms.find(r => r._id === editId);
                await axios.put(`${BASE_URL}/room/${editId}`, payload);
                if (oldRoom && oldRoom.status !== status) {
                    await syncRoomStatusToHousekeeping(roomNumber, status);
                }
                Swal.fire("Updated", "Room updated successfully", "success");
            } else {
                await axios.post(`${BASE_URL}/room`, payload);
                await syncRoomStatusToHousekeeping(roomNumber, status);
                Swal.fire("Added", "New room added", "success");
            }
            closeModal();
            await fetchRooms();
            await fetchHousekeeping();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", err.response?.data?.message || "Failed to save room", "error");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete this room?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete"
        });
        if (result.isConfirmed) {
            try {
                await axios.delete(`${BASE_URL}/room/${id}`);
                Swal.fire("Deleted!", "Room has been deleted.", "success");
                await fetchRooms();
                await fetchHousekeeping();
            } catch {
                Swal.fire("Error", "Failed to delete room", "error");
            }
        }
    };

    const getStatusBadge = (status) => {
        const base = "badge ";
        switch (status) {
            case "Available": return base + "bg-success";
            case "Occupied": return base + "bg-danger";
            case "Reserved": return base + "bg-warning text-dark";
            case "Cleaning": return base + "bg-info text-dark";
            case "Maintenance": return base + "bg-secondary";
            default: return base + "bg-light text-dark";
        }
    };

    const counts = {
        All: rooms.length,
        Available: rooms.filter(r => r.status === "Available").length,
        Occupied: rooms.filter(r => r.status === "Occupied").length,
        Reserved: rooms.filter(r => r.status === "Reserved").length,
        Cleaning: rooms.filter(r => r.status === "Cleaning").length,
        Maintenance: rooms.filter(r => r.status === "Maintenance").length,
    };

    // Group filtered rooms by display name (based on numeric floor derived from room number)
    const groupedRooms = filteredRooms.reduce((acc, room) => {
        const numericFloor = getNumericFloor(room.roomNumber);
        const floorKey = getFloorDisplayName(numericFloor);
        if (!acc[floorKey]) acc[floorKey] = [];
        acc[floorKey].push(room);
        return acc;
    }, {});

    const floorOrder = ["Ground Floor", "First Floor", "Second Floor", "Third Floor", "Fourth Floor", "Fifth Floor", "Sixth Floor", "Seventh Floor"];
    const sortedFloors = Object.keys(groupedRooms).sort((a, b) => {
        const idxA = floorOrder.indexOf(a);
        const idxB = floorOrder.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    return (
        <div className="container-fluid p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">🛏️ Room Management</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        {filteredRooms.length} of {rooms.length} room{rooms.length !== 1 ? "s" : ""} displayed
                    </p>
                </div>
                <button className="btn btn-warning" onClick={openAddModal}>
                    + Add New Room
                </button>
            </div>

            {/* Filter + Search + Toggle Buttons */}
            <div className="card shadow-sm p-3 mb-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3">
                    <div className="flex-grow-1">
                        <div className="d-flex flex-wrap gap-1 mb-3">
                            <button
                                onClick={() => setStatusFilter("All")}
                                className={`btn btn-sm rounded-pill ${statusFilter === "All" ? "btn-dark" : "btn-outline-secondary"}`}
                                style={{ fontSize: "0.8rem" }}
                            >
                                All ({counts.All})
                            </button>
                            {Object.entries(STATUS_STYLES).map(([status, style]) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    style={{
                                        fontSize: "0.8rem",
                                        padding: "6px 18px",
                                        borderRadius: "40px",
                                        border: statusFilter === status ? "2px solid #333" : "1px solid #ddd",
                                        background: style.background,
                                        color: style.color,
                                        fontWeight: statusFilter === status ? 600 : 400,
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {status} ({counts[status]})
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="🔍 Search by room number, type, or amenities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="d-flex gap-1 align-self-md-stretch">
                        <button
                            className={`btn ${viewMode === "grid" ? "text-danger" : "text-dark"}`}
                            onClick={() => setViewMode("grid")}
                            title="Grid View"
                        >
                            <i className="bi bi-grid-3x3-gap-fill" style={{ transform: "scale(2.5)", display: "inline-block" }}></i>
                        </button>
                        <button
                            className={`btn ${viewMode === "table" ? "text-danger" : "text-dark"}`}
                            onClick={() => setViewMode("table")}
                            title="Table View"
                        >
                            <i className="bi bi-table" style={{ transform: "scale(2.5)", display: "inline-block" }}></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid View with floor grouping (by display name) */}
            {viewMode === "grid" ? (
                <div>
                    {filteredRooms.length === 0 && (
                        <div className="text-center text-muted py-5">No rooms match the current filters.</div>
                    )}
                    {sortedFloors.map(floorName => (
                        <div key={floorName} className="mb-5" style={{ backgroundColor: "white", borderRadius: "5px" }}>
                            <p className="mb-3 pb-2 border-bottom bg-danger fw-bold" style={{ color: "white", padding: "5px", borderTopLeftRadius: "5px", borderTopRightRadius: "5px" }}>
                                {floorName}
                            </p>
                            <div className="row g-4" style={{ padding: "20px" }}>
                                {groupedRooms[floorName].map(room => {
                                    const statusStyle = STATUS_STYLES[room.status] || STATUS_STYLES.Available;
                                    const cardBg = statusStyle.background + "40";
                                    return (
                                        <div className="col-sm-6 col-md-4 col-lg-3" key={room._id}>
                                            <div
                                                className="card h-100 shadow-sm"
                                                style={{
                                                    backgroundColor: cardBg,
                                                    borderLeft: `6px solid ${statusStyle.color}`,
                                                    borderTop: "none",
                                                    borderRight: "none",
                                                    borderBottom: "none",
                                                }}
                                            >
                                                <div
                                                    className="card-header fw-bold"
                                                    style={{
                                                        backgroundColor: statusStyle.background,
                                                        color: statusStyle.color,
                                                        borderBottom: `1px solid ${statusStyle.color}20`,
                                                    }}
                                                >
                                                    Room {room.roomNumber}
                                                </div>
                                                <div className="card-body" style={{
                                                    backgroundColor: statusStyle.background,

                                                    borderBottom: `1px solid ${statusStyle.color}20`,
                                                }}>
                                                    <p className="mb-1"><strong>Type:</strong> {room.type}</p>
                                                    <p className="mb-1"><strong>Price:</strong> ₹{room.price}</p>
                                                    <p className="mb-1"><strong>Capacity:</strong> {room.capacity}</p>
                                                </div>
                                                <div className="card-footer d-flex gap-2" style={{
                                                    backgroundColor: statusStyle.background,

                                                    borderBottom: `1px solid ${statusStyle.color}20`,
                                                }}>
                                                    <button
                                                        className="btn btn-sm btn-warning flex-grow-1"
                                                        onClick={() => openEditModal(room)}
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => confirmDelete(room._id)}
                                                    >
                                                        🗑
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // Table View (we show the numeric floor stored in DB, but you could also show display name)
                <div className="card shadow">
                    <div className="card-header bg-danger text-white">All Rooms</div>
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Room No</th>
                                    <th>Type</th>
                                    <th>Price / Night</th>
                                    <th>Capacity</th>
                                    <th>Amenities</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRooms.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center text-muted py-4">
                                            No rooms match the current filter.
                                        </td>
                                    </tr>
                                )}
                                {filteredRooms.map(room => (
                                    <tr key={room._id}>
                                        <td className="fw-bold">{room.roomNumber}</td>
                                        <td>{room.type}</td>
                                        <td className="fw-bold text-danger">₹{room.price}</td>
                                        <td>{room.capacity}</td>
                                        <td className="text-truncate" style={{ maxWidth: "160px" }}>
                                            {room.amenities || "—"}
                                        </td>
                                        <td>
                                            <span className={getStatusBadge(room.status)}>
                                                {room.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-warning me-2"
                                                onClick={() => openEditModal(room)}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => confirmDelete(room._id)}
                                            >
                                                🗑
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal (no floor input – computed automatically) */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">
                                    {editId ? "✏️ Edit Room" : "➕ Add New Room"}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Room Number *</label>
                                        <input
                                            className="form-control"
                                            placeholder="e.g. 101"
                                            value={form.roomNumber}
                                            onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Room Type *</label>
                                        <div className="d-flex gap-2">
                                            <input
                                                list="roomTypeList"
                                                className="form-control"
                                                placeholder="Select or type new type"
                                                value={form.type}
                                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                                                style={{ flex: 1 }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary"
                                                onClick={async () => {
                                                    const { value: newType } = await Swal.fire({
                                                        title: "Add New Room Type",
                                                        input: "text",
                                                        inputPlaceholder: "e.g. Presidential Suite",
                                                        showCancelButton: true,
                                                        confirmButtonText: "Add",
                                                        cancelButtonText: "Cancel",
                                                        inputValidator: (value) => {
                                                            if (!value) return "Please enter a room type.";
                                                            return null;
                                                        }
                                                    });
                                                    if (newType) {
                                                        setForm({ ...form, type: newType.trim() });
                                                        Swal.fire("Added", `"${newType.trim()}" added.`, "success");
                                                    }
                                                }}
                                                style={{ whiteSpace: "nowrap" }}
                                            >
                                                + Add Type
                                            </button>
                                        </div>
                                        <datalist id="roomTypeList">
                                            {[...new Set(rooms.map(r => r.type).filter(t => t))].map(type => (
                                                <option key={type} value={type} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Price per Night (₹) *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="0"
                                            value={form.price}
                                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Capacity (persons) *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="1"
                                            value={form.capacity}
                                            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        >
                                            {["Available", "Occupied", "Reserved", "Cleaning", "Maintenance"].map(s => (
                                                <option key={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Amenities</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            placeholder="e.g. AC, TV, WiFi, Hot Water, Minibar"
                                            value={form.amenities}
                                            onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button className="btn btn-danger" onClick={handleSave} disabled={loading}>
                                    {loading ? "Saving…" : editId ? "Update Room" : "Save Room"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}