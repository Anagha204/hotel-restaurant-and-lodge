import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function PurchaseManagement() {
  const [showForm, setShowForm] = useState(false);

  const [purchases, setPurchases] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const fetchSuppliers = async () => {
    const res = await axios.get("http://localhost:5000/api/suppliers");
    setSuppliers(res.data);
  };

  const fetchItems = async () => {
    const res = await axios.get("http://localhost:5000/api/inventory");
    setItems(res.data);
  };

  const [newPurchase, setNewPurchase] = useState({
    supplier: "",
    item: "",
    qty: 1,
    rate: 0
  });

  // 🔄 FETCH DATA
  const fetchPurchases = async () => {
    const res = await axios.get("http://localhost:5000/api/purchases");
    setPurchases(res.data);
  };

  const fetchInventory = async () => {
    const res = await axios.get("http://localhost:5000/api/inventory");
    setInventory(res.data);
  };

  useEffect(() => {
    fetchPurchases();
    fetchInventory();
    fetchSuppliers();
    fetchItems();
  }, []);

  // ➕ ADD PURCHASE (BACKEND)
  const addPurchase = async () => {

    // 🔥 1. REQUIRED FIELD CHECK
    if (
      !newPurchase.supplier ||
      !newPurchase.item ||
      !newPurchase.qty ||
      !newPurchase.rate
    ) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all required fields"
      });
    }

    // 🔥 2. VALIDATION CHECK (qty & rate)
    if (newPurchase.qty <= 0 || newPurchase.rate <= 0) {
      return Swal.fire({
        icon: "error",
        title: "Invalid Input",
        text: "Quantity and Rate must be greater than 0"
      });
    }

    try {
      await axios.post("http://localhost:5000/api/purchases", newPurchase);

      Swal.fire({
        icon: "success",
        title: "Saved!",
        text: "Purchase added successfully"
      });

      fetchPurchases();
      fetchInventory();

      setShowForm(false);

      setNewPurchase({
        supplier: "",
        item: "",
        qty: 1,
        rate: 0
      });

    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save purchase"
      });
    }
  };

  // 🔁 UPDATE STATUS (BACKEND handles inventory)
  const updateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/purchases/${id}`, { status });

      fetchPurchases();
      fetchInventory();

    } catch (err) {
      console.error(err);
    }
  };
  const deletePurchase = async (id) => {
    if (!window.confirm("Delete this purchase?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/purchases/${id}`);

      fetchPurchases();
      fetchInventory(); // refresh stock also

    } catch (err) {
      console.error(err);
    }
  };

  // 📊 STATS
  const totalOrdered = purchases.length;
  const totalReceived = purchases.filter(p => p.status === "Received").length;
  const totalPending = purchases.filter(p => p.status === "Pending").length;

  const getBadge = (status) => {
    switch (status) {
      case "Ordered":
        return "bg-warning text-dark";
      case "Received":
        return "bg-success";
      case "Pending":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="row">

        {/* LEFT SIDE */}
        <div className="col-md-8">

          {/* HEADER */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h3 className="page-title mb-0">📦 Purchase Management</h3>
                <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                  Purchase items to update the stock.
                </p>
              </div>
            </div>
            <button
              className="btn btn-dark"
              onClick={() => setShowForm(!showForm)}
            >
              + New Purchase
            </button>
          </div>

          {/* FORM */}
          {showForm && (
            <div className="card shadow p-3 mb-3">
              <div className="row g-2">

                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={newPurchase.supplier}
                    onChange={(e) =>
                      setNewPurchase({ ...newPurchase, supplier: e.target.value })
                    }
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={newPurchase.item}
                    onChange={(e) =>
                      setNewPurchase({ ...newPurchase, item: e.target.value })
                    }
                  >
                    <option value="">Select Item</option>
                    {items.map((i) => (
                      <option key={i._id} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-2">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Qty"
                    value={newPurchase.qty}
                    onChange={(e) =>
                      setNewPurchase({ ...newPurchase, qty: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-2">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Rate"
                    value={newPurchase.rate}
                    onChange={(e) =>
                      setNewPurchase({ ...newPurchase, rate: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-2">
                  <button
                    className="btn btn-success w-100"
                    onClick={addPurchase}
                  >
                    Save
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TABLE */}
          <div className="card shadow">
            <div className="card-header bg-danger text-white">
              Purchase Orders
            </div>

            <div className="table-responsive">
              <table className="table table-hover table-sm mb-0">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Update</th>
                    <th>Delete</th>
                  </tr>
                </thead>

                <tbody>
                  {purchases.map(p => (
                    <tr key={p._id}>
                      <td>{p.supplier}</td>
                      <td>{p.item}</td>
                      <td>{p.qty}</td>
                      <td>₹{p.rate}</td>
                      <td className="text-success">₹{p.total}</td>

                      <td>
                        <span className={`badge ${getBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </td>

                      <td>
                        <select
                          className="form-select"
                          value={p.status}
                          onChange={(e) =>
                            updateStatus(p._id, e.target.value)
                          }
                        >
                          <option>Ordered</option>
                          <option>Received</option>
                          <option>Pending</option>
                        </select>
                      </td>

                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deletePurchase(p._id)}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="col-md-4">

          {/* STATS */}
          <div className="card shadow p-3 mb-3">
            <h5>📊 Live Status</h5>
            <hr />
            <p>🛒 Total Orders: {totalOrdered}</p>
            <p>📦 Received: {totalReceived}</p>
            <p>⏳ Pending: {totalPending}</p>
          </div>

          {/* INVENTORY */}
          <div className="card shadow p-3">
            <h5>📦 Inventory Stock</h5>
            <hr />

            {inventory.map((i) => (
              <div
                key={i._id}
                className="d-flex justify-content-between border-bottom py-1"
              >
                <span>{i.name}</span>
                <strong>{i.stock}</strong>
              </div>
            ))}

          </div>

        </div>

      </div>
    </div>
  );
}
