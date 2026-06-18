import { useState, useEffect } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const BASE_URL = "http://localhost:5000/api";

export default function Reports() {
  const [reportData, setReportData] = useState({
    dailySales: 0,
    monthlySales: 0,
    totalOrdersToday: 0,
    topItems: [],
    topOrders: [],
    salesChartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/restaurant-reports/summary`);
        setReportData(res.data);
      } catch (err) {
        console.error("Failed to load reports", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const exportToCSV = () => {
    if (!reportData.salesChartData || reportData.salesChartData.length === 0) return;
    const csvContent = [
      ["Date", "Sales (INR)", "Order Count"],
      ...reportData.salesChartData.map(d => [d.date, d.sales, d.orderCount])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Restaurant_Sales_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid px-3 px-md-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="page-title mb-0">📊 Reporting & Analytics</h3>
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
            Overview of restaurant performance
          </p>
        </div>
        <button className="btn btn-outline-primary" onClick={exportToCSV} disabled={!reportData.salesChartData || reportData.salesChartData.length === 0}>
            📥 Export CSV
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">Loading reports...</div>
      ) : (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card card-premium shadow-sm border-0 p-4 text-center h-100">
                <h6 className="text-muted text-uppercase" style={{ fontSize: "0.8rem", letterSpacing: "1px" }}>Daily Sales</h6>
                <h3 className="mb-0 fw-bold" style={{ color: "#2E7D32" }}>₹{reportData.dailySales?.toLocaleString()}</h3>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card card-premium shadow-sm border-0 p-4 text-center h-100">
                <h6 className="text-muted text-uppercase" style={{ fontSize: "0.8rem", letterSpacing: "1px" }}>Monthly Sales</h6>
                <h3 className="mb-0 fw-bold text-primary">₹{reportData.monthlySales?.toLocaleString()}</h3>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card card-premium shadow-sm border-0 p-4 text-center h-100">
                <h6 className="text-muted text-uppercase" style={{ fontSize: "0.8rem", letterSpacing: "1px" }}>Orders Today</h6>
                <h3 className="mb-0 fw-bold text-dark">{reportData.totalOrdersToday}</h3>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            {/* Sales Line Chart */}
            <div className="col-12">
              <div className="card card-premium shadow-sm border-0">
                <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-0">
                  <h6 className="fw-bold mb-0">📈 Sales Trend (Last 7 Days)</h6>
                </div>
                <div className="card-body p-4" style={{ height: "300px" }}>
                  {reportData.salesChartData && reportData.salesChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={reportData.salesChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} domain={[0, dataMax => (dataMax === 0 ? 1000 : dataMax)]} />
                        <RechartsTooltip formatter={(value) => [`₹${value}`, 'Sales']} labelStyle={{color: '#333'}} />
                        <Line type="monotone" dataKey="sales" stroke="#007bff" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-100 d-flex align-items-center justify-content-center text-muted">No sales data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Top Selling Items Bar Chart */}
            <div className="col-md-6">
              <div className="card card-premium shadow-sm border-0 h-100">
                <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-0">
                  <h6 className="fw-bold mb-0">🔥 Top Selling Items</h6>
                </div>
                <div className="card-body p-4" style={{ height: "300px" }}>
                  {reportData.topItems && reportData.topItems.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.topItems} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: '#333'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
                        <RechartsTooltip formatter={(value) => [value, 'Qty Sold']} cursor={{fill: '#f5f5f5'}} />
                        <Bar dataKey="count" fill="#C62828" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-100 d-flex align-items-center justify-content-center text-muted">No items data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Orders By Date Bar Chart */}
            <div className="col-md-6">
              <div className="card card-premium shadow-sm border-0 h-100">
                <div className="card-header bg-white border-bottom-0 pt-4 px-4 pb-0">
                  <h6 className="fw-bold mb-0">🏆 Orders by Date (Last 7 Days)</h6>
                </div>
                <div className="card-body p-4" style={{ height: "300px" }}>
                  {reportData.salesChartData && reportData.salesChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.salesChartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#333'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, dataMax => (dataMax === 0 ? 5 : dataMax)]} />
                        <RechartsTooltip formatter={(value) => [value, 'Total Orders']} cursor={{fill: '#f5f5f5'}} />
                        <Bar dataKey="orderCount" fill="#28a745" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-100 d-flex align-items-center justify-content-center text-muted">No orders data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
