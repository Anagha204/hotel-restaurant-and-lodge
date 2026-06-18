import { useEffect, useState } from "react";
import axios from "axios";

export default function LodgeReports() {
    const [summary, setSummary] = useState(null);
    const [reportsTab, setReportsTab] = useState("overview"); // overview, bills
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchReports();
    }, [reportDate]);

    const fetchReports = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/reports/summary?date=${reportDate}`);
            setSummary(res.data);
        } catch (err) {
            console.log("Error fetching summary", err);
        }
    };

    const exportToCSV = () => {
        if (!summary) return;
        const csvContent = [
            ["Metric", "Value"],
            ["Report Date", reportDate],
            ["Total Revenue", summary.revenue.total.toFixed(2)],
            ["Pending Payments", summary.revenue.pending.toFixed(2)],
            ["Occupied Rooms", summary.occupancy.occupied],
            ["Available Rooms", summary.occupancy.available],
            ["Reserved Rooms", summary.occupancy.reserved],
            ["Total Bills", summary.totalBills]
        ].map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Lodge_Report_${reportDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container-fluid px-3 px-md-4 py-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h3 className="page-title mb-0">📊 Lodge Reports</h3>
                <div className="d-flex align-items-center gap-3">
                    <input
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        className="form-control"
                        style={{ borderRadius: "8px", border: "1px solid #ced4da" }}
                    />
                    <button className="btn btn-primary" onClick={exportToCSV} disabled={!summary}>
                        📥 Export to CSV
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4 border-bottom">
                <li className="nav-item">
                    <button
                        className={`nav-link ${reportsTab === 'overview' ? 'active fw-bold' : ''}`}
                        onClick={() => setReportsTab('overview')}
                        style={{ color: 'var(--red)' }}
                    >
                        Overview Analytics
                    </button>
                </li>
            </ul>

            {reportsTab === "overview" && (
                <>
                    {summary ? (
                        <div className="row g-4">
                            {/* Revenue Card */}
                            <div className="col-md-6">
                                <div className="card shadow-sm border-0 h-100">
                                    <div className="card-header bg-success text-white">
                                        <i className="bi bi-cash-stack me-2"></i> Revenue Report
                                    </div>
                                    <div className="card-body p-4 text-center">
                                        <h1 className="text-success display-4 fw-bold mb-2">
                                            ₹{summary.revenue.total.toFixed(2)}
                                        </h1>
                                        <p className="text-muted mb-3">Total Collected Revenue</p>
                                        <hr className="my-3" />
                                        <div className="d-flex justify-content-between px-2">
                                            <span className="text-warning fw-bold">
                                                Pending: ₹{summary.revenue.pending.toFixed(2)}
                                            </span>
                                            <span className="text-secondary">
                                                Expected: ₹{(summary.revenue.total + summary.revenue.pending).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Occupancy Card */}
                            <div className="col-md-6">
                                <div className="card shadow-sm border-0 h-100">
                                    <div className="card-header bg-info text-white">
                                        <i className="bi bi-house-door me-2"></i> Occupancy Report
                                    </div>
                                    <div className="card-body p-3">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                Occupied Rooms
                                                <span className="badge bg-danger rounded-pill">
                                                    {summary.occupancy.occupied}
                                                </span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                Available Rooms
                                                <span className="badge bg-success rounded-pill">
                                                    {summary.occupancy.available}
                                                </span>
                                            </li>
                                            <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                                                Reserved Rooms
                                                <span className="badge bg-warning text-dark rounded-pill">
                                                    {summary.occupancy.reserved}
                                                </span>
                                            </li>
                                        </ul>
                                        <div className="mt-4">
                                            <button
                                                className="btn btn-outline-info w-100"
                                                onClick={fetchReports}
                                            >
                                                <i className="bi bi-arrow-clockwise me-1"></i> Refresh Data
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card shadow-sm border-0 p-4 text-center text-muted">
                            Loading reports data...
                        </div>
                    )}
                </>
            )}
        </div>
    );
}