import axios from "axios";
import { useEffect, useState, useRef } from "react";

// Reusable styles (matching other modules)
const editBtn = {
    background: "#FFF8E1", border: "1px solid #F9A825", color: "#E65100",
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

// SearchableSelect component (same as in Bookings)
function SearchableSelect({ options = [], value, onChange, placeholder = "Search…", emptyMsg = "No results found" }) {
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
            <div style={{
                display: "flex", alignItems: "center",
                border: open ? "1.5px solid #C62828" : "1px solid #ced4da",
                borderRadius: "8px", background: "white", padding: "0 10px",
                boxShadow: open ? "0 0 0 3px rgba(198,40,40,0.1)" : "none",
            }}>
                <span style={{ color: "#aaa", marginRight: "8px", fontSize: "0.85rem" }}>🔍</span>
                {selected && !open ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "7px 0" }}>
                        {selected.avatar && (
                            <div style={{
                                width: "28px", height: "28px", borderRadius: "50%",
                                background: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
                                color: "white", display: "flex", alignItems: "center",
                                justifyContent: "center", fontWeight: 700, fontSize: "0.75rem",
                            }}>
                                {selected.avatar}
                            </div>
                        )}
                        <div>
                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{selected.label}</div>
                            {selected.sublabel && <div style={{ fontSize: "0.73rem", color: "#888" }}>{selected.sublabel}</div>}
                        </div>
                    </div>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setHighlighted(0); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={handleKeyDown}
                        style={{ flex: 1, border: "none", outline: "none", fontSize: "0.88rem", padding: "9px 0", background: "transparent" }}
                    />
                )}
                {selected ? (
                    <button onClick={clear} style={{ border: "none", background: "none", cursor: "pointer", color: "#aaa", fontSize: "1rem" }}>✕</button>
                ) : (
                    <span style={{ color: "#aaa", fontSize: "0.75rem" }}>▾</span>
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
                                }}
                            >
                                {opt.avatar && (
                                    <div style={{
                                        width: "32px", height: "32px", borderRadius: "50%",
                                        background: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
                                        color: "white", display: "flex", alignItems: "center",
                                        justifyContent: "center", fontWeight: 700, fontSize: "0.8rem",
                                    }}>
                                        {opt.avatar}
                                    </div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{highlight(opt.label, query)}</div>
                                    {opt.sublabel && <div style={{ fontSize: "0.73rem", color: "#888" }}>{highlight(opt.sublabel, query)}</div>}
                                </div>
                                {highlighted === idx && <span style={{ color: "#C62828", fontSize: "0.75rem" }}>↵</span>}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default function AmenityService() {
    const [showForm, setShowForm] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState("");
    const [rooms, setRooms] = useState([]);
    const [services, setServices] = useState([
        { name: "Laundry", charge: 200, desc: "Washing and ironing of clothes" },
        { name: "Extra Bed", charge: 500, desc: "Additional bed for guest comfort" },
        { name: "Airport Pickup", charge: 800, desc: "Pickup service from airport" },
        { name: "WiFi", charge: 100, desc: "High-speed internet access" },
        { name: "Spa", charge: 1500, desc: "Relaxing spa and wellness service" }
    ]);
    const [newService, setNewService] = useState({ name: "", charge: "", desc: "" });
    const [activeServices, setActiveServices] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchServices();
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/room");
            const occupied = res.data.filter(r => r.status === "Occupied");
            setRooms(occupied);
        } catch (err) {
            console.error("Error fetching rooms", err);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/services");
            setActiveServices(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    const total = activeServices
        .filter(a => a.status === "Billed")
        .reduce((sum, a) => sum + a.charge, 0);

    const openAddToBillModal = (service) => {
        setSelectedService(service);
        setSelectedRoom("");
        setShowAddModal(true);
    };

    const confirmAddToBill = async () => {
        if (!selectedRoom) {
            alert("Please select a room");
            return;
        }
        setLoading(true);
        try {
            await axios.post("http://localhost:5000/api/services", {
                room: selectedRoom,
                serviceName: selectedService.name,
                charge: selectedService.charge
            });
            await fetchServices();
            setShowAddModal(false);
            setSelectedService(null);
            setSelectedRoom("");
        } catch (err) {
            console.log(err);
            alert("Error adding service to bill");
        } finally {
            setLoading(false);
        }
    };

    const markAsBilled = async (id, room, amount) => {
        try {
            await axios.put(`http://localhost:5000/api/services/${id}`, { status: "Billed" });
            await axios.post("http://localhost:5000/api/roombilling/add-service", {
                room,
                amount
            }).catch(e => console.log("Billing error", e));
            await fetchServices();
        } catch (err) {
            console.log(err);
            alert("Error updating bill");
        }
    };

    const roomOptions = rooms.map(r => ({
        value: r.roomNumber,
        label: `Room ${r.roomNumber}`,
        sublabel: `${r.type}  ·  Floor ${r.floor ?? "—"}`,
        avatar: String(r.roomNumber),
    }));

    return (
        <div className="container-fluid px-3 px-md-4 py-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">✨ Amenity / Service Management</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        Add extra services and charge to guest rooms
                    </p>
                </div>
                <button className="btn btn-warning" onClick={() => setShowForm(!showForm)}>+ Add Service</button>
            </div>

            <div className="row g-4">
                <div className="col-md-8">
                    {showForm && (
                        <div className="card-premium shadow-sm border-0 mb-4">
                            <div className="card-header-gradient d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">➕ Add New Service</h5>
                                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                            </div>
                            <div className="card-body p-4">
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="text-muted fw-bold mb-1">Service Name</label>
                                        <input className="form-control" placeholder="e.g., Laundry" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="text-muted fw-bold mb-1">Charge (₹)</label>
                                        <input type="number" className="form-control" placeholder="200" value={newService.charge} onChange={e => setNewService({ ...newService, charge: e.target.value })} />
                                    </div>
                                    <div className="col-md-5">
                                        <label className="text-muted fw-bold mb-1">Description</label>
                                        <input className="form-control" placeholder="Brief description" value={newService.desc} onChange={e => setNewService({ ...newService, desc: e.target.value })} />
                                    </div>
                                    <div className="col-12 d-flex justify-content-end gap-2">
                                        <button style={outlineRedBtn} onClick={() => setShowForm(false)}>Cancel</button>
                                        <button style={primaryBtn} onClick={() => {
                                            if (!newService.name || !newService.charge) return alert("Please fill all fields");
                                            setServices([...services, { name: newService.name, charge: Number(newService.charge), desc: newService.desc }]);
                                            setNewService({ name: "", charge: "", desc: "" });
                                            setShowForm(false);
                                        }}>Save Service</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="row g-4">
                        {services.map((s, i) => (
                            <div className="col-md-6" key={i}>
                                <div className="card-premium shadow-sm border-0 h-100">
                                    <div className="card-header-gradient d-flex justify-content-between align-items-center" style={{ background: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)", borderBottom: "2px solid #F9A825", padding: "0.75rem 1rem" }}>
                                        <strong style={{ fontSize: "0.9rem", color: "white" }}>{s.name}</strong>
                                        <span style={{ background: "#FFF8E1", color: "#E65100", padding: "4px 12px", borderRadius: "40px", fontSize: "0.7rem", fontWeight: 600 }}>₹{s.charge}</span>
                                    </div>
                                    <div className="card-body p-3">
                                        <p className="text-muted mb-3" style={{ fontSize: "0.85rem" }}>{s.desc}</p>
                                        <button style={editBtn} className="w-100" onClick={() => openAddToBillModal(s)}>➕ Add to Bill</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="card-premium shadow-sm border-0 mb-4">
                        <div className="card-header-gradient d-flex justify-content-between align-items-center">
                            <span>🧾 Active Services</span>
                            <span className="badge bg-light text-dark">{activeServices.filter(a => a.status !== "Billed").length}</span>
                        </div>
                        <div className="card-body p-3" style={{ maxHeight: "300px", overflowY: "auto" }}>
                            {activeServices.filter(a => a.status !== "Billed").length === 0 ? (
                                <p className="text-muted text-center mb-0">No active services</p>
                            ) : (
                                activeServices.filter(a => a.status !== "Billed").map(a => (
                                    <div key={a._id} className="border-bottom pb-3 mb-3">
                                        <strong>Room {a.room}</strong>
                                        <div>{a.serviceName}</div>
                                        <div className="text-muted">₹{a.charge}</div>
                                        <button style={editBtn} className="w-100 mt-2" onClick={() => markAsBilled(a._id, a.room, a.charge)}>✓ Bill Update</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="card-premium shadow-sm border-0 mb-4">
                        <div className="card-header-gradient d-flex justify-content-between align-items-center">
                            <span>💰 Billed Services</span>
                            <span className="badge bg-light text-dark">{activeServices.filter(a => a.status === "Billed").length}</span>
                        </div>
                        <div className="card-body p-3" style={{ maxHeight: "250px", overflowY: "auto" }}>
                            {activeServices.filter(a => a.status === "Billed").length === 0 ? (
                                <p className="text-muted text-center mb-0">No billed services</p>
                            ) : (
                                activeServices.filter(a => a.status === "Billed").map(a => (
                                    <div key={a._id} className="border-bottom pb-3 mb-3">
                                        <strong>Room {a.room}</strong>
                                        <div>{a.serviceName}</div>
                                        <div className="text-muted">₹{a.charge}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="card-premium shadow-sm border-0 text-center">
                        <div className="card-body p-4">
                            <h5 className="text-muted mb-2">Total Billed</h5>
                            <h2 className="text-success mb-0" style={{ fontWeight: 700 }}>₹{total.toLocaleString("en-IN")}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Add to Bill */}
            {showAddModal && selectedService && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header border-0 pb-0" style={{ backgroundColor: "#f8f9fa", borderBottom: "4px solid #007bff" }}>
                                <h5 className="modal-title fw-bold text-dark mb-2">➕ Add Service to Bill</h5>
                                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                            </div>
                            <div className="modal-body p-4 bg-white">
                                <div className="mb-4 p-3 rounded" style={{ background: "#F8FAFE", border: "1px solid #e9ecef" }}>
                                    <div className="d-flex justify-content-between mb-2"><span className="text-muted">Service:</span><span className="fw-bold">{selectedService.name}</span></div>
                                    <div className="d-flex justify-content-between"><span className="text-muted">Charge:</span><span className="fw-bold text-success">₹{selectedService.charge}</span></div>
                                </div>
                                <div className="mb-3">
                                    <label className="text-muted fw-bold mb-1">Select Occupied Room *</label>
                                    <SearchableSelect options={roomOptions} value={selectedRoom} onChange={setSelectedRoom} placeholder="Search by room number or type…" emptyMsg={rooms.length === 0 ? "No occupied rooms available" : "No matching rooms"} />
                                    {rooms.length === 0 && <div className="text-warning small mt-1">⚠️ No occupied rooms. Please check-in guests first.</div>}
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0 pb-4 px-4">
                                <button style={outlineRedBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button style={primaryBtn} onClick={confirmAddToBill} disabled={loading || !selectedRoom || rooms.length === 0}>{loading ? "Adding..." : "Confirm Add to Bill"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}