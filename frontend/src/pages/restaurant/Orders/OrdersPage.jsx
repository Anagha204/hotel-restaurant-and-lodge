import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

const EMPTY_ORDER = {
    orderType: "Dine In",
    table: "",
    assignedRoom: "",
    guestName: "",
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
    items: [],
    kitchenNotes: "",
    orderStatus: "Pending",
};

const ORDER_TYPES = ["Dine In", "Takeaway", "Delivery", "Online order"];
const STATUS_STYLES = {
    Pending: { background: "#FFF8E1", color: "#F9A825" },
    Confirmed: { background: "#E3F2FD", color: "#1565C0" },
    Preparing: { background: "#FFF3E0", color: "#E65100" },
    Ready: { background: "#E8F5E9", color: "#2E7D32" },
    Completed: { background: "#E8F5E9", color: "#1B5E20" },
    Cancelled: { background: "#FFEBEE", color: "#C62828" },
};

const editBtn = {
    background: "#FFF8E1", border: "1px solid #F9A825", color: "#E65100",
    borderRadius: "8px", padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
};
const delBtn = {
    background: "#FFEBEE", border: "1px solid #EF9A9A", color: "#C62828",
    borderRadius: "8px", padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
};
const noteBtn = {
    background: "#E8EAF6", border: "1px solid #9FA8DA", color: "#283593",
    borderRadius: "8px", padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
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
                background: active ? "#C62828" : style?.background || "white",
                color: active ? "white" : style?.color || "#333",
                fontWeight: active ? 600 : 400,
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.2s",
            }}
        >
            {label}
        </button>
    );
}

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
            <div
                className={`form-control ${open ? "border-danger" : ""}`}
                style={{ display: "flex", alignItems: "center", padding: "0.375rem 0.75rem", cursor: "text", minHeight: "38px" }}
                onClick={() => inputRef.current?.focus()}
            >
                <span style={{ color: "#aaa", marginRight: "8px", fontSize: "0.85rem" }}>🔍</span>
                {selected && !open ? (
                    <div style={{ flex: 1, fontSize: "0.88rem", fontWeight: 500 }}>{selected.label}</div>
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
                {selected ? (
                    <button type="button" onClick={clear} style={{ border: "none", background: "none", cursor: "pointer", color: "#aaa", fontSize: "1rem" }}>✕</button>
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
                                    fontSize: "0.88rem",
                                }}
                            >
                                <div style={{ flex: 1 }}>{highlight(opt.label, query)}</div>
                                {highlighted === idx && <span style={{ color: "#C62828", fontSize: "0.75rem" }}>↵ select</span>}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function MenuPicker({ menuItems, onAdd }) {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [flashId, setFlashId] = useState(null);
    const searchRef = useRef(null);
    const getCategoryName = (item) => {
        if (!item.category) return "Uncategorized";
        if (typeof item.category === "string") return item.category;
        return item.category.name || "Uncategorized";
    };
    const categories = ["All", ...Array.from(new Set(menuItems.map(item => getCategoryName(item)))).sort()];
    const filtered = menuItems.filter(item => {
        const catName = getCategoryName(item);
        const matchCat = activeCategory === "All" || catName === activeCategory;
        const matchText = item.name.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchText;
    });
    const handleAdd = (item) => {
        onAdd(item);
        setFlashId(item._id);
        setTimeout(() => setFlashId(null), 500);
    };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: "1rem", color: "#aaa", pointerEvents: "none" }}>🔍</span>
                <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search menu items…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: "100%", padding: "9px 36px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: "0.88rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                    onFocus={e => (e.target.style.borderColor = "#F9A825")}
                    onBlur={e => (e.target.style.borderColor = "#e0e0e0")}
                />
                {search && (
                    <button onClick={() => { setSearch(""); searchRef.current?.focus(); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "#aaa" }}>✕</button>
                )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingBottom: 8, borderBottom: "1px solid #f0f0f0" }}>
                {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: "4px 14px", borderRadius: 20, border: "1.5px solid", borderColor: activeCategory === cat ? "#E65100" : "#e0e0e0", background: activeCategory === cat ? "#FFF3E0" : "white", color: activeCategory === cat ? "#E65100" : "#555", fontWeight: activeCategory === cat ? 700 : 400, fontSize: "0.76rem", cursor: "pointer" }}>{cat}</button>
                ))}
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10, paddingRight: 2 }}>
                {filtered.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#bbb", padding: "30px 0", fontSize: "0.85rem" }}>No items found</div>}
                {filtered.map(item => {
                    const flashing = flashId === item._id;
                    return (
                        <div key={item._id} onClick={() => handleAdd(item)} style={{ border: flashing ? "2px solid #2E7D32" : "1.5px solid #eee", borderRadius: 12, padding: "10px", cursor: "pointer", background: flashing ? "#E8F5E9" : "white", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 5, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", userSelect: "none" }} onMouseEnter={e => { if (!flashing) e.currentTarget.style.borderColor = "#F9A825"; }} onMouseLeave={e => { if (!flashing) e.currentTarget.style.borderColor = "#eee"; }}>
                            {item.image ? <img src={`http://localhost:5000${item.image}`} alt={item.name} style={{ width: "100%", height: 75, objectFit: "cover", borderRadius: 8 }} /> : <div style={{ width: "100%", height: 75, borderRadius: 8, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🍽️</div>}
                            <div style={{ fontWeight: 600, fontSize: "0.81rem" }}>{item.name}</div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "0.72rem", color: "#aaa" }}>{getCategoryName(item)}</span>
                                <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "#C62828" }}>₹{item.price}</span>
                            </div>
                            <div style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 600, color: flashing ? "#2E7D32" : "#F9A825" }}>{flashing ? "✓ Added!" : "+ Add to order"}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const qtyBtn = {
    width: 26, height: 26, borderRadius: 6, border: "1px solid #ddd", background: "#f5f5f5",
    color: "#555", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", lineHeight: 1, padding: 0,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
};

function Cart({ items, onUpdateQuantity, onRemove }) {
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    if (items.length === 0) {
        return (
            <div style={{ border: "2px dashed #eee", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, color: "#ccc", gap: 8 }}>
                <span style={{ fontSize: "2rem" }}>🛒</span>
                <span style={{ fontSize: "0.85rem" }}>Cart is empty</span>
                <span style={{ fontSize: "0.75rem" }}>Click items on the left to add</span>
            </div>
        );
    }
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map(item => (
                    <div key={item._id} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: "8px 10px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>{item.name}</div>
                            <div style={{ fontSize: "0.74rem", color: "#888" }}>₹{item.price} × {item.quantity} = <strong style={{ color: "#C62828" }}>₹{(item.price * item.quantity).toFixed(2)}</strong></div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button style={qtyBtn} onClick={() => onUpdateQuantity(item._id, -1)}>−</button>
                            <span style={{ minWidth: 22, textAlign: "center", fontWeight: 700 }}>{item.quantity}</span>
                            <button style={{ ...qtyBtn, background: "#FFF8E1", color: "#E65100", borderColor: "#F9A825" }} onClick={() => onUpdateQuantity(item._id, 1)}>+</button>
                        </div>
                        <button onClick={() => onRemove(item._id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: "1rem" }}>🗑</button>
                    </div>
                ))}
            </div>
            <div style={{ borderTop: "2px solid #f0f0f0", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.85rem", color: "#555" }}>{totalQty} item{totalQty !== 1 ? "s" : ""}</span>
                <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#C62828" }}>₹{total.toFixed(2)}</span>
            </div>
        </div>
    );
}

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [tables, setTables] = useState([]);
    const [verifiedGuests, setVerifiedGuests] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [cancelId, setCancelId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [editId, setEditId] = useState(null);
    const [showNoteModal, setShowNoteModal] = useState(null);
    const [noteText, setNoteText] = useState("");
    const [form, setForm] = useState(EMPTY_ORDER);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [originalTableId, setOriginalTableId] = useState(null);
    const [originalOrderStatus, setOriginalOrderStatus] = useState(null);
    const [phoneError, setPhoneError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const getItemName = (item) => {
        if (item.name) return item.name;
        if (item.menuItem) {
            if (typeof item.menuItem === "object") return item.menuItem.name;
            return "Item";
        }
        return "Unknown";
    };

    const confirmDelete = async (id) => {
        if (window.confirm("Delete this order? This action cannot be undone.")) {
            try {
                const orderToDelete = orders.find(o => o._id === id);
                const tableId = orderToDelete?.orderType === "Dine In"
                    ? (orderToDelete.table?._id || orderToDelete.table)
                    : null;
                if (tableId) {
                    await updateSingleTableStatus(tableId, "Available");
                }
                await axios.delete(`${BASE_URL}/orders/${id}`);
                alert("Order removed successfully.");
                await fetchOrders();
                await fetchTables();
            } catch (err) {
                alert("Failed to delete order.");
            }
        }
    };

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/orders`);
            setOrders(res.data);
        } catch { setError("Failed to load orders."); }
    };
    const fetchMenuItems = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/menu`);
            setMenuItems(res.data);
        } catch { console.error("Failed to load menu"); }
    };
    const fetchTables = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/tables`);
            setTables(res.data);
        } catch { console.error("Failed to load tables"); }
    };
    const fetchVerifiedGuests = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/checkin`);
            const activeGuests = res.data
                .filter(c => !c.checkOutTime && c.booking && c.booking.guest && c.booking.room)
                .map(c => ({
                    _id: c._id,
                    guestName: c.booking.guest.guestName || c.booking.guest.name || "Guest",
                    roomNumber: c.booking.room.roomNumber
                }));
            setVerifiedGuests(activeGuests);
        } catch { console.error("Failed to load active guests"); }
    };
    const fetchCustomers = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/customers`);
            setCustomers(res.data);
        } catch { console.error("Failed to load customers"); }
    };

    // NEW: Update loyalty points for a customer based on all their orders
    const updateCustomerLoyaltyPoints = async (customerPhone) => {
        if (!customerPhone) return;
        try {
            // Fetch all orders to calculate total spent
            const ordersRes = await axios.get(`${BASE_URL}/orders`);
            const customerOrders = ordersRes.data.filter(order => order.customerPhone === customerPhone);
            let totalSpent = 0;
            customerOrders.forEach(order => {
                let orderTotal = 0;
                order.items.forEach(item => {
                    const price = item.price || item.menuItem?.price || 0;
                    orderTotal += price * item.quantity;
                });
                totalSpent += orderTotal;
            });
            const newPoints = Math.floor(totalSpent / 100) * 5;
            // Find customer by phone
            const customersRes = await axios.get(`${BASE_URL}/customers`);
            const customer = customersRes.data.find(c => c.phone === customerPhone);
            if (customer && customer.loyaltyPoints !== newPoints) {
                await axios.put(`${BASE_URL}/customers/${customer._id}`, {
                    ...customer,
                    loyaltyPoints: newPoints
                });
                console.log(`Updated loyalty points for ${customer.name} to ${newPoints}`);
            }
        } catch (err) {
            console.error("Failed to update loyalty points:", err);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchMenuItems();
        fetchTables();
        fetchVerifiedGuests();
        fetchCustomers();
    }, []);

    useEffect(() => {
        let result = [...orders];
        if (typeFilter !== "All") result = result.filter(o => o.orderType === typeFilter);
        if (statusFilter !== "All") result = result.filter(o => o.orderStatus === statusFilter);
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(o =>
                o._id.toLowerCase().includes(term) ||
                (o.customerName && o.customerName.toLowerCase().includes(term)) ||
                (o.table?.tableNumber && o.table.tableNumber.toString().includes(term))
            );
        }
        setFilteredOrders(result);
    }, [orders, typeFilter, statusFilter, searchTerm]);

    const updateSingleTableStatus = async (tableId, newStatus) => {
        if (!tableId) return;
        try {
            await axios.put(`${BASE_URL}/tables/${tableId}`, { status: newStatus });
            await fetchTables();
        } catch (err) {
            console.error(`Failed to update table ${tableId} to ${newStatus}`, err);
        }
    };

    const openAdd = () => {
        setForm({ ...EMPTY_ORDER, items: [] });
        setEditId(null);
        setError("");
        setPhoneError("");
        setOriginalTableId(null);
        setOriginalOrderStatus(null);
        setShowModal(true);
    };

    const openEdit = (order) => {
        const editableItems = order.items.map(item => ({
            _id: item.menuItem?._id || item.menuItem,
            name: item.name || item.menuItem?.name || "Unknown",
            price: item.price || item.menuItem?.price || 0,
            quantity: item.quantity,
            notes: item.notes || "",
        }));
        setForm({
            ...order,
            table: order.table?._id || order.table,
            assignedRoom: order.assignedRoom || "",
            guestName: order.guestName || "",
            items: editableItems,
            customerPhone: order.customerPhone || "",
        });
        setEditId(order._id);
        setError("");
        setPhoneError("");
        setOriginalTableId(order.table?._id || order.table || null);
        setOriginalOrderStatus(order.orderStatus);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditId(null);
        setError("");
        setPhoneError("");
        setOriginalTableId(null);
        setOriginalOrderStatus(null);
    };

    const addToCart = (menuItem) => {
        setForm(prev => {
            const existing = prev.items.find(i => i._id === menuItem._id);
            if (existing) {
                return { ...prev, items: prev.items.map(i => i._id === menuItem._id ? { ...i, quantity: i.quantity + 1 } : i) };
            }
            const cartItem = { _id: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: 1, notes: "" };
            return { ...prev, items: [...prev.items, cartItem] };
        });
    };

    const updateQuantity = (id, delta) => {
        setForm(prev => ({
            ...prev,
            items: prev.items.map(i => i._id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0),
        }));
    };

    const removeFromCart = (id) => {
        setForm(prev => ({ ...prev, items: prev.items.filter(i => i._id !== id) }));
    };

    const setField = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handlePhoneChange = (e) => {
        let value = e.target.value;
        const digitsOnly = value.replace(/\D/g, "");
        const truncated = digitsOnly.slice(0, 10);
        setForm(f => ({ ...f, customerPhone: truncated }));
        if (truncated.length > 0 && truncated.length !== 10) {
            setPhoneError("Phone number must be exactly 10 digits.");
        } else {
            setPhoneError("");
        }
    };

    const handleCustomerSelect = (customerId) => {
        if (!customerId) {
            setForm(f => ({ ...f, customerName: "", customerPhone: "" }));
            return;
        }
        const selected = customers.find(c => c._id === customerId);
        if (selected) {
            setForm(f => ({
                ...f,
                customerName: selected.name,
                customerPhone: selected.phone
            }));
            setPhoneError("");
        }
    };

    const handleSave = async () => {
        if (!form.orderType || form.items.length === 0) {
            alert("Order type and at least one item are required.");
            return;
        }
        if (form.orderType === "Dine In" && !form.table) {
            alert("Please select a table for Dine In orders.");
            return;
        }
        if (form.orderType !== "Dine In" && form.customerPhone && form.customerPhone.length !== 10) {
            setPhoneError("Phone number must be exactly 10 digits.");
            alert("Phone number must be exactly 10 digits.");
            return;
        }
        if (form.orderType !== "Dine In" && form.customerPhone && !/^\d{10}$/.test(form.customerPhone)) {
            alert("Phone number must be exactly 10 digits.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const payload = {
                orderType: form.orderType,
                table: form.table || null,
                assignedRoom: form.assignedRoom || null,
                guestName: form.guestName || "",
                customerName: form.customerName,
                customerPhone: form.customerPhone,
                deliveryAddress: form.deliveryAddress,
                kitchenNotes: form.kitchenNotes,
                items: form.items.map(i => ({ menuItem: i._id, quantity: i.quantity, notes: i.notes })),
                orderStatus: form.orderStatus,
            };
            if (editId) {
                await axios.put(`${BASE_URL}/orders/${editId}`, payload);
            } else {
                await axios.post(`${BASE_URL}/orders`, payload);
            }

            if (form.orderType === "Dine In" && form.table) {
                const isFinalStatus = ["Completed", "Cancelled"].includes(form.orderStatus);
                const newTableStatus = isFinalStatus ? "Available" : "Occupied";
                if (editId && originalTableId && originalTableId !== form.table) {
                    await updateSingleTableStatus(originalTableId, "Available");
                }
                await updateSingleTableStatus(form.table, newTableStatus);
            }
            if (editId && originalTableId && form.orderType !== "Dine In") {
                await updateSingleTableStatus(originalTableId, "Available");
            }

            // NEW: Update loyalty points for new orders (not edit) and if customer phone exists
            if (!editId && form.customerPhone) {
                await updateCustomerLoyaltyPoints(form.customerPhone);
                // Refresh customers list to show updated points
                await fetchCustomers();
            }

            alert(editId ? "Order updated." : "Order created.");
            closeModal();
            await fetchOrders();
            await fetchTables();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to save order.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (id) => {
        if (window.confirm("Cancel this order? This action cannot be undone.")) {
            const orderToCancel = orders.find(o => o._id === id);
            const tableId = orderToCancel?.orderType === "Dine In" ? (orderToCancel.table?._id || orderToCancel.table) : null;
            try {
                await axios.put(`${BASE_URL}/orders/${id}/cancel`);
                if (tableId) await updateSingleTableStatus(tableId, "Available");
                alert("Order has been cancelled.");
                await fetchOrders();
                await fetchTables();
            } catch {
                alert("Failed to cancel order.");
            }
        }
    };

    const handleAddNote = async () => {
        try {
            const orderRes = await axios.get(`${BASE_URL}/orders/${showNoteModal}`);
            const updatedOrder = { ...orderRes.data, kitchenNotes: noteText };
            await axios.put(`${BASE_URL}/orders/${showNoteModal}`, updatedOrder);
            setShowNoteModal(null);
            await fetchOrders();
            alert("Note added successfully.");
        } catch {
            alert("Failed to add note.");
        }
    };

    const openNoteModal = (order) => {
        setShowNoteModal(order._id);
        setNoteText(order.kitchenNotes || "");
    };

    const computeOrderTotal = (order) => {
        let total = 0;
        for (const item of order.items) {
            const price = item.price || item.menuItem?.price || 0;
            total += price * item.quantity;
        }
        return total.toFixed(2);
    };

    const getCustomerDisplay = (order) => {
        if (order.orderType === "Dine In") return order.table?.tableNumber || order.table || "?";
        return order.customerName || "-";
    };

    const tableOptions = tables.map(t => ({
        value: t._id,
        label: `Table ${t.tableNumber} (Capacity: ${t.capacity})`,
        sublabel: `${t.section} - ${t.status}`
    }));
    const guestOptions = verifiedGuests.map(g => ({
        value: String(g.roomNumber),
        label: `${g.guestName} - Room ${g.roomNumber}`,
        sublabel: `Room ${g.roomNumber}`
    }));

    const customerOptions = customers.map(c => ({
        value: c._id,
        label: `${c.name} (${c.phone})`,
        sublabel: c.email || "No email"
    }));

    return (
        <div className="container-fluid p-3">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">📋 Order Management</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        {filteredOrders.length} of {orders.length} order{orders.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <button className="btn btn-warning" onClick={openAdd}>+ New Order</button>
            </div>

            <div className="d-flex flex-wrap gap-0.8 mb-4">
                <Chip
                    label={`All Status (${orders.length})`}
                    active={statusFilter === "All"}
                    onClick={() => setStatusFilter("All")}
                />
                {Object.keys(STATUS_STYLES).map(status => {
                    const count = orders.filter(o => o.orderStatus === status).length;
                    return (
                        <Chip
                            key={status}
                            label={`${status} (${count})`}
                            active={statusFilter === status}
                            onClick={() => setStatusFilter(status)}
                            style={STATUS_STYLES[status]}
                        />
                    );
                })}
            </div>

            <div className="card shadow-sm p-3 mb-4">
                <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 Search by order ID, customer name, table..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="card shadow">
                <div className="card-header bg-danger text-white">All Orders</div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Order ID</th><th>Type</th><th>Customer / Table</th>
                                <th>Items</th><th>Total</th><th>Status</th><th>Notes</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="text-center text-muted py-4">
                                        No orders found.
                                    </td>
                                </tr>
                            )}
                            {filteredOrders.map((order, idx) => (
                                <tr key={order._id}>
                                    <td className="fw-bold">{order._id.slice(-6)}</td>
                                    <td>{order.orderType}</td>
                                    <td>{getCustomerDisplay(order)}</td>
                                    <td className="table-inline-items">
                                        {order.items.map((item, i) => (
                                            <span key={i} className="item-chip">
                                                {item.quantity}× {getItemName(item)}
                                            </span>
                                        ))}
                                    </td>
                                    <td className="fw-bold text-danger">₹{computeOrderTotal(order)}</td>
                                    <td>
                                        <span
                                            style={{
                                                ...(STATUS_STYLES[order.orderStatus] || STATUS_STYLES.Pending),
                                                display: "inline-block",
                                                padding: "4px 14px",
                                                borderRadius: "40px",
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {order.orderStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <button onClick={() => openNoteModal(order)} style={noteBtn}>
                                            📝 {order.kitchenNotes ? "Edit" : "Add"}
                                        </button>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <button onClick={() => openEdit(order)} style={editBtn}>✏️ Edit</button>
                                            {order.orderStatus !== "Cancelled" && order.orderStatus !== "Completed" && (
                                                <button onClick={() => handleCancelOrder(order._id)} style={delBtn}>❌ Cancel</button>
                                            )}
                                            <button onClick={() => confirmDelete(order._id)} style={{ ...delBtn, background: "#FFCDD2" }}>🗑️ Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Modal */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">{editId ? "✏️ Edit Order" : "➕ New Order"}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                            </div>
                            <div className="modal-body">
                                {error && <div className="alert alert-danger">⚠️ {error}</div>}
                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <label className="form-label fw-bold">Order Type *</label>
                                        <select className="form-select" value={form.orderType} onChange={setField("orderType")}>
                                            {ORDER_TYPES.map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    {form.orderType === "Dine In" && (
                                        <>
                                            <div className="col-md-4">
                                                <label className="form-label fw-bold">Table *</label>
                                                <SearchableSelect
                                                    options={tableOptions}
                                                    value={form.table || ""}
                                                    onChange={(val) => setForm(f => ({ ...f, table: val }))}
                                                    placeholder="Search table..."
                                                />
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label fw-bold">Link to Room Guest (billing)</label>
                                                <SearchableSelect
                                                    options={guestOptions}
                                                    value={form.assignedRoom || ""}
                                                    onChange={(val) => {
                                                        const guest = verifiedGuests.find(g => String(g.roomNumber) === String(val));
                                                        setForm(f => ({ ...f, assignedRoom: val, guestName: guest ? guest.guestName : "" }));
                                                    }}
                                                    placeholder="Search guest or room..."
                                                />
                                            </div>
                                        </>
                                    )}
                                    {form.orderType !== "Dine In" && (
                                        <>
                                            <div className="col-md-12">
                                                <label className="form-label fw-bold">Select existing customer (optional)</label>
                                                <SearchableSelect
                                                    options={customerOptions}
                                                    value=""
                                                    onChange={handleCustomerSelect}
                                                    placeholder="Search by name or phone..."
                                                    emptyMsg="No customers found"
                                                />
                                                <div className="form-text mb-2">Or enter new customer details below.</div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold">Customer Name</label>
                                                <input
                                                    className="form-control"
                                                    value={form.customerName || ""}
                                                    onChange={(e) => setForm(f => ({ ...f, customerName: e.target.value }))}
                                                    placeholder="Enter name"
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-bold">Phone</label>
                                                <input
                                                    type="tel"
                                                    className={`form-control ${phoneError ? "is-invalid" : ""}`}
                                                    value={form.customerPhone || ""}
                                                    onChange={handlePhoneChange}
                                                    placeholder="10-digit number"
                                                />
                                                {phoneError && (
                                                    <div className="text-danger small mt-1">{phoneError}</div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    {(form.orderType === "Delivery" || form.orderType === "Online order") && (
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Delivery Address *</label>
                                            <textarea className="form-control" rows="2" value={form.deliveryAddress || ""} onChange={setField("deliveryAddress")} />
                                        </div>
                                    )}
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Kitchen Notes</label>
                                        <textarea className="form-control" rows="2" value={form.kitchenNotes || ""} onChange={setField("kitchenNotes")} placeholder="Special requests, allergies, etc." />
                                    </div>
                                    {editId && (
                                        <div className="col-md-4">
                                            <label className="form-label fw-bold">Order Status</label>
                                            <select className="form-select" value={form.orderStatus} onChange={setField("orderStatus")}>
                                                {Object.keys(STATUS_STYLES).map(s => <option key={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="row g-4">
                                    <div className="col-md-7">
                                        <h6 className="mb-3 fw-bold">🍽️ Menu — click any item to add</h6>
                                        <MenuPicker menuItems={menuItems} onAdd={addToCart} />
                                    </div>
                                    <div className="col-md-5">
                                        <h6 className="mb-3 fw-bold">🛒 Current Order</h6>
                                        <Cart items={form.items} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleSave} disabled={loading || form.items.length === 0}>
                                    {loading ? "Saving…" : editId ? "Update" : "Create"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Note Modal */}
            {showNoteModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">📝 Kitchen Note</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowNoteModal(null)}></button>
                            </div>
                            <div className="modal-body">
                                <textarea className="form-control" rows="3" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Enter note for kitchen..."></textarea>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowNoteModal(null)}>Cancel</button>
                                <button className="btn btn-danger" onClick={handleAddNote}>Save Note</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}