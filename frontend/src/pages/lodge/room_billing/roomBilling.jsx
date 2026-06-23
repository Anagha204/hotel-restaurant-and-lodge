import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

// Reusable styles
const STATUS_STYLES = {
    Pending: { background: "#FFF8E1", color: "#F9A825" },
    Generated: { background: "#E3F2FD", color: "#1565C0" },
    Paid: { background: "#E8F5E9", color: "#2E7D32" },
};

const editBtn = {
    background: "#FFF8E1",
    border: "1px solid #F9A825",
    color: "#E65100",
    borderRadius: "8px",
    padding: "5px 14px",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
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
    padding: "8px 24px",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s",
};

const outlineRedBtn = {
    background: "white",
    border: "1px solid #C62828",
    borderRadius: "8px",
    padding: "8px 24px",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#C62828",
    cursor: "pointer",
    transition: "all 0.2s",
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
                transition: "all 0.2s",
                ...(active ? {} : style),
            }}
        >
            {label}
        </button>
    );
}

export default function RoomBilling() {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({});
    const [bills, setBills] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [checkedInRooms, setCheckedInRooms] = useState([]);
    const [customCheckoutDateTime, setCustomCheckoutDateTime] = useState("");

    const [newBill, setNewBill] = useState({
        room: "",
        roomRent: 0,
        foodCharges: 0,
        laundry: 0,
        extraServices: 0,
        tax: 0,
        status: "Generated",
    });

    // Fetch all orders to calculate food charges (room service)
    const fetchOrders = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/orders");
            return res.data;
        } catch (err) {
            console.error("Failed to fetch orders", err);
            return [];
        }
    };

    // Fetch all services (amenities) for a given room
    const fetchServicesForRoom = async (roomNumber) => {
        try {
            const res = await axios.get("http://localhost:5000/api/services");
            const allServices = res.data;
            const roomServices = allServices.filter(s => s.room === roomNumber && s.status !== "Billed");
            return roomServices;
        } catch (err) {
            console.error("Failed to fetch services", err);
            return [];
        }
    };

    // Calculate total food charges for a room from completed room service orders
    const calculateFoodChargesForRoom = async (roomNumber) => {
        const orders = await fetchOrders();
        const roomOrders = orders.filter(
            o => o.orderType === "Room Service" &&
                o.roomNumber === roomNumber &&
                o.orderStatus === "Completed"
        );
        let total = 0;
        for (const order of roomOrders) {
            for (const item of order.items) {
                const price = item.price || item.menuItem?.price || 0;
                total += price * item.quantity;
            }
        }
        return total;
    };

    // Calculate amenity charges (laundry + extra) for a room
    const calculateAmenityCharges = async (roomNumber) => {
        const services = await fetchServicesForRoom(roomNumber);
        let laundryTotal = 0;
        let extraTotal = 0;
        for (const s of services) {
            const charge = s.charge || 0;
            if (s.serviceName && s.serviceName.toLowerCase().includes("laundry")) {
                laundryTotal += charge;
            } else {
                extraTotal += charge;
            }
        }
        return { laundryTotal, extraTotal };
    };

    // Fetch check-in record for a given room (to get actual check-in time)
    const fetchCheckinForRoom = async (roomNumber) => {
        try {
            const res = await axios.get("http://localhost:5000/api/checkin");
            const checkins = res.data;
            const active = checkins.find(c => c.booking?.room?.roomNumber === roomNumber && !c.checkOutTime);
            if (active) return active;
            const alt = checkins.find(c => c.booking?.roomNumber === roomNumber && !c.checkOutTime);
            return alt || null;
        } catch (err) {
            console.error("Failed to fetch checkin data", err);
            return null;
        }
    };

    // Calculate room rent based on actual stay duration
    const calculateRoomRent = (nightlyPrice, checkinTime, checkoutDateTime) => {
        const ci = new Date(checkinTime);
        const co = checkoutDateTime ? new Date(checkoutDateTime) : new Date();
        if (co <= ci) return nightlyPrice;
        const nights = Math.ceil((co - ci) / (1000 * 60 * 60 * 24));
        return nightlyPrice * nights;
    };

    // Auto‑fill all charges when room is selected
    const handleRoomSelect = async (roomId) => {
        const selected = checkedInRooms.find((r) => r._id === roomId);
        if (!selected) return;

        const checkin = await fetchCheckinForRoom(selected.roomNumber);
        let computedRoomRent = selected.price || 0;
        let checkinTime = null;

        if (checkin && checkin.checkInTime) {
            checkinTime = checkin.checkInTime;
            const checkoutValue = customCheckoutDateTime || new Date().toISOString();
            computedRoomRent = calculateRoomRent(selected.price, checkinTime, checkoutValue);
        }

        const foodCharges = await calculateFoodChargesForRoom(selected.roomNumber);
        const { laundryTotal, extraTotal } = await calculateAmenityCharges(selected.roomNumber);

        setNewBill({
            ...newBill,
            room: selected.roomNumber,
            roomRent: computedRoomRent,
            foodCharges: foodCharges,
            laundry: laundryTotal,
            extraServices: extraTotal,
        });
    };

    // When custom checkout datetime changes, recalc room rent
    useEffect(() => {
        if (newBill.room && customCheckoutDateTime) {
            const selectedRoom = checkedInRooms.find(r => r.roomNumber === newBill.room);
            if (selectedRoom) {
                fetchCheckinForRoom(newBill.room).then(checkin => {
                    if (checkin && checkin.checkInTime) {
                        const newRent = calculateRoomRent(selectedRoom.price, checkin.checkInTime, customCheckoutDateTime);
                        setNewBill(prev => ({ ...prev, roomRent: newRent }));
                    }
                });
            }
        }
    }, [customCheckoutDateTime, newBill.room, checkedInRooms]);

    // Refresh charges for edit mode
    const refreshChargesForEdit = async (roomNumber) => {
        const newFoodCharges = await calculateFoodChargesForRoom(roomNumber);
        const { laundryTotal, extraTotal } = await calculateAmenityCharges(roomNumber);
        const selectedRoom = checkedInRooms.find(r => r.roomNumber === roomNumber);
        let computedRoomRent = editData.roomRent;
        if (selectedRoom) {
            const checkin = await fetchCheckinForRoom(roomNumber);
            if (checkin && checkin.checkInTime) {
                const checkoutValue = editData.checkoutDateTime || new Date().toISOString();
                computedRoomRent = calculateRoomRent(selectedRoom.price, checkin.checkInTime, checkoutValue);
            }
        }
        setEditData({
            ...editData,
            roomRent: computedRoomRent,
            foodCharges: newFoodCharges,
            laundry: laundryTotal,
            extraServices: extraTotal,
        });
    };

    const fetchCheckedInRooms = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/room");
            const occupied = res.data.filter(room => room.status === "Occupied");
            setCheckedInRooms(occupied);
        } catch (err) {
            console.log("Error fetching rooms:", err);
        }
    };

    const fetchBills = async () => {
        const res = await axios.get("http://localhost:5000/api/roombilling");
        setBills(res.data);
    };

    useEffect(() => {
        fetchBills();
        fetchCheckedInRooms();
    }, []);

    const filteredBills = bills.filter((b) => {
        if (statusFilter !== "All" && b.status !== statusFilter) return false;
        if (search && !(b.room || "").toString().includes(search)) return false;
        return true;
    });

    const calculateTotal = (b) => {
        const subtotal =
            Number(b.roomRent) +
            Number(b.foodCharges) +
            Number(b.laundry) +
            Number(b.extraServices);
        return subtotal + (subtotal * Number(b.tax)) / 100;
    };

    const addBill = async () => {
        if (!newBill.room) {
            Swal.fire("Error", "Please select a checked-in room", "warning");
            return;
        }
        await axios.post("http://localhost:5000/api/roombilling", { ...newBill, status: "Generated" });
        fetchBills();
        setShowForm(false);
        setNewBill({
            room: "",
            roomRent: 0,
            foodCharges: 0,
            laundry: 0,
            extraServices: 0,
            tax: 0,
            status: "Generated",
        });
        setCustomCheckoutDateTime("");
    };

    // ─── Cashfree payment handler (identical to billing.jsx) ────────────────
    const handleRoomPayment = async (bill) => {
        const total = calculateTotal(bill);
        if (total <= 0) {
            Swal.fire("Error", "Total amount is ₹0. Nothing to pay.", "warning");
            return;
        }

        try {
            // Step 1: Create Cashfree order
            const { data } = await axios.post("http://localhost:5000/api/payment/create-order", {
                amount: Math.round(total),
                type: "lodge",
                customerName: `Room ${bill.room}`,
                customerPhone: "9999999999",
                customerEmail: "guest@hotel.com"
            });

            // Step 2: Open Cashfree popup
            const cashfree = await window.Cashfree({ mode: "sandbox" });

            cashfree.checkout({
                paymentSessionId: data.paymentSessionId,
                redirectTarget: "_modal",
            }).then(async (result) => {
                if (result.error) {
                    Swal.fire("Payment Failed", result.error.message, "error");
                } else if (result.redirect) {
                    // Redirect happened – verify on return (not expected in modal mode)
                    console.log("Redirect occurred, verification will happen on return page.");
                } else {
                    // Step 3: Verify payment
                    const verify = await axios.post("http://localhost:5000/api/payment/verify-payment", {
                        orderId: data.orderId
                    });
                    if (verify.data.success) {
                        // Step 4: Mark bill as Paid
                        await axios.put(`http://localhost:5000/api/roombilling/${bill._id}`, {
                            ...bill,
                            status: "Paid"
                        });
                        fetchBills();
                        Swal.fire("Success", `Payment successful! Room ${bill.room} bill marked as Paid.`, "success");
                    } else {
                        Swal.fire("Error", "Payment verification failed!", "error");
                    }
                }
            });
        } catch (err) {
            Swal.fire("Error", "Could not initialize payment. Check your backend.", "error");
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this bill?")) return;
        await axios.delete(`http://localhost:5000/api/roombilling/${id}`);
        setBills(bills.filter((b) => b._id !== id));
    };

    const saveEdit = async (id) => {
        try {
            await axios.put(`http://localhost:5000/api/roombilling/${id}`, {
                room: editData.room,
                roomRent: Number(editData.roomRent),
                foodCharges: Number(editData.foodCharges),
                laundry: Number(editData.laundry),
                extraServices: Number(editData.extraServices),
                tax: Number(editData.tax),
                status: editData.status,
            });
            setEditId(null);
            setEditData({});
            fetchBills();
        } catch (err) {
            console.log("EDIT ERROR:", err);
            Swal.fire("Error", "Error updating bill", "error");
        }
    };

    // ─── Print receipt with scrollable window ──────────────────────────────
    const printBill = (b) => {
        const subtotal =
            Number(b.roomRent) +
            Number(b.foodCharges) +
            Number(b.laundry) +
            Number(b.extraServices);
        const taxAmount = (subtotal * Number(b.tax)) / 100;
        const total = subtotal + taxAmount;

        const win = window.open("", "", "width=900,height=700");
        win.document.write(`
            <html>
            <head>
                <title>Hotel Invoice</title>
                <style>
                    body { font-family: 'Arial', padding: 30px; background: #fff; overflow: auto; }
                    .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    h2 { margin: 0; }
                    .details { margin-top: 20px; }
                    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd; }
                    .label { font-weight: bold; }
                    .total { margin-top: 20px; font-size: 22px; font-weight: bold; text-align: right; color: green; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                    .stamp { margin-top: 20px; text-align: right; font-weight: bold; color: #444; }
                </style>
            </head>
            <body>
                <div class="invoice-box">
                    <div class="header">
                        <h2>MANGALORE INTERNATIONAL LODGE</h2>
                        <p>Luxury Stay & Comfort</p>
                    </div>
                    <div class="details">
                        <div class="row"><span class="label">Room Number</span><span>${b.room}</span></div>
                        <div class="row"><span class="label">Room Rent (total stay)</span><span>₹${b.roomRent}</span></div>
                        <div class="row"><span class="label">Food Charges</span><span>₹${b.foodCharges}</span></div>
                        <div class="row"><span class="label">Laundry</span><span>₹${b.laundry}</span></div>
                        <div class="row"><span class="label">Extra Services</span><span>₹${b.extraServices}</span></div>
                        <div class="row"><span class="label">Tax</span><span>${b.tax}%</span></div>
                    </div>
                    <div class="total">GRAND TOTAL: ₹${total}</div>
                    <div class="stamp">Status: ${b.status}</div>
                    <div class="footer">
                        Thank you for staying with us ❤️<br/>
                        Visit Again | Mangalore International<br/>
                        &copy; 2026 Mangalore International
                    </div>
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `);
        win.document.close();
    };

    return (
        <div className="container-fluid px-3 px-md-4 py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">💳 Room Billing Console</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        {filteredBills.length} of {bills.length} bill{bills.length !== 1 ? "s" : ""} displayed
                    </p>
                </div>
                <button className="btn btn-warning" onClick={() => setShowForm(true)}>
                    + New Bill
                </button>
            </div>

            {/* Status Filter Chips */}
            <div className="d-flex flex-wrap gap-2 mb-4">
                <Chip
                    label={`All (${bills.length})`}
                    active={statusFilter === "All"}
                    onClick={() => setStatusFilter("All")}
                />
                {Object.entries(STATUS_STYLES).map(([status, style]) => {
                    const count = bills.filter((b) => b.status === status).length;
                    return (
                        <Chip
                            key={status}
                            label={`${status} (${count})`}
                            active={statusFilter === status}
                            onClick={() => setStatusFilter(status)}
                            style={style}
                        />
                    );
                })}
            </div>

            {/* Search Bar */}
            <div className="mb-4">
                <input
                    className="form-control"
                    placeholder="🔍 Search by room number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ borderRadius: "40px", maxWidth: "300px" }}
                />
            </div>

            {/* Modal: Add New Bill */}
            {showForm && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div
                                className="modal-header border-0 pb-0"
                                style={{ backgroundColor: "#f8f9fa", borderBottom: "4px solid #007bff" }}
                            >
                                <h5 className="modal-title fw-bold text-dark mb-2">➕ Generate New Bill</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowForm(false);
                                        setCustomCheckoutDateTime("");
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body p-4 bg-white">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Select Checked-In Room</label>
                                        <select
                                            className="form-select"
                                            value={newBill.room ? checkedInRooms.find(r => r.roomNumber === newBill.room)?._id : ""}
                                            onChange={(e) => handleRoomSelect(e.target.value)}
                                            required
                                        >
                                            <option value="">-- Choose a checked-in room --</option>
                                            {checkedInRooms.length === 0 && (
                                                <option disabled>No rooms are currently checked in</option>
                                            )}
                                            {checkedInRooms.map((room) => (
                                                <option key={room._id} value={room._id}>
                                                    {room.roomNumber} - {room.type} (₹{room.price}/night)
                                                </option>
                                            ))}
                                        </select>
                                        {checkedInRooms.length === 0 && (
                                            <div className="text-warning small mt-1">⚠️ No occupied rooms available for billing.</div>
                                        )}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Actual Check‑Out Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            value={customCheckoutDateTime}
                                            onChange={(e) => setCustomCheckoutDateTime(e.target.value)}
                                        />
                                        <small className="text-muted">
                                            Leave empty to use current date/time (early checkout).<br />
                                            Change for late checkout.
                                        </small>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Room Rent (₹) *</label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            value={newBill.roomRent}
                                            readOnly
                                            style={{ backgroundColor: "#e9ecef" }}
                                        />
                                        <small className="text-muted">Auto‑calculated × nights stayed.</small>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Food Charges (₹)</label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            value={newBill.foodCharges}
                                            onChange={(e) => setNewBill({ ...newBill, foodCharges: e.target.value })}
                                        />
                                        <small className="text-muted">Auto‑filled from completed room service orders.</small>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Laundry (₹)</label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            value={newBill.laundry}
                                            onChange={(e) => setNewBill({ ...newBill, laundry: e.target.value })}
                                        />
                                        <small className="text-muted">Auto‑filled from laundry services.</small>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Extra Services (₹)</label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            value={newBill.extraServices}
                                            onChange={(e) => setNewBill({ ...newBill, extraServices: e.target.value })}
                                        />
                                        <small className="text-muted">Auto‑filled from other amenities.</small>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Tax (%)</label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            value={newBill.tax}
                                            onChange={(e) => setNewBill({ ...newBill, tax: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0 pb-4 px-4">
                                <button
                                    style={outlineRedBtn}
                                    onClick={() => {
                                        setShowForm(false);
                                        setCustomCheckoutDateTime("");
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FFEBEE")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                                >
                                    Cancel
                                </button>
                                <button
                                    style={primaryBtn}
                                    onClick={addBill}
                                    disabled={checkedInRooms.length === 0}
                                    onMouseEnter={(e) => {
                                        if (checkedInRooms.length === 0) return;
                                        e.currentTarget.style.background = "linear-gradient(135deg, #0056b3, #004099)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (checkedInRooms.length === 0) return;
                                        e.currentTarget.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
                                    }}
                                >
                                    Generate Bill
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bills Grid */}
            {filteredBills.length === 0 ? (
                <div className="card-premium shadow-sm border-0 p-4 text-center text-muted">
                    No billing records match the current filter.
                </div>
            ) : (
                <div className="row g-4 mb-4">
                    {filteredBills.map((b) => (
                        <div className="col-md-4" key={b._id}>
                            <div className="card-premium shadow-sm border-0 h-100">
                                <div
                                    className="card-header-gradient d-flex justify-content-between align-items-center"
                                    style={{
                                        background: "#C62828",
                                        borderBottom: "2px solid #007bff",
                                        padding: "0.75rem 1rem",
                                    }}
                                >
                                    <strong style={{ fontSize: "0.9rem" }}>Room {b.room}</strong>
                                    <span
                                        style={{
                                            ...(STATUS_STYLES[b.status] || STATUS_STYLES.Pending),
                                            display: "inline-block",
                                            padding: "4px 12px",
                                            borderRadius: "40px",
                                            fontSize: "0.7rem",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {b.status}
                                    </span>
                                </div>
                                <div className="card-body p-3">
                                    {editId === b._id ? (
                                        // Edit mode
                                        <>
                                            <input
                                                className="form-control mb-2"
                                                placeholder="Room"
                                                value={editData.room}
                                                onChange={(e) => setEditData({ ...editData, room: e.target.value })}
                                            />
                                            <input
                                                className="form-control mb-2"
                                                type="number"
                                                placeholder="Room Rent"
                                                value={editData.roomRent}
                                                onChange={(e) => setEditData({ ...editData, roomRent: e.target.value })}
                                            />
                                            <div className="input-group mb-2">
                                                <input
                                                    className="form-control"
                                                    type="number"
                                                    placeholder="Food Charges"
                                                    value={editData.foodCharges}
                                                    onChange={(e) => setEditData({ ...editData, foodCharges: e.target.value })}
                                                />
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={() => refreshChargesForEdit(editData.room)}
                                                    style={{ whiteSpace: "nowrap" }}
                                                >
                                                    🔄 Refresh
                                                </button>
                                            </div>
                                            <div className="input-group mb-2">
                                                <input
                                                    className="form-control"
                                                    type="number"
                                                    placeholder="Laundry"
                                                    value={editData.laundry}
                                                    onChange={(e) => setEditData({ ...editData, laundry: e.target.value })}
                                                />
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={() => refreshChargesForEdit(editData.room)}
                                                    style={{ whiteSpace: "nowrap" }}
                                                >
                                                    🔄 Refresh
                                                </button>
                                            </div>
                                            <div className="input-group mb-2">
                                                <input
                                                    className="form-control"
                                                    type="number"
                                                    placeholder="Extra Services"
                                                    value={editData.extraServices}
                                                    onChange={(e) => setEditData({ ...editData, extraServices: e.target.value })}
                                                />
                                                <button
                                                    className="btn btn-outline-secondary"
                                                    type="button"
                                                    onClick={() => refreshChargesForEdit(editData.room)}
                                                    style={{ whiteSpace: "nowrap" }}
                                                >
                                                    🔄 Refresh
                                                </button>
                                            </div>
                                            <input
                                                className="form-control mb-2"
                                                type="number"
                                                placeholder="Tax %"
                                                value={editData.tax}
                                                onChange={(e) => setEditData({ ...editData, tax: e.target.value })}
                                            />
                                            <select
                                                className="form-select mb-3"
                                                value={editData.status}
                                                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Generated">Generated</option>
                                                <option value="Paid">Paid</option>
                                            </select>
                                            <button className="btn btn-success w-100" onClick={() => saveEdit(b._id)}>
                                                💾 Save Changes
                                            </button>
                                        </>
                                    ) : (
                                        // View mode
                                        <>
                                            <p className="mb-1">🛏 Room Rent (total): ₹{b.roomRent}</p>
                                            <p className="mb-1">🍽 Food: ₹{b.foodCharges}</p>
                                            <p className="mb-1">🧺 Laundry: ₹{b.laundry}</p>
                                            <p className="mb-1">➕ Extra: ₹{b.extraServices}</p>
                                            <p className="mb-2">📊 Tax: {b.tax}%</p>
                                            <hr />
                                            <h5 className="text-success mb-3">💰 Total: ₹{calculateTotal(b)}</h5>
                                            <button
                                                className="btn btn-warning w-100 mb-2"
                                                onClick={() => {
                                                    setEditId(b._id);
                                                    setEditData({
                                                        room: b.room,
                                                        roomRent: b.roomRent,
                                                        foodCharges: b.foodCharges,
                                                        laundry: b.laundry,
                                                        extraServices: b.extraServices,
                                                        tax: b.tax,
                                                        status: b.status,
                                                    });
                                                }}
                                            >
                                                ✏️ Edit Bill
                                            </button>
                                        </>
                                    )}
                                    <div className="d-flex gap-2 mt-3 flex-wrap">
                                        <button style={delBtn} onClick={() => handleDelete(b._id)}>
                                            🗑️ Delete
                                        </button>
                                        <button style={editBtn} onClick={() => printBill(b)}>
                                            🖨️ Print
                                        </button>
                                        {b.status !== "Paid" ? (
                                            <button
                                                onClick={() => handleRoomPayment(b)}
                                                style={{
                                                    background: "linear-gradient(135deg, #1a73e8, #0d47a1)",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    padding: "5px 14px",
                                                    fontSize: "0.78rem",
                                                    fontWeight: 600,
                                                    color: "white",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                💳 Pay Now
                                            </button>
                                        ) : (
                                            <span style={{
                                                background: "#E8F5E9",
                                                border: "1px solid #2E7D32",
                                                color: "#2E7D32",
                                                borderRadius: "8px",
                                                padding: "5px 14px",
                                                fontSize: "0.78rem",
                                                fontWeight: 600,
                                            }}>
                                                ✅ Paid
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}