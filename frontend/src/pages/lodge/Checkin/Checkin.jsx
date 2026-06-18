import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { QRCodeSVG } from "qrcode.react";

const BASE_URL = "http://localhost:5000/api";

export default function Checkin() {
    const [bookings, setBookings] = useState([]);
    const [checkins, setCheckins] = useState([]);
    const [idVerifications, setIdVerifications] = useState([]);
    const [combinedBills, setCombinedBills] = useState([]);
    const [tab, setTab] = useState("checkin");
    const [checkinModal, setCheckinModal] = useState(null);
    const [checkoutModal, setCheckoutModal] = useState(null);
    const [checkinForm, setCheckinForm] = useState({
        advancePayment: "",
        notes: "",
    });
    const [checkoutForm, setCheckoutForm] = useState({
        restaurantCharges: 0,
        otherCharges: 0,
        paymentMode: "Cash",
    });
    const [customCheckoutDateTime, setCustomCheckoutDateTime] = useState("");
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [pendingServices, setPendingServices] = useState([]);
    const [restaurantChargesTotal, setRestaurantChargesTotal] = useState(0);
    const [filterDate, setFilterDate] = useState("");
    // Store the exact advance payment entered at check‑in (keyed by checkin _id)
    const [originalAdvances, setOriginalAdvances] = useState({});

    const fetchAll = async () => {
        setLoading(true);
        setError("");
        try {
            const [bRes, cRes, idRes, cbRes] = await Promise.all([
                axios.get(`${BASE_URL}/booking`),
                axios.get(`${BASE_URL}/checkin`),
                axios.get(`${BASE_URL}/idverification`),
                axios.get(`${BASE_URL}/combinedbilling`).catch(() => ({ data: [] })),
            ]);
            setBookings(
                Array.isArray(bRes.data)
                    ? bRes.data.filter((b) => b.status === "Confirmed")
                    : []
            );
            setCheckins(Array.isArray(cRes.data) ? cRes.data : []);
            setIdVerifications(Array.isArray(idRes.data) ? idRes.data : []);
            setCombinedBills(Array.isArray(cbRes.data) ? cbRes.data : []);
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to load data. Check backend is running.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const isGuestVerified = (guestId) => {
        if (!guestId) return false;
        return idVerifications.some((v) => v.guest === guestId && v.status === "Verified");
    };

    const fetchRestaurantChargesForRoom = async (roomNumber) => {
        try {
            const ordersRes = await axios.get(`${BASE_URL}/orders`);
            const allOrders = ordersRes.data;
            let total = 0;
            for (const order of allOrders) {
                if (
                    order.orderStatus === "Completed" &&
                    order.orderType !== "Room Service" &&
                    order.assignedRoom === roomNumber
                ) {
                    for (const item of order.items) {
                        const price = item.price || item.menuItem?.price || 0;
                        total += price * item.quantity;
                    }
                }
            }
            return total;
        } catch (err) {
            console.error("Failed to fetch restaurant charges", err);
            return 0;
        }
    };

    const getGuestName = (booking) => booking.guest?.name || booking.guestName || "—";
    const getGuestMobile = (booking) => booking.guest?.mobile || booking.mobile || "—";
    const getGuestId = (booking) => booking.guest?._id || booking.guestId || null;
    const getRoomNumber = (booking) =>
        booking.room?.roomNumber
            ? `Room ${booking.room.roomNumber}`
            : booking.roomNumber
                ? `Room ${booking.roomNumber}`
                : "—";
    const getRawRoomNumber = (booking) =>
        booking.room?.roomNumber || booking.roomNumber || "";
    const getRoomType = (booking) => booking.room?.type || booking.roomType || "—";

    const roundAdvance = (value) => Math.round(Number(value) || 0);

    const openCheckin = (b) => {
        const guestId = getGuestId(b);
        if (!guestId) {
            Swal.fire("Error", "Guest ID not found for this booking.", "error");
            return;
        }
        if (!isGuestVerified(guestId)) {
            Swal.fire(
                "ID Not Verified",
                "Please verify the guest's ID in the ID Verification module first.",
                "error"
            );
            return;
        }
        setCheckinForm({
            advancePayment: "",
            notes: "",
        });
        setError("");
        setCheckinModal(b);
    };

    const handleCheckin = async () => {
        if (!checkinForm.advancePayment) {
            Swal.fire("Missing", "Enter advance payment amount.", "warning");
            return;
        }
        setLoading(true);
        try {
            const advance = roundAdvance(checkinForm.advancePayment);
            await axios.post(`${BASE_URL}/checkin/checkin`, {
                booking: checkinModal._id,
                checkInTime: new Date().toISOString(),
                advancePayment: advance,
                idVerified: true,
                notes: checkinForm.notes,
            });
            // Store the exact amount we just sent
            setOriginalAdvances(prev => ({
                ...prev,
                [checkinModal._id]: advance
            }));
            Swal.fire("Success", "Guest checked in successfully.", "success");
            setCheckinModal(null);
            await fetchAll();
        } catch {
            Swal.fire("Error", "Failed to process check-in.", "error");
        } finally {
            setLoading(false);
        }
    };

    const openCheckout = async (c) => {
        setCheckoutForm({ restaurantCharges: 0, otherCharges: 0, paymentMode: "Cash" });
        setBill(null);
        setError("");
        setPendingServices([]);
        setRestaurantChargesTotal(0);

        const now = new Date();
        const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        setCustomCheckoutDateTime(localISO);

        const roomNumber = getRawRoomNumber(c.booking);
        if (!roomNumber) {
            Swal.fire("Error", "Room number not found for this check-in.", "error");
            setCheckoutModal(c);
            return;
        }

        try {
            const res = await axios.get(`${BASE_URL}/services`);
            const allServices = res.data;
            const pending = allServices.filter((s) => s.room === roomNumber && s.status !== "Billed");
            setPendingServices(pending);
            const totalPending = pending.reduce((sum, s) => sum + s.charge, 0);
            setCheckoutForm((prev) => ({ ...prev, otherCharges: totalPending }));
        } catch (err) {
            console.error("Failed to fetch services", err);
        }

        const restaurantTotal = await fetchRestaurantChargesForRoom(roomNumber);
        setRestaurantChargesTotal(restaurantTotal);
        setCheckoutForm((prev) => ({ ...prev, restaurantCharges: restaurantTotal }));

        setCheckoutModal(c);
    };

    const calcBill = () => {
        const c = checkoutModal;
        const checkInTime = c.checkInTime || c.booking?.checkIn;
        const ci = new Date(checkInTime);
        const co = customCheckoutDateTime
            ? new Date(customCheckoutDateTime)
            : new Date();

        if (co < ci) {
            Swal.fire("Invalid Date", "Checkout time cannot be before check-in time.", "warning");
            return;
        }

        const nights = Math.max(1, Math.ceil((co - ci) / (1000 * 60 * 60 * 24)));
        const roomRate = c.booking?.room?.price || 0;
        const roomCharge = roomRate * nights;
        const restaurant = Number(checkoutForm.restaurantCharges) || 0;
        const other = Number(checkoutForm.otherCharges) || 0;
        // Use the stored original advance if available, otherwise round what we have
        const advance = originalAdvances[c._id] || roundAdvance(c.advancePayment);
        const subtotal = roomCharge + restaurant + other;
        let balance = subtotal - advance;

        const roomNumber = getRawRoomNumber(c.booking);
        const roomBills = combinedBills.filter((b) => b.room == roomNumber);
        const latestBill = roomBills[roomBills.length - 1];
        let hasPaidCombinedBill = false;
        if (latestBill && latestBill.status === "Paid") {
            hasPaidCombinedBill = true;
            balance = 0;
        }

        setBill({
            nights,
            roomRate,
            roomCharge,
            restaurant,
            other,
            advance,
            subtotal,
            balance,
            hasPaidCombinedBill,
        });
    };

    const handleCheckout = async () => {
        if (!bill) {
            Swal.fire("Missing", "Generate bill first.", "warning");
            return;
        }
        if (bill.balance > 0) {
            const guestName =
                checkoutModal.booking?.guest?.name ||
                checkoutModal.booking?.guestName ||
                "Guest";
            Swal.fire("Balance Due", `${guestName} has not completed payment.`, "error");
            return;
        }

        setLoading(true);
        try {
            for (const svc of pendingServices) {
                await axios.put(`${BASE_URL}/services/${svc._id}`, { status: "Billed" });
                await axios
                    .post(`${BASE_URL}/roombilling/add-service`, { room: svc.room, amount: svc.charge })
                    .catch((e) => console.log("Service billing error", e));
            }

            await axios.post(`${BASE_URL}/checkin/checkout`, {
                checkinId: checkoutModal._id,
                checkOutTime: customCheckoutDateTime ? new Date(customCheckoutDateTime) : new Date(),
                restaurantCharges: bill.restaurant,
                otherCharges: bill.other,
                totalAmount: bill.subtotal,
                balanceDue: bill.balance,
                paymentMode: checkoutForm.paymentMode,
            });

            const roomNumber = getRawRoomNumber(checkoutModal.booking);
            if (roomNumber) {
                try {
                    const hkRes = await axios.get(`${BASE_URL}/housekeeping`);
                    const existingTask = hkRes.data.find((t) => t.room == roomNumber);
                    if (existingTask) {
                        await axios.put(`${BASE_URL}/housekeeping/${existingTask._id}`, {
                            status: "Cleaning",
                        });
                    } else {
                        await axios.post(`${BASE_URL}/housekeeping`, {
                            room: roomNumber,
                            staff: "Auto (checkout)",
                            status: "Cleaning",
                        });
                    }
                } catch (err) {
                    console.error("Failed to sync housekeeping:", err);
                }
            }

            Swal.fire("Checked Out", "Guest checked out successfully.", "success");
            setCheckoutModal(null);
            setBill(null);
            await fetchAll();
        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Failed to process check-out.", "error");
        } finally {
            setLoading(false);
        }
    };

    const fmtDateTime = (d) =>
        d
            ? new Date(d).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            })
            : "—";

    const fmtDateShort = (d) =>
        d ? new Date(d).toLocaleDateString("en-IN") : "—";

    const statusStyle = (verified) => ({
        background: verified ? "#E8F5E9" : "#FFEBEE",
        color: verified ? "#2E7D32" : "#C62828",
    });

    const filteredBookings = filterDate
        ? bookings.filter(
            (b) =>
                b.checkIn && new Date(b.checkIn).toISOString().split("T")[0] === filterDate
        )
        : bookings;

    const filteredCheckins = filterDate
        ? checkins.filter(
            (c) =>
                c.checkInTime &&
                new Date(c.checkInTime).toISOString().split("T")[0] === filterDate
        )
        : checkins;

    const currentlyCheckedIn = filteredCheckins.filter((c) => !c.checkOutTime);
    const checkedOutToday = checkins.filter(
        (c) =>
            c.checkOutTime &&
            new Date(c.checkOutTime).toDateString() ===
            (filterDate ? new Date(filterDate).toDateString() : new Date().toDateString())
    ).length;

    if (loading && !bookings.length && !checkins.length)
        return <div className="text-center p-5 text-muted">Loading data</div>;

    return (
        <div className="container-fluid p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">🛎️ Check‑In / Check‑Out</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        Manage guest arrivals and departures
                    </p>
                </div>
                <div>
                    <label className="form-label mb-0 me-2 fw-semibold">Filter by Date:</label>
                    <input
                        type="date"
                        className="form-control d-inline-block w-auto"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                    {filterDate && (
                        <button className="btn btn-sm btn-outline-secondary ms-2" onClick={() => setFilterDate("")}>
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm bg-light">
                        <div className="card-body text-center">
                            <h2 className="text-info fw-bold mb-0">{filteredBookings.length}</h2>
                            <p className="text-muted mb-0">Awaiting Check‑In</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm bg-light">
                        <div className="card-body text-center">
                            <h2 className="text-success fw-bold mb-0">{currentlyCheckedIn.length}</h2>
                            <p className="text-muted mb-0">Currently Checked‑In</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm bg-light">
                        <div className="card-body text-center">
                            <h2 className="text-secondary fw-bold mb-0">{checkedOutToday}</h2>
                            <p className="text-muted mb-0">
                                {filterDate ? "Checked‑Out on Date" : "Checked‑Out Today"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="d-flex gap-2 mb-4 border-bottom pb-2">
                <button
                    onClick={() => setTab("checkin")}
                    className={`btn ${tab === "checkin" ? "btn-danger" : "btn-outline-secondary"} rounded-pill px-4`}
                >
                    🛎️ Check‑In
                </button>
                <button
                    onClick={() => setTab("checkout")}
                    className={`btn ${tab === "checkout" ? "btn-danger" : "btn-outline-secondary"} rounded-pill px-4`}
                >
                    🚪 Check‑Out
                </button>
            </div>

            {/* Check‑In Table */}
            {tab === "checkin" && (
                <div className="card shadow">
                    <div className="card-header bg-danger text-white">
                        <h5 className="mb-0">🛎️ Guests Awaiting Check‑In</h5>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Guest</th>
                                    <th>Mobile</th>
                                    <th>Room</th>
                                    <th>Type</th>
                                    <th>CheckIn</th>
                                    <th>CheckOut</th>
                                    <th>ID Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center text-muted py-4">
                                            No confirmed bookings awaiting check‑in.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((b) => {
                                        const guestId = getGuestId(b);
                                        const verified = isGuestVerified(guestId);
                                        return (
                                            <tr key={b._id}>
                                                <td className="fw-semibold">{getGuestName(b)}</td>
                                                <td>{getGuestMobile(b)}</td>
                                                <td className="fw-semibold">{getRoomNumber(b)}</td>
                                                <td>{getRoomType(b)}</td>
                                                <td>{fmtDateShort(b.checkIn)}</td>
                                                <td>{fmtDateShort(b.checkOut)}</td>
                                                <td>
                                                    <span className="badge" style={statusStyle(verified)}>
                                                        {verified ? "✅ Verified" : "⚠️ Not Verified"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-warning"
                                                        onClick={() => openCheckin(b)}
                                                        disabled={!verified}
                                                    >
                                                        Check‑In →
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Check‑Out Table */}
            {tab === "checkout" && (
                <div className="card shadow">
                    <div className="card-header bg-danger text-white">
                        <h5 className="mb-0">🚪 Guests Currently Checked‑In</h5>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Guest</th>
                                    <th>Room</th>
                                    <th>Check‑In Time</th>
                                    <th>Advance Paid</th>
                                    <th>ID Verified</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentlyCheckedIn.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center text-muted py-4">
                                            No guests currently checked in.
                                        </td>
                                    </tr>
                                ) : (
                                    currentlyCheckedIn.map((c) => (
                                        <tr key={c._id}>
                                            <td className="fw-semibold">
                                                {c.booking?.guest?.name || c.booking?.guestName || "—"}
                                            </td>
                                            <td className="fw-semibold">
                                                {c.booking?.room?.roomNumber
                                                    ? `Room ${c.booking.room.roomNumber}`
                                                    : c.booking?.roomNumber
                                                        ? `Room ${c.booking.roomNumber}`
                                                        : "—"}
                                            </td>
                                            <td className="text-nowrap">{fmtDateTime(c.checkInTime)}</td>
                                            <td className="text-success fw-semibold">
                                                ₹{(originalAdvances[c._id] || roundAdvance(c.advancePayment)).toLocaleString("en-IN")}
                                            </td>
                                            <td>
                                                <span className="badge" style={statusStyle(c.idVerified)}>
                                                    {c.idVerified ? "✓ Verified" : "✗ Pending"}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-warning" onClick={() => openCheckout(c)}>
                                                    Check‑Out →
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CHECK‑IN MODAL */}
            {checkinModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">🛎️ Process Check‑In</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setCheckinModal(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-light border mb-3">
                                    <div className="row g-2">
                                        <div className="col-sm-4"><small className="text-muted">Guest</small><div className="fw-semibold">{getGuestName(checkinModal)}</div></div>
                                        <div className="col-sm-4"><small className="text-muted">Mobile</small><div className="fw-semibold">{getGuestMobile(checkinModal)}</div></div>
                                        <div className="col-sm-4"><small className="text-muted">Room</small><div className="fw-semibold">{getRoomNumber(checkinModal)}</div></div>
                                        <div className="col-sm-4"><small className="text-muted">Room Type</small><div className="fw-semibold">{getRoomType(checkinModal)}</div></div>
                                        <div className="col-sm-4"><small className="text-muted">Booked Check‑In</small><div className="fw-semibold">{fmtDateShort(checkinModal.checkIn)}</div></div>
                                        <div className="col-sm-4"><small className="text-muted">Booked Check‑Out</small><div className="fw-semibold">{fmtDateShort(checkinModal.checkOut)}</div></div>
                                    </div>
                                </div>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Advance Payment (₹) *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="0"
                                            step="1"
                                            placeholder="e.g. 2000"
                                            value={checkinForm.advancePayment}
                                            onChange={(e) =>
                                                setCheckinForm((f) => ({ ...f, advancePayment: e.target.value }))
                                            }
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">ID Verification</label>
                                        <div className="alert alert-success mb-0 py-2">
                                            ✓ Guest ID has been verified
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Notes / Remarks</label>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            placeholder="Any special instructions…"
                                            value={checkinForm.notes}
                                            onChange={(e) =>
                                                setCheckinForm((f) => ({ ...f, notes: e.target.value }))
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setCheckinModal(null)}>
                                    Cancel
                                </button>
                                <button className="btn btn-danger" onClick={handleCheckin} disabled={loading}>
                                    {loading ? "Processing…" : "✓ Confirm Check‑In"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CHECK‑OUT MODAL */}
            {checkoutModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-warning text-dark">
                                <h5 className="modal-title">🚪 Process Check‑Out</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setCheckoutModal(null);
                                        setBill(null);
                                        setPendingServices([]);
                                        setRestaurantChargesTotal(0);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-light border mb-3">
                                    <div className="row g-2">
                                        <div className="col-sm-4"><small className="text-muted">Guest</small><div className="fw-semibold">{checkoutModal.booking?.guest?.name || checkoutModal.booking?.guestName || "—"}</div></div>
                                        <div className="col-sm-4"><small className="text-muted">Room</small><div className="fw-semibold">
                                            {checkoutModal.booking?.room?.roomNumber
                                                ? `Room ${checkoutModal.booking.room.roomNumber}`
                                                : checkoutModal.booking?.roomNumber
                                                    ? `Room ${checkoutModal.booking.roomNumber}`
                                                    : "—"}
                                        </div></div>
                                        <div className="col-sm-4"><small className="text-muted">Rate / Night</small><div className="fw-semibold">₹{checkoutModal.booking?.room?.price || 0}</div></div>
                                        <div className="col-sm-4"><small className="text-muted">Checked‑In</small><div className="fw-semibold">{fmtDateTime(checkoutModal.checkInTime)}</div></div>
                                        <div className="col-sm-4"><small className="text-muted">Advance Paid</small><div className="fw-semibold text-success">
                                            ₹{(originalAdvances[checkoutModal._id] || roundAdvance(checkoutModal.advancePayment)).toLocaleString("en-IN")}
                                        </div></div>
                                    </div>
                                </div>

                                {pendingServices.length > 0 && (
                                    <div className="border rounded p-3 mb-3">
                                        <h6 className="mb-2">🧾 Pending Amenity Services</h6>
                                        {pendingServices.map((s) => (
                                            <div key={s._id} className="d-flex justify-content-between py-1">
                                                <span>{s.serviceName}</span>
                                                <span>₹{s.charge}</span>
                                            </div>
                                        ))}
                                        <div className="d-flex justify-content-between mt-2 fw-bold">
                                            <span>Total Service Charges</span>
                                            <span>₹{pendingServices.reduce((sum, s) => sum + s.charge, 0)}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="row g-3 mb-3">
                                    <div className="col-12">
                                        <label className="form-label">Actual Check‑Out Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            value={customCheckoutDateTime}
                                            onChange={(e) => setCustomCheckoutDateTime(e.target.value)}
                                        />
                                        <small className="text-muted">
                                            Set the guest’s actual departure time (early or late).
                                        </small>
                                    </div>
                                </div>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Restaurant Charges (₹)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="0"
                                            value={checkoutForm.restaurantCharges}
                                            onChange={(e) =>
                                                setCheckoutForm((f) => ({
                                                    ...f,
                                                    restaurantCharges: e.target.value,
                                                }))
                                            }
                                        />
                                        {restaurantChargesTotal > 0 && (
                                            <small className="text-success">
                                                Auto‑filled from completed restaurant orders.
                                            </small>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Other Charges (₹)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            min="0"
                                            value={checkoutForm.otherCharges}
                                            onChange={(e) =>
                                                setCheckoutForm((f) => ({
                                                    ...f,
                                                    otherCharges: e.target.value,
                                                }))
                                            }
                                        />
                                        <small className="text-muted">Includes pending services automatically.</small>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Payment Mode</label>
                                        <div className="d-flex flex-wrap gap-2">
                                            {["Cash", "Card", "UPI", "Bank Transfer"].map((mode) => (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() =>
                                                        setCheckoutForm((f) => ({ ...f, paymentMode: mode }))
                                                    }
                                                    className={`btn btn-sm rounded-pill ${checkoutForm.paymentMode === mode
                                                        ? "btn-warning"
                                                        : "btn-outline-secondary"
                                                        }`}
                                                >
                                                    {mode}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button className="btn btn-outline-warning w-100 mt-3" onClick={calcBill}>
                                    📋 Generate Final Bill
                                </button>

                                {bill && (
                                    <div className="card mt-3 border-0 shadow-sm" id="bill-print-area">
                                        <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
                                            <h6 className="mb-0">🧾 Final Bill</h6>
                                            <button
                                                className="btn btn-sm btn-light"
                                                onClick={() => window.print()}
                                            >
                                                🖨️ Print Bill
                                            </button>
                                        </div>
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between">
                                                <span>Room Charges ({bill.nights} nights × ₹{bill.roomRate})</span>
                                                <span>₹{bill.roomCharge.toLocaleString("en-IN")}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mt-1">
                                                <span>Restaurant Charges</span>
                                                <span>₹{bill.restaurant.toLocaleString("en-IN")}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mt-1">
                                                <span>Other Charges (incl. services)</span>
                                                <span>₹{bill.other.toLocaleString("en-IN")}</span>
                                            </div>
                                            <hr />
                                            <div className="d-flex justify-content-between fw-bold">
                                                <span>Subtotal</span>
                                                <span>₹{bill.subtotal.toLocaleString("en-IN")}</span>
                                            </div>
                                            <div className="d-flex justify-content-between text-success">
                                                <span>Advance Paid</span>
                                                <span>– ₹{bill.advance.toLocaleString("en-IN")}</span>
                                            </div>
                                            {bill.hasPaidCombinedBill && (
                                                <div className="d-flex justify-content-between text-success">
                                                    <span>Combined Bill Payment</span>
                                                    <span>Fully Paid ✅</span>
                                                </div>
                                            )}
                                            <div
                                                className={`d-flex justify-content-between mt-3 p-2 rounded ${bill.balance <= 0 ? "bg-success-subtle" : "bg-warning-subtle"
                                                    }`}
                                            >
                                                <span className="fw-bold">
                                                    {bill.balance <= 0 ? "✓ No Balance Due" : "Balance Due"}
                                                </span>
                                                <span className="fw-bold">
                                                    ₹{Math.abs(bill.balance).toLocaleString("en-IN")}
                                                    {bill.balance < 0 ? " (Refund)" : ""}
                                                </span>
                                            </div>

                                            {bill.balance > 0 && (
                                                <div className="text-center mt-4 pt-2 border-top">
                                                    <p className="mb-1 small text-muted">Scan to pay with any UPI app</p>
                                                    <QRCodeSVG
                                                        value={`upi://pay?pa=yourUPIID@ybl&pn=HotelName&am=${bill.balance}&cu=INR`}
                                                        size={120}
                                                        className="mx-auto"
                                                    />
                                                    <p className="mt-2 fw-bold">Amount: ₹{bill.balance}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setCheckoutModal(null);
                                        setBill(null);
                                        setPendingServices([]);
                                        setRestaurantChargesTotal(0);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-warning"
                                    onClick={handleCheckout}
                                    disabled={!bill || loading}
                                >
                                    {loading ? "Processing…" : "✓ Confirm Check‑Out"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}