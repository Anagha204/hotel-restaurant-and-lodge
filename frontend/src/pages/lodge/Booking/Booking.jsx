import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const BASE_URL = `${window.API_BASE_URL}`

    ;

const EMPTY = {
    guestId: "",
    roomType: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
    numberOfGuests: 1,
    status: "Confirmed",
    notes: "",
    billingMode: "nightly",      // "nightly" or "fixed"
    fixedTotalAmount: 0,
};

const STATUS_STYLES = {
    Confirmed: { background: "#E8F5E9", color: "#2E7D32" },
    Pending: { background: "#FFF8E1", color: "#F9A825" },
    Cancelled: { background: "#FFEBEE", color: "#C62828" },
    "Checked-In": { background: "#E3F2FD", color: "#1565C0" },
    "Checked-Out": { background: "#ECEFF1", color: "#546E7A" },
};

// ── Generic Searchable Select ─────────────────────────────────────────────
function SearchableSelect({ options, value, onChange, placeholder = "Search…", renderOption, renderSelected, getKey, getLabel }) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    const selectedOption = options.find((o) => getKey(o) === value);

    const filtered = query.trim()
        ? options.filter((o) => getLabel(o).toLowerCase().includes(query.toLowerCase()))
        : options;

    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
                if (!value) setQuery("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [value]);

    const selectOption = (opt) => {
        onChange(getKey(opt));
        setQuery("");
        setOpen(false);
    };

    const clearSelection = () => {
        onChange("");
        setQuery("");
        inputRef.current?.focus();
        setOpen(true);
    };

    const handleKeyDown = (e) => {
        if (!open) { setOpen(true); return; }
        if (e.key === "ArrowDown") setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
        if (e.key === "ArrowUp") setHighlighted((h) => Math.max(h - 1, 0));
        if (e.key === "Enter" && filtered[highlighted]) selectOption(filtered[highlighted]);
        if (e.key === "Escape") setOpen(false);
    };

    const highlightText = (text = "", q = "") => {
        if (!q.trim()) return text;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark style={{ background: "#FFF0F0", color: "#C62828", padding: 0, borderRadius: "2px" }}>
                    {text.slice(idx, idx + q.length)}
                </mark>
                {text.slice(idx + q.length)}
            </>
        );
    };

    return (
        <div ref={wrapperRef} style={{ position: "relative" }}>
            <div
                className={`form-control ${open ? "border-danger" : ""}`}
                style={{ display: "flex", alignItems: "center", padding: "0.375rem 0.75rem", cursor: "text", minHeight: "38px" }}
                onClick={() => inputRef.current?.focus()}
            >
                <span style={{ color: "#aaa", marginRight: "8px", fontSize: "0.85rem" }}>🔍</span>
                {selectedOption && !open ? (
                    <div style={{ flex: 1, fontSize: "0.88rem", fontWeight: 500 }}>
                        {renderSelected ? renderSelected(selectedOption) : getLabel(selectedOption)}
                    </div>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={options.length === 0 ? "No options available…" : placeholder}
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setHighlighted(0); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={handleKeyDown}
                        style={{ flex: 1, border: "none", outline: "none", fontSize: "0.88rem", background: "transparent" }}
                    />
                )}
                {selectedOption ? (
                    <button
                        type="button"
                        onClick={clearSelection}
                        style={{ border: "none", background: "none", cursor: "pointer", color: "#aaa", fontSize: "1rem" }}
                        title="Clear"
                    >✕</button>
                ) : (
                    <span style={{ color: "#aaa", fontSize: "0.75rem", pointerEvents: "none" }}>▾</span>
                )}
            </div>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "white", border: "1px solid #dee2e6", borderRadius: "0.375rem",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999,
                    maxHeight: "240px", overflowY: "auto",
                }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: "14px 16px", color: "#aaa", fontSize: "0.85rem", textAlign: "center" }}>
                            No results for "{query}"
                        </div>
                    ) : (
                        filtered.map((opt, idx) => (
                            <div
                                key={getKey(opt)}
                                onMouseDown={() => selectOption(opt)}
                                onMouseEnter={() => setHighlighted(idx)}
                                style={{
                                    display: "flex", alignItems: "center", gap: "10px",
                                    padding: "10px 14px", cursor: "pointer",
                                    background: highlighted === idx ? "#FFF5F5" : "white",
                                    borderBottom: idx < filtered.length - 1 ? "1px solid #f5f5f5" : "none",
                                    fontSize: "0.88rem",
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    {renderOption ? renderOption(opt, highlightText, query) : highlightText(getLabel(opt), query)}
                                </div>
                                {highlighted === idx && (
                                    <span style={{ color: "#C62828", fontSize: "0.75rem" }}>↵ select</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ── Searchable Guest Selector ─────────────────────────────────────────────
function GuestSearchSelect({ guests, value, onChange }) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    const selectedGuest = guests.find((g) => g._id === value);

    const filtered = query.trim()
        ? guests.filter((g) =>
            [g.name, g.mobile, g.email]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query.toLowerCase())
        )
        : guests;

    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
                if (!value) setQuery("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [value]);

    const selectGuest = (guest) => {
        onChange(guest._id);
        setQuery("");
        setOpen(false);
    };

    const clearSelection = () => {
        onChange("");
        setQuery("");
        inputRef.current?.focus();
        setOpen(true);
    };

    const handleKeyDown = (e) => {
        if (!open) { setOpen(true); return; }
        if (e.key === "ArrowDown") setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
        if (e.key === "ArrowUp") setHighlighted((h) => Math.max(h - 1, 0));
        if (e.key === "Enter" && filtered[highlighted]) selectGuest(filtered[highlighted]);
        if (e.key === "Escape") setOpen(false);
    };

    const highlight = (text = "", q = "") => {
        if (!q.trim()) return text;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark style={{ background: "#FFF0F0", color: "#C62828", padding: 0, borderRadius: "2px" }}>
                    {text.slice(idx, idx + q.length)}
                </mark>
                {text.slice(idx + q.length)}
            </>
        );
    };

    return (
        <div ref={wrapperRef} style={{ position: "relative" }}>
            <div
                className={`form-control ${open ? "border-danger" : ""}`}
                style={{ display: "flex", alignItems: "center", padding: "0.375rem 0.75rem", cursor: "text" }}
                onClick={() => inputRef.current?.focus()}
            >
                <span style={{ color: "#aaa", marginRight: "8px", fontSize: "0.85rem" }}>🔍</span>
                {selectedGuest && !open ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "2px 0" }}>
                        <div style={{
                            width: "28px", height: "28px", borderRadius: "50%",
                            background: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
                            color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: "0.75rem", flexShrink: 0,
                        }}>
                            {selectedGuest.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{selectedGuest.name}</div>
                            <div style={{ fontSize: "0.73rem", color: "#888" }}>
                                {selectedGuest.mobile}{selectedGuest.email ? ` · ${selectedGuest.email}` : ""}
                            </div>
                        </div>
                    </div>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={guests.length === 0 ? "No guests available…" : "Search by name, mobile or email…"}
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setHighlighted(0); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={handleKeyDown}
                        style={{ flex: 1, border: "none", outline: "none", fontSize: "0.88rem", background: "transparent" }}
                    />
                )}
                {selectedGuest ? (
                    <button type="button" onClick={clearSelection}
                        style={{ border: "none", background: "none", cursor: "pointer", color: "#aaa", fontSize: "1rem" }}
                        title="Clear selection">✕</button>
                ) : (
                    <span style={{ color: "#aaa", fontSize: "0.75rem", pointerEvents: "none" }}>▾</span>
                )}
            </div>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "white", border: "1px solid #dee2e6", borderRadius: "0.375rem",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999,
                    maxHeight: "240px", overflowY: "auto",
                }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: "14px 16px", color: "#aaa", fontSize: "0.85rem", textAlign: "center" }}>
                            No guests found for "{query}"
                        </div>
                    ) : (
                        filtered.map((guest, idx) => (
                            <div
                                key={guest._id}
                                onMouseDown={() => selectGuest(guest)}
                                onMouseEnter={() => setHighlighted(idx)}
                                style={{
                                    display: "flex", alignItems: "center", gap: "10px",
                                    padding: "10px 14px", cursor: "pointer",
                                    background: highlighted === idx ? "#FFF5F5" : "white",
                                    borderBottom: idx < filtered.length - 1 ? "1px solid #f5f5f5" : "none",
                                }}
                            >
                                <div style={{
                                    width: "32px", height: "32px", borderRadius: "50%",
                                    background: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
                                    color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                                    fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
                                }}>
                                    {guest.name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div style={{ lineHeight: 1.3 }}>
                                    <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{highlight(guest.name, query)}</div>
                                    <div style={{ fontSize: "0.73rem", color: "#888" }}>
                                        {highlight(guest.mobile, query)}
                                        {guest.email && <> · {highlight(guest.email, query)}</>}
                                    </div>
                                </div>
                                {highlighted === idx && (
                                    <span style={{ marginLeft: "auto", color: "#C62828", fontSize: "0.75rem" }}>↵ select</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {selectedGuest && !open && (
                <div className="mt-2 text-success small">✓ Selected: {selectedGuest.name}</div>
            )}
            {guests.length === 0 && (
                <div className="mt-2 text-warning small">⚠️ No guests found. Please add guests in Guest Management first.</div>
            )}
        </div>
    );
}

export default function Bookings() {
    const [data, setData] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [guests, setGuests] = useState([]);
    const [verifications, setVerifications] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [bRes, rRes, gRes, vRes] = await Promise.all([
                axios.get(`${BASE_URL}/booking`),
                axios.get(`${BASE_URL}/room`),
                axios.get(`${BASE_URL}/guest`),
                axios.get(`${BASE_URL}/idverification`),
            ]);
            const sortedBookings = Array.isArray(bRes.data)
                ? bRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                : [];
            setData(sortedBookings);
            setRooms(rRes.data);
            setGuests(gRes.data);
            setVerifications(vRes.data);
        } catch (err) {
            console.error(err);
            Swal.fire("Error", `Cannot load data: ${err.message}. Make sure backend is running.`, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const getRoomNumber = (booking) => {
        if (booking.room?.roomNumber) return booking.room.roomNumber;
        const room = rooms.find((r) => r._id === booking.room);
        return room?.roomNumber || "—";
    };
    const getRoomType = (booking) => {
        if (booking.room?.type) return booking.room.type;
        const room = rooms.find((r) => r._id === booking.room);
        return room?.type || "—";
    };
    const getRoomPrice = (booking) => {
        if (booking.room?.price) return booking.room.price;
        const room = rooms.find((r) => r._id === booking.room);
        return room?.price || 0;
    };

    const openAdd = () => {
        const today = new Date().toISOString().split("T")[0];
        setForm({
            ...EMPTY,
            checkIn: today,
            checkOut: "",
            billingMode: "nightly",
            fixedTotalAmount: 0,
        });
        setEditId(null);
        setError("");
        setShowModal(true);
    };

    const openEdit = (b) => {
        setForm({
            guestId: b.guest?._id || b.guest || "",
            roomType: b.room?.type || "",
            roomId: b.room?._id || b.room || "",
            checkIn: b.checkIn ? b.checkIn.substring(0, 10) : "",
            checkOut: b.checkOut ? b.checkOut.substring(0, 10) : "",
            numberOfGuests: b.numberOfGuests || 1,
            status: b.status || "Confirmed",
            notes: b.notes || "",
            billingMode: b.billingMode || "nightly",
            fixedTotalAmount: b.fixedTotalAmount || 0,
        });
        setEditId(b._id);
        setError("");
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditId(null); setError(""); };

    const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleGuestSelect = (id) => {
        let updatedForm = { guestId: id };
        const guestVerifications = verifications.filter(
            (v) => (v.guest?._id === id || v.guest === id) && v.status === "Verified"
        );
        guestVerifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const latestVerification = guestVerifications[0];
        if (latestVerification && latestVerification.roomNumber) {
            const roomObj = rooms.find((r) => String(r.roomNumber) === String(latestVerification.roomNumber));
            if (roomObj) { updatedForm.roomId = roomObj._id; updatedForm.roomType = roomObj.type; }
        }
        setForm((f) => ({ ...f, ...updatedForm }));
    };

    const availableRooms = rooms.filter(
        (r) =>
            (r.status === "Available" || (editId && r._id === form.roomId) || r._id === form.roomId) &&
            (!form.roomType || r.type === form.roomType)
    );

    const roomTypeOptions = [
        { _id: "", label: "— Any type —" },
        ...[...new Set(rooms.map((r) => r.type))].map((t) => ({ _id: t, label: t })),
    ];

    const nights = () => {
        if (!form.checkIn || !form.checkOut) return 0;
        const diff = (new Date(form.checkOut) - new Date(form.checkIn)) / (1000 * 60 * 60 * 24);
        return diff > 0 ? diff : 0;
    };
    const selectedRoom = rooms.find((r) => r._id === form.roomId);
    const nightlyTotal = selectedRoom ? selectedRoom.price * nights() : 0;
    const effectiveTotal = form.billingMode === "fixed" ? form.fixedTotalAmount : nightlyTotal;

    // Pre-fill fixedTotalAmount when switching to fixed mode
    useEffect(() => {
        if (form.billingMode === "fixed" && form.fixedTotalAmount === 0 && nightlyTotal > 0) {
            setForm(f => ({ ...f, fixedTotalAmount: nightlyTotal }));
        }
    }, [form.billingMode, nightlyTotal, form.fixedTotalAmount]);

    const handleSave = async () => {
        if (!form.guestId) { Swal.fire("Missing", "Please select a guest from the dropdown.", "warning"); return; }
        if (!form.roomId) { Swal.fire("Missing", "Please select a room.", "warning"); return; }
        if (!form.checkIn || !form.checkOut) { Swal.fire("Missing", "Please select check-in and check-out dates.", "warning"); return; }
        if (new Date(form.checkOut) <= new Date(form.checkIn)) { Swal.fire("Invalid Dates", "Check-out must be after check-in.", "error"); return; }
        if (form.billingMode === "fixed" && (!form.fixedTotalAmount || form.fixedTotalAmount <= 0)) {
            Swal.fire("Missing", "Please enter a valid total amount for the entire stay.", "warning");
            return;
        }

        setLoading(true);
        setError("");

        const payload = {
            guest: form.guestId,
            room: form.roomId,
            checkIn: form.checkIn,
            checkOut: form.checkOut,
            numberOfGuests: form.numberOfGuests,
            bookingType: "Walk-in",
            status: form.status,
            notes: form.notes,
            billingMode: form.billingMode,
            fixedTotalAmount: form.billingMode === "fixed" ? form.fixedTotalAmount : undefined,
        };

        try {
            const url = editId ? `${BASE_URL}/booking/${editId}` : `${BASE_URL}/booking`;
            const method = editId ? axios.put : axios.post;
            await method(url, payload);
            Swal.fire("Success", editId ? "Booking updated." : "Booking confirmed.", "success");
            closeModal();
            await fetchAll();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", err.response?.data?.message || "Failed to save booking.", "error");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async (id) => {
        const result = await Swal.fire({
            title: "Cancel this booking?", text: "This action cannot be undone.", icon: "warning",
            showCancelButton: true, confirmButtonColor: "#d33", cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, cancel",
        });
        if (result.isConfirmed) {
            try {
                await axios.delete(`${BASE_URL}/booking/${id}`);
                Swal.fire("Cancelled", "Booking has been cancelled.", "success");
                await fetchAll();
            } catch { Swal.fire("Error", "Failed to cancel booking.", "error"); }
        }
    };

    const exportToCSV = () => {
        const filtered = filterStatus === "All" ? data : data.filter((b) => b.status === filterStatus);
        if (filtered.length === 0) { Swal.fire("No Data", "No bookings to export.", "info"); return; }
        const csvContent = [
            ["Guest Name", "Mobile", "Room", "Type", "Check-In", "Check-Out", "Nights", "Amount", "Billing Mode", "Status"],
            ...filtered.map((b) => {
                const guest = b.guest || {};
                const room = b.room || {};
                const nightsCount = Math.max(0, (new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24));
                let amount = 0;
                if (b.billingMode === "fixed" && b.fixedTotalAmount) amount = b.fixedTotalAmount;
                else amount = (room.price || getRoomPrice(b)) * nightsCount;
                return [
                    `"${guest.name || "—"}"`, `"${guest.mobile || "—"}"`,
                    room.roomNumber || getRoomNumber(b), room.type || getRoomType(b),
                    new Date(b.checkIn).toLocaleDateString("en-IN"),
                    new Date(b.checkOut).toLocaleDateString("en-IN"),
                    nightsCount, amount,
                    b.billingMode === "fixed" ? "Entire Stay (Fixed)" : "Night-to-Night",
                    b.status,
                ].join(",");
            }),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Bookings_Export_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredData = () => {
        let result = filterStatus === "All" ? data : data.filter((b) => b.status === filterStatus);
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter((b) => {
                const guest = b.guest || {};
                const room = b.room || {};
                return (
                    guest.name?.toLowerCase().includes(term) ||
                    guest.mobile?.includes(term) ||
                    room.roomNumber?.toLowerCase().includes(term) ||
                    room.type?.toLowerCase().includes(term)
                );
            });
        }
        return result;
    };

    const fmtDate = (d) => {
        if (!d) return "—";
        const date = new Date(d);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    if (loading && data.length === 0)
        return <div className="text-center p-5 text-muted">Loading bookings...</div>;

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">📅 Booking Management</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        {data.length} total booking{data.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary" onClick={exportToCSV}>📥 Export CSV</button>
                    <button className="btn btn-warning" onClick={openAdd}>+ New Booking</button>
                </div>
            </div>

            {/* Status Filter Chips */}
            <div className="d-flex flex-wrap gap-2 mb-4">
                <button
                    onClick={() => setFilterStatus("All")}
                    className={`btn btn-sm rounded-pill ${filterStatus === "All" ? "btn-dark" : "btn-outline-secondary"}`}
                    style={{ fontSize: "0.8rem" }}
                >
                    All ({data.length})
                </button>
                {Object.entries(STATUS_STYLES).map(([status, style]) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        style={{
                            fontSize: "0.8rem", padding: "6px 18px", borderRadius: "40px",
                            border: filterStatus === status ? "2px solid #333" : "1px solid #ddd",
                            background: style.background, color: style.color,
                            fontWeight: filterStatus === status ? 600 : 400,
                            cursor: "pointer", transition: "all 0.2s",
                        }}
                    >
                        {status} ({data.filter((b) => b.status === status).length})
                    </button>
                ))}
            </div>

            {/* Global Search Bar */}
            <div className="card shadow-sm p-3 mb-4">
                <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 Search by guest name, mobile, room number or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Bookings Table */}
            <div className="card shadow">
                <div className="card-header bg-danger text-white">All Bookings</div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr style={{ fontSize: "0.95rem" }}>
                                <th>Guest</th>
                                <th>Room</th>
                                <th>Type</th>
                                <th>CheckIn</th>
                                <th>CheckOut</th>
                                <th>Amount</th>
                                {/* <th>Billing Mode</th> */}
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody style={{ fontSize: "0.9rem" }}>
                            {filteredData().length === 0 && (
                                <tr>
                                    <td colSpan="9" className="text-center text-muted py-4">
                                        {data.length === 0 ? "No bookings found. Add one!" : "No matching bookings."}
                                    </td>
                                </tr>
                            )}
                            {filteredData().map((b) => {
                                const guest = b.guest || {};
                                const room = b.room || {};
                                const nightsCount = Math.max(0, (new Date(b.checkOut) - new Date(b.checkIn)) / (1000 * 60 * 60 * 24));
                                let amount = 0;

                                if (b.billingMode === "fixed" && b.fixedTotalAmount) {
                                    amount = Number(b.fixedTotalAmount);
                                } else {
                                    amount = (room.price || getRoomPrice(b)) * nightsCount;
                                }
                                const statusStyle = STATUS_STYLES[b.status] || STATUS_STYLES.Confirmed;
                                return (
                                    <tr key={b._id} className="align-middle">
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div style={{
                                                    width: "36px", height: "36px", borderRadius: "50%",
                                                    background: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
                                                    color: "white", display: "flex", alignItems: "center",
                                                    justifyContent: "center", fontWeight: 700, fontSize: "0.85rem",
                                                }}>
                                                    {guest.name?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div>
                                                    <div className="fw-semibold">{guest.name || "—"}</div>
                                                    {guest.mobile && <div className="small text-muted">{guest.mobile}</div>}
                                                    {guest.email && <div className="small text-muted">{guest.email}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="fw-semibold">{room.roomNumber || getRoomNumber(b)}</td>
                                        <td>{room.type || getRoomType(b)}</td>
                                        <td className="text-nowrap">{fmtDate(b.checkIn)}</td>
                                        <td className="text-nowrap">{fmtDate(b.checkOut)}</td>
                                        <td className="fw-bold text-danger">₹{amount.toLocaleString("en-IN")}</td>
                                        {/* <td>
                                            <span className="badge bg-secondary">
                                                {b.billingMode === "fixed" ? "Entire Stay" : "Night-to-Night"}
                                            </span>
                                        </td> */}
                                        <td>
                                            <span className="badge" style={{ backgroundColor: statusStyle.background, color: statusStyle.color, padding: "6px 12px" }}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-sm btn-warning" onClick={() => openEdit(b)}>✏️</button>
                                                <button className="btn btn-sm btn-danger" onClick={() => confirmDelete(b._id)}>❌</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">{editId ? "✏️ Modify Booking" : "➕ New Booking"}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                {error && <div className="alert alert-danger">⚠️ {error}</div>}
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Select Guest *</label>
                                        <GuestSearchSelect guests={guests} value={form.guestId} onChange={handleGuestSelect} />
                                        {!form.guestId && <div className="text-danger small mt-1">⚠️ Please select a guest from the list</div>}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Check-In Date *</label>
                                        <input className="form-control" type="date" value={form.checkIn} onChange={setField("checkIn")} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Check-Out Date *</label>
                                        <input className="form-control" type="date" value={form.checkOut} onChange={setField("checkOut")} />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Number of Guests</label>
                                        <input className="form-control" type="number" min="1" value={form.numberOfGuests} onChange={setField("numberOfGuests")} />
                                    </div>

                                    {/* Billing Mode Selection */}
                                    {/* <div className="col-md-6">
                                        <label className="form-label fw-bold">Billing Mode</label>
                                        <div className="d-flex gap-3 mt-1">
                                            <label className="d-flex align-items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="billingMode"
                                                    value="nightly"
                                                    checked={form.billingMode === "nightly"}
                                                    onChange={() => setForm(f => ({ ...f, billingMode: "nightly", fixedTotalAmount: 0 }))}
                                                />
                                                <span>Night‑to‑Night (per night)</span>
                                            </label>
                                            <label className="d-flex align-items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="billingMode"
                                                    value="fixed"
                                                    checked={form.billingMode === "fixed"}
                                                    onChange={() => setForm(f => ({ ...f, billingMode: "fixed" }))}
                                                />
                                                <span>Entire Stay (fixed total)</span>
                                            </label>
                                        </div>
                                    </div> */}

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Room Type</label>
                                        <SearchableSelect
                                            options={roomTypeOptions}
                                            value={form.roomType}
                                            placeholder="Search room type…"
                                            getKey={(o) => o._id}
                                            getLabel={(o) => o.label}
                                            onChange={(val) => setForm((f) => ({ ...f, roomType: val, roomId: "" }))}
                                        />
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-bold">Select Room *</label>
                                        <SearchableSelect
                                            options={availableRooms}
                                            value={form.roomId}
                                            placeholder="Search by room number, type or floor…"
                                            getKey={(r) => r._id}
                                            getLabel={(r) => `Room ${r.roomNumber} — ${r.type} — Floor ${r.floor} — ₹${r.price}/night`}
                                            onChange={(val) => setForm((f) => ({ ...f, roomId: val }))}
                                            renderOption={(r, hl, q) => (
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                                                        {hl(`Room ${r.roomNumber}`, q)}
                                                        <span style={{ fontWeight: 400, color: "#888", marginLeft: 6 }}>{hl(r.type, q)}</span>
                                                    </div>
                                                    <div style={{ fontSize: "0.75rem", color: "#888" }}>
                                                        Floor {r.floor} &nbsp;·&nbsp; ₹{r.price}/night
                                                    </div>
                                                </div>
                                            )}
                                            renderSelected={(r) => (
                                                <span>Room {r.roomNumber} — {r.type} — Floor {r.floor} — ₹{r.price}/night</span>
                                            )}
                                        />
                                        {availableRooms.length === 0 && form.roomType && (
                                            <p className="text-danger small mt-1">⚠️ No available rooms for selected type.</p>
                                        )}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Status</label>
                                        <select className="form-select" value={form.status} onChange={setField("status")}>
                                            {Object.keys(STATUS_STYLES).map((s) => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Notes</label>
                                        <input className="form-control" placeholder="Special requests…" value={form.notes} onChange={setField("notes")} />
                                    </div>

                                    {/* Fixed Total Amount (only shown when billingMode = fixed) */}
                                    {form.billingMode === "fixed" && (
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Total Amount (₹) *</label>
                                            <input
                                                className="form-control"
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={form.fixedTotalAmount}
                                                onChange={(e) => setForm(f => ({ ...f, fixedTotalAmount: parseFloat(e.target.value) || 0 }))}
                                                placeholder="Enter the total amount for the entire stay"
                                            />
                                            <small className="text-muted">
                                                This amount replaces the nightly calculation. Guest pays this fixed sum.
                                            </small>
                                        </div>
                                    )}

                                    {/* Amount Display */}
                                    {form.checkIn && form.checkOut && selectedRoom && (
                                        <div className="col-12">
                                            <div className="alert alert-success mb-0">
                                                <div className="d-flex justify-content-between">
                                                    <span>
                                                        {form.billingMode === "nightly"
                                                            ? `${nights()} night${nights() !== 1 ? "s" : ""} × ₹${selectedRoom.price}`
                                                            : "Fixed total amount:"}
                                                    </span>
                                                    <span className="fw-bold">
                                                        Total: ₹{effectiveTotal.toLocaleString("en-IN")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleSave} disabled={loading}>
                                    {loading ? "Saving…" : editId ? "Update Booking" : "Confirm Booking"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}