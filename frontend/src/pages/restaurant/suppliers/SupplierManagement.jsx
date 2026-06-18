import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function SupplierManagement() {

  const [suppliers, setSuppliers] = useState([]);

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact: "",
    address: "",
    items: "",
    paid: "Pending"
  });

  // 👉 FETCH
  const fetchSuppliers = async () => {
    const res = await axios.get("http://localhost:5000/api/suppliers");
    setSuppliers(res.data);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const viewSupplier = (s) => {
    Swal.fire({
      html: `
      <div style="text-align:center; padding:10px;">
        
        <!-- Profile Image -->
        <img 
          src="https://ui-avatars.com/api/?name=${s.name}&background=dc3545&color=fff&size=100" 
          style="
            width:90px;
            height:90px;
            border-radius:50%;
            margin-bottom:10px;
            border:3px solid #eee;
          "
        />

        <!-- Name -->
        <h4 style="margin-bottom:15px;">${s.name}</h4>

        <!-- Details -->
        <div style="text-align:left; font-size:14px; line-height:1.8;">
          <p><strong>📞 Contact:</strong> ${s.contact}</p>
          <p><strong>📍 Address:</strong> ${s.address || "-"}</p>
          <p><strong>📦 Items Supplied:</strong> ${s.items || "-"}</p>

          <p>
            <strong>💰 Payment Status:</strong> 
            <span style="
              padding:4px 10px;
              border-radius:12px;
              color:white;
              background:${s.paid === "Paid" ? "#28a745" : "#ffc107"};
            ">
              ${s.paid}
            </span>
          </p>
        </div>
      </div>
    `,
      showConfirmButton: false,
      showCloseButton: true,
      width: "400px"
    });
  };

  // 👉 ADD
  const addSupplier = async () => {

    const nameRegex = /^[A-Za-z\s]+$/;
    const itemsRegex = /^[A-Za-z\s]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    // 1️⃣ ALL FIELDS REQUIRED
    if (
      !newSupplier.name ||
      !newSupplier.contact ||
      !newSupplier.address ||
      !newSupplier.items
    ) {
      Swal.fire("Missing", "All fields are required", "warning");
      return;
    }

    // 2️⃣ NAME VALIDATION
    if (!nameRegex.test(newSupplier.name)) {
      Swal.fire(
        "Invalid Name",
        "Supplier name should contain only letters",
        "error"
      );
      return;
    }

    // 3️⃣ PHONE VALIDATION (10 digits only)
    if (!phoneRegex.test(newSupplier.contact)) {
      Swal.fire("Invalid", "Enter valid 10-digit contact number", "error");
      return;
    }

    // 🔥 3. DUPLICATE CONTACT CHECK (IMPORTANT)
    const exists = suppliers.find(
      (s) => s.contact === newSupplier.contact
    );

    if (exists) {
      Swal.fire(
        "Already Exists",
        "This contact number is already registered",
        "error"
      );
      return;
    }

    // 5️⃣ API CALL
    try {
      await axios.post("http://localhost:5000/api/suppliers", newSupplier);

      Swal.fire("Added!", "Supplier saved successfully", "success");

      setNewSupplier({
        name: "",
        contact: "",
        address: "",
        items: "",
        paid: "Pending"
      });

      fetchSuppliers();

    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to add supplier",
        "error"
      );
    }
  };

  // 👉 DELETE
  const deleteSupplier = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete supplier?",
      icon: "warning",
      showCancelButton: true
    });

    if (!confirm.isConfirmed) return;

    await axios.delete(`http://localhost:5000/api/suppliers/${id}`);

    Swal.fire("Deleted!", "", "success");
    fetchSuppliers();
  };

  const editSupplier = (s) => {
  Swal.fire({
    title: "Edit Supplier",
    html: `
      <input id="name" class="swal2-input" value="${s.name}" placeholder="Name">
      <input id="contact" class="swal2-input" value="${s.contact}" placeholder="Contact">
      <input id="address" class="swal2-input" value="${s.address}" placeholder="Address">
      <input id="items" class="swal2-input" value="${s.items}" placeholder="Items">
    `,
    focusConfirm: false,
    showCancelButton: true,
    preConfirm: () => {
      return {
        name: document.getElementById("name").value,
        contact: document.getElementById("contact").value,
        address: document.getElementById("address").value,
        items: document.getElementById("items").value,
      };
    }
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    try {
      await axios.put(
        `http://localhost:5000/api/suppliers/${s._id}`,
        result.value
      );

      Swal.fire("Updated!", "Supplier updated successfully", "success");
      fetchSuppliers();

    } catch (err) {
      Swal.fire("Error", "Update failed", "error");
    }
  });
};

  // 👉 TOGGLE PAYMENT
  const togglePayment = async (s) => {
    const newStatus = s.paid === "Paid" ? "Pending" : "Paid";

    await axios.put(`http://localhost:5000/api/suppliers/${s._id}`, {
      paid: newStatus
    });

    fetchSuppliers();
  };

  return (
    <div className="container-fluid p-4">

      {/* HEADER */}

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="page-title mb-0">🚚 Supplier Management</h3>
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
            Add the suppliers and track payment overview.
          </p>
        </div>
      </div>



      {/* FORM */}
      <div className="card shadow p-3 mb-4">
        <div className="row g-2">

          <input className="form-control col"
            placeholder="Supplier Name"
            value={newSupplier.name}
            onChange={(e) =>
              setNewSupplier({ ...newSupplier, name: e.target.value })
            }
          />

          <input
            className="form-control col"
            placeholder="Contact"
            value={newSupplier.contact}
            maxLength={10}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, ""); // only digits
              setNewSupplier({ ...newSupplier, contact: value });
            }}
          />

          <input className="form-control col"
            placeholder="Address"
            value={newSupplier.address}
            onChange={(e) =>
              setNewSupplier({ ...newSupplier, address: e.target.value })
            }
          />

          <input className="form-control col"
            placeholder="Items Supplied"
            value={newSupplier.items}
            onChange={(e) =>
              setNewSupplier({ ...newSupplier, items: e.target.value })
            }
          />

          <button className="btn btn-success col" onClick={addSupplier}>
            Add
          </button>

        </div>
      </div>

      {/* CARDS VIEW */}
      <div className="row g-3">

        {suppliers.map((s) => (
          <div className="col-md-4 col-sm-6" key={s._id}>

            <div
              className="card h-100 shadow-sm border-0"
              style={{
                borderRadius: "14px",
                background: "linear-gradient(135deg, #f6efef, #f0e7e7)",
                transition: "0.3s",
              }}
            >

              <div className="card-body">

                {/* NAME */}
                <h5 className="mb-2 text-dark fw-bold">
                  {s.name}
                </h5>

                {/* DETAILS */}
                <p className="mb-1 text-dark">📞 {s.contact}</p>
                <p className="mb-1 text-dark">📍 {s.address}</p>
                <p className="mb-3 text-dark">📦 {s.items}</p>

                {/* STATUS */}
                <span
                  className={`badge ${s.paid === "Paid"
                      ? "bg-success"
                      : "bg-warning text-dark"
                    }`}
                  style={{ cursor: "pointer", fontSize: "0.85rem" }}
                  onClick={() => togglePayment(s)}
                >
                  {s.paid}
                </span>

                {/* ACTION BUTTONS */}
                <div className="mt-3 d-flex gap-2">

                  <button
                    className="btn btn-sm btn-outline-primary flex-fill bg-primary text-white"
                    onClick={() => editSupplier(s)}
                  >
                    ✏ Edit
                  </button>

                  <button
                    className="btn btn-sm btn-outline-danger flex-fill bg-danger text-white"
                    onClick={() => deleteSupplier(s._id)}
                  >
                    🗑 Delete
                  </button>

                </div>

              </div>
            </div>
          </div>
        ))}

      </div>
      {/* SUMMARY */}
      <div className="card shadow mt-4 p-3">

        <h5>💰 Payment Overview</h5>

        <hr />

        <p>✔ Paid: {suppliers.filter(s => s.paid === "Paid").length}</p>
        <p>⏳ Pending: {suppliers.filter(s => s.paid === "Pending").length}</p>

        <hr />

        <h5 className="text-success">
          Total: {suppliers.length}
        </h5>

      </div>

    </div>
  );
}

