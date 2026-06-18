import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";

const BASE_URL = "http://localhost:5000/api";

const EMPTY = {
    name: "",
    email: "",
    password: "",
    role: "waiter",
    isActive: true,
};

export default function UserManagement() {
    const { user, token } = useAuth();
    const isAdmin = user?.role === "admin";

    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [logs, setLogs] = useState([]);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/users`, { headers });
            setUsers(res.data);
        } catch {
            setError("Failed to load users.");
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/activity`, { headers });
            setLogs(res.data);
        } catch {
            // Ignore errors for logs
        }
    };

    useEffect(() => { fetchUsers(); fetchLogs(); }, []);

    const openAdd = () => { setForm(EMPTY); setEditId(null); setError(""); setShowModal(true); };
    const openEdit = (u) => {
        setForm({
            name: u.name,
            email: u.email,
            role: u.role,
            isActive: u.isActive,
            password: "",
        });
        setEditId(u._id);
        setError("");
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setEditId(null); setError(""); };

    const setField = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
    const setCheckbox = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.checked }));

    const handleSave = async () => {
        if (!form.name || !form.email) {
            setError("Name and email are required.");
            return;
        }
        if (!editId && !form.password) {
            setError("Password is required for new user.");
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(form.email)) {
            setError("Enter a valid email address.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            if (editId) {
                await axios.put(`${BASE_URL}/users/${editId}`, {
                    name: form.name,
                    email: form.email,
                    role: form.role,
                    isActive: form.isActive,
                }, { headers });
                Swal.fire("Updated", "User updated successfully", "success");
            } else {
                await axios.post(`${BASE_URL}/users`, {
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    role: form.role,
                }, { headers });
                Swal.fire("Created", "User created successfully", "success");
            }
            closeModal();
            fetchUsers();
            fetchLogs();
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to save user.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (userData) => {
        const { value: newPassword } = await Swal.fire({
            title: `Reset password for ${userData.name}`,
            input: "password",
            inputPlaceholder: "Enter new password",
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) return "Password is required";
                if (value.length < 4) return "Password must be at least 4 characters";
            }
        });
        if (newPassword) {
            try {
                await axios.post(`${BASE_URL}/users/${userData._id}/reset-password`, { newPassword }, { headers });
                Swal.fire("Success", "Password has been reset", "success");
                fetchLogs();
            } catch (err) {
                Swal.fire("Error", err.response?.data?.message || "Failed to reset password", "error");
            }
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`${BASE_URL}/users/${deleteId}`, { headers });
            setDeleteId(null);
            fetchUsers();
            fetchLogs();
            Swal.fire("Deleted", "User deleted successfully", "success");
        } catch (err) {
            Swal.fire("Error", err.response?.data?.message || "Failed to delete", "error");
        }
    };

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="container-fluid px-3 px-md-4 py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0 text-dark">👥 User Management</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        {users.length} user{users.length !== 1 ? "s" : ""} registered
                    </p>
                </div>
                {isAdmin && (
                    <button className="btn btn-warning" onClick={openAdd}>
                        + Add User
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    className="form-control"
                    style={{ maxWidth: "360px", width: "100%" }}
                    placeholder="🔍 Search by name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Users Table - same UI as TablesPage */}
            <div className="card shadow-sm border-0">
                <div className="card-header bg-danger text-white">
                    <p className="mb-0 fw-bold">All Users</p>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>No</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                {isAdmin && <th>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="text-center text-muted py-5">
                                        {search ? "No users match." : "No users yet. Click + Add User."}
                                    </td>
                                </tr>
                            )}
                            {filtered.map((u, i) => (
                                <tr key={u._id}>
                                    <td className="text-muted">{i + 1}</td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <div style={{
                                                width: "36px", height: "36px", borderRadius: "50%",
                                                background: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
                                                color: "white", display: "flex", alignItems: "center",
                                                justifyContent: "center", fontWeight: 700,
                                            }}>
                                                {u.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                                        </div>
                                    </td>
                                    <td>{u.email}</td>
                                    <td>
                                        <span className="badge bg-secondary">{u.role}</span>
                                    </td>
                                    <td>
                                        {u.isActive ? (
                                            <span className="badge bg-success">Active</span>
                                        ) : (
                                            <span className="badge bg-danger">Disabled</span>
                                        )}
                                    </td>
                                    {isAdmin && (
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button onClick={() => openEdit(u)} className="btn btn-sm btn-warning">✏️</button>
                                                <button onClick={() => handleResetPassword(u)} className="btn btn-sm btn-primary">🔐</button>
                                                <button onClick={() => setDeleteId(u._id)} className="btn btn-sm btn-danger">🗑️</button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal - matching TablesPage modal style */}
            {showModal && isAdmin && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title fw-bold mb-0">{editId ? "✏️ Edit User" : "➕ Add New User"}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body p-4 bg-white">
                                {error && <div className="alert alert-danger mb-3">{error}</div>}
                                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Full Name <span className="text-danger">*</span></label>
                                            <input className="form-control" required value={form.name} onChange={setField("name")} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Email <span className="text-danger">*</span></label>
                                            <input className="form-control" type="email" required value={form.email} onChange={setField("email")} />
                                        </div>
                                        {!editId && (
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold">Password <span className="text-danger">*</span></label>
                                                <input className="form-control" type="password" required value={form.password} onChange={setField("password")} />
                                            </div>
                                        )}
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Role</label>
                                            <select className="form-select" value={form.role} onChange={setField("role")}>
                                                <option value="admin">Admin</option>
                                                <option value="manager">Manager</option>
                                                <option value="cashier">Cashier</option>
                                                <option value="waiter">Waiter</option>
                                                <option value="kitchen">Kitchen</option>
                                            </select>
                                        </div>
                                        {editId && (
                                            <div className="col-md-6">
                                                <div className="form-check mt-4">
                                                    <input className="form-check-input" type="checkbox" checked={form.isActive} onChange={setCheckbox("isActive")} />
                                                    <label className="form-check-label">Active</label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer border-0 pt-3 pb-0 px-0 mt-3">
                                        <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                        <button type="submit" className="btn btn-warning" disabled={loading}>
                                            {loading ? "Saving…" : editId ? "Update" : "Create"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && isAdmin && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "420px" }}>
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-body text-center p-4">
                                <div style={{ fontSize: "2.8rem", marginBottom: "12px" }}>🗑️</div>
                                <h4 className="mb-2">Delete this user?</h4>
                                <p className="text-muted mb-4">This action cannot be undone.</p>
                                <div className="d-flex gap-2 justify-content-center">
                                    <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
                                    <button className="btn btn-danger" onClick={handleDelete}>Yes, Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Logs - using same card style as TablesPage */}
            <div className="card shadow-sm border-0 mt-4">
                <div className="card-header bg-danger text-white">
                    <p className="mb-0 fw-bold">📋 Activity Logs</p>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Time</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center text-muted py-5">No activity logs yet.</td>
                                </tr>
                            )}
                            {logs.slice(0, 20).map((log) => (
                                <tr key={log._id}>
                                    <td className="text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td>{log.user?.name || "Unknown"} ({log.user?.email || ""})</td>
                                    <td><span className="badge bg-info">{log.action}</span></td>
                                    <td>{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}