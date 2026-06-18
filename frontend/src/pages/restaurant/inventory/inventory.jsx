import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function Inventory() {

  const [items, setItems] = useState([]);
  const [lowItems, setLowItems] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);

  const [newItem, setNewItem] = useState({
    name: "",
    stock: "",
    min: "",
    unit: ""
  });

  // 👉 FETCH ITEMS
  const fetchItems = async () => {
    const res = await axios.get("http://localhost:5000/api/inventory");
    setItems(res.data);
  };

  // 👉 FETCH LOW STOCK
  const fetchLowStock = async () => {
    const res = await axios.get("http://localhost:5000/api/inventory/low");
    setLowItems(res.data);
  };

  useEffect(() => {
    fetchItems();
    fetchLowStock();
  }, []);

  // 👉 ADD ITEM
  const addItem = async () => {
    const nameRegex = /^[A-Za-z0-9\s]+$/;

    // 1️⃣ Check empty fields
    if (!newItem.name || !newItem.stock || !newItem.min || !newItem.unit) {
      Swal.fire("Missing", "Enter all fields", "warning");
      return;
    }

    const exists = items.find(
      (i) => i.name.toLowerCase() === newItem.name.toLowerCase()
    );

    if (exists) {
      Swal.fire(
        "Already Exists",
        "This item is already in inventory",
        "error"
      );
      return;
    }


    // 2️⃣ Validate name (ONLY letters + space)
    if (!nameRegex.test(newItem.name)) {

      Swal.fire(
        "Invalid",
        "Enter a valid item name (no underscore/special chars)",
        "error"
      );
      return;
    }
    if (newItem.name.length > 15) {
      Swal.fire(
        "Too Long",
        "Item name must be maximum 15 characters",
        "error"
      );
      return;
    }

    // 3️⃣ Send to backend
    try {
      await axios.post("http://localhost:5000/api/inventory", {
        ...newItem,
        stock: Number(newItem.stock),
        min: Number(newItem.min)
      });

      Swal.fire("Success", "Item added", "success");

      // reset form
      setNewItem({ name: "", stock: "", min: "", unit: "" });

      // refresh data
      fetchItems();
      fetchLowStock();

    } catch (err) {
      Swal.fire("Error", "Failed to add item", "error");
    }
  };


  // 👉 DELETE ITEM
  const deleteItem = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete item?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "red"
    });

    if (!confirm.isConfirmed) return;

    await axios.delete(`http://localhost:5000/api/inventory/${id}`);

    Swal.fire("Deleted!", "", "success");

    fetchItems();
    fetchLowStock(); // 🔥 update alerts
  };

  // 👉 SELL ITEM (AUTO DEDUCT)
  const sellItem = async (item) => {
  const { value: qty } = await Swal.fire({
    title: `${item.name}`,
    input: "number",
    inputLabel: `Enter quantity (${item.unit})`,
    inputAttributes: {
      min: 0.01,     // ✅ allow small values
      step: "0.01"   // ✅ allow decimals like 2.5
    },
    showCancelButton: true
  });

  // ✅ Proper validation
  if (qty === null || qty === "" || Number(qty) <= 0) {
    Swal.fire("Invalid", "Enter a valid quantity", "warning");
    return;
  }

  try {
    await axios.post("http://localhost:5000/api/sales/sell", {
      name: item.name,
      quantity: Number(qty)  // ✅ decimal will be sent
    });

    Swal.fire("Sold!", "Stock updated", "success");

    fetchItems();
    fetchLowStock(); // 🔥 update alerts

  } catch (err) {
    Swal.fire("Error", err.response?.data?.message, "error");
  }
};

  const getBadge = (item) =>
    item.stock <= item.min ? "bg-danger" : "bg-success";

  const getStatus = (item) =>
    item.stock <= item.min ? "LOW STOCK" : "IN STOCK";


  return (
    <div className="container-fluid p-4">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">

        {/* LEFT SIDE (TITLE) */}
        <div>
          <h3 className="page-title mb-0">📦 Inventory Management</h3>
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
            Add the inventory items and track the stocks.
          </p>
        </div>

        {/* RIGHT SIDE (ALERT ICON) */}
        <div className="d-flex align-items-center gap-3">

  <div style={{ position: "relative" }}>
    
    {/* ALERT ICON */}
    <div
      onClick={() => setShowAlerts(!showAlerts)}
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "50%",
        background: "#dc3545",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: "16px"
      }}
    >
      !
    </div>

    {/* 🔴 BADGE COUNT */}
    {lowItems.length > 0 && (
      <span
        style={{
          position: "absolute",
          top: "-5px",
          right: "-8px",
          background: "black",
          color: "white",
          borderRadius: "50%",
          padding: "2px 6px",
          fontSize: "10px"
        }}
      >
        {lowItems.length}
      </span>
    )}

    {/* 🔔 DROPDOWN */}
    {showAlerts && (
      <div
        style={{
          position: "absolute",
          top: "35px",
          right: "0",
          width: "280px",
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          zIndex: 1000,
          padding: "10px"
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h6 className="mb-0">⚠ Low Stock</h6>

          <button
            onClick={() => setShowAlerts(false)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer"
            }}
          >
            ✖
          </button>
        </div>

        {lowItems.length === 0 ? (
          <p className="text-success mb-0">All stock healthy ✅</p>
        ) : (
          lowItems.map(item => (
            <div key={item._id} style={{ fontSize: "0.85rem" }}>
              {item.name} low ({item.stock} {item.unit})
            </div>
          ))
        )}
      </div>
    )}

  </div>

</div>
        {showAlerts && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              width: "min(280px, 100%)",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              zIndex: 1000,
              padding: "10px"
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">⚠ Low Stock</h6>

              <button
                onClick={() => setShowAlerts(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "16px",
                  cursor: "pointer",
                  color: "#888"
                }}
              >
                ✖
              </button>
            </div>

            {lowItems.length === 0 ? (
              <p className="text-success mb-0">All stock healthy ✅</p>
            ) : (
              lowItems.map(item => (
                <div
                  key={item._id}
                  style={{
                    fontSize: "0.85rem",
                    padding: "6px",
                    borderBottom: "1px solid #eee"
                  }}
                >
                  {item.name} low ({item.stock} {item.unit})
                </div>
              ))
            )}
          </div>
        )}

      </div>


      {/* FORM */}
      <div className="card shadow p-3 mb-4">
        <div className="row g-2">

          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Item Name"
              value={newItem.name}
              onChange={(e) =>
                setNewItem({ ...newItem, name: e.target.value })
              }
            />
          </div>

          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Stock"
              value={newItem.stock}
              onChange={(e) =>
                setNewItem({ ...newItem, stock: e.target.value })
              }
            />
          </div>

          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Min"
              value={newItem.min}
              onChange={(e) =>
                setNewItem({ ...newItem, min: e.target.value })
              }
            />
          </div>

          {/* ✅ UNIT DROPDOWN */}
          <div className="col-md-2">
            <select
              className="form-select"
              value={newItem.unit}
              onChange={(e) =>
                setNewItem({ ...newItem, unit: e.target.value })
              }
            >
              <option value="">Unit</option>
              <option value="kg">kg</option>
              <option value="L">L</option>
              <option value="pcs">pcs</option>
              <option value="g">g</option>
            </select>
          </div>

          <div className="col-md-3">
            <button className="btn btn-success w-100" onClick={addItem}>
              + Add Item
            </button>
          </div>

        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow">
        <div className="card-header bg-danger text-white">
          Inventory Stock List
        </div>

        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Item</th>
                <th>Stock</th>
                <th>Min</th>
                <th>Unit</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.name}</td>
                  <td>{Number(item.stock).toFixed(2)}</td>
                  <td>{item.min}</td>
                  <td>{item.unit}</td>

                  <td>
                    <span className={`badge ${getBadge(item)}`}>
                      {getStatus(item)}
                    </span>
                  </td>

                  {/* ✅ ACTION FIXED */}
                  <td>
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => sellItem(item)}
                    >
                      Qty used
                    </button>

                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteItem(item._id)}
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
  );
}