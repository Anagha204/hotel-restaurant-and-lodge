import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const BASE_URL = `${window.API_BASE_URL}`

    ;

const EMPTY_GUEST = {
    name: "",
    mobile: "",
    email: "",
    address: "",
    idProof: "",
    idNumber: "",
    nationality: "Indian",
};

// Helper: Validate email format
const isValidEmail = (email) => /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email);

// Get max length for ID Number based on ID Proof type
const getIdNumberMaxLength = (idProof) => {
    switch (idProof) {
        case "Aadhaar Card": return 12;
        case "PAN Card": return 10;
        case "Passport": return 9;
        case "Driving Licence": return 16;
        case "Voter ID": return 10;
        default: return 20;
    }
};

// Validate ID Number format (returns error message or null)
const validateIdNumberFormat = (idProof, idNumber) => {
    if (!idProof) return null;
    if (!idNumber || idNumber.trim() === "") return "ID Number is required.";
    const cleanNumber = idNumber.trim().toUpperCase();
    switch (idProof) {
        case "Aadhaar Card":
            if (!/^\d{12}$/.test(cleanNumber)) return "Aadhaar number must be exactly 12 digits.";
            break;
        case "PAN Card":
            if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanNumber))
                return "PAN Card format: 5 letters, then 4 digits, then 1 letter (e.g., ABCDE1234F).";
            break;
        case "Passport":
            if (!/^[A-Z0-9]{6,9}$/.test(cleanNumber))
                return "Passport number should be 6-9 alphanumeric characters.";
            break;
        case "Driving Licence":
            if (!/^[A-Z0-9]{5,16}$/.test(cleanNumber))
                return "Driving Licence number should be 5-16 alphanumeric characters.";
            break;
        case "Voter ID":
            if (!/^[A-Z]{3}[0-9]{7}$/.test(cleanNumber))
                return "Voter ID format: 3 letters followed by 7 digits (e.g., ABC1234567).";
            break;
        default:
            if (!/^[A-Z0-9\s\-]+$/i.test(cleanNumber))
                return "ID Number should contain only letters, numbers, spaces, or hyphens.";
    }
    return null;
};

export default function Guests() {
    const [guests, setGuests] = useState([]);
    const [filteredGuests, setFilteredGuests] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [viewGuest, setViewGuest] = useState(null);
    const [form, setForm] = useState(EMPTY_GUEST);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Field-specific error messages (real-time validation)
    const [fieldErrors, setFieldErrors] = useState({
        name: "",
        mobile: "",
        email: "",
        idProof: "",
        idNumber: "",
        address: "",
    });

    const fetchGuests = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/guest`);
            setGuests(res.data);
        } catch {
            Swal.fire("Error", "Failed to load guests", "error");
        }
    };

    useEffect(() => {
        fetchGuests();
    }, []);

    // Filter guests based on search term
    useEffect(() => {
        let result = [...guests];
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (g) =>
                    g.name?.toLowerCase().includes(term) || g.mobile?.includes(term)
            );
        }
        setFilteredGuests(result);
    }, [guests, searchTerm]);

    // Real-time validation functions
    const validateName = (name) => {
        if (!name) return "Full name is required.";
        if (name.length < 2) return "Name must be at least 2 characters.";
        if (name.length > 50) return "Name must be less than 50 characters.";
        if (!/^[A-Za-z\s\.]+$/.test(name)) return "Name can only contain letters, spaces, and dots.";
        return "";
    };

    const validateMobile = (mobile) => {
        if (!mobile) return "Mobile number is required.";
        if (!/^\d{10}$/.test(mobile)) return "Mobile number must be exactly 10 digits.";
        return "";
    };

    const validateEmail = (email) => {
        if (!email) return "Email is required.";
        if (!isValidEmail(email)) return "Enter a valid email (e.g., name@example.com).";
        return "";
    };

    const validateIdProof = (idProof) => {
        if (!idProof) return "ID Proof type is required.";
        return "";
    };

    const validateIdNumber = (idProof, idNumber) => {
        if (!idProof) return ""; // skip if no proof selected yet
        if (!idNumber) return "ID Number is required.";
        const formatError = validateIdNumberFormat(idProof, idNumber);
        return formatError || "";
    };

    const validateAddress = (address) => {
        if (!address) return "Address is required.";
        if (address.length < 5) return "Address must be at least 5 characters.";
        return "";
    };

    // Update form and run validation for the changed field
    const handleFieldChange = (field, value) => {
        // Special handling for mobile: only digits, max 10 chars
        if (field === "mobile") {
            const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
            setForm({ ...form, mobile: digitsOnly });
            setFieldErrors((prev) => ({ ...prev, mobile: validateMobile(digitsOnly) }));
            return;
        }

        setForm({ ...form, [field]: value });

        let errorMsg = "";
        switch (field) {
            case "name":
                errorMsg = validateName(value);
                break;
            case "email":
                errorMsg = validateEmail(value);
                break;
            case "idProof":
                errorMsg = validateIdProof(value);
                setFieldErrors((prev) => ({
                    ...prev,
                    idNumber: validateIdNumber(value, form.idNumber),
                }));
                break;
            case "idNumber":
                errorMsg = validateIdNumber(form.idProof, value);
                break;
            case "address":
                errorMsg = validateAddress(value);
                break;
        }
        setFieldErrors((prev) => ({ ...prev, [field]: errorMsg }));
    };

    const handleIdNumberChange = (e) => {
        let value = e.target.value;
        // Convert letters to uppercase (keeps digits, spaces, hyphens as is)
        value = value.toUpperCase();
        const maxLen = getIdNumberMaxLength(form.idProof);
        if (maxLen && value.length > maxLen) {
            value = value.slice(0, maxLen);
        }
        handleFieldChange("idNumber", value);
    };

    // Check for duplicates before save
    const checkDuplicates = () => {
        const existing = guests.filter((g) => !editId || g._id !== editId);
        if (existing.some((g) => g.mobile === form.mobile)) {
            return "Mobile number already registered.";
        }
        if (
            existing.some(
                (g) => g.email && g.email.toLowerCase() === form.email.toLowerCase()
            )
        ) {
            return "Email address already in use.";
        }
        if (
            form.idNumber &&
            form.idProof &&
            existing.some((g) => g.idNumber === form.idNumber)
        ) {
            return "ID Number already registered.";
        }
        return null;
    };

    const handleSave = async () => {
        // Run all validations again
        const errors = {
            name: validateName(form.name),
            mobile: validateMobile(form.mobile),
            email: validateEmail(form.email),
            idProof: validateIdProof(form.idProof),
            idNumber: validateIdNumber(form.idProof, form.idNumber),
            address: validateAddress(form.address),
        };
        setFieldErrors(errors);
        if (Object.values(errors).some((err) => err !== "")) {
            Swal.fire("Validation Error", "Please correct the errors before saving.", "warning");
            return;
        }

        const duplicateError = checkDuplicates();
        if (duplicateError) {
            Swal.fire("Duplicate Entry", duplicateError, "error");
            return;
        }

        setLoading(true);
        try {
            if (editId) {
                await axios.put(`${BASE_URL}/guest/${editId}`, form);
                Swal.fire("Updated", "Guest details updated successfully.", "success");
            } else {
                await axios.post(`${BASE_URL}/guest`, form);
                Swal.fire("Added", "New guest added successfully.", "success");
            }
            closeModal();
            await fetchGuests();
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to save guest.";
            Swal.fire("Error", msg, "error");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete this guest?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete",
        });
        if (result.isConfirmed) {
            try {
                await axios.delete(`${BASE_URL}/guest/${id}`);
                Swal.fire("Deleted!", "Guest has been removed.", "success");
                await fetchGuests();
            } catch {
                Swal.fire("Error", "Failed to delete guest.", "error");
            }
        }
    };

    const openAddModal = () => {
        setForm(EMPTY_GUEST);
        setEditId(null);
        setError("");
        setFieldErrors({
            name: "", mobile: "", email: "", idProof: "", idNumber: "", address: "",
        });
        setShowModal(true);
    };

    const openEditModal = (guest) => {
        setForm({
            name: guest.name,
            mobile: guest.mobile,
            email: guest.email || "",
            address: guest.address || "",
            idProof: guest.idProof || "",
            idNumber: guest.idNumber || "",
            nationality: guest.nationality || "Indian",
        });
        setEditId(guest._id);
        setError("");
        setFieldErrors({
            name: "", mobile: "", email: "", idProof: "", idNumber: "", address: "",
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditId(null);
        setError("");
    };

    return (
        <div className="container-fluid p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">👥 Guest Management</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        {filteredGuests.length} of {guests.length} guest{guests.length !== 1 ? "s" : ""} displayed
                    </p>
                </div>
                <button className="btn btn-warning" onClick={openAddModal}>
                    + Add Guest details
                </button>
            </div>

            {/* Search Bar */}
            <div className="card shadow-sm p-3 mb-4">
                <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 Search by name or mobile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Guests Table Card */}
            <div className="card shadow">
                <div className="card-header bg-danger text-white">All Guests</div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead>
                            <tr>
                                {/* <th>No</th> */}
                                <th>Name</th>
                                <th>Mobile</th>
                                <th>Email</th>
                                <th>Nationality</th>
                                <th>ID Proof</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGuests.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="text-center text-muted py-4">
                                        {searchTerm ? "No guests match your search." : "No guests yet. Click + Add Guest."}
                                    </td>
                                </tr>
                            )}
                            {filteredGuests.map((guest, idx) => (
                                <tr key={guest._id}>
                                    {/* <td className="text-muted">{idx + 1}</td> */}
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <div
                                                style={{
                                                    width: "36px",
                                                    height: "36px",
                                                    borderRadius: "50%",
                                                    background: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
                                                    color: "white",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontWeight: 700,
                                                    fontSize: "0.85rem",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {guest.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="fw-semibold">{guest.name}</div>
                                                {guest.address && (
                                                    <div style={{ fontSize: "0.75rem", color: "#6c757d" }}>
                                                        {guest.address}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{guest.mobile}</td>
                                    <td className="text-muted">{guest.email || "—"}</td>
                                    <td>{guest.nationality || "—"}</td>
                                    <td>
                                        {guest.idProof ? (
                                            <span className="badge bg-success">{guest.idProof}</span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-sm btn-info"
                                                onClick={() => setViewGuest(guest)}
                                            >
                                                👁
                                            </button>
                                            <button
                                                className="btn btn-sm btn-warning"
                                                onClick={() => openEditModal(guest)}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => confirmDelete(guest._id)}
                                            >
                                                🗑
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">
                                    {editId ? "✏️ Edit Guest" : "➕ Add New Guest"}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={closeModal}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {error && <div className="alert alert-danger mb-3">⚠️ {error}</div>}
                                <div className="row g-3">
                                    {/* Full Name */}
                                    <div className="col-md-6">
                                        <label className="form-label">Full Name *</label>
                                        <input
                                            className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
                                            placeholder="e.g. Ravi Kumar"
                                            value={form.name}
                                            onChange={(e) => handleFieldChange("name", e.target.value)}
                                        />
                                        {fieldErrors.name && (
                                            <div className="text-danger small mt-1">{fieldErrors.name}</div>
                                        )}
                                    </div>

                                    {/* Mobile Number - digits only */}
                                    <div className="col-md-6">
                                        <label className="form-label">Mobile Number *</label>
                                        <input
                                            type="tel"
                                            className={`form-control ${fieldErrors.mobile ? "is-invalid" : ""}`}
                                            placeholder="10-digit mobile"
                                            value={form.mobile}
                                            onChange={(e) => handleFieldChange("mobile", e.target.value)}
                                        />
                                        {fieldErrors.mobile && (
                                            <div className="text-danger small mt-1">{fieldErrors.mobile}</div>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="col-md-6">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
                                            placeholder="e.g. ravi@email.com"
                                            value={form.email}
                                            onChange={(e) => handleFieldChange("email", e.target.value)}
                                        />
                                        {fieldErrors.email && (
                                            <div className="text-danger small mt-1">{fieldErrors.email}</div>
                                        )}
                                    </div>

                                    {/* Nationality (searchable datalist) */}
                                    <div className="col-md-6">
                                        <label className="form-label">Nationality</label>
                                        <input
                                            list="nationalityList"
                                            className="form-control"
                                            value={form.nationality}
                                            onChange={(e) => handleFieldChange("nationality", e.target.value)}
                                            placeholder="Start typing..."
                                        />
                                        <datalist id="nationalityList">
                                            {["Indian", "American", "British", "Australian", "Canadian", "Other"].map(n => (
                                                <option key={n} value={n} />
                                            ))}
                                        </datalist>
                                    </div>

                                    {/* ID Proof Type (searchable datalist) */}
                                    <div className="col-md-6">
                                        <label className="form-label">ID Proof Type *</label>
                                        <input
                                            list="idProofList"
                                            className={`form-control ${fieldErrors.idProof ? "is-invalid" : ""}`}
                                            value={form.idProof}
                                            onChange={(e) => handleFieldChange("idProof", e.target.value)}
                                            placeholder="Start typing or select..."
                                        />
                                        <datalist id="idProofList">
                                            {["Aadhaar Card", "PAN Card", "Passport", "Driving Licence", "Voter ID"].map(d => (
                                                <option key={d} value={d} />
                                            ))}
                                        </datalist>
                                        {fieldErrors.idProof && (
                                            <div className="text-danger small mt-1">{fieldErrors.idProof}</div>
                                        )}
                                    </div>

                                    {/* ID Number */}
                                    <div className="col-md-6">
                                        <label className="form-label">ID Number *</label>
                                        <input
                                            className={`form-control ${fieldErrors.idNumber ? "is-invalid" : ""}`}
                                            placeholder="ID document number"
                                            value={form.idNumber}
                                            onChange={handleIdNumberChange}
                                            maxLength={getIdNumberMaxLength(form.idProof) || 20}
                                        />
                                        {fieldErrors.idNumber && (
                                            <div className="text-danger small mt-1">{fieldErrors.idNumber}</div>
                                        )}
                                        {form.idProof && !fieldErrors.idNumber && form.idNumber && (
                                            <small className="text-muted d-block mt-1">
                                                {form.idProof === "Aadhaar Card" && "Exactly 12 digits"}
                                                {form.idProof === "PAN Card" && "5 letters → 4 digits → 1 letter"}
                                                {form.idProof === "Passport" && "6-9 alphanumeric characters"}
                                                {form.idProof === "Driving Licence" && "5-16 alphanumeric characters"}
                                                {form.idProof === "Voter ID" && "3 letters + 7 digits (e.g., ABC1234567)"}
                                            </small>
                                        )}
                                    </div>

                                    {/* Address */}
                                    <div className="col-12">
                                        <label className="form-label">Address *</label>
                                        <textarea
                                            className={`form-control ${fieldErrors.address ? "is-invalid" : ""}`}
                                            rows="3"
                                            placeholder="Full address"
                                            value={form.address}
                                            onChange={(e) => handleFieldChange("address", e.target.value)}
                                        />
                                        {fieldErrors.address && (
                                            <div className="text-danger small mt-1">{fieldErrors.address}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button className="btn btn-danger" onClick={handleSave} disabled={loading}>
                                    {loading ? "Saving…" : editId ? "Update Guest" : "Save Guest"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Guest Modal */}
            {viewGuest && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "520px" }}>
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">👤 Guest Profile</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setViewGuest(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div
                                        style={{
                                            width: "64px",
                                            height: "64px",
                                            borderRadius: "50%",
                                            background: "linear-gradient(135deg, #C62828 0%, #B71C1C 100%)",
                                            color: "white",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: 700,
                                            fontSize: "1.6rem",
                                        }}
                                    >
                                        {viewGuest.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="mb-0">{viewGuest.name}</h4>
                                        <p className="text-muted mb-0">{viewGuest.nationality}</p>
                                    </div>
                                </div>
                                <div className="row g-3">
                                    <div className="col-6">
                                        <div className="text-muted fw-bold small text-uppercase mb-1">📞 Mobile</div>
                                        <div>{viewGuest.mobile}</div>
                                    </div>
                                    <div className="col-6">
                                        <div className="text-muted fw-bold small text-uppercase mb-1">📧 Email</div>
                                        <div>{viewGuest.email || "—"}</div>
                                    </div>
                                    <div className="col-6">
                                        <div className="text-muted fw-bold small text-uppercase mb-1">🪪 ID Proof</div>
                                        <div>{viewGuest.idProof || "—"}</div>
                                    </div>
                                    <div className="col-6">
                                        <div className="text-muted fw-bold small text-uppercase mb-1">🔢 ID Number</div>
                                        <div>{viewGuest.idNumber || "—"}</div>
                                    </div>
                                    <div className="col-12">
                                        <div className="text-muted fw-bold small text-uppercase mb-1">🏠 Address</div>
                                        <div>{viewGuest.address || "—"}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setViewGuest(null)}>
                                    Close
                                </button>
                                <button
                                    className="btn btn-warning"
                                    onClick={() => {
                                        setViewGuest(null);
                                        openEditModal(viewGuest);
                                    }}
                                >
                                    ✏️ Edit Guest
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}