import { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    loyaltyPoints: 0,
  });

  const fetchCustomers = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await axios.get(`${BASE_URL}/customers`);
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/orders`);
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch orders", err);
    }
  };

  useEffect(() => {
    fetchCustomers(true);
    fetchOrders();
    const intervalCustomers = setInterval(() => fetchCustomers(false), 5000);
    const intervalOrders = setInterval(() => fetchOrders(), 5000);
    return () => {
      clearInterval(intervalCustomers);
      clearInterval(intervalOrders);
    };
  }, []);

  const calculateCustomerStats = (phone) => {
    const customerOrders = orders.filter((order) => order.customerPhone === phone);
    let totalSpent = 0;
    customerOrders.forEach((order) => {
      let orderTotal = 0;
      order.items.forEach((item) => {
        const price = item.price || item.menuItem?.price || 0;
        orderTotal += price * item.quantity;
      });
      totalSpent += orderTotal;
    });
    const loyaltyPoints = Math.floor(totalSpent / 100) * 5;
    return {
      totalOrders: customerOrders.length,
      totalSpent,
      loyaltyPoints,
    };
  };

  const handleOpenModal = (customer = null) => {
    if (customer) {
      setEditingId(customer._id);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || "",
        address: customer.address || "",
        loyaltyPoints: customer.loyaltyPoints || 0,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        loyaltyPoints: 0,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert("Please enter a valid email address.");
        return;
      }
    }

    try {
      if (editingId) {
        await axios.put(`${BASE_URL}/customers/${editingId}`, formData);
      } else {
        await axios.post(`${BASE_URL}/customers`, formData);
      }
      fetchCustomers(true);
      handleCloseModal();
    } catch (err) {
      alert(err.response?.data?.error || "Error saving customer");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await axios.delete(`${BASE_URL}/customers/${id}`);
        fetchCustomers(true);
      } catch (err) {
        alert("Error deleting customer");
      }
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="page-title mb-0 text-dark">👥 Customer Management</h3>
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
            {customers.length} registered customers
          </p>
        </div>
        <button className="btn btn-warning" onClick={() => handleOpenModal()}>
          + Add Customer
        </button>
      </div>

      <div className="card-premium shadow-sm border-0">
        <div className="card-header bg-danger text-white" style={{ borderTopLeftRadius: "5px", borderTopRightRadius: "5px" }}>
          <p className="mb-0 fw-bold" style={{ padding: "10px" }}>All Customers</p>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4 py-3 text-muted text-uppercase" style={{ fontSize: "0.75rem", fontWeight: 600 }}>Customer</th>
                <th className="px-4 py-3 text-muted text-uppercase" style={{ fontSize: "0.75rem", fontWeight: 600 }}>Contact Info</th>
                <th className="px-4 py-3 text-muted text-uppercase" style={{ fontSize: "0.75rem", fontWeight: 600 }}>Loyalty Points</th>
                <th className="px-4 py-3 text-muted text-uppercase" style={{ fontSize: "0.75rem", fontWeight: 600 }}>Total Orders</th>
                <th className="px-4 py-3 text-muted text-uppercase text-end" style={{ fontSize: "0.75rem", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">No customers found.</td>
                </tr>
              ) : (
                customers.map((c) => {
                  const stats = calculateCustomerStats(c.phone);
                  return (
                    <tr key={c._id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold",
                              fontSize: "1rem",
                            }}
                          >
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="fw-bold">{c.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div style={{ fontSize: "0.85rem" }}>
                          <div>📞 {c.phone}</div>
                          {c.email && <div className="text-muted mt-1">📧 {c.email}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-warning text-dark px-3 py-2 rounded-pill">
                          ★ {stats.loyaltyPoints} pts
                        </span>
                      </td>
                      <td className="px-4 py-3 fw-bold text-muted">{stats.totalOrders}</td>
                      <td className="px-4 py-3 text-end">
                        <button className="btn btn-sm btn-warning me-2" onClick={() => handleOpenModal(c)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c._id)}>
                          Delete
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

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">{editingId ? "✏️ Edit Customer" : "➕ Add Customer"}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body p-4 bg-white">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Phone Number *</label>
                      <input
                        type="tel"
                        maxLength="10"
                        className="form-control"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                        placeholder="10-digit mobile number"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold">Loyalty Points (manual override)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.loyaltyPoints}
                        onChange={(e) => setFormData({ ...formData, loyaltyPoints: e.target.value })}
                      />
                      <div className="form-text">Points are automatically calculated from orders. Use this only for manual adjustments.</div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">Address</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer border-0 pt-3 pb-0 px-0 mt-3">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-warning">
                      Save Customer
                    </button>
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