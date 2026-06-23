import { useState, useEffect, useRef } from "react";
import axios from "axios";

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

export default function Receipts() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchPaidOrders = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/orders`);
      const paidOrders = res.data.filter(o => o.paymentStatus === "Paid");
      setOrders(paidOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaidOrders();
  }, []);

  const handlePrint = () => {
    const printElement = document.getElementById("receipt-print-area");
    if (!printElement) return;

    const printWindow = window.open('', '', 'width=420'); // ← removed height=600
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - Order #${selectedOrder?._id.toString().slice(-6).toUpperCase()}</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html, body {
              height: auto !important;
              overflow: visible !important;
              padding: 20px;
              font-family: monospace;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            #receipt-print-area {
              max-width: 350px;
              margin: 0 auto;
              padding: 20px;
              height: auto !important;
              overflow: visible !important;
            }
            @media print {
              html, body {
                height: auto !important;
                overflow: visible !important;
              }
              #receipt-print-area {
                width: 100%;
                max-width: 100%;
                box-shadow: none !important;
                border: none !important;
              }
            }
          </style>
        </head>
        <body>
          ${printElement.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const generateReceiptText = (order) => {
    if (!order) return "";
    let text = `*MANGALORE INTERNATIONAL*\n123 Food Street, City Center\nPhone: +91 98765 43210\n\n`;
    text += `*Order No:* #${order._id.toString().slice(-6).toUpperCase()}\n`;
    text += `*Date:* ${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString()}\n`;
    if (order.customerName) text += `*Customer:* ${order.customerName}\n`;
    text += `\n*ITEMS:*\n`;
    order.items.forEach(item => {
      const price = item.menuItem?.price || 0;
      text += `- ${item.name || item.menuItem?.name || "Item"} (x${item.quantity}): ₹${price * item.quantity}\n`;
    });
    text += `\n*TOTAL: ₹${order.totalAmount}*\n`;
    text += `Payment Mode: ${order.paymentMode || "Cash"}\n\n`;
    text += `Thank you for visiting!`;
    return text;
  };

  const shareWhatsApp = () => {
    if (!selectedOrder) return;
    const text = generateReceiptText(selectedOrder);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareEmail = () => {
    if (!selectedOrder) return;
    const text = generateReceiptText(selectedOrder);
    const url = `mailto:?subject=Your Receipt from Mangalore International&body=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4">

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 d-print-none">
        <div>
          <h3 className="page-title mb-0">🧾 Receipt & Invoices</h3>
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
            View and print past customer receipts
          </p>
        </div>
      </div>

      <div className="row g-4 d-print-none">
        <div className="col-md-5">
          <div className="card card-premium shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-0">
              <h6 className="fw-bold mb-0">Paid Orders</h6>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush mt-3">
                {loading ? (
                  <li className="list-group-item text-center py-5 text-muted border-0">Loading...</li>
                ) : orders.length === 0 ? (
                  <li className="list-group-item text-center py-5 text-muted border-0">No paid orders found.</li>
                ) : (
                  orders.map(o => (
                    <li
                      key={o._id}
                      className={`list-group-item px-4 py-3 border-light`}
                      style={{ cursor: "pointer", background: selectedOrder?._id === o._id ? "#F0F8FF" : "white" }}
                      onClick={() => setSelectedOrder(o)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong className="d-block text-dark">Order #{o._id.toString().slice(-6).toUpperCase()}</strong>
                          <div className="text-secondary mt-1 mb-1" style={{ fontSize: "0.8rem", fontWeight: 500 }}>
                            {o.guestName ? (
                              `🏨 ${o.guestName} ${(o.assignedRoom || o.roomNumber) ? `(Room ${o.assignedRoom || o.roomNumber})` : ""}`
                            ) : o.customerName ? (
                              `👤 ${o.customerName}`
                            ) : o.orderType === "Dine In" && o.table ? (
                              `🍽️ Table ${o.table.tableNumber || "Selected"}`
                            ) : o.assignedRoom || o.roomNumber ? (
                              `🏨 Room ${o.assignedRoom || o.roomNumber}`
                            ) : (
                              `👤 Walk-in Customer`
                            )}
                          </div>
                          <small className="text-muted">{new Date(o.createdAt).toLocaleString()}</small>
                        </div>
                        <strong className="text-success">₹{o.totalAmount}</strong>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          {selectedOrder ? (
            <div className="card card-premium shadow-sm border-0">
              <div className="card-header bg-white d-flex justify-content-between align-items-center border-bottom pt-3 px-4 pb-3">
                <h6 className="fw-bold mb-0">Receipt Preview</h6>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-success" onClick={shareWhatsApp}><i className="bi bi-whatsapp"></i> WhatsApp</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={shareEmail}><i className="bi bi-envelope"></i> Email</button>
                  <button style={{ ...primaryBtn, padding: "6px 16px", fontSize: "0.8rem" }} onClick={handlePrint}><i className="bi bi-printer me-1"></i> Print / Save PDF</button>
                </div>
              </div>
              <div className="card-body p-5 d-flex justify-content-center bg-light">
                {/* Simulated Thermal Receipt */}
                <div id="receipt-print-area" style={{ width: "320px", background: "white", padding: "25px", border: "1px dashed #ccc", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                  <div className="text-center mb-3">
                    <h5 className="fw-bold mb-1">MANGALORE INTERNATIONAL</h5>
                    <small className="text-muted d-block">123 Food Street, City Center</small>
                    <small className="text-muted d-block">Phone: +91 98765 43210</small>
                  </div>
                  <hr style={{ borderTop: "1px dashed #000" }} />
                  <div className="mb-2" style={{ fontSize: "0.85rem" }}>
                    <div className="d-flex justify-content-between"><span>Order No:</span> <strong>#{selectedOrder._id.toString().slice(-6).toUpperCase()}</strong></div>
                    <div className="d-flex justify-content-between"><span>Date:</span> <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span></div>
                    <div className="d-flex justify-content-between"><span>Time:</span> <span>{new Date(selectedOrder.createdAt).toLocaleTimeString()}</span></div>
                    {selectedOrder.customerName && <div className="d-flex justify-content-between mt-1"><span>Customer:</span> <span>{selectedOrder.customerName}</span></div>}
                  </div>
                  <hr style={{ borderTop: "1px dashed #000" }} />
                  <table className="table table-borderless table-sm mb-2" style={{ fontSize: "0.85rem" }}>
                    <thead>
                      <tr className="border-bottom">
                        <th className="px-0">Item</th>
                        <th className="text-center">Qty</th>
                        <th className="text-center">Price</th>
                        <th className="text-end px-0">Amt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => {
                        const price = item.menuItem?.price || 0;
                        return (
                          <tr key={idx}>
                            <td className="px-0">{item.name || item.menuItem?.name || "Item"}</td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-center">₹{price}</td>
                            <td className="text-end px-0">₹{price * item.quantity}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <hr style={{ borderTop: "1px dashed #000" }} />
                  <div className="d-flex justify-content-between fw-bold mb-1" style={{ fontSize: "1rem" }}>
                    <span>TOTAL</span>
                    <span>₹{selectedOrder.totalAmount}</span>
                  </div>
                  <div className="d-flex justify-content-between text-muted" style={{ fontSize: "0.8rem" }}>
                    <span>Payment Mode</span>
                    <span>{selectedOrder.paymentMode || "Cash"}</span>
                  </div>
                  <hr style={{ borderTop: "1px dashed #000" }} className="mt-3" />
                  <div className="text-center mt-3">
                    <p className="mb-1" style={{ fontSize: "0.85rem", fontWeight: 600 }}>Thank you for visiting!</p>
                    <small className="text-muted">Have a great day</small>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card card-premium shadow-sm border-0 h-100 d-flex align-items-center justify-content-center text-muted py-5">
              Select an order from the list to view its receipt.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
