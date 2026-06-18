import { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

// 🟢 Change status names to match your backend enum
const STATUS_STYLES = {
    Pending: { background: "#FFF8E1", color: "#F9A825", label: "🕒 Pending" },
    Preparing: { background: "#E3F2FD", color: "#1565C0", label: "🔪 Preparing" },
    Ready: { background: "#E8F5E9", color: "#2E7D32", label: "✅ Ready" },
    Completed: { background: "#E0F2F1", color: "#00897B", label: "🍽️ Completed" }, // ✅ changed from "Served"
    Cancelled: { background: "#FFEBEE", color: "#C62828", label: "❌ Cancelled" },
};

// Allowed transitions – Ready goes to Completed
const NEXT_STATUS = {
    Pending: "Preparing",
    Preparing: "Ready",
    Ready: "Completed",   // ✅ changed from "Served"
    Completed: null,
    Cancelled: null,
};

const getItemName = (item) => {
    if (item.name) return item.name;
    if (item.menuItem) {
        if (typeof item.menuItem === "object") return item.menuItem.name;
        return "Item";
    }
    return "Unknown";
};

export default function KDS() {
    const [orders, setOrders] = useState([]);
    const [errorMsg, setErrorMsg] = useState("");
    const [updatingId, setUpdatingId] = useState(null);

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/orders`);
            // Exclude Completed and Cancelled orders from KDS
            const activeOrders = res.data.filter(
                o => o.orderStatus !== "Completed" && o.orderStatus !== "Cancelled"
            );
            setOrders(activeOrders);
        } catch (err) {
            setErrorMsg("Failed to load orders");
            console.error(err);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, []);

    const updateStatus = async (orderId, newStatus) => {
        setUpdatingId(orderId);
        setErrorMsg("");
        try {
            const order = orders.find(o => o._id === orderId);
            if (!order) throw new Error("Order not found");

            const payload = {
                orderType: order.orderType,
                table: order.table?._id || order.table || null,
                customerName: order.customerName || "",
                customerPhone: order.customerPhone || "",
                deliveryAddress: order.deliveryAddress || "",
                kitchenNotes: order.kitchenNotes || "",
                items: order.items.map(i => ({
                    menuItem: i.menuItem?._id || i.menuItem,
                    quantity: i.quantity,
                    notes: i.notes || "",
                })),
                orderStatus: newStatus,   // ✅ now sends "Completed" instead of "Served"
            };

            console.log(`Updating order ${orderId} to ${newStatus}`, payload);
            await axios.put(`${BASE_URL}/orders/${orderId}`, payload);
            await fetchOrders();
        } catch (err) {
            console.error("Update error:", err);
            const serverMsg = err.response?.data?.error || err.message;
            setErrorMsg(`Could not update to ${newStatus}: ${serverMsg}`);
            setTimeout(() => setErrorMsg(""), 5000);
        } finally {
            setUpdatingId(null);
        }
    };

    const ordersByStatus = {
        Pending: orders.filter(o => o.orderStatus === "Pending"),
        Preparing: orders.filter(o => o.orderStatus === "Preparing"),
        Ready: orders.filter(o => o.orderStatus === "Ready"),
    };

    const getCustomerInfo = (order) => {
        if (order.orderType === "Dine In") {
            const tableNum = order.table?.tableNumber || order.table || "?";
            return `Table ${tableNum}`;
        }
        return order.customerName || "Guest";
    };

    return (
        <div className="container-fluid px-3 px-md-4 py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="page-title mb-0">🍳 Kitchen Display System</h3>
                    <p className="text-muted mb-0">Real‑time orders for kitchen</p>
                </div>
                <button className="btn btn-outline-secondary" onClick={fetchOrders}>🔄 Refresh</button>
            </div>

            {errorMsg && <div className="alert alert-danger mb-3">⚠️ {errorMsg}</div>}

            <div className="row g-4">
                {Object.entries(ordersByStatus).map(([status, statusOrders]) => (
                    <div className="col-md-4" key={status}>
                        <div className="card h-100 shadow-sm border-0">
                            <div className="card-header" style={STATUS_STYLES[status]}>
                                {STATUS_STYLES[status]?.label} ({statusOrders.length})
                            </div>
                            <div className="card-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                                {statusOrders.length === 0 && (
                                    <p className="text-muted text-center py-4">No orders</p>
                                )}
                                {statusOrders.map(order => (
                                    <OrderCard
                                        key={order._id}
                                        order={order}
                                        customerInfo={getCustomerInfo(order)}
                                        getItemName={getItemName}
                                        onUpdate={() => updateStatus(order._id, NEXT_STATUS[order.orderStatus])}
                                        nextStatus={NEXT_STATUS[order.orderStatus]}
                                        isUpdating={updatingId === order._id}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function OrderCard({ order, customerInfo, getItemName, onUpdate, nextStatus, isUpdating }) {
    const totalQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = order.items.reduce((sum, i) => {
        const price = i.price || i.menuItem?.price || 0;
        return sum + (price * i.quantity);
    }, 0).toFixed(2);

    return (
        <div className="card mb-3 shadow-sm border-0 bg-white">
            <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span className="badge bg-secondary me-2">#{order._id.slice(-6)}</span>
                        <span className="badge bg-light text-dark">{order.orderType}</span>
                    </div>
                    <span className="fw-bold text-danger">₹{totalPrice}</span>
                </div>
                <h6 className="card-title mb-1">{customerInfo}</h6>
                <p className="text-muted small mb-2">{totalQty} item(s)</p>
                <div className="mb-3">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="small">
                            {item.quantity}× {getItemName(item)}
                            {item.notes && <span className="text-muted ms-1">(Note: {item.notes})</span>}
                        </div>
                    ))}
                </div>
                {order.kitchenNotes && (
                    <div className="alert alert-warning py-1 px-2 small mb-2">📝 {order.kitchenNotes}</div>
                )}
                {nextStatus ? (
                    <button
                        className="btn btn-sm w-100 mt-2"
                        style={{ backgroundColor: STATUS_STYLES[nextStatus]?.background, color: STATUS_STYLES[nextStatus]?.color, fontWeight: 600 }}
                        onClick={onUpdate}
                        disabled={isUpdating}
                    >
                        {isUpdating ? "Updating..." : `Mark as ${nextStatus}`}
                    </button>
                ) : (
                    <button className="btn btn-sm btn-secondary w-100 mt-2" disabled>Completed</button>
                )}
            </div>
        </div>
    );
}