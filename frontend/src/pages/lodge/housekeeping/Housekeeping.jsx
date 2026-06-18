import axios from "axios";
import { useEffect, useState } from "react";
import { FaTable, FaThLarge } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// Reusable styles
const STATUS_STYLES = {
    Dirty: { background: "#FFEBEE", color: "#C62828" },
    Cleaning: { background: "#FFF8E1", color: "#F9A825" },
    Clean: { background: "#E8F5E9", color: "#2E7D32" },
    Maintenance: { background: "#ECEFF1", color: "#546E7A" },
};

const delBtn = {
    background: "#FFEBEE",
    border: "1px solid #EF9A9A",
    color: "#C62828",
    borderRadius: "8px",
    padding: "5px 14px",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
};

const primaryBtn = {
    background: "linear-gradient(135deg, #007bff, #0056b3)",
    border: "none",
    borderRadius: "8px",
    padding: "8px 20px",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "white",
    cursor: "pointer",
};

function Chip({ label, active, onClick, style }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "6px 18px",
                borderRadius: "40px",
                border: "1px solid",
                borderColor: active ? "#C62828" : "#ddd",
                background: active ? "#C62828" : "white",
                color: active ? "white" : "#333",
                fontWeight: active ? 600 : 400,
                fontSize: "0.8rem",
                cursor: "pointer",
                ...(active ? {} : style)
            }}
        >
            {label}
        </button>
    );
}

export default function Housekeeping() {
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [layout, setLayout] = useState("table");

    const [newTask, setNewTask] = useState({
        room: "",
        staff: "",
        status: "Dirty"
    });

    const [tasks, setTasks] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [availableRoomsForDropdown, setAvailableRoomsForDropdown] = useState([]);

    const fetchTasks = async () => {
        const res = await axios.get("http://localhost:5000/api/housekeeping");
        setTasks(res.data);
    };

    const fetchAllRooms = async () => {
        const res = await axios.get("http://localhost:5000/api/room");
        setAllRooms(res.data);
    };

    useEffect(() => {
        fetchTasks();
        fetchAllRooms();
    }, []);

    useEffect(() => {
        const nonOccupied = allRooms.filter(r => r.status !== "Occupied");
        setAvailableRoomsForDropdown(nonOccupied);
    }, [allRooms]);

    const mapToRoomStatus = (hkStatus) => {
        switch (hkStatus) {
            case "Clean": return "Available";
            case "Cleaning": return "Cleaning";
            case "Maintenance": return "Maintenance";
            case "Dirty": return "Dirty";
            default: return "Available";
        }
    };

    const getRunningTime = (start) => {
        if (!start) return "-";

        const diff = (new Date() - new Date(start)) / 1000;
        const mins = Math.floor(diff / 60);
        const secs = Math.floor(diff % 60);

        return `${mins}m ${secs}s`;
    };

    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(async () => {
            for (let t of tasks) {
                if (t.status === "Cleaning" && t.startedAt) {

                    const diff = (new Date() - new Date(t.startedAt)) / 1000; // seconds

                    if (diff >= 10) {
                        // auto mark clean after 10 sec
                        await updateStatus(t._id, "Clean");
                    }
                }
            }
        }, 3000); // check every 3 seconds

        return () => clearInterval(interval);
    }, [tasks]);

    const updateStatus = async (taskId, newHKStatus) => {
        const task = tasks.find(t => t._id === taskId);
        if (!task) return;

        let updateData = { status: newHKStatus };

        // ✅ AUTO ASSIGN WILLIAM WHEN DIRTY (checkout case)
        if (newHKStatus === "Dirty") {
            updateData.staff = "William";
        }

        // ✅ START TIMER
        if (newHKStatus === "Cleaning") {
            updateData.startedAt = new Date();
            updateData.completedAt = null;
        }

        // ✅ STOP TIMER
        if (newHKStatus === "Clean") {
            updateData.completedAt = new Date();
            toast.success(`Room ${task.room} is ready`);
        }

        try {
            // ✅ 1. UPDATE HOUSEKEEPING
            await axios.put(
                `http://localhost:5000/api/housekeeping/${taskId}`,
                updateData
            );

            // ✅ 2. 🔥 UPDATE ROOM STATUS (ADDED FIX)
            const roomObj = allRooms.find(r => r.roomNumber == task.room);

            if (roomObj) {
                const newRoomStatus = mapToRoomStatus(newHKStatus);

                await axios.put(
                    `http://localhost:5000/api/room/${roomObj._id}`,
                    { status: newRoomStatus }
                );
            }

            // ✅ 3. UPDATE UI INSTANTLY
            setTasks(prev =>
                prev.map(t =>
                    t._id === taskId ? { ...t, ...updateData } : t
                )
            );

            // ✅ 4. REFRESH DATA
            await fetchTasks();

        } catch (err) {
            console.error("Update failed:", err);
        }
    };


    const updateStaff = async (taskId, newStaff) => {
        try {
            await axios.put(
                `http://localhost:5000/api/housekeeping/${taskId}`,
                { staff: newStaff }
            );

            // update UI instantly
            setTasks(prev =>
                prev.map(t =>
                    t._id === taskId ? { ...t, staff: newStaff } : t
                )
            );

        } catch (err) {
            console.error("Staff update failed:", err);
        }
    };
    useEffect(() => {
        const handleCheckoutDirty = async () => {
            for (let room of allRooms) {
                if (room.status === "Available") {

                    const existingTask = tasks.find(t => t.room == room.roomNumber);

                    if (!existingTask) {
                        // create new dirty task with William
                        await axios.post("http://localhost:5000/api/housekeeping", {
                            room: room.roomNumber,
                            status: "Dirty",
                            staff: "William"
                        });
                    } else if (existingTask.status !== "Dirty") {
                        // update existing task
                        await updateStatus(existingTask._id, "Dirty");
                    }
                }
            }

            fetchTasks();
        };

        if (allRooms.length > 0) {
            handleCheckoutDirty();
        }

    }, [allRooms]);

    const getDuration = (start, end) => {
        if (!start || !end) return "-";

        const diff = (new Date(end) - new Date(start)) / 1000;

        const mins = Math.floor(diff / 60);
        const secs = Math.floor(diff % 60);

        return `${mins}m ${secs}s`;
    };

    const addTask = async () => {
        if (!newTask.room || !newTask.staff) {
            alert("Fill all fields");
            return;
        }

        await axios.post("http://localhost:5000/api/housekeeping", newTask);

        const roomObj = allRooms.find(r => r.roomNumber == newTask.room);
        if (roomObj) {
            const newRoomStatus = mapToRoomStatus(newTask.status);
            await axios.put(`http://localhost:5000/api/room/${roomObj._id}`, { status: newRoomStatus });
        }

        await fetchTasks();
        setShowForm(false);
        setNewTask({ room: "", staff: "", status: "Dirty" });
    };

    const handleDelete = async (id) => {
        await axios.delete(`http://localhost:5000/api/housekeeping/${id}`);
        fetchTasks();
    };

    const filteredTasks = tasks.filter(t => {
        if (statusFilter !== "All" && t.status !== statusFilter) return false;
        if (search && !t.room.toString().includes(search)) return false;
        return true;
    });

    return (

        <div className="container py-4">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">🧹 Housekeeping Management</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                        Manage room cleaning status and staff assignments
                    </p>
                </div>
                <button className="btn btn-warning" onClick={() => setShowForm(true)}>+ Assign</button>
            </div>
            {showForm && (
                <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="modal-dialog">
                        <div className="modal-content p-3">

                            <h5>Assign Task</h5>

                            <select
                                className="form-control mb-2"
                                value={newTask.room}
                                onChange={(e) => setNewTask({ ...newTask, room: e.target.value })}
                            >
                                <option value="">Select Room</option>
                                {availableRoomsForDropdown.map(r => (
                                    <option key={r._id} value={r.roomNumber}>
                                        Room {r.roomNumber}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="form-control mb-2"
                                value={newTask.staff}
                                onChange={(e) => setNewTask({ ...newTask, staff: e.target.value })}
                            >
                                <option value="">Select Staff</option>
                                <option value="Vinisha">Vinisha</option>
                                <option value="Roy">Roy</option>
                                <option value="James">James</option>
                                <option value="Alice">Alice</option>
                                <option value="William">William</option>
                            </select>

                            <select
                                className="form-control mb-3"
                                value={newTask.status}
                                onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                            >
                                <option>Dirty</option>
                                <option>Cleaning</option>
                                <option>Clean</option>
                                <option>Maintenance</option>
                            </select>

                            <div className="d-flex justify-content-end gap-2">
                                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={addTask}>Assign</button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Filters + Layout */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">

                <div className="d-flex flex-wrap gap-2 mb-4">
                    <Chip
                        label={`All (${tasks.length})`}
                        active={statusFilter === "All"}
                        onClick={() => setStatusFilter("All")}
                    />

                    {Object.entries(STATUS_STYLES).map(([status, style]) => {
                        const count = tasks.filter(t => t.status === status).length;

                        return (
                            <Chip
                                key={status}
                                label={`${status} (${count})`}   // ✅ THIS LINE IMPORTANT
                                active={statusFilter === status}
                                onClick={() => setStatusFilter(status)}
                                style={style}
                            />
                        );
                    })}
                </div>

                {/* Layout Toggle */}
                <div className="d-flex gap-2">
                    <button onClick={() => setLayout("table")} style={primaryBtn}><FaTable /></button>
                    <button onClick={() => setLayout("grid")} style={primaryBtn}><FaThLarge /></button>
                </div>

            </div>

            {/* Search */}
            <input
                className="form-control mb-4"
                placeholder="Search room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {/* VIEW SWITCH */}
            {layout === "table" ? (

                <div className="table-responsive">
                    <table className="table table-sm mb-0">
                        <thead>
                            <tr>
                                <th style={{ backgroundColor: "#8B0000", color: "white" }}>Room</th>
                                <th style={{ backgroundColor: "#8B0000", color: "white" }}>Staff</th>
                                <th style={{ backgroundColor: "#8B0000", color: "white" }}>Status</th>
                                <th style={{ backgroundColor: "#8B0000", color: "white" }}>Update</th>
                                <th style={{ backgroundColor: "#8B0000", color: "white" }}>Action</th>
                                <th style={{ backgroundColor: "#8B0000", color: "white" }}>Time Taken</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.map(t => (
                                <tr key={t._id}>
                                    <td>{t.room}</td>
                                    <td>
                                        <select
                                            className="form-select form-select-sm"
                                            value={t.staff}
                                            onChange={(e) => updateStaff(t._id, e.target.value)}
                                        >
                                            <option>Vinisha</option>
                                            <option>Roy</option>
                                            <option>James</option>
                                            <option>Alice</option>
                                            <option>William</option>
                                        </select>
                                    </td>
                                    <td>{t.status}</td>

                                    <td>
                                        <select
                                            className="form-select form-select-sm"
                                            value={t.status}
                                            onChange={(e) => updateStatus(t._id, e.target.value)}
                                        >
                                            <option>Dirty</option>
                                            <option>Cleaning</option>
                                            <option>Clean</option>
                                            <option>Maintenance</option>
                                        </select>
                                    </td>
                                    <td>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t._id)}>Delete</button>
                                    </td>
                                    <td>
                                        {t.status === "Cleaning" && t.startedAt ? (
                                            <>
                                                <div
                                                    style={{
                                                        height: "6px",
                                                        background: "#eee",
                                                        borderRadius: "5px",
                                                        overflow: "hidden"
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${Math.min(((Date.now() - new Date(t.startedAt)) / 1000) * 2, 100)}%`,
                                                            height: "100%",
                                                            background: "#28a745",
                                                            borderRadius: "5px",
                                                            transition: "width 1s linear"
                                                        }}
                                                    />
                                                </div>

                                                <small style={{ color: "#007bff", fontWeight: "bold" }}>
                                                    {getRunningTime(t.startedAt)}
                                                </small>
                                            </>
                                        ) : (
                                            <span>
                                                {getDuration(t.startedAt, t.completedAt)}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            ) : (

                <div className="row">
                    {filteredTasks.map(t => (
                        <div className="col-md-4 mb-3" key={t._id}>
                            <div
                                className="card shadow-sm border-0 rounded-4 h-100 p-3"
                                style={{
                                    background: STATUS_STYLES[t.status]?.background || "#fff",
                                    borderLeft: `5px solid ${STATUS_STYLES[t.status]?.color || "#000"}`,
                                    transition: "all 0.2s ease"
                                }}
                            >
                                <h5
                                    className="fw-bold mb-1"
                                    style={{ color: STATUS_STYLES[t.status]?.color }}
                                >
                                    Room {t.room}
                                </h5>
                                <select
                                    className="form-control mb-2"
                                    value={t.staff}
                                    onChange={(e) => updateStaff(t._id, e.target.value)}
                                >
                                    <option>Vinisha</option>
                                    <option>Roy</option>
                                    <option>James</option>
                                    <option>Alice</option>
                                    <option>William</option>
                                </select>
                                <p>Status: {t.status}</p>
                                <p>
                                    ⏱️{" "}
                                    {t.status === "Cleaning"
                                        ? getRunningTime(t.startedAt)
                                        : getDuration(t.startedAt, t.completedAt)}
                                </p>

                                <select
                                    className="form-control mb-2"
                                    value={t.status}
                                    onChange={(e) => updateStatus(t._id, e.target.value)}
                                >
                                    <option>Dirty</option>
                                    <option>Cleaning</option>
                                    <option>Clean</option>
                                    <option>Maintenance</option>
                                </select>

                                <button style={delBtn} onClick={() => handleDelete(t._id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>

            )}

        </div>
    );
}