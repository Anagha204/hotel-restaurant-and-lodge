import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

// Reuse the same button styles from Rooms component
const primaryBtn = {
    background: "linear-gradient(135deg, #007bff, #0056b3)",
    border: "none",
    borderRadius: "8px",
    padding: "8px 24px",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "white",
    cursor: "pointer",
    transition: "all 0.2s",
};

const secondaryBtn = {
    background: "#f8f9fa",
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    padding: "8px 24px",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#495057",
    cursor: "pointer",
};

export default function NightAudit() {
    const [auditDate, setAuditDate] = useState(new Date().toISOString().split('T')[0]);
    const [summary, setSummary] = useState(null);
    const [existingAudit, setExistingAudit] = useState(null);

    useEffect(() => {
        fetchReports();
        checkAuditStatus();
    }, [auditDate]);

    const fetchReports = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/reports/summary?date=${auditDate}`);
            setSummary(res.data);
        } catch (err) {
            console.log("Error fetching summary", err);
        }
    };

    const checkAuditStatus = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/nightaudit/${auditDate}`);
            setExistingAudit(res.data);
        } catch (err) {
            setExistingAudit(null);
        }
    };

    const runAudit = async () => {
        if (!summary) return;

        const result = await Swal.fire({
            title: 'Run Night Audit?',
            text: `Are you sure you want to close accounts for ${auditDate}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#007bff',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Run Audit',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            await axios.post("http://localhost:5000/api/nightaudit", {
                date: auditDate,
                totalRoomsOccupied: summary.occupancy.occupied,
                totalRevenue: summary.revenue.total,
                status: "Completed",
                closedBy: "Admin"
            });
            Swal.fire({
                title: 'Success!',
                text: 'Night Audit Completed successfully!',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            checkAuditStatus();
        } catch (err) {
            console.log(err);
            Swal.fire({
                title: 'Error!',
                text: 'Error running audit',
                icon: 'error'
            });
        }
    };

    return (
        <div className="container-fluid px-3 px-md-4 py-4">
            {/* Header with date picker aligned right */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">🌙 Night Audit Module</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        Close daily accounts and generate audit summary
                    </p>
                </div>
                <div style={{ minWidth: "200px" }}>
                    <label className="text-muted fw-bold mb-1 d-block">Audit Date</label>
                    <input
                        type="date"
                        value={auditDate}
                        onChange={(e) => setAuditDate(e.target.value)}
                        className="form-control"
                        style={{ borderRadius: "8px", border: "1px solid #ced4da" }}
                    />
                </div>
            </div>

            {/* Main Card */}
            <div className="card-premium shadow-sm border-0">
                <div className="card-header-gradient">
                    <h4 className="mb-0">Daily Audit Summary</h4>
                </div>
                <div className="card-body p-4">
                    {summary ? (
                        <>
                            {/* Summary Cards Row */}
                            <div className="row g-3 mb-5">
                                <div className="col-md-4">
                                    <div
                                        style={{
                                            background: "#F8F9FA",
                                            borderRadius: "16px",
                                            padding: "1rem 1.25rem",
                                            borderLeft: "4px solid #007bff",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <h6 className="text-muted mb-1" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                                            TOTAL REVENUE
                                        </h6>
                                        <h3 className="mb-0" style={{ fontWeight: 700, color: "#2E7D32" }}>
                                            ₹{summary.revenue.total.toFixed(2)}
                                        </h3>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div
                                        style={{
                                            background: "#F8F9FA",
                                            borderRadius: "16px",
                                            padding: "1rem 1.25rem",
                                            borderLeft: "4px solid #F9A825",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <h6 className="text-muted mb-1" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                                            PENDING PAYMENTS
                                        </h6>
                                        <h3 className="mb-0" style={{ fontWeight: 700, color: "#E65100" }}>
                                            ₹{summary.revenue.pending.toFixed(2)}
                                        </h3>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div
                                        style={{
                                            background: "#F8F9FA",
                                            borderRadius: "16px",
                                            padding: "1rem 1.25rem",
                                            borderLeft: "4px solid #2E7D32",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <h6 className="text-muted mb-1" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                                            ROOMS OCCUPIED
                                        </h6>
                                        <h3 className="mb-0" style={{ fontWeight: 700, color: "#1976D2" }}>
                                            {summary.occupancy.occupied}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            {/* Audit Action Area */}
                            <div className="text-center pt-2">
                                {existingAudit && existingAudit.status === "Completed" ? (
                                    <div
                                        className="alert d-inline-flex align-items-center gap-2 px-4 py-3"
                                        style={{
                                            background: "#E8F5E9",
                                            color: "#2E7D32",
                                            borderRadius: "40px",
                                            border: "none",
                                            fontWeight: 500,
                                        }}
                                    >
                                        <span>✅</span> Audit for {auditDate} is already COMPLETED by {existingAudit.closedBy}.
                                    </div>
                                ) : (
                                    <button
                                        onClick={runAudit}
                                        disabled={!summary}
                                        style={{
                                            ...primaryBtn,
                                            opacity: !summary ? 0.6 : 1,
                                            cursor: !summary ? "not-allowed" : "pointer",
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!summary) return;
                                            e.currentTarget.style.background = "linear-gradient(135deg, #0056b3, #004099)";
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!summary) return;
                                            e.currentTarget.style.background = "linear-gradient(135deg, #007bff, #0056b3)";
                                        }}
                                    >
                                        ▶ Run Night Audit & Close Accounts
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-5 text-muted">Loading summary data...</div>
                    )}
                </div>
            </div>
        </div>
    );
}