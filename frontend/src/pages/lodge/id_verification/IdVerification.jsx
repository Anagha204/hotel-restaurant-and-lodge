import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const STATUS_STYLES = {
    Pending: { background: "#FFF8E1", color: "#F9A825" },
    Verified: { background: "#E8F5E9", color: "#2E7D32" },
    Rejected: { background: "#FFEBEE", color: "#C62828" },
};

const editBtn = {
    background: "#FFF8E1", border: "1px solid #F9A825", color: "#E65100",
    borderRadius: "8px", padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
};
const delBtn = {
    background: "#FFEBEE", border: "1px solid #EF9A9A", color: "#C62828",
    borderRadius: "8px", padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
};
const primaryBtn = {
    background: "linear-gradient(135deg, #007bff, #0056b3)", border: "none",
    borderRadius: "8px", padding: "8px 24px", fontSize: "0.85rem",
    fontWeight: 600, color: "white", cursor: "pointer", transition: "all 0.2s",
};
const outlineRedBtn = {
    background: "white", border: "1px solid #C62828", borderRadius: "8px",
    padding: "8px 24px", fontSize: "0.85rem", fontWeight: 600,
    color: "#C62828", cursor: "pointer", transition: "all 0.2s",
};

const Chip = ({ label, active, onClick, style }) => (
    <button
        onClick={onClick}
        style={{
            padding: "6px 18px", borderRadius: "40px", border: "1px solid",
            borderColor: active ? "#C62828" : "#ddd",
            background: active ? "#C62828" : "white",
            color: active ? "white" : "#333",
            fontWeight: active ? 600 : 400, fontSize: "0.8rem",
            cursor: "pointer", transition: "all 0.2s",
            ...(active ? {} : style),
        }}
    >
        {label}
    </button>
);

const mapIdProofToType = (proof) => {
    if (!proof) return "";
    if (proof === "Aadhaar Card") return "Aadhaar";
    if (proof === "Driving Licence") return "Driving License";
    if (proof === "PAN Card") return "PAN Card";
    if (proof === "Passport") return "Passport";
    if (proof === "Voter ID") return "Voter ID";
    return proof;
};

// SearchableSelect component (unchanged)
function SearchableSelect({ options = [], value, onChange, placeholder = "Search…", emptyMsg = "No results found", disabled = false }) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    const selected = options.find((o) => o.value === value);

    const filtered = query.trim()
        ? options.filter((o) =>
            [o.label, o.sublabel]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query.toLowerCase())
        )
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

    const select = (opt) => {
        onChange(opt.value);
        setQuery("");
        setOpen(false);
    };

    const clear = () => {
        onChange("");
        setQuery("");
        inputRef.current?.focus();
        setOpen(true);
    };

    const handleKeyDown = (e) => {
        if (!open) { setOpen(true); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); }
        if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
        if (e.key === "Enter" && filtered[highlighted]) select(filtered[highlighted]);
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
                style={{
                    display: "flex", alignItems: "center",
                    border: open ? "1.5px solid #C62828" : "1px solid #ced4da",
                    borderRadius: "8px", background: disabled ? "#f8f9fa" : "white",
                    padding: "0 10px", transition: "border-color 0.15s",
                    boxShadow: open ? "0 0 0 3px rgba(198,40,40,0.1)" : "none",
                    opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? "none" : "auto",
                }}
            >
                <span style={{ color: "#aaa", marginRight: "8px", fontSize: "0.85rem" }}>🔍</span>

                {selected && !open ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "7px 0" }}>
                        {selected.avatar && (
                            <div style={{
                                width: "28px", height: "28px", borderRadius: "50%",
                                background: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
                                color: "white", display: "flex", alignItems: "center",
                                justifyContent: "center", fontWeight: 700, fontSize: "0.75rem", flexShrink: 0,
                            }}>
                                {selected.avatar}
                            </div>
                        )}
                        <div style={{ lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{selected.label}</div>
                            {selected.sublabel && (
                                <div style={{ fontSize: "0.73rem", color: "#888" }}>{selected.sublabel}</div>
                            )}
                        </div>
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
                        style={{
                            flex: 1, border: "none", outline: "none",
                            fontSize: "0.88rem", padding: "9px 0", background: "transparent",
                        }}
                    />
                )}

                {selected ? (
                    <button
                        type="button"
                        onClick={clear}
                        style={{ border: "none", background: "none", cursor: "pointer", color: "#aaa", fontSize: "1rem", padding: "0 2px", lineHeight: 1 }}
                        title="Clear"
                    >✕</button>
                ) : (
                    <span style={{ color: "#aaa", fontSize: "0.75rem", pointerEvents: "none" }}>▾</span>
                )}
            </div>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "white", border: "1px solid #e0e0e0", borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999,
                    maxHeight: "220px", overflowY: "auto",
                }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: "14px 16px", color: "#aaa", fontSize: "0.85rem", textAlign: "center" }}>
                            {query ? `No results for "${query}"` : emptyMsg}
                        </div>
                    ) : (
                        filtered.map((opt, idx) => (
                            <div
                                key={opt.value}
                                onMouseDown={() => select(opt)}
                                onMouseEnter={() => setHighlighted(idx)}
                                style={{
                                    display: "flex", alignItems: "center", gap: "10px",
                                    padding: "10px 14px", cursor: "pointer",
                                    background: highlighted === idx ? "#FFF5F5" : "white",
                                    borderBottom: idx < filtered.length - 1 ? "1px solid #f5f5f5" : "none",
                                    transition: "background 0.1s",
                                }}
                            >
                                {opt.avatar && (
                                    <div style={{
                                        width: "32px", height: "32px", borderRadius: "50%",
                                        background: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
                                        color: "white", display: "flex", alignItems: "center",
                                        justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
                                    }}>
                                        {opt.avatar}
                                    </div>
                                )}
                                <div style={{ lineHeight: 1.3, flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>
                                        {highlight(opt.label, query)}
                                    </div>
                                    {opt.sublabel && (
                                        <div style={{ fontSize: "0.73rem", color: "#888" }}>
                                            {highlight(opt.sublabel, query)}
                                        </div>
                                    )}
                                </div>
                                {highlighted === idx && (
                                    <span style={{ color: "#C62828", fontSize: "0.75rem" }}>↵</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

const ID_TYPES = ["Aadhaar", "Passport", "Driving License", "Voter ID", "PAN Card"];

export default function IdVerification() {
    const [verifications, setVerifications] = useState([]);
    const [filteredVerifications, setFilteredVerifications] = useState([]);
    const [guests, setGuests] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [statusFilter, setStatusFilter] = useState("All");
    const [formData, setFormData] = useState({
        guestId: "", guestName: "", roomNumber: "",
        idType: "Aadhaar", idNumber: "", imageUrl: "", status: "Verified",
        phone: "",
    });

    useEffect(() => {
        fetchVerifications();
        fetchGuests();
        fetchRooms();
        fetchBookings();
    }, []);

    useEffect(() => {
        let result = [...verifications];
        if (statusFilter !== "All") result = result.filter((v) => v.status === statusFilter);
        setFilteredVerifications(result);
    }, [verifications, statusFilter]);

    const fetchRooms = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/room");
            setRooms(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchGuests = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/guest");
            setGuests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/booking");
            setBookings(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchVerifications = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/idverification");
            setVerifications(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    // When a guest is selected: auto-fill ID type, ID number, room, and phone
    const handleGuestSelect = (guestId) => {
        const guest = guests.find(g => g._id === guestId);
        if (!guest) return;

        let idType = mapIdProofToType(guest.idProof);
        if (!idType && ID_TYPES.includes(guest.idProof)) idType = guest.idProof;
        if (!idType) idType = "Aadhaar";

        setFormData(prev => ({
            ...prev,
            guestId: guest._id,
            guestName: guest.name,
            idType: idType,
            idNumber: guest.idNumber || "",
            phone: guest.mobile || "",   // 👈 auto‑fill phone from guest's mobile
        }));

        const confirmedBooking = bookings.find(b =>
            (b.guest?._id === guestId || b.guest === guestId) &&
            b.status === "Confirmed"
        );

        if (confirmedBooking && confirmedBooking.room) {
            let roomNumber = null;
            if (typeof confirmedBooking.room === 'object') {
                roomNumber = confirmedBooking.room.roomNumber;
            } else {
                const roomObj = rooms.find(r => r._id === confirmedBooking.room);
                roomNumber = roomObj?.roomNumber;
            }
            if (roomNumber) {
                setFormData(prev => ({ ...prev, roomNumber }));
                return;
            }
        }
        setFormData(prev => ({ ...prev, roomNumber: "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.guestId || !formData.roomNumber || !formData.idNumber) {
            alert("Please select a guest, room, and fill ID number");
            return;
        }
        try {
            await axios.post("http://localhost:5000/api/idverification", {
                guest: formData.guestId,
                guestName: formData.guestName,
                roomNumber: formData.roomNumber,
                idType: formData.idType,
                idNumber: formData.idNumber,
                imageUrl: formData.imageUrl,
                status: formData.status,
                phone: formData.phone,   // 👈 send phone number
            });
            fetchVerifications();
            setShowForm(false);
            setFormData({
                guestId: "", guestName: "", roomNumber: "",
                idType: "Aadhaar", idNumber: "", imageUrl: "", status: "Verified",
                phone: "",
            });
        } catch (err) {
            alert("Error: " + (err.response?.data?.error || err.message));
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.put(`http://localhost:5000/api/idverification/${id}`, { status });
            fetchVerifications();
        } catch (err) {
            console.log(err);
        }
    };

    const handleVerify = async (id) => {
        await updateStatus(id, "Verified");
        Swal.fire({
            icon: 'success',
            title: 'Verified',
            showConfirmButton: false,
            timer: 1500
        });
    };

    const handleReject = (id) => {
        Swal.fire({
            title: 'Are you sure you want to reject?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ok',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await updateStatus(id, "Rejected");
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure you want to delete this record?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#C62828',
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.delete(`http://localhost:5000/api/idverification/${id}`);
                    fetchVerifications();
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        showConfirmButton: false,
                        timer: 1500
                    });
                } catch (err) {
                    console.log(err);
                }
            }
        });
    };

    const guestOptions = guests
        .filter(g => !verifications.some(v => v.status === "Verified" && (v.guest === g._id || v.guest?._id === g._id)))
        .map(g => ({
            value: g._id,
            label: g.name,
            sublabel: [g.mobile, g.email].filter(Boolean).join(" · "),
            avatar: g.name?.[0]?.toUpperCase(),
        }));

    const roomOptions = rooms
        .filter(r => r.status === "Available")
        .map(r => ({
            value: r.roomNumber,
            label: `Room ${r.roomNumber}`,
            sublabel: `${r.type}  ·  Floor ${r.floor ?? "—"}  ·  ${r.status}`,
            avatar: String(r.roomNumber),
        }));

    const idTypeOptions = ID_TYPES.map(t => ({
        value: t, label: t,
        sublabel: t === "Aadhaar" ? "12-digit number" : t === "Passport" ? "Alphanumeric" : "Government ID",
    }));

    return (
        <div className="container-fluid px-3 px-md-4 py-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">🪪 ID Verification Module</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        {filteredVerifications.length} of {verifications.length} record{verifications.length !== 1 ? "s" : ""} displayed
                    </p>
                </div>
                <button className="btn btn-warning" onClick={() => setShowForm(true)}>+ Verify New Guest</button>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-4">
                <Chip label={`All (${verifications.length})`} active={statusFilter === "All"} onClick={() => setStatusFilter("All")} />
                {Object.entries(STATUS_STYLES).map(([status, style]) => (
                    <Chip
                        key={status}
                        label={`${status} (${verifications.filter(v => v.status === status).length})`}
                        active={statusFilter === status}
                        onClick={() => setStatusFilter(status)}
                        style={style}
                    />
                ))}
            </div>

            {/* Verification Modal */}
            {showForm && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 10500, position: "fixed", inset: 0, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "4rem 1rem 2rem 1rem", opacity: 1, visibility: "visible" }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg" style={{ margin: "0 auto", width: "100%", maxWidth: "800px" }}>
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header border-0 pb-0" style={{ backgroundColor: "#f8f9fa", borderBottom: "4px solid #007bff" }}>
                                <h5 className="modal-title fw-bold text-dark mb-2">🪪 New Guest ID Verification</h5>
                                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                            </div>
                            <div className="modal-body p-4 bg-white">
                                <form onSubmit={handleSubmit} className="row g-3">
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Select Guest *</label>
                                        <SearchableSelect
                                            options={guestOptions}
                                            value={formData.guestId}
                                            onChange={handleGuestSelect}
                                            placeholder="Search by name, mobile or email…"
                                            emptyMsg="No guests found. Add guests first."
                                        />
                                        {guests.length === 0 && (
                                            <div className="text-warning small mt-1">⚠️ No guests found. Please add guests in Guest Management first.</div>
                                        )}
                                    </div>
                                    {/* <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Room Number *</label>
                                        <SearchableSelect
                                            options={roomOptions}
                                            value={formData.roomNumber}
                                            onChange={(val) => setFormData(f => ({ ...f, roomNumber: val }))}
                                            placeholder="Search by room number or type…"
                                            emptyMsg="No rooms found."
                                        />
                                    </div> */}
                                    <div className="col-md-4">
                                        <label className="text-muted fw-bold mb-1">ID Type *</label>
                                        <SearchableSelect
                                            options={idTypeOptions}
                                            value={formData.idType}
                                            onChange={(val) => setFormData(f => ({ ...f, idType: val }))}
                                            placeholder="Search ID type…"
                                        />
                                    </div>
                                    <div className="col-md-8">
                                        <label className="text-muted fw-bold mb-1">ID Number *</label>
                                        <input
                                            required
                                            className="form-control"
                                            placeholder="Enter ID number…"
                                            value={formData.idNumber}
                                            onChange={(e) => setFormData(f => ({ ...f, idNumber: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="text-muted fw-bold mb-1">Upload ID Document Image</label>
                                        <input required
                                            type="file"
                                            accept="image/*"
                                            className="form-control"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setFormData(f => ({ ...f, imageUrl: reader.result }));
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        <div className="form-text mt-1">Select an image file from your PC (JPG, PNG).</div>
                                    </div>
                                    <div className="col-12 mt-4 d-flex justify-content-end gap-2">
                                        <button type="button" style={outlineRedBtn} onClick={() => setShowForm(false)}>Cancel</button>
                                        <button type="submit" style={primaryBtn}>Save Record</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {filteredVerifications.length === 0 ? (
                <div className="card-premium shadow-sm border-0 p-4 text-center text-muted">
                    <h5>No Verification Records Found</h5>
                    <p>Add a new record to get started.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {filteredVerifications.map((v) => (
                        <div className="col-md-6 col-lg-4" key={v._id}>
                            <div className="card-premium shadow-sm border-0 h-100">
                                <div
                                    className="card-header-gradient d-flex justify-content-between align-items-center"
                                    style={{ background: "#C62828", borderBottom: "2px solid #007bff", padding: "0.75rem 1rem" }}
                                >
                                    <strong style={{ fontSize: "0.9rem", color: "white" }}>Room {v.roomNumber}</strong>
                                    <span style={{
                                        ...(STATUS_STYLES[v.status] || STATUS_STYLES.Pending),
                                        display: "inline-block", padding: "4px 12px",
                                        borderRadius: "40px", fontSize: "0.7rem", fontWeight: 600,
                                    }}>
                                        {v.status}
                                    </span>
                                </div>
                                <div className="card-body p-3">
                                    <h5 className="mb-2">{v.guestName}</h5>
                                    <p className="mb-2 text-muted"><strong>{v.idType}:</strong> {v.idNumber}</p>
                                    {v.imageUrl ? (
                                        <div className="mt-3 mb-3 text-center bg-light p-2 rounded border" style={{ height: "150px", overflow: "hidden" }}>
                                            <img src={v.imageUrl} alt="ID Document" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                        </div>
                                    ) : (
                                        <div className="mt-3 mb-3 text-center bg-light p-2 rounded border d-flex align-items-center justify-content-center text-muted" style={{ height: "150px" }}>
                                            No Image Provided
                                        </div>
                                    )}
                                    <div className="d-flex gap-2 mt-3">
                                        <button style={editBtn} onClick={() => handleVerify(v._id)} disabled={v.status === "Verified"}>✓ Verify</button>
                                        <button style={delBtn} onClick={() => handleReject(v._id)} disabled={v.status === "Rejected"}>✗ Reject</button>
                                        <button style={{ ...delBtn, background: "#ECEFF1", border: "1px solid #90A4AE", color: "#455A64" }} onClick={() => handleDelete(v._id)}>🗑️</button>
                                    </div>
                                </div>
                                <div className="card-footer text-muted text-center" style={{ fontSize: "0.75rem", background: "#f8f9fa" }}>
                                    Recorded: {new Date(v.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}