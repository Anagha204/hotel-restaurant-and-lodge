import { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

const STATUS_STYLES = {
    Available: { background: "#E8F5E9", color: "#2E7D32" },
    Occupied: { background: "#FFEBEE", color: "#C62828" },
    Reserved: { background: "#FFF8E1", color: "#F9A825" },
    Cleaning: { background: "#ECEFF1", color: "#546E7A" },
};

export default function FloorLayout() {
    const [tables, setTables] = useState([]);
    const [selectedSection, setSelectedSection] = useState("all");
    const [loading, setLoading] = useState(true);

    const fetchTables = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/tables`);
            setTables(res.data);
        } catch (err) {
            console.error("Failed to load tables", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTables();
        const interval = setInterval(fetchTables, 10000); // auto-refresh
        return () => clearInterval(interval);
    }, []);

    const getStatusStyle = (status) => STATUS_STYLES[status] || STATUS_STYLES.Available;

    const filteredTables = selectedSection === "all"
        ? tables
        : tables.filter(t => t.section === selectedSection);

    const sections = ["AC", "Non AC", "Outdoor"];

    if (loading) {
        return (
            <div className="container-fluid px-4 py-5 text-center">
                <div className="spinner-border text-warning" role="status"></div>
                <p className="mt-2">Loading floor layout...</p>
            </div>
        );
    }

    return (
        <div className="container-fluid px-3 px-md-4 py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">🗺️ Restaurant Floor Layout</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        {tables.length} table{tables.length !== 1 ? "s" : ""} total
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className={`btn ${selectedSection === "all" ? "btn-warning" : "btn-outline-secondary"}`}
                        onClick={() => setSelectedSection("all")}
                    >
                        All Sections
                    </button>
                    {sections.map(section => (
                        <button
                            key={section}
                            className={`btn ${selectedSection === section ? "btn-warning" : "btn-outline-secondary"}`}
                            onClick={() => setSelectedSection(section)}
                        >
                            {section}
                        </button>
                    ))}
                </div>
            </div>

            {/* Floor Plan Cards */}
            {tables.length === 0 ? (
                <div className="card-premium shadow-sm border-0 text-center py-5">
                    <p className="text-muted mb-0">No tables found. Please add tables from the Table Management page.</p>
                </div>
            ) : (
                <div className="card-premium shadow-sm border-0">
                    <div className="card-header-gradient">
                        <h4 className="mb-0">
                            {selectedSection === "all" ? "All Sections" : `${selectedSection} Section`}
                        </h4>
                    </div>
                    <div className="p-4">
                        {selectedSection !== "all" ? (
                            // Single section – show grid
                            <div className="d-flex flex-wrap gap-4">
                                {filteredTables.map(table => (
                                    <TableCard key={table._id} table={table} statusStyle={getStatusStyle(table.status)} />
                                ))}
                            </div>
                        ) : (
                            // Group by section
                            sections.map(section => {
                                const sectionTables = tables.filter(t => t.section === section);
                                if (sectionTables.length === 0) return null;
                                return (
                                    <div key={section} className="mb-5">
                                        <h5 className="mb-3" style={{ borderLeft: "4px solid #F9A825", paddingLeft: "12px" }}>
                                            {section} Section
                                        </h5>
                                        <div className="d-flex flex-wrap gap-4">
                                            {sectionTables.map(table => (
                                                <TableCard key={table._id} table={table} statusStyle={getStatusStyle(table.status)} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

// Reusable table card component
function TableCard({ table, statusStyle }) {
    return (
        <div
            style={{
                width: 180,
                background: statusStyle.background,
                border: `1px solid ${statusStyle.color}`,
                borderRadius: 16,
                padding: 16,
                textAlign: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                transition: "transform 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
            <div style={{ fontSize: 40 }}>🍽️</div>
            <h5 className="mb-1">Table {table.tableNumber}</h5>
            <div className="small">👥 Capacity: {table.capacity}</div>
            <div className="mt-2">
                <span
                    style={{
                        background: statusStyle.color,
                        color: "white",
                        padding: "2px 10px",
                        borderRadius: 20,
                        fontSize: "0.7rem",
                        fontWeight: 500,
                    }}
                >
                    {table.status}
                </span>
            </div>
            <div className="small text-muted mt-1">{table.section}</div>
        </div>
    );
}