import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const BASE_URL = `${window.API_BASE_URL}`

    ;

// ---------------------- MenuPicker (category + search) ----------------------
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
                <span style={{
                    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                    fontSize: "1rem", color: "#aaa", pointerEvents: "none",
                }}>🔍</span>
                <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search menu items…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        width: "100%", padding: "9px 36px", borderRadius: 10,
                        border: "1.5px solid #e0e0e0", fontSize: "0.88rem", outline: "none",
                    }}
                    onFocus={e => (e.target.style.borderColor = "#F9A825")}
                    onBlur={e => (e.target.style.borderColor = "#e0e0e0")}
                />
                {search && (
                    <button onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                        style={{
                            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "#aaa"
                        }}>
                        ✕
                    </button>
                )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingBottom: 8, borderBottom: "1px solid #f0f0f0" }}>
                {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                        padding: "4px 14px", borderRadius: 20, border: "1.5px solid",
                        borderColor: activeCategory === cat ? "#E65100" : "#e0e0e0",
                        background: activeCategory === cat ? "#FFF3E0" : "white",
                        color: activeCategory === cat ? "#E65100" : "#555",
                        fontWeight: activeCategory === cat ? 700 : 400, fontSize: "0.76rem", cursor: "pointer",
                    }}>{cat}</button>
                ))}
            </div>
            <div style={{
                maxHeight: 320, overflowY: "auto", display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10, paddingRight: 2,
            }}>
                {filtered.length === 0 && (
                    <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#bbb", padding: "30px 0" }}>No items found</div>
                )}
                {filtered.map(item => {
                    const flashing = flashId === item._id;
                    return (
                        <div key={item._id} onClick={() => handleAdd(item)} style={{
                            border: flashing ? "2px solid #2E7D32" : "1.5px solid #eee", borderRadius: 12, padding: "10px",
                            cursor: "pointer", background: flashing ? "#E8F5E9" : "white", transition: "all 0.15s",
                            display: "flex", flexDirection: "column", gap: 5, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        }}>
                            {item.image ? (
                                <img src={`http://localhost:5000${item.image}`} alt={item.name}
                                    style={{ width: "100%", height: 75, objectFit: "cover", borderRadius: 8 }} />
                            ) : (
                                <div style={{
                                    width: "100%", height: 75, borderRadius: 8, background: "#f5f5f5",
                                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem"
                                }}>🍽️</div>
                            )}
                            <div style={{ fontWeight: 600, fontSize: "0.81rem" }}>{item.name}</div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "0.72rem", color: "#aaa" }}>{getCategoryName(item)}</span>
                                <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "#C62828" }}>₹{item.price}</span>
                            </div>
                            <div style={{
                                textAlign: "center", fontSize: "0.7rem", fontWeight: 600,
                                color: flashing ? "#2E7D32" : "#F9A825"
                            }}>
                                {flashing ? "✓ Added!" : "+ Add to order"}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ---------------------- Cart ----------------------
const qtyBtn = {
    width: 26, height: 26, borderRadius: 6, border: "1px solid #ddd", background: "#f5f5f5",
    color: "#555", cursor: "pointer", fontWeight: 700, fontSize: "0.9rem", padding: 0,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
};

function Cart({ items, onUpdateQuantity, onRemove }) {
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    if (items.length === 0) {
        return (
            <div style={{
                border: "2px dashed #eee", borderRadius: 12, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", minHeight: 200, color: "#ccc", gap: 8
            }}>
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
                    <div key={item._id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: "8px 10px"
                    }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: "0.82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                            <div style={{ fontSize: "0.74rem", color: "#888" }}>₹{item.price} × {item.quantity} = <strong style={{ color: "#C62828" }}>₹{(item.price * item.quantity).toFixed(2)}</strong></div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button style={qtyBtn} onClick={() => onUpdateQuantity(item._id, -1)}>−</button>
                            <span style={{ minWidth: 22, textAlign: "center", fontWeight: 700, fontSize: "0.85rem" }}>{item.quantity}</span>
                            <button style={{ ...qtyBtn, background: "#FFF8E1", color: "#E65100", borderColor: "#F9A825" }} onClick={() => onUpdateQuantity(item._id, 1)}>+</button>
                        </div>
                        <button onClick={() => onRemove(item._id)} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: "1rem" }}>&#128465;</button>
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

// ---------------------- Main RoomService component ----------------------
export default function RoomService() {
    const [orders, setOrders] = useState([]);
    const [occupiedRooms, setOccupiedRooms] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState("");
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchRoomServiceOrders = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/orders`);
            const roomServiceOrders = res.data.filter(o => o.orderType === "Room Service");
            setOrders(roomServiceOrders);
        } catch (err) { console.error(err); }
    };
    const fetchOccupiedRooms = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/room`);
            const occupied = res.data.filter(r => r.status === "Occupied");
            setOccupiedRooms(occupied);
        } catch (err) { console.error(err); }
    };
    const fetchMenuItems = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/menu`);
            setMenuItems(res.data.filter(i => i.availability));
        } catch (err) { console.error(err); }
    };
    useEffect(() => {
        fetchRoomServiceOrders();
        fetchOccupiedRooms();
        fetchMenuItems();
    }, []);

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i._id === item._id);
            if (existing) return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { ...item, quantity: 1, notes: "" }];
        });
    };
    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(i => i._id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0));
    };
    const removeFromCart = (id) => {
        setCart(prev => prev.filter(i => i._id !== id));
    };

    const placeOrder = async () => {
        if (!selectedRoom) { setError("Please select a room"); return; }
        if (cart.length === 0) { setError("Please add at least one item"); return; }
        setLoading(true);
        setError("");
        const payload = {
            orderType: "Room Service",
            roomNumber: selectedRoom,
            customerName: `Room ${selectedRoom}`,
            items: cart.map(i => ({ menuItem: i._id, quantity: i.quantity, notes: i.notes || "" })),
            orderStatus: "Pending",
            kitchenNotes: "",
        };
        try {
            await axios.post(`${BASE_URL}/orders`, payload);
            setCart([]);
            setSelectedRoom("");
            setShowModal(false);
            fetchRoomServiceOrders();
            alert("Order placed!");
        } catch (err) {
            setError(err.response?.data?.error || "Failed to place order");
        } finally { setLoading(false); }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            const order = orders.find(o => o._id === orderId);
            if (!order) return;
            const payload = {
                orderType: order.orderType,
                roomNumber: order.roomNumber,
                customerName: order.customerName,
                items: order.items.map(i => ({ menuItem: i.menuItem?._id || i.menuItem, quantity: i.quantity, notes: i.notes || "" })),
                orderStatus: newStatus,
                kitchenNotes: order.kitchenNotes,
            };
            await axios.put(`${BASE_URL}/orders/${orderId}`, payload);
            fetchRoomServiceOrders();
            // auto‑bill when Completed
            if (newStatus === "Completed") {
                const room = order.roomNumber;
                const allOrders = (await axios.get(`${BASE_URL}/orders`)).data;
                const roomOrders = allOrders.filter(o => o.roomNumber === room && o.orderStatus === "Completed");
                const totalFood = roomOrders.reduce((sum, o) => {
                    return sum + o.items.reduce((s, i) => s + (i.price || i.menuItem?.price || 0) * i.quantity, 0);
                }, 0);
                const billRes = await axios.get(`${BASE_URL}/roombilling?room=${room}`);
                if (billRes.data && billRes.data.length > 0) {
                    await axios.put(`${BASE_URL}/roombilling/${billRes.data[0]._id}`, { foodCharges: totalFood });
                } else {
                    await axios.post(`${BASE_URL}/roombilling`, { room, foodCharges: totalFood, roomRent: 0, laundry: 0, extraServices: 0, tax: 0, status: "Pending" });
                }
            }
        } catch (err) { alert("Status update failed"); }
    };

    const deleteOrder = async (id) => {
        if (!window.confirm("Delete?")) return;
        await axios.delete(`${BASE_URL}/orders/${id}`);
        fetchRoomServiceOrders();
    };

    const STATUS_STYLES = {
        Pending: { background: "#FFF8E1", color: "#F9A825" },
        Preparing: { background: "#E3F2FD", color: "#1565C0" },
        Ready: { background: "#E8F5E9", color: "#2E7D32" },
        Completed: { background: "#E0F2F1", color: "#00897B" },
        Cancelled: { background: "#FFEBEE", color: "#C62828" },
    };
    const delBtn = {
        background: "#FFEBEE", border: "1px solid #EF9A9A", color: "#C62828",
        borderRadius: "8px", padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
    };

    const getItemName = (item) => {
        if (item.name) return item.name;
        if (item.menuItem) {
            if (typeof item.menuItem === "object") return item.menuItem.name;
            return "Item";
        }
        return "Unknown";
    };

    return (
        <div className="container-fluid px-3 px-md-4 py-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">🛎️ Room Service Management</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>{orders.length} order(s)</p>
                </div>
                <button className="btn btn-warning" onClick={() => setShowModal(true)}>+ New Order</button>
            </div>
            {error && <div className="alert alert-danger mb-3">{error}</div>}
            {/* Orders table */}
            <div className="card-premium shadow-sm border-0">
                <div className="card-header bg-danger" style={{ borderTopLeftRadius: "5px", borderTopRightRadius: "5px", padding: "5px" }}>
                    <p className="mb-0 bg-danger text-white fw-bold " style={{ padding: "5px" }}>Room Service Orders</p>
                </div>
                <div className="table-responsive">
                    <table className="table-premium mb-0">
                        <thead><tr><th>Room No</th><th>Items</th><th>Total (₹)</th><th>Status</th><th>Update Status</th><th>Action</th></tr></thead>
                        <tbody>
                            {orders.map(order => {
                                const total = order.items.reduce((sum, i) => sum + (i.price || i.menuItem?.price || 0) * i.quantity, 0).toFixed(2);
                                return (
                                    <tr key={order._id}>
                                        <td style={{ fontWeight: 700 }}>{order.roomNumber || order.customerName?.replace("Room ", "") || "—"}</td>
                                        <td className="table-inline-items">
                                            {order.items.map((item, idx) => (
                                                <span key={idx} className="item-chip">
                                                    {item.quantity}× {getItemName(item)}
                                                </span>
                                            ))}
                                        </td>
                                        <td style={{ fontWeight: 700, color: "#C62828" }}>₹{total}</td>
                                        <td><span style={{ ...STATUS_STYLES[order.orderStatus], display: "inline-block", padding: "4px 14px", borderRadius: 40, fontSize: "0.75rem", fontWeight: 600 }}>{order.orderStatus}</span></td>
                                        <td>
                                            <select className="form-select" value={order.orderStatus} onChange={(e) => updateStatus(order._id, e.target.value)} style={{ width: "auto", minWidth: "130px", fontSize: "0.8rem" }}>
                                                <option value="Pending">Pending</option><option value="Preparing">Preparing</option><option value="Ready">Ready</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td><button style={delBtn} onClick={() => deleteOrder(order._id)}>🗑️ Delete</button></td>
                                    </tr>
                                );
                            })}
                            {orders.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-5">No room service orders</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modal */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header border-0 pb-0" style={{ backgroundColor: "#f8f9fa", borderBottom: "4px solid #007bff" }}>
                                <h5 className="modal-title fw-bold text-dark">➕ New Room Service Order</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body p-4 bg-white">
                                {error && <div className="alert alert-danger mb-3">{error}</div>}
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Select Occupied Room *</label>
                                        <select className="form-select" value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
                                            <option value="">-- Choose a room --</option>
                                            {occupiedRooms.map(room => <option key={room._id} value={room.roomNumber}>Room {room.roomNumber} - {room.type} (₹{room.price}/night)</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="row g-4">
                                    <div className="col-md-7"><h6 className="mb-3">🍽️ Menu — click any item to add</h6><MenuPicker menuItems={menuItems} onAdd={addToCart} /></div>
                                    <div className="col-md-5"><h6 className="mb-3">🛒 Current Order{cart.length > 0 && <span style={{ marginLeft: 8, background: "#C62828", color: "white", borderRadius: "50%", padding: "2px 7px", fontSize: "0.72rem" }}>{cart.reduce((s, i) => s + i.quantity, 0)}</span>}</h6><Cart items={cart} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} /></div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0 pb-4 px-4">
                                <button className="btn-outline-red" onClick={() => setShowModal(false)}>Cancel</button>
                                <button className="btn-gradient-primary" onClick={placeOrder} disabled={loading || cart.length === 0 || !selectedRoom}>{loading ? "Placing..." : "Place Order"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}