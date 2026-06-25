import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const BASE_URL = `${window.API_BASE_URL}`

    ;

const EMPTY_TABLE = {
    tableNumber: "",
    capacity: "",
    section: "Non AC",
    status: "Available",
};

const STATUS_STYLES = {
    Available: { background: "#E8F5E9", color: "#2E7D32" },
    Occupied: { background: "#FFEBEE", color: "#C62828" },
    Reserved: { background: "#FFF8E1", color: "#F9A825" },
    Cleaning: { background: "#ECEFF1", color: "#546E7A" },
};

// TableCard – now includes a status badge exactly like the table view
function TableCard({ table, onEdit, onDelete }) {
    const statusStyle = STATUS_STYLES[table.status] || STATUS_STYLES.Available;

    return (
        <div
            className="card h-100 shadow-sm"
            style={{
                backgroundColor: statusStyle.background,
                border: `1px solid ${statusStyle.color}`,
                borderRadius: 16,
                transition: "transform 0.2s",
                cursor: "pointer",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
            <div className="card-body text-center">
                <div style={{ fontSize: 40 }}>🍽️</div>
                <h5 className="card-title mb-1">Table {table.tableNumber}</h5>
                <p className="card-text small mb-1">👥 Capacity: {table.capacity}</p>
                <p className="card-text small mb-2">{table.section}</p>
                {/* Status badge – same as table column */}
                {/* <span
                    className="badge"
                    style={{
                        backgroundColor: statusStyle.color,
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: "0.7rem",
                        fontWeight: 500,
                    }}
                >
                    {table.status}
                </span> */}
                <div className="d-flex gap-2 justify-content-center mt-3">
                    <button
                        className="btn btn-sm btn-warning"
                        onClick={() => onEdit(table)}
                    >
                        ✏️Edit
                    </button>
                    <button
                        className="btn btn-sm btn-danger"
                        onClick={() => onDelete(table._id)}
                    >
                        🗑
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TablesPage() {
    const [tables, setTables] = useState([]);
    const [filteredTables, setFilteredTables] = useState([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState("grid");

    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY_TABLE);
    const [loading, setLoading] = useState(false);

    const fetchTables = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/tables`);
            setTables(res.data);
        } catch {
            Swal.fire("Error", "Failed to load tables", "error");
        }
    };

    useEffect(() => {
        fetchTables();
    }, []);

    useEffect(() => {
        let result = [...tables];
        if (statusFilter !== "All") {
            result = result.filter(table => table.status === statusFilter);
        }
        if (searchTerm.trim() !== "") {
            const term = searchTerm.toLowerCase();
            result = result.filter(table =>
                table.tableNumber.toString().includes(term) ||
                table.capacity.toString().includes(term) ||
                table.section.toLowerCase().includes(term)
            );
        }
        setFilteredTables(result);
    }, [tables, statusFilter, searchTerm]);

    const openAddModal = () => {
        setForm(EMPTY_TABLE);
        setEditId(null);
        setShowModal(true);
    };

    const openEditModal = (table) => {
        setForm({
            tableNumber: table.tableNumber,
            capacity: table.capacity,
            section: table.section,
            status: table.status,
        });
        setEditId(table._id);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditId(null);
    };

    const setField = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const handleSave = async () => {
        const { tableNumber, capacity, section } = form;
        if (!tableNumber || !capacity || !section) {
            Swal.fire("Missing", "Please fill all required fields", "warning");
            return;
        }

        setLoading(true);
        try {
            if (editId) {
                await axios.put(`${BASE_URL}/tables/${editId}`, form);
                Swal.fire("Updated", "Table updated successfully", "success");
            } else {
                await axios.post(`${BASE_URL}/tables`, form);
                Swal.fire("Added", "New table added successfully", "success");
            }
            closeModal();
            await fetchTables();
        } catch (err) {
            Swal.fire("Error", err.response?.data?.message || "Failed to save table", "error");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete this table?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete"
        });
        if (result.isConfirmed) {
            try {
                await axios.delete(`${BASE_URL}/tables/${id}`);
                Swal.fire("Deleted!", "Table has been deleted.", "success");
                await fetchTables();
            } catch {
                Swal.fire("Error", "Failed to delete table", "error");
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
            default: return base + "bg-light text-dark";
        }
    };

    const counts = {
        All: tables.length,
        Available: tables.filter(t => t.status === "Available").length,
        Occupied: tables.filter(t => t.status === "Occupied").length,
        Reserved: tables.filter(t => t.status === "Reserved").length,
        Cleaning: tables.filter(t => t.status === "Cleaning").length,
    };

    const sections = ["AC", "Non AC", "Outdoor"];

    const groupedTables = sections.reduce((acc, section) => {
        acc[section] = filteredTables.filter(t => t.section === section);
        return acc;
    }, {});

    return (
        <div className="container-fluid p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">🍽️ Table Management</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        {filteredTables.length} of {tables.length} table{tables.length !== 1 ? "s" : ""} displayed
                    </p>
                </div>
                <button className="btn btn-warning" onClick={openAddModal}>
                    + Add New Table
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
                            placeholder="🔍 Search by table number, capacity or section..."
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

            {/* View: Grid or Table */}
            {viewMode === "grid" ? (
                <div>
                    {filteredTables.length === 0 && (
                        <div className="text-center text-muted py-5">
                            No tables match the current filters.
                        </div>
                    )}
                    {sections.map(section => {
                        const sectionTables = groupedTables[section];
                        if (sectionTables.length === 0) return null;
                        return (
                            <div key={section} className="mb-5" style={{ backgroundColor: "white", borderRadius: "5px" }}>
                                <p
                                    className="mb-3 border-bottom bg-danger fw-bold"
                                    style={{ color: "white", padding: "10px", borderTopLeftRadius: "5px", borderTopRightRadius: "5px" }}
                                >
                                    {section} Section
                                </p>
                                <div className="row g-4" style={{ padding: "20px" }}>
                                    {sectionTables.map(table => (
                                        <div className="col-sm-6 col-md-4 col-lg-3" key={table._id}>
                                            <TableCard
                                                table={table}
                                                onEdit={openEditModal}
                                                onDelete={confirmDelete}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card shadow">
                    <div className="card-header bg-danger text-white">
                        All Tables
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>Table No.</th>
                                    <th>Capacity</th>
                                    <th>Section</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTables.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted py-4">
                                            No tables match the current filter.
                                        </td>
                                    </tr>
                                )}
                                {filteredTables.map((table) => (
                                    <tr key={table._id}>
                                        <td className="fw-bold">{table.tableNumber}</td>
                                        <td>{table.capacity}</td>
                                        <td>{table.section}</td>
                                        <td>
                                            <span className={getStatusBadge(table.status)}>
                                                {table.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-sm btn-warning"
                                                    onClick={() => openEditModal(table)}
                                                >
                                                    ✏️Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => confirmDelete(table._id)}
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">
                                    {editId ? "✏️ Edit Table" : "➕ Add New Table"}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Table Number *</label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            min="1"
                                            placeholder="e.g. 5"
                                            value={form.tableNumber}
                                            onChange={setField("tableNumber")}
                                            disabled={!!editId}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Capacity *</label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            min="1"
                                            placeholder="e.g. 4"
                                            value={form.capacity}
                                            onChange={setField("capacity")}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Section *</label>
                                        <select
                                            className="form-select"
                                            value={form.section}
                                            onChange={setField("section")}
                                        >
                                            <option value="AC">AC</option>
                                            <option value="Non AC">Non AC</option>
                                            <option value="Outdoor">Outdoor</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            value={form.status}
                                            onChange={setField("status")}
                                        >
                                            {Object.keys(STATUS_STYLES).map(s => (
                                                <option key={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button className="btn btn-danger" onClick={handleSave} disabled={loading}>
                                    {loading ? "Saving…" : editId ? "Update Table" : "Save Table"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}