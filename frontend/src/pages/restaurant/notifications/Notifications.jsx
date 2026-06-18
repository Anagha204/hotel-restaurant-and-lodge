import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

const BASE_URL = "http://localhost:5000/api";

const actionBtn = {
  background: "#F0F2F5", border: "none", borderRadius: "6px",
  padding: "6px 12px", fontSize: "0.8rem", color: "#333",
  cursor: "pointer", fontWeight: 600
};

const primaryBtn = {
  background: "linear-gradient(135deg, #007bff, #0056b3)", border: "none",
  borderRadius: "8px", padding: "8px 24px", fontSize: "0.85rem",
  fontWeight: 600, color: "white", cursor: "pointer", transition: "all 0.2s"
};
const outlineRedBtn = {
  background: "white", border: "1px solid #C62828", borderRadius: "8px",
  padding: "8px 24px", fontSize: "0.85rem", fontWeight: 600,
  color: "#C62828", cursor: "pointer", transition: "all 0.2s"
};

export default function Notifications() {
  const { user, isManagerOrAbove } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox"); // 'inbox' or 'sent'
  const [recipientGroup, setRecipientGroup] = useState("Staff"); // 'Staff' or 'Customer'
  const userRole = user?.role?.toLowerCase();
  const isKitchen = userRole === "kitchen" || userRole === "kitchen staff" || userRole === "staff";
  const canSendMessage = (isManagerOrAbove && isManagerOrAbove()) || isKitchen;
  const [formData, setFormData] = useState({
    type: "General", message: "", recipient: isKitchen ? "Waiter" : "All Staff"
  });

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/notifications`);
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/customers`);
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWaiters = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.get(`${BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const waiterList = res.data.filter(u => u.role?.toLowerCase() === "waiter");
      setWaiters(waiterList);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const handleOpenModal = () => {
    fetchCustomers();
    if (isKitchen) fetchWaiters();
    setRecipientGroup("Staff");
    setFormData({ type: "General", message: "", recipient: isKitchen ? "All Waiters" : "All Staff" });
    setShowModal(true);
  };
  const handleCloseModal = () => setShowModal(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/notifications`, {
        ...formData,
        senderRole: user?.role || "System"
      });
      fetchNotifications();
      handleCloseModal();
    } catch (err) {
      alert("Error sending message");
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${BASE_URL}/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      alert("Error marking notification as read");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      alert("Error deleting notification");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "Order": return "🍲";
      case "Inventory": return "📦";
      case "Reservation": return "📅";
      case "General": return "💬";
      default: return "🔔";
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="page-title mb-0">🔔 Notifications & Messages</h3>
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
            Alerts and updates for restaurant staff and customers
          </p>
        </div>
        {canSendMessage && (
          <button style={primaryBtn} onClick={handleOpenModal}>
            + Send Message
          </button>
        )}
      </div>

      {/* Tabs for Inbox and Sent */}
      {canSendMessage && (
        <div className="d-flex gap-3 mb-3 border-bottom pb-2">
          <button
            onClick={() => setActiveTab("inbox")}
            style={{
              background: "none",
              border: "none",
              padding: "8px 16px",
              fontWeight: activeTab === "inbox" ? "bold" : "normal",
              color: activeTab === "inbox" ? "#007bff" : "#6c757d",
              borderBottom: activeTab === "inbox" ? "2px solid #007bff" : "2px solid transparent",
              cursor: "pointer"
            }}>
            Inbox
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            style={{
              background: "none",
              border: "none",
              padding: "8px 16px",
              fontWeight: activeTab === "sent" ? "bold" : "normal",
              color: activeTab === "sent" ? "#007bff" : "#6c757d",
              borderBottom: activeTab === "sent" ? "2px solid #007bff" : "2px solid transparent",
              cursor: "pointer"
            }}>
            Sent Messages
          </button>
        </div>
      )}

      <div className="card card-premium shadow-sm border-0">
        <div className="card-body p-0">
          <ul className="list-group list-group-flush">
            {loading && notifications.length === 0 ? (
              <li className="list-group-item text-center py-5 text-muted border-0">Loading...</li>
            ) : notifications.length === 0 ? (
              <li className="list-group-item text-center py-5 text-muted border-0">No notifications available.</li>
            ) : (
              notifications
                .filter(n => {
                  if (activeTab === "sent") {
                    return n.senderRole === user?.role;
                  } else {
                    const recipient = (n.recipient || "All").toLowerCase();
                    const role = (user?.role || "Staff").toLowerCase();
                    const name = (user?.name || "").toLowerCase();
                    return recipient === "all" ||
                      recipient === "all staff" ||
                      recipient === "all waiters" ||
                      recipient === role ||
                      recipient === name ||
                      ((role === "kitchen" || role === "staff") && recipient === "kitchen staff") ||
                      (role === "kitchen staff" && recipient === "kitchen");
                  }
                })
                .map(n => (
                  <li key={n._id} className={`list-group-item d-flex justify-content-between align-items-start p-4 ${n.isRead ? "bg-white" : "bg-light"}`} style={{ borderLeft: n.isRead ? "none" : "4px solid #007bff" }}>
                    <div className="d-flex gap-3">
                      <div style={{ fontSize: "1.5rem" }}>{getIcon(n.type)}</div>
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <strong className="text-dark">{n.type} Alert</strong>
                          <span className="badge bg-secondary rounded-pill" style={{ fontSize: "0.65rem" }}>
                            {activeTab === "sent" ? `To: ${n.recipient || "All"}` : `From: ${n.senderRole || "System"}`}
                          </span>
                          {!n.isRead && activeTab === "inbox" && <span className="badge bg-primary rounded-pill" style={{ fontSize: "0.6rem" }}>NEW</span>}
                        </div>
                        <p className="mb-1 text-secondary" style={{ fontSize: "0.9rem" }}>{n.message}</p>
                        <small className="text-muted" style={{ fontSize: "0.75rem" }}>{new Date(n.createdAt).toLocaleString()}</small>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      {activeTab === "inbox" && !n.isRead && (
                        <button style={{ ...actionBtn, color: "#007bff", background: "#E3F2FD" }} onClick={() => markAsRead(n._id)}>Mark Read</button>
                      )}
                      <button style={{ ...actionBtn, color: "#C62828", background: "#FFEBEE" }} onClick={() => deleteNotification(n._id)}>Delete</button>
                    </div>
                  </li>
                ))
            )}
            {notifications.filter(n => {
              if (activeTab === "sent") return n.senderRole === user?.role;
              const recipient = (n.recipient || "All").toLowerCase();
              const role = (user?.role || "Staff").toLowerCase();
              const name = (user?.name || "").toLowerCase();
              return recipient === "all" ||
                recipient === "all staff" ||
                recipient === "all waiters" ||
                recipient === role ||
                recipient === name ||
                ((role === "kitchen" || role === "staff") && recipient === "kitchen staff") ||
                (role === "kitchen staff" && recipient === "kitchen");
            }).length === 0 && !loading && (
                <li className="list-group-item text-center py-5 text-muted border-0">No {activeTab} messages available.</li>
              )}
          </ul>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-light">
                <h5 className="modal-title fw-bold">Send Message</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSendMessage}>

                  <div className="mb-3 d-flex gap-4">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="recipientGroup" id="groupStaff" value="Staff" checked={recipientGroup === "Staff"}
                        onChange={() => {
                          setRecipientGroup("Staff");
                          setFormData({ ...formData, recipient: isKitchen ? "All Waiters" : "All Staff" });
                        }}
                      />
                      <label className="form-check-label fw-bold text-muted" htmlFor="groupStaff">Staff</label>
                    </div>
                    {!isKitchen && (
                      <div className="form-check">
                        <input className="form-check-input" type="radio" name="recipientGroup" id="groupCustomer" value="Customer" checked={recipientGroup === "Customer"}
                          onChange={() => {
                            setRecipientGroup("Customer");
                            setFormData({ ...formData, recipient: "All Customers" });
                          }}
                        />
                        <label className="form-check-label fw-bold text-muted" htmlFor="groupCustomer">Customer</label>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted fw-bold" style={{ fontSize: "0.85rem" }}>Select {recipientGroup}</label>
                    {isKitchen ? (
                      <select className="form-select" value={formData.recipient} onChange={e => setFormData({ ...formData, recipient: e.target.value })}>
                        <option value="All Waiters">All Waiters</option>
                        {waiters.map(w => (
                          <option key={w._id} value={w.name}>{w.name} (Waiter)</option>
                        ))}
                      </select>
                    ) : recipientGroup === "Staff" ? (
                      <select className="form-select" value={formData.recipient} onChange={e => setFormData({ ...formData, recipient: e.target.value })}>
                        <option value="All Staff">All Staff</option>
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Waiter">Waiter</option>
                        <option value="Cashier">Cashier</option>
                        <option value="Kitchen Staff">Kitchen Staff</option>
                      </select>
                    ) : (
                      <select className="form-select" value={formData.recipient} onChange={e => setFormData({ ...formData, recipient: e.target.value })}>
                        <option value="All Customers">All Customers</option>
                        {customers.map(c => (
                          <option key={c._id} value={c.name}>{c.name} ({c.phone})</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted fw-bold" style={{ fontSize: "0.85rem" }}>Message Type</label>
                    <select className="form-select" value={formData.type} onChange={(e) => {
                      const selectedType = e.target.value;
                      let defaultMsg = formData.message;

                      if (selectedType === "Order") defaultMsg = "Your order is ready for pickup/delivery.";
                      else if (selectedType === "Inventory") defaultMsg = "Low stock alert: Please check inventory levels.";
                      else if (selectedType === "Reservation") defaultMsg = "A new table reservation has been confirmed.";
                      else if (selectedType === "General") defaultMsg = "";

                      setFormData({ ...formData, type: selectedType, message: defaultMsg });
                    }}>
                      <option value="General">General</option>
                      <option value="Order">Order Alert</option>
                      <option value="Inventory">Inventory Alert</option>
                      <option value="Reservation">Reservation Alert</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="form-label text-muted fw-bold" style={{ fontSize: "0.85rem" }}>Message</label>
                    <textarea className="form-control" rows="3" required placeholder="Type your message here..." value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}></textarea>
                  </div>
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" style={outlineRedBtn} onClick={handleCloseModal}>Cancel</button>
                    <button type="submit" style={primaryBtn}>Send Message</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}