import { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

const primaryBtn = {
  background: "linear-gradient(135deg, #007bff, #0056b3)", border: "none",
  borderRadius: "8px", padding: "8px 24px", fontSize: "0.85rem",
  fontWeight: 600, color: "white", cursor: "pointer", transition: "all 0.2s"
};
const actionBtn = {
  background: "#F0F2F5", border: "none", borderRadius: "6px",
  padding: "6px 12px", fontSize: "0.8rem", color: "#333",
  cursor: "pointer", fontWeight: 600
};

const getStatusBadge = (status) => {
  const styles = {
    "Pending": { bg: "#FFF8E1", color: "#F9A825" },
    "Assigned": { bg: "#E3F2FD", color: "#1565C0" },
    "Out for Delivery": { bg: "#FFF3E0", color: "#EF6C00" },
    "Delivered": { bg: "#E8F5E9", color: "#2E7D32" },
    "Cancelled": { bg: "#FFEBEE", color: "#C62828" },
  };
  const style = styles[status] || { bg: "#F5F5F5", color: "#757575" };
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: "4px 12px", borderRadius: "40px", fontSize: "0.75rem", fontWeight: 600
    }}>
      {status}
    </span>
  );
};

export default function DeliveryManagement() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    orderId: "", customerName: "", customerPhone: "", address: "", estimatedTime: ""
  });

  const fetchData = async () => {
    try {
      const [delRes, ordRes] = await Promise.all([
        axios.get(`${BASE_URL}/deliveries`),
        axios.get(`${BASE_URL}/orders`)
      ]);
      setDeliveries(delRes.data);
      // Only show orders that aren't already in delivery list
      const deliveryOrderIds = delRes.data.map(d => d.orderId?._id);
      setOrders(ordRes.data.filter(o => !deliveryOrderIds.includes(o._id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleOrderSelect = (e) => {
    const orderId = e.target.value;
    const order = orders.find(o => o._id === orderId);
    if (order) {
      setFormData({
        orderId: order._id,
        customerName: order.customerName || "Walk-in Customer",
        customerPhone: order.customerPhone || "N/A",
        address: "",
        estimatedTime: "30 mins"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${BASE_URL}/deliveries`, formData);
      fetchData();
      handleCloseModal();
    } catch (err) {
      alert("Error adding delivery");
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${BASE_URL}/deliveries/${id}`, { status: newStatus });
      fetchData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const updateRider = async (id, riderName) => {
    try {
      await axios.put(`${BASE_URL}/deliveries/${id}`, { riderName, status: riderName ? "Assigned" : "Pending" });
      fetchData();
    } catch (err) {
      alert("Failed to assign rider");
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="page-title mb-0">🛵 Delivery Management</h3>
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
            Track active deliveries and assign riders
          </p>
        </div>
        <button style={primaryBtn} onClick={handleOpenModal}>
          + New Delivery
        </button>
      </div>

      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">Loading deliveries...</div>
        ) : deliveries.length === 0 ? (
          <div className="col-12 text-center text-muted py-5">No active deliveries.</div>
        ) : (
          deliveries.map(d => (
            <div className="col-md-6 col-lg-4" key={d._id}>
              <div className="card card-premium shadow-sm border-0 h-100">
                <div className="card-header bg-white d-flex justify-content-between align-items-center border-bottom-0 pt-3 px-3 pb-0">
                  <h6 className="mb-0 fw-bold">Order #{d.orderId?._id?.toString().slice(-6).toUpperCase()}</h6>
                  {getStatusBadge(d.status)}
                </div>
                <div className="card-body px-3 pb-3">
                  <div className="mb-3">
                    <small className="text-muted d-block">Customer</small>
                    <span className="fw-bold">{d.customerName}</span>
                    <br />
                    <small>📞 {d.customerPhone}</small>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted d-block">Delivery Address</small>
                    <span>{d.address || "No address provided"}</span>
                  </div>
                  <div className="mb-3 bg-light p-2 rounded d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted d-block">Assigned Rider</small>
                      <span className="fw-bold text-primary">{d.riderName}</span>
                    </div>
                    <button 
                      style={actionBtn} 
                      onClick={() => {
                        const newRider = prompt("Enter rider name:", d.riderName !== "Unassigned" ? d.riderName : "");
                        if (newRider !== null) updateRider(d._id, newRider || "Unassigned");
                      }}
                    >
                      Assign
                    </button>
                  </div>
                  <div className="d-flex gap-2">
                    <select 
                      className="form-select form-select-sm" 
                      value={d.status} 
                      onChange={(e) => updateStatus(d._id, e.target.value)}
                      style={{ fontSize: "0.8rem", borderRadius: "6px" }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-light">
                <h5 className="modal-title fw-bold">Create Delivery</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-bold">Select Order</label>
                    <select className="form-select" required onChange={handleOrderSelect}>
                      <option value="">-- Select Order --</option>
                      {orders.map(o => (
                        <option key={o._id} value={o._id}>
                          Order #{o._id.toString().slice(-6).toUpperCase()} - ₹{o.totalAmount}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-bold">Customer Name</label>
                    <input type="text" className="form-control" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-bold">Phone</label>
                    <input type="text" className="form-control" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-bold">Address</label>
                    <textarea className="form-control" rows="2" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required></textarea>
                  </div>
                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-outline-danger px-4" onClick={handleCloseModal}>Cancel</button>
                    <button type="submit" style={primaryBtn}>Create</button>
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
