import { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const BASE_URL = "http://localhost:5000/api";

// SearchableSelect component (unchanged – keep as is)
function SearchableSelect({ options = [], value, onChange, placeholder = "Search…", emptyMsg = "No results found" }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  const filtered = query.trim()
    ? options.filter((o) =>
      [o.label, o.sublabel]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    )
    : options;

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        if (!value) setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [value]);

  const select = (opt) => {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setQuery("");
    inputRef.current?.focus();
    setOpen(true);
  };

  const handleKeyDown = (e) => {
    if (!open) { setOpen(true); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    if (e.key === "Enter" && filtered[highlighted]) select(filtered[highlighted]);
    if (e.key === "Escape") setOpen(false);
  };

  const highlight = (text = "", q = "") => {
    if (!q.trim()) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: "#FFF0F0", color: "#C62828", padding: 0, borderRadius: "2px" }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div style={{
        display: "flex", alignItems: "center",
        border: open ? "1.5px solid #C62828" : "1px solid #ced4da",
        borderRadius: "8px", background: "white", padding: "0 10px",
        boxShadow: open ? "0 0 0 3px rgba(198,40,40,0.1)" : "none",
      }}>
        <span style={{ color: "#aaa", marginRight: "8px", fontSize: "0.85rem" }}>🔍</span>
        {selected && !open ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", padding: "7px 0" }}>
            {selected.avatar && (
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
                color: "white", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 700, fontSize: "0.75rem",
              }}>
                {selected.avatar}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{selected.label}</div>
              {selected.sublabel && <div style={{ fontSize: "0.73rem", color: "#888" }}>{selected.sublabel}</div>}
            </div>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHighlighted(0); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            style={{ flex: 1, border: "none", outline: "none", fontSize: "0.88rem", padding: "9px 0", background: "transparent" }}
          />
        )}
        {selected ? (
          <button onClick={clear} style={{ border: "none", background: "none", cursor: "pointer", color: "#aaa", fontSize: "1rem" }}>✕</button>
        ) : (
          <span style={{ color: "#aaa", fontSize: "0.75rem" }}>▾</span>
        )}
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "white", border: "1px solid #e0e0e0", borderRadius: "10px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999,
          maxHeight: "220px", overflowY: "auto",
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "14px 16px", color: "#aaa", fontSize: "0.85rem", textAlign: "center" }}>
              {query ? `No results for "${query}"` : emptyMsg}
            </div>
          ) : (
            filtered.map((opt, idx) => (
              <div
                key={opt.value}
                onMouseDown={() => select(opt)}
                onMouseEnter={() => setHighlighted(idx)}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 14px", cursor: "pointer",
                  background: highlighted === idx ? "#FFF5F5" : "white",
                  borderBottom: idx < filtered.length - 1 ? "1px solid #f5f5f5" : "none",
                }}
              >
                {opt.avatar && (
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
                    color: "white", display: "flex", alignItems: "center",
                    justifyContent: "center", fontWeight: 700, fontSize: "0.8rem",
                  }}>
                    {opt.avatar}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{highlight(opt.label, query)}</div>
                  {opt.sublabel && <div style={{ fontSize: "0.73rem", color: "#888" }}>{highlight(opt.sublabel, query)}</div>}
                </div>
                {highlighted === idx && <span style={{ color: "#C62828", fontSize: "0.75rem" }}>↵</span>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Helper: calculate subtotal from an array of items
const calculateItemsSubtotal = (items) => {
  if (!items || !items.length) return 0;
  return items.reduce((sum, item) => {
    const price = item.price || item.menuItem?.price || 0;
    return sum + price * (item.quantity || 1);
  }, 0);
};

export default function BillingPayment() {
  const [allOrders, setAllOrders] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [mergedItems, setMergedItems] = useState([]);
  const [entityType, setEntityType] = useState("table");
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paidDetails, setPaidDetails] = useState(null);

  const fetchUnpaidOrders = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/orders`);
      const unpaid = res.data.filter(o => o.orderStatus !== "Cancelled" && o.paymentStatus !== "Paid");
      setAllOrders(unpaid);
    } catch (err) {
      setError("Failed to load orders");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUnpaidOrders();
  }, []);

  const getEntityOptions = () => {
    if (entityType === "table") {
      const tableMap = new Map();
      allOrders.forEach(order => {
        if (order.orderType === "Dine In" && order.table && order.table._id) {
          const tableId = order.table._id;
          if (!tableMap.has(tableId)) {
            tableMap.set(tableId, {
              value: tableId,
              label: `Table ${order.table.tableNumber}`,
              sublabel: `${order.table.section || "Main"} · ${order.table.status}`,
              avatar: "🍽️",
              orders: []
            });
          }
          tableMap.get(tableId).orders.push(order);
        }
      });
      return Array.from(tableMap.values()).map(entry => {
        const allItems = entry.orders.flatMap(o => o.items);
        const subtotal = calculateItemsSubtotal(allItems);
        return {
          ...entry,
          sublabel: `${entry.orders.length} order(s) · ₹${subtotal.toFixed(2)}`,
          orders: entry.orders
        };
      });
    } else {
      const customerMap = new Map();
      allOrders.forEach(order => {
        if (order.orderType !== "Dine In" && order.customerName) {
          const key = `${order.customerName}_${order.customerPhone || ""}`;
          if (!customerMap.has(key)) {
            customerMap.set(key, {
              value: key,
              label: order.customerName,
              sublabel: order.customerPhone ? `📞 ${order.customerPhone}` : "",
              avatar: "👤",
              orders: []
            });
          }
          customerMap.get(key).orders.push(order);
        }
      });
      return Array.from(customerMap.values()).map(entry => {
        const allItems = entry.orders.flatMap(o => o.items);
        const subtotal = calculateItemsSubtotal(allItems);
        return {
          ...entry,
          sublabel: `${entry.orders.length} order(s) · ₹${subtotal.toFixed(2)}`,
          orders: entry.orders
        };
      });
    }
  };

  const entityOptions = getEntityOptions();

  const handleEntitySelect = (entityId) => {
    const selected = entityOptions.find(opt => opt.value === entityId);
    if (!selected) {
      setSelectedEntity(null);
      setMergedItems([]);
      return;
    }
    setSelectedEntity(selected);
    const allItems = [];
    selected.orders.forEach(order => {
      order.items.forEach(item => {
        const menuItemId = item.menuItem?._id || item.menuItem;
        const existing = allItems.find(i => i.menuItemId === menuItemId);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          allItems.push({
            menuItemId: menuItemId,
            name: item.name || item.menuItem?.name || "Item",
            price: item.price || item.menuItem?.price || 0,
            quantity: item.quantity,
          });
        }
      });
    });
    setMergedItems(allItems);
    setTaxPercent(0);
    setDiscountPercent(0);
    setPaidDetails(null);
  };

  const subtotal = calculateItemsSubtotal(mergedItems);
  const taxAmount = (subtotal * taxPercent) / 100;
  const discountAmount = (subtotal * discountPercent) / 100;
  const grandTotal = subtotal + taxAmount - discountAmount;

  // Print receipt with working QR code (using QRCode.js)
  const printReceipt = () => {
    if (!selectedEntity) {
      alert("Please select a table / customer first");
      return;
    }

    const win = window.open("", "", "width=900,height=700");
    const date = new Date().toLocaleString("en-IN");
    let entityDisplay = "";
    if (entityType === "table") entityDisplay = `Table ${selectedEntity.label.replace("Table ", "")}`;
    else entityDisplay = selectedEntity.label;

    const orderIds = selectedEntity.orders.map(o => o._id.slice(-6)).join(",");
    const upiLink = `upi://pay?pa=yourUPI@ybl&pn=MangaloreLodge&am=${grandTotal}&cu=INR`;

    // Build table rows
    const tableRows = mergedItems.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>₹${item.price}</td>
        <td>₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    win.document.write(`
      <html>
      <head>
        <title>Consolidated Bill - ${entityDisplay}</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 30px; background: #fff; }
          .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #C62828; padding-bottom: 10px; }
          h2 { margin: 0; color: #C62828; }
          .details { margin-top: 20px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #ddd; }
          .label { font-weight: bold; }
          .total { margin-top: 20px; font-size: 24px; font-weight: bold; text-align: right; color: #2E7D32; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          .stamp { text-align: right; margin-top: 20px; font-style: italic; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #f0f0f0; }
          th { background: #f8f9fa; }
          .qr-container { text-align: center; margin-top: 25px; }
          .qr-container canvas { margin: 0 auto; border: 1px solid #ddd; padding: 5px; border-radius: 8px; background: white; }
          .qr-container p { font-size: 11px; color: #888; margin: 8px 0 0; }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <h2>🏨 MANGALORE INTERNATIONAL RESTAURANT</h2>
            <p>Consolidated Bill</p>
          </div>
          <div class="details">
            <div class="row"><span class="label">${entityType === "table" ? "Table" : "Customer"}:</span><span>${entityDisplay}</span></div>
            <div class="row"><span class="label">Order IDs:</span><span>${orderIds}</span></div>
            <div class="row"><span class="label">Date & Time:</span><span>${date}</span></div>
          </div>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="row"><span class="label">Subtotal:</span><span>₹${subtotal.toFixed(2)}</span></div>
          <div class="row"><span class="label">Tax (${taxPercent}%):</span><span>₹${taxAmount.toFixed(2)}</span></div>
          <div class="row"><span class="label">Discount (${discountPercent}%):</span><span>− ₹${discountAmount.toFixed(2)}</span></div>
          <div class="total">GRAND TOTAL: ₹${grandTotal.toFixed(2)}</div>
          <div class="row"><span class="label">Payment Mode:</span><span>${paymentMode}</span></div>
          
          <div class="qr-container">
            <p>📱 Scan to pay (UPI)</p>
            <div id="qrcode"></div>
            <p>₹${grandTotal}</p>
          </div>

          <div class="stamp">✓ Paid on ${date}</div>
          <div class="footer">
            Thank you for dining with us!<br/>
            Visit Again | Mangalore International Lodge<br/>
            © 2026
          </div>
        </div>
        <script>
          try {
            new QRCode(document.getElementById("qrcode"), {
              text: "${upiLink}",
              width: 150,
              height: 150,
              colorDark : "#000000",
              colorLight : "#ffffff",
              correctLevel : QRCode.CorrectLevel.H
            });
          } catch(e) {
            document.getElementById("qrcode").innerHTML = "<p style='color:red;'>QR error</p>";
          }
        <\/script>
        <script>window.print();<\/script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const handleGenerateBill = async () => {
    if (!selectedEntity || mergedItems.length === 0) {
      Swal.fire("No selection", "Please select a table or customer with pending orders", "warning");
      return;
    }
    setLoading(true);
    try {
      const orderIds = selectedEntity.orders.map(o => o._id);
      await axios.put(`${BASE_URL}/orders/mark-paid`, {
        orderIds,
        paymentMode,
        taxPercent,
        discountPercent,
        grandTotal
      });

      setPaidDetails({
        entityLabel: selectedEntity.label,
        entityType,
        paymentMode,
        grandTotal: grandTotal.toFixed(2),
        orderCount: orderIds.length
      });

      printReceipt();
      await fetchUnpaidOrders();
      setSelectedEntity(null);
      setMergedItems([]);
      Swal.fire("Success", `Bill generated for ${orderIds.length} order(s)`, "success");
    } catch (err) {
      setError("Failed to process billing");
      Swal.fire("Error", err.response?.data?.error || "Failed to process billing", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="page-title mb-0 text-dark">💳 Consolidated Billing</h3>
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
            Group unpaid orders by Table or Customer
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-3">⚠️ {error}</div>}

      <div className="row g-4">
        <div className="col-md-7">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-danger text-white">
              <p className="mb-0 fw-bold">Select Group</p>
            </div>
            <div className="card-body p-4">
              <div className="mb-3">
                <label className="form-label fw-bold">Group by:</label>
                <div className="d-flex gap-2">
                  <button
                    className={`btn ${entityType === "table" ? "btn-danger" : "btn-outline-secondary"}`}
                    onClick={() => setEntityType("table")}
                    style={{ borderRadius: "40px" }}
                  >
                    🍽️ Tables
                  </button>
                  <button
                    className={`btn ${entityType === "customer" ? "btn-danger" : "btn-outline-secondary"}`}
                    onClick={() => setEntityType("customer")}
                    style={{ borderRadius: "40px" }}
                  >
                    👤 Customers
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-muted fw-bold mb-1">Select {entityType === "table" ? "Table" : "Customer"}</label>
                <SearchableSelect
                  options={entityOptions}
                  value={selectedEntity?.value || ""}
                  onChange={handleEntitySelect}
                  placeholder={`Search ${entityType === "table" ? "table" : "customer"}...`}
                  emptyMsg={entityOptions.length === 0 ? `No pending orders for any ${entityType}` : `No matching ${entityType}`}
                />
              </div>

              {mergedItems.length > 0 && (
                <div>
                  <h5 className="fw-bold mb-3">Consolidated Order Items</h5>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead className="table-light">
                        <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                      </thead>
                      <tbody>
                        {mergedItems.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>₹{item.price}</td>
                            <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="table-active">
                          <td colSpan="3" className="text-end fw-bold">Subtotal:</td>
                          <td className="fw-bold">₹{subtotal.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-5">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-danger text-white">
              <p className="mb-0 fw-bold">Tax, Discount & Payment</p>
            </div>
            <div className="card-body p-4">
              <div className="mb-3">
                <label className="form-label fw-bold text-muted">Tax (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  min="0"
                  step="0.5"
                  placeholder="e.g., 5, 12, 18"
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold text-muted">Discount (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.5"
                  placeholder="e.g., 10"
                />
              </div>
              <div className="mb-4">
                <label className="form-label fw-bold text-muted">Payment Mode</label>
                <div className="d-flex gap-3 mt-2">
                  {["Cash", "Card", "UPI"].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      className={`btn ${paymentMode === mode ? "btn-warning" : "btn-outline-secondary"}`}
                      onClick={() => setPaymentMode(mode)}
                      style={{ borderRadius: "40px", padding: "6px 24px" }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded text-center mb-4" style={{ backgroundColor: "#F8FAFE", border: "1px solid #e9ecef" }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal:</span>
                  <span className="fw-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Tax ({taxPercent}%):</span>
                  <span className="fw-bold">₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Discount ({discountPercent}%):</span>
                  <span className="fw-bold text-danger">− ₹{discountAmount.toFixed(2)}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between">
                  <span className="fw-bold h5">Grand Total:</span>
                  <span className="fw-bold h5 text-success">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                className="btn btn-warning w-100"
                onClick={handleGenerateBill}
                disabled={!selectedEntity || mergedItems.length === 0 || loading}
                style={{ padding: "12px", fontWeight: 600 }}
              >
                {loading ? "Processing..." : "💰 Generate Consolidated Bill & Print"}
              </button>

              {paidDetails && (
                <div className="card mt-4 border-0 shadow-sm" style={{ borderLeft: "5px solid #28a745", background: "#f8fef9" }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-bold text-success mb-0">✓ Bill Generated</h6>
                      <span className="badge bg-success">PAID</span>
                    </div>
                    <hr className="my-2" />
                    <div style={{ fontSize: "0.85rem" }}>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">{paidDetails.entityType === "table" ? "Table" : "Customer"}:</span>
                        <span className="fw-bold">{paidDetails.entityLabel}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Orders Combined:</span>
                        <span className="fw-bold">{paidDetails.orderCount}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Payment Mode:</span>
                        <span className="fw-bold">{paidDetails.paymentMode}</span>
                      </div>
                      <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                        <span className="text-muted fw-bold">Grand Total:</span>
                        <span className="fw-bold text-dark">₹{paidDetails.grandTotal}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}