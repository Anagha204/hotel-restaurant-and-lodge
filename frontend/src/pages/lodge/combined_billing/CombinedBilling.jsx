import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const BASE_URL = "http://localhost:5000/api";

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

export default function CombinedBilling() {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState({});
    const [bills, setBills] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [activeCheckins, setActiveCheckins] = useState([]);
    const [roomsMap, setRoomsMap] = useState({});
    const [allOrders, setAllOrders] = useState([]);
    const [roomBillingRecords, setRoomBillingRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const formatDateForInput = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d - tzOffset).toISOString().slice(0, 16);
    };

    const [newBill, setNewBill] = useState({
        room: "",
        guestName: "",
        phone: "",
        roomRent: 0,
        restaurantCharges: 0,
        roomService: 0,
        laundry: 0,
        extraServices: 0,
        advancePayment: 0,
        tax: 0,
        status: "Pending",
        checkInTime: "",
        checkOutTime: "",
    });

    // SAFE TOTAL CALCULATION
    const calculateTotal = (bill) => {
        const roomRent = Number(bill.roomRent) || 0;
        const restaurantCharges = Number(bill.restaurantCharges) || 0;
        const roomService = Number(bill.roomService) || 0;
        const laundry = Number(bill.laundry) || 0;
        const extraServices = Number(bill.extraServices) || 0;
        const advancePayment = Number(bill.advancePayment) || 0;
        const tax = Number(bill.tax) || 0;
        const subtotal = roomRent + restaurantCharges + roomService + laundry + extraServices;
        const finalTotal = subtotal + (subtotal * tax) / 100 - advancePayment;
        return finalTotal > 0 ? finalTotal : 0;
    };

    // Data Fetching
    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchBills(),
                fetchActiveCheckins(),
                fetchAllRooms(),
                fetchAllOrders(),
                fetchRoomBilling()
            ]);
        } catch (err) {
            console.error("Initial fetch error", err);
            setErrorMsg("Failed to load initial data. Check backend.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Auto-calc room rent on checkout change
    useEffect(() => {
        if (newBill.room && newBill.checkInTime && newBill.checkOutTime) {
            const basePrice = roomsMap[newBill.room]?.price || 0;
            const ci = new Date(newBill.checkInTime);
            const co = new Date(newBill.checkOutTime);
            let nights = 1;
            if (co > ci) {
                nights = Math.ceil((co - ci) / (1000 * 60 * 60 * 24));
            }
            const computedRent = basePrice * nights;
            if (newBill.roomRent !== computedRent) {
                setNewBill(prev => ({ ...prev, roomRent: computedRent }));
            }
        }
    }, [newBill.checkOutTime, newBill.checkInTime, newBill.room, roomsMap]);

    const fetchAllRooms = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/room`);
            const map = {};
            res.data.forEach((room) => {
                map[room.roomNumber] = { price: room.price, type: room.type };
            });
            setRoomsMap(map);
        } catch (err) {
            console.log("Error fetching rooms", err);
        }
    };

    const fetchActiveCheckins = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/checkin`);
            const active = res.data.filter(c => !c.checkOutTime);
            setActiveCheckins(active);
            if (active.length === 0) {
                setErrorMsg("No active check-ins found. Please check in guests first.");
            } else {
                setErrorMsg("");
            }
        } catch (err) {
            console.error("Error fetching active check-ins", err);
            setErrorMsg("Could not fetch active check-ins.");
        }
    };

    const fetchBills = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/combinedbilling`);
            setBills(res.data);
        } catch (err) {
            console.error("Error fetching bills", err);
        }
    };

    const fetchAllOrders = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/orders`);
            setAllOrders(res.data);
        } catch (err) {
            console.error("Failed to fetch orders", err);
        }
    };

    const fetchRoomBilling = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/roombilling`);
            setRoomBillingRecords(res.data);
        } catch (err) {
            console.error("Failed to fetch room billing", err);
        }
    };

    // Helper functions
    const calculateOrderChargesForRoom = (roomNumber) => {
        let restaurantTotal = 0;
        let roomServiceTotal = 0;
        for (const order of allOrders) {
            if (order.orderStatus !== "Completed") continue;
            if (order.orderType !== "Room Service" && order.assignedRoom === roomNumber) {
                for (const item of order.items) {
                    const price = item.price || item.menuItem?.price || 0;
                    restaurantTotal += price * item.quantity;
                }
            }
            else if (order.orderType === "Room Service" && order.roomNumber === roomNumber) {
                for (const item of order.items) {
                    const price = item.price || item.menuItem?.price || 0;
                    roomServiceTotal += price * item.quantity;
                }
            }
        }
        return { restaurantTotal, roomServiceTotal };
    };

    const getRoomBillingDetails = (roomNumber) => {
        const billing = roomBillingRecords.find(b => b.room === roomNumber);
        if (billing) {
            return {
                laundry: billing.laundry || 0,
                extraServices: billing.extraServices || 0,
                roomRent: billing.roomRent || 0
            };
        }
        return { laundry: 0, extraServices: 0, roomRent: 0 };
    };

    const getPhoneFromCheckin = (checkin) => {
        if (checkin.booking?.guest?.mobile) return checkin.booking.guest.mobile;
        if (checkin.booking?.mobile) return checkin.booking.mobile;
        if (checkin.mobile) return checkin.mobile;
        if (checkin.guestMobile) return checkin.guestMobile;
        if (checkin.phone) return checkin.phone;
        return "";
    };

    const getRoomAndGuestFromCheckin = (checkin) => {
        let roomNumber = null;
        let guestName = null;
        let phone = "";
        let advancePayment = Number(checkin.advancePayment) || 0;

        if (checkin.booking?.room?.roomNumber) {
            roomNumber = checkin.booking.room.roomNumber;
            guestName = checkin.booking.guest?.name || checkin.booking.guestName || "Guest";
            phone = getPhoneFromCheckin(checkin);
        }
        else if (checkin.roomNumber) {
            roomNumber = checkin.roomNumber;
            guestName = checkin.guestName || "Guest";
            phone = getPhoneFromCheckin(checkin);
        }
        else if (checkin.room?.roomNumber) {
            roomNumber = checkin.room.roomNumber;
            guestName = checkin.guest?.name || checkin.guestName || "Guest";
            phone = getPhoneFromCheckin(checkin);
        }
        else {
            console.warn("Cannot extract room number from checkin:", checkin);
        }
        return { roomNumber, guestName, phone, advancePayment };
    };

    // ─── Cashfree payment handler (identical to billing.jsx) ────────────────
    const handleLodgePayment = async (bill) => {
        const total = calculateTotal(bill);
        if (total <= 0) {
            Swal.fire("Error", "Total amount is ₹0. Nothing to pay.", "warning");
            return;
        }

        try {
            // Step 1: Create Cashfree order
            const { data } = await axios.post(`${BASE_URL}/payment/create-order`, {
                amount: Math.round(total),
                type: "lodge",
                customerName: bill.guestName || "Guest",
                customerPhone: bill.phone || "9999999999",
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
                    // Redirect happened – verify on return (not expected)
                    console.log("Redirect occurred, verification will happen on return page.");
                } else {
                    // Step 3: Verify payment
                    const verify = await axios.post(`${BASE_URL}/payment/verify-payment`, {
                        orderId: data.orderId
                    });
                    if (verify.data.success) {
                        // Step 4: Mark bill as Paid
                        await axios.put(`${BASE_URL}/combinedbilling/${bill._id}`, {
                            ...bill,
                            status: "Paid"
                        });
                        await fetchBills();
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

    const handleGuestSelect = async (checkinId) => {
        const selectedCheckin = activeCheckins.find(c => c._id === checkinId);
        if (!selectedCheckin) {
            setErrorMsg("Selected check-in not found.");
            return;
        }

        const { roomNumber, guestName, phone, advancePayment } = getRoomAndGuestFromCheckin(selectedCheckin);
        if (!roomNumber) {
            setErrorMsg("Could not determine room number for this check-in.");
            return;
        }

        const checkInTimeStr = selectedCheckin.checkInTime || selectedCheckin.booking?.checkIn || "";

        await Promise.all([fetchAllOrders(), fetchRoomBilling()]);

        const roomPrice = roomsMap[roomNumber]?.price || 0;
        const { restaurantTotal, roomServiceTotal } = calculateOrderChargesForRoom(roomNumber);
        const roomBill = getRoomBillingDetails(roomNumber);

        setNewBill({
            ...newBill,
            guestName: guestName,
            room: roomNumber,
            phone: phone,
            checkInTime: formatDateForInput(checkInTimeStr),
            checkOutTime: formatDateForInput(new Date()),
            roomRent: roomPrice,
            restaurantCharges: restaurantTotal,
            roomService: roomServiceTotal,
            laundry: roomBill.laundry,
            extraServices: roomBill.extraServices,
            advancePayment: advancePayment,
        });
        setErrorMsg("");
    };

    const refreshChargesForEdit = async (roomNumber) => {
        await Promise.all([fetchAllOrders(), fetchRoomBilling()]);
        const { restaurantTotal, roomServiceTotal } = calculateOrderChargesForRoom(roomNumber);
        const roomBill = getRoomBillingDetails(roomNumber);
        setEditData(prev => ({
            ...prev,
            restaurantCharges: restaurantTotal,
            roomService: roomServiceTotal,
            laundry: roomBill.laundry,
            extraServices: roomBill.extraServices,
            roomRent: roomsMap[roomNumber]?.price || 0
        }));
    };

    const addBill = async () => {
        if (!newBill.room || !newBill.guestName) {
            setErrorMsg("Please select a checked‑in guest first.");
            return;
        }
        setLoading(true);
        setErrorMsg("");
        try {
            await axios.post(`${BASE_URL}/combinedbilling`, newBill);
            await fetchBills();
            setShowForm(false);
            setNewBill({
                room: "",
                guestName: "",
                phone: "",
                roomRent: 0,
                restaurantCharges: 0,
                roomService: 0,
                laundry: 0,
                extraServices: 0,
                advancePayment: 0,
                tax: 0,
                status: "Pending",
                checkInTime: "",
                checkOutTime: "",
            });
        } catch (err) {
            console.error("Add bill error:", err.response?.data || err.message);
            setErrorMsg(err.response?.data?.error || "Failed to create bill. Check backend logs.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this bill?")) return;
        try {
            await axios.delete(`${BASE_URL}/combinedbilling/${id}`);
            setBills(bills.filter((b) => b._id !== id));
        } catch (err) {
            Swal.fire("Error", "Error deleting bill", "error");
        }
    };

    const saveEdit = async (id) => {
        try {
            await axios.put(`${BASE_URL}/combinedbilling/${id}`, {
                room: editData.room,
                guestName: editData.guestName,
                phone: editData.phone || "",
                roomRent: Number(editData.roomRent) || 0,
                restaurantCharges: Number(editData.restaurantCharges) || 0,
                roomService: Number(editData.roomService) || 0,
                laundry: Number(editData.laundry) || 0,
                extraServices: Number(editData.extraServices) || 0,
                advancePayment: Number(editData.advancePayment) || 0,
                tax: Number(editData.tax) || 0,
                status: editData.status,
            });
            setEditId(null);
            setEditData({});
            await fetchBills();
        } catch (err) {
            console.error("Save edit error:", err);
            Swal.fire("Error", "Error updating bill", "error");
        }
    };

    // ─── Print receipt with scrollable window ──────────────────────────────
    const printBill = (b) => {
        const total = calculateTotal(b);
        const subtotal =
            (Number(b.roomRent) || 0) +
            (Number(b.restaurantCharges) || 0) +
            (Number(b.roomService) || 0) +
            (Number(b.laundry) || 0) +
            (Number(b.extraServices) || 0);
        const taxAmount = (subtotal * (Number(b.tax) || 0)) / 100;

        const win = window.open("", "", "width=900,height=700");
        win.document.write(`
            <html>
            <head>
                <title>Combined Billing Invoice</title>
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
                        <p>Combined Billing Invoice</p>
                    </div>
                    <div class="details">
                        <div class="row"><span class="label">Guest Name</span><span>${b.guestName || "Guest"}</span></div>
                        <div class="row"><span class="label">Phone</span><span>${b.phone || "—"}</span></div>
                        <div class="row"><span class="label">Room Number</span><span>${b.room}</span></div>
                        <div class="row"><span class="label">Room Type</span><span>${roomsMap[b.room]?.type || "—"}</span></div>
                        <div class="row"><span class="label">Room Rent</span><span>₹${Number(b.roomRent) || 0}</span></div>
                        <div class="row"><span class="label">Restaurant Charges</span><span>₹${Number(b.restaurantCharges) || 0}</span></div>
                        <div class="row"><span class="label">Room Service</span><span>₹${Number(b.roomService) || 0}</span></div>
                        <div class="row"><span class="label">Laundry</span><span>₹${Number(b.laundry) || 0}</span></div>
                        <div class="row"><span class="label">Extra Services</span><span>₹${Number(b.extraServices) || 0}</span></div>
                        <div class="row"><span class="label">Tax</span><span>${Number(b.tax) || 0}%</span></div>
                        <div class="row"><span class="label" style="color: #2E7D32;">Advance Paid</span><span style="color: #2E7D32;">-₹${Number(b.advancePayment) || 0}</span></div>
                    </div>
                    <div class="total">GRAND TOTAL: ₹${total.toFixed(2)}</div>
                    <div class="stamp">Status: ${b.status}</div>
                    <div class="footer">Thank you for staying with us ❤️<br/>Visit Again | Mangalore International</div>
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `);
        win.document.close();
    };

    const filteredBills = bills.filter((b) => {
        if (statusFilter !== "All" && b.status !== statusFilter) return false;
        if (
            search &&
            !(b.room || "").toLowerCase().includes(search) &&
            !(b.guestName || "").toLowerCase().includes(search)
        )
            return false;
        return true;
    });

    return (
        <div className="container-fluid px-3 px-md-4 py-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">🧾 Combined Restaurant + Lodge Billing</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        {filteredBills.length} of {bills.length} bill{bills.length !== 1 ? "s" : ""} displayed
                    </p>
                </div>
                <button className="btn btn-warning" onClick={() => setShowForm(true)}>+ New Combined Bill</button>
            </div>

            {errorMsg && (
                <div className="alert alert-danger mb-3" style={{ borderRadius: "10px", backgroundColor: "#FFEBEE", color: "#C62828" }}>
                    ⚠️ {errorMsg}
                </div>
            )}

            <div className="d-flex flex-wrap gap-2 mb-4">
                <Chip label={`All (${bills.length})`} active={statusFilter === "All"} onClick={() => setStatusFilter("All")} />
                {Object.entries(STATUS_STYLES).map(([status, style]) => {
                    const count = bills.filter((b) => b.status === status).length;
                    return <Chip key={status} label={`${status} (${count})`} active={statusFilter === status} onClick={() => setStatusFilter(status)} style={style} />;
                })}
            </div>

            <div className="mb-4">
                <input
                    className="form-control"
                    placeholder="🔍 Search by room number or guest name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value.toLowerCase())}
                    style={{ borderRadius: "40px", maxWidth: "350px" }}
                />
            </div>

            {/* New Bill Modal */}
            {showForm && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header border-0 pb-0" style={{ backgroundColor: "#f8f9fa", borderBottom: "4px solid #007bff" }}>
                                <h5 className="modal-title fw-bold text-dark mb-2">🧾 New Combined Bill</h5>
                                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                            </div>
                            <div className="modal-body p-4 bg-white">
                                <div className="row g-3">
                                    <div className="col-md-12">
                                        <label className="text-muted fw-bold mb-1">Select Currently Checked‑In Guest</label>
                                        <select
                                            className="form-select"
                                            onChange={(e) => handleGuestSelect(e.target.value)}
                                            value=""
                                        >
                                            <option value="">-- Choose a guest --</option>
                                            {activeCheckins.map((c) => {
                                                const { roomNumber, guestName, phone } = getRoomAndGuestFromCheckin(c);
                                                const roomInfo = roomsMap[roomNumber];
                                                const roomType = roomInfo ? ` (${roomInfo.type})` : "";
                                                return (
                                                    <option key={c._id} value={c._id}>
                                                        {guestName} - Room {roomNumber}{roomType} {phone ? `📞 ${phone}` : ""}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        {activeCheckins.length === 0 && (
                                            <div className="text-warning small mt-1">⚠️ No guests currently checked in.</div>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Room Number</label>
                                        <input className="form-control" value={newBill.room} disabled />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Guest Name</label>
                                        <input className="form-control" value={newBill.guestName} disabled />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Phone</label>
                                        <input className="form-control" value={newBill.phone} disabled />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Check-in Time</label>
                                        <input className="form-control" type="datetime-local" value={newBill.checkInTime} disabled />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Check-out Time</label>
                                        <input className="form-control" type="datetime-local" value={newBill.checkOutTime} onChange={(e) => setNewBill({ ...newBill, checkOutTime: e.target.value })} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Room Rent (₹)</label>
                                        <input className="form-control" type="number" value={newBill.roomRent} disabled style={{ backgroundColor: "#e9ecef" }} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Restaurant Charges (₹)</label>
                                        <input className="form-control" type="number" value={newBill.restaurantCharges} onChange={(e) => setNewBill({ ...newBill, restaurantCharges: e.target.value })} />
                                        <small className="text-muted">Auto‑filled from completed restaurant orders linked to this room</small>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Room Service (₹)</label>
                                        <input className="form-control" type="number" value={newBill.roomService} onChange={(e) => setNewBill({ ...newBill, roomService: e.target.value })} />
                                        <small className="text-muted">Auto‑filled from completed room service orders</small>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Laundry (₹)</label>
                                        <input className="form-control" type="number" value={newBill.laundry} onChange={(e) => setNewBill({ ...newBill, laundry: e.target.value })} />
                                        <small className="text-muted">Auto‑filled from room billing (laundry services)</small>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Extra Services (₹)</label>
                                        <input className="form-control" type="number" value={newBill.extraServices} onChange={(e) => setNewBill({ ...newBill, extraServices: e.target.value })} />
                                        <small className="text-muted">Auto‑filled from room billing</small>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Advance Pay (₹)</label>
                                        <input className="form-control" type="number" value={newBill.advancePayment} onChange={(e) => setNewBill({ ...newBill, advancePayment: e.target.value })} />
                                        <small className="text-muted">Auto‑filled from check-in</small>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Tax (%)</label>
                                        <input className="form-control" type="number" value={newBill.tax} onChange={(e) => setNewBill({ ...newBill, tax: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0 pb-4 px-4">
                                <button
                                    style={outlineRedBtn}
                                    onClick={() => setShowForm(false)}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FFEBEE")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                                >
                                    Cancel
                                </button>
                                <button
                                    style={primaryBtn}
                                    onClick={addBill}
                                    disabled={loading || activeCheckins.length === 0}
                                    onMouseEnter={(e) => {
                                        if (activeCheckins.length === 0) return;
                                        e.currentTarget.style.background = "linear-gradient(135deg, #0056b3, #004099)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeCheckins.length === 0) return;
                                        e.currentTarget.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
                                    }}
                                >
                                    {loading ? "Creating..." : "Generate Combined Bill"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bills Grid */}
            {filteredBills.length === 0 ? (
                <div className="card-premium shadow-sm border-0 p-4 text-center text-muted">
                    No combined bills match the current filter.
                </div>
            ) : (
                <div className="row g-4">
                    {filteredBills.map((b) => (
                        <div className="col-lg-4 col-md-6" key={b._id}>
                            <div className="card-premium shadow-sm border-0 h-100">
                                <div className="card-header-gradient d-flex justify-content-between align-items-center" style={{ background: "#C62828", borderBottom: "2px solid #007bff", padding: "0.75rem 1rem" }}>
                                    <div>
                                        <strong>Room {b.room} {roomsMap[b.room] && `(${roomsMap[b.room].type})`}</strong>
                                        <div style={{ fontSize: "0.7rem", color: "#f8f9fa" }}>{b.guestName || "Guest"} {b.phone && `📞 ${b.phone}`}</div>
                                    </div>
                                    <span style={{ ...(STATUS_STYLES[b.status] || STATUS_STYLES.Pending), display: "inline-block", padding: "4px 12px", borderRadius: "40px", fontSize: "0.7rem", fontWeight: 600 }}>{b.status}</span>
                                </div>
                                <div className="card-body p-3">
                                    {editId === b._id ? (
                                        <div className="d-flex flex-column gap-2">
                                            <input className="form-control form-control-sm" placeholder="Room" value={editData.room} onChange={e => setEditData({ ...editData, room: e.target.value })} />
                                            <input className="form-control form-control-sm" placeholder="Guest" value={editData.guestName} onChange={e => setEditData({ ...editData, guestName: e.target.value })} />
                                            <input className="form-control form-control-sm" placeholder="Phone" value={editData.phone || ""} onChange={e => setEditData({ ...editData, phone: e.target.value })} />
                                            <input className="form-control form-control-sm" type="number" placeholder="Rent" value={editData.roomRent} onChange={e => setEditData({ ...editData, roomRent: e.target.value })} />
                                            <div className="input-group">
                                                <input className="form-control form-control-sm" type="number" placeholder="Restaurant" value={editData.restaurantCharges} onChange={e => setEditData({ ...editData, restaurantCharges: e.target.value })} />
                                                <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => refreshChargesForEdit(editData.room)}>🔄</button>
                                            </div>
                                            <div className="input-group">
                                                <input className="form-control form-control-sm" type="number" placeholder="Room Service" value={editData.roomService} onChange={e => setEditData({ ...editData, roomService: e.target.value })} />
                                                <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => refreshChargesForEdit(editData.room)}>🔄</button>
                                            </div>
                                            <div className="input-group">
                                                <input className="form-control form-control-sm" type="number" placeholder="Laundry" value={editData.laundry} onChange={e => setEditData({ ...editData, laundry: e.target.value })} />
                                                <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => refreshChargesForEdit(editData.room)}>🔄</button>
                                            </div>
                                            <div className="input-group">
                                                <input className="form-control form-control-sm" type="number" placeholder="Extra Services" value={editData.extraServices} onChange={e => setEditData({ ...editData, extraServices: e.target.value })} />
                                                <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => refreshChargesForEdit(editData.room)}>🔄</button>
                                            </div>
                                            <input className="form-control form-control-sm" type="number" placeholder="Advance Pay" value={editData.advancePayment} onChange={e => setEditData({ ...editData, advancePayment: e.target.value })} />
                                            <input className="form-control form-control-sm" type="number" placeholder="Tax" value={editData.tax} onChange={e => setEditData({ ...editData, tax: e.target.value })} />
                                            <select className="form-select form-select-sm" value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}>
                                                <option value="Pending">Pending</option><option value="Generated">Generated</option><option value="Paid">Paid</option>
                                            </select>
                                            <button className="btn btn-success btn-sm" onClick={() => saveEdit(b._id)}>Save Changes</button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="d-flex justify-content-between mb-1"><span>🛏 Rent:</span><span>₹{Number(b.roomRent) || 0}</span></div>
                                            <div className="d-flex justify-content-between mb-1"><span>🍽 Restaurant:</span><span>₹{Number(b.restaurantCharges) || 0}</span></div>
                                            <div className="d-flex justify-content-between mb-1"><span>🛎 Room Service:</span><span>₹{Number(b.roomService) || 0}</span></div>
                                            <div className="d-flex justify-content-between mb-1"><span>🧺 Laundry:</span><span>₹{Number(b.laundry) || 0}</span></div>
                                            <div className="d-flex justify-content-between mb-1"><span>➕ Extra:</span><span>₹{Number(b.extraServices) || 0}</span></div>
                                            <div className="d-flex justify-content-between mb-1"><span>📊 Tax:</span><span>{Number(b.tax) || 0}%</span></div>
                                            <div className="d-flex justify-content-between mb-3"><span style={{ color: "#2E7D32" }}>💰 Advance Pay:</span><span style={{ color: "#2E7D32", fontWeight: "bold" }}>-₹{Number(b.advancePayment) || 0}</span></div>
                                            <div className="p-3 rounded text-center" style={{ backgroundColor: "rgba(0,123,255,0.1)" }}>
                                                <h5 className="mb-0 text-primary">Total: ₹{calculateTotal(b).toFixed(2)}</h5>
                                            </div>
                                            <div className="mt-3">
                                                <button style={editBtn} className="w-100" onClick={() => { setEditId(b._id); setEditData({ ...b, phone: b.phone || "", extraServices: b.extraServices || 0, advancePayment: b.advancePayment || 0 }); }}>✏️ Edit Charges</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="card-footer bg-white border-0 d-flex gap-2 p-3 flex-wrap">
                                    <button style={delBtn} className="flex-fill" onClick={() => handleDelete(b._id)}>Delete</button>
                                    <button style={{ ...editBtn, background: "#E8F5E9", border: "1px solid #2E7D32", color: "#2E7D32" }} className="flex-fill" onClick={() => printBill(b)}>Print Invoice</button>
                                    {b.status !== "Paid" && (
                                        <button
                                            className="flex-fill"
                                            onClick={() => handleLodgePayment(b)}
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
                                    )}
                                    {b.status === "Paid" && (
                                        <span style={{
                                            background: "#E8F5E9", border: "1px solid #2E7D32",
                                            color: "#2E7D32", borderRadius: "8px",
                                            padding: "5px 14px", fontSize: "0.78rem",
                                            fontWeight: 600, textAlign: "center"
                                        }} className="flex-fill">
                                            ✅ Paid
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}