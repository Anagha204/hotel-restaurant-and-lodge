import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const BASE_URL = "http://localhost:5000/api/reservations";

export default function ReservationManagement() {
  const [reservations, setReservations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [tables, setTables] = useState([]);
  useEffect(() => {
    fetchReservations();

    axios.get("http://localhost:5000/api/tables")
      .then(res => setTables(res.data));
  }, []);

  const [newRes, setNewRes] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    people: 1,
    tableNumber: ""
  });

  // FETCH
  const fetchReservations = async () => {
    try {
      const res = await axios.get(BASE_URL);
      setReservations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  // ADD
  const addReservation = async () => {

    // 1. BASIC VALIDATION
    if (
      !newRes.name ||
      !newRes.phone ||
      !newRes.date ||
      !newRes.time ||
      !newRes.tableNumber
    ) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all details"
      });
    }

    // 2. PHONE DUPLICATE CHECK
    const phoneExists = reservations.find(
      r => r.phone === newRes.phone
    );

    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(newRes.phone)) {
      return Swal.fire({
        icon: "error",
        title: "Invalid Phone Number",
        text: "Phone number must be exactly 10 digits"
      });
    }


    if (phoneExists) {
      return Swal.fire({
        icon: "error",
        title: "Duplicate Phone",
        text: "This phone number already has a reservation"
      });
    }

    // 3. TABLE + DATE + TIME CHECK
    const tableConflict = reservations.find(
      r =>
        Number(r.tableNumber) === Number(newRes.tableNumber) &&
        r.date === newRes.date &&
        r.time === newRes.time &&
        r.status !== "Completed"
    );

    if (tableConflict) {
      return Swal.fire({
        icon: "error",
        title: "Table Already Booked",
        text: `Table ${newRes.tableNumber} is already booked for this time`
      });
    }

    // 4. OPTIONAL: TABLE STATUS CHECK (extra safety)
    const tableAlreadyReserved = reservations.find(
      r =>
        Number(r.tableNumber) === Number(newRes.tableNumber) &&
        r.status === "Reserved"
    );

    if (tableAlreadyReserved) {
      return Swal.fire({
        icon: "warning",
        title: "Table Not Available",
        text: "This table is already reserved"
      });
    }

    // 5. SAVE RESERVATION
    try {
      await axios.post(BASE_URL, newRes);

      await axios.put(
        `http://localhost:5000/api/tables/by-number/${newRes.tableNumber}`,
        { status: "Reserved" }
      );

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Reservation added successfully"
      });

      setNewRes({
        name: "",
        phone: "",
        date: "",
        time: "",
        people: 1,
        tableNumber: ""
      });

      setShowForm(false);
      fetchReservations();

    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create reservation"
      });
    }
  };

  // DELETE
  const deleteReservation = async (id) => {
    await axios.delete(`${BASE_URL}/${id}`);
    fetchReservations();
  };

  const getCurrentDateTime = () => {
    const now = new Date();

    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD

    const time = now.toTimeString().slice(0, 5); // HH:MM

    return { date, time };
  };

  // STATS
  const total = reservations.length;
  const today = new Date().toISOString().split("T")[0];
  const todayCount = reservations.filter(r => r.date === today).length;


  const handleTableClick = async (tableNo) => {
    const table = reservations.find(r => r.tableNumber === tableNo);

    if (!table) {
      return Swal.fire("No reservation for this table");
    }

    const { value: status } = await Swal.fire({
      title: `Table ${tableNo}`,
      input: "select",
      inputOptions: {
        Reserved: "Reserved",
        Arrived: "Arrived",
        Occupied: "Occupied",
        Completed: "Completed"
      },
      inputValue: table.status || "Reserved",
      showCancelButton: true
    });

    if (!status) return;

    try {
      await axios.put(`${BASE_URL}/${table._id}`, { status });
      fetchReservations();
    } catch (err) {
      Swal.fire("Error updating table");
    }
  };

  const updateReservation = async (reservation, status) => {
    const finalStatus =
      status === "Available" ? "Completed" : status;

    await axios.put(`${BASE_URL}/${reservation._id}`, {
      ...reservation,
      status: finalStatus
    });

    // 🔥 SYNC TABLE USING tableNumber
    await axios.put(
      `http://localhost:5000/api/tables/by-number/${reservation.tableNumber}`,
      {
        status:
          finalStatus === "Completed"
            ? "Available"
            : finalStatus
      }
    );

    fetchReservations();
  };

  return (
    <div className="container-fluid p-4">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h3 className="page-title mb-0">🍽 Reservation Management</h3>
            <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
              Book tables and manage reservation
            </p>
          </div>
        </div>
        <button
          className="btn btn-dark"
          onClick={() => {
            const { date, time } = getCurrentDateTime();

            setNewRes((prev) => ({
              ...prev,
              date,
              time
            }));

            setShowForm(!showForm);
          }}
        >
          + New Reservation
        </button>
      </div>

      <div className="row">

        {/* LEFT SIDE (TABLE) */}
        <div className="col-md-8">

          {/* FORM */}
          {showForm && (
            <div className="card shadow p-4 mb-3">
              <div className="row g-3">

                {/* ROW 1 */}
                <div className="col-md-6">
                  <label className="form-label">Customer Name</label>
                  <input
                    className="form-control"
                    value={newRes.name}
                    onChange={(e) =>
                      setNewRes({ ...newRes, name: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-control"
                    value={newRes.phone}
                    maxLength={10}
                    inputMode="numeric"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ""); // remove letters
                      if (value.length <= 10) {
                        setNewRes({ ...newRes, phone: value });
                      }
                    }}
                  />
                </div>

                {/* ROW 2 */}
                <div className="col-md-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newRes.date}
                    onChange={(e) =>
                      setNewRes({ ...newRes, date: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={newRes.time}
                    onChange={(e) =>
                      setNewRes({ ...newRes, time: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">People</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newRes.people}
                    onChange={(e) =>
                      setNewRes({ ...newRes, people: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Table No</label>
                  <select
                    className="form-control"
                    value={newRes.tableNumber}
                    onChange={(e) =>
                      setNewRes({ ...newRes, tableNumber: Number(e.target.value) })
                    }
                  >
                    <option value="">Select Table</option>
                    {tables.map(t => (
                      <option key={t._id} value={t.tableNumber}>
                        Table {t.tableNumber} ({t.section})
                      </option>
                    ))}
                  </select>
                </div>

                {/* BUTTON */}
                <div className="col-12 text-end">
                  <button
                    className="btn btn-success px-4"
                    onClick={addReservation}
                  >
                    Save Reservation
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TABLE */}
          <div className="card shadow">
            <div className="card-header bg-danger text-white">
              Reservations List
            </div>

            <div className="table-responsive">
              <table className="table table-hover table-sm mb-0">
                <thead className="table-danger">
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>People</th>
                    <th>Table</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {reservations.map(r => (
                    <tr key={r._id}>
                      <td>{r.name}</td>
                      <td>{r.phone}</td>
                      <td>{r.date}</td>
                      <td>{r.time}</td>
                      <td>{r.people}</td>
                      <td>{r.tableNumber || "-"}</td>

                      <td>
                        <select
                          className="form-select form-select-sm mb-1"
                          value={r.status || "Reserved"}
                          onChange={(e) =>
                            updateReservation(r, e.target.value)
                          }
                        >
                          <option value="Reserved">Reserved</option>
                          <option value="Arrived">Arrived</option>
                          <option value="Occupied">Occupied</option>
                          <option value="Completed">Completed</option>
                          <option value="Available">Available</option>
                        </select>

                        <button
                          className="btn btn-sm btn-danger w-100"
                          onClick={() => deleteReservation(r._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
          <br></br>

          {/* TABLE LAYOUT */}
          <div className="card shadow p-3 mb-3 ">
            <h5 className="mb-3">🪑 Table Layout</h5>

            <div className="d-flex flex-wrap gap-3">

              {[...Array(12)].map((_, i) => {
                const tableNo = i + 1;

                const table = reservations.find(
                  r => r.tableNumber === tableNo
                );

                const rawStatus = table?.status;

                const status =
                  rawStatus === "Completed" || !rawStatus
                    ? "Available"
                    : rawStatus;

                const getColor = () => {
                  if (status === "Reserved") return "bg-warning text-dark";
                  if (status === "Arrived") return "bg-success text-white";
                  if (status === "Occupied") return "bg-danger text-white";
                  return "bg-light";
                };

                return (
                  <div
                    key={tableNo}
                    className={`rounded shadow-sm ${getColor()}`}
                    style={{
                      width: "100px",
                      height: "80px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      fontWeight: "600"
                    }}
                    onClick={() => handleTableClick(tableNo)}
                  >
                    <div>T{tableNo}</div>
                    <small>{status}</small>
                  </div>
                );
              })}

            </div>
          </div>

        </div>

        {/* RIGHT SIDE (CARDS) */}
        <div className="col-md-4">

          {/* SUMMARY CARD */}
          <div className="card shadow p-3 mb-3">
            <h5>📊 Reservation Summary</h5>
            <hr />
            <p><b>Total Reservations:</b> {total}</p>
            <p><b>Today's Bookings:</b> {todayCount}</p>
          </div>

          {/* ACTIVITY CARD */}
          <div className="card shadow p-3">
            <h5>🔔 Recent Activity</h5>
            <hr />

            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {reservations.slice(0, 5).map(r => (
                <div key={r._id} className="border-bottom mb-2 pb-2">
                  <strong>{r.name}</strong>
                  <br />
                  <small>
                    Table {r.tableNumber || "-"} • {r.date}
                  </small>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

    </div>

  );
}
