import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";

// ----- SearchableSelect component (identical to the one in Bookings) -----
function SearchableSelect({ options = [], value, onChange, placeholder = "Search…", emptyMsg = "No results found", disabled = false }) {
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
            <div
                className={`form-control ${open ? "border-danger" : ""}`}
                style={{ display: "flex", alignItems: "center", padding: "0.375rem 0.75rem", cursor: "text", minHeight: "38px" }}
                onClick={() => inputRef.current?.focus()}
            >
                <span style={{ color: "#aaa", marginRight: "8px", fontSize: "0.85rem" }}>🔍</span>
                {selected && !open ? (
                    <div style={{ flex: 1, fontSize: "0.88rem", fontWeight: 500 }}>
                        {selected.label}
                    </div>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={options.length === 0 ? "No options available…" : placeholder}
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setHighlighted(0); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        onKeyDown={handleKeyDown}
                        style={{ flex: 1, border: "none", outline: "none", fontSize: "0.88rem", background: "transparent" }}
                    />
                )}
                {selected ? (
                    <button
                        type="button"
                        onClick={clear}
                        style={{ border: "none", background: "none", cursor: "pointer", color: "#aaa", fontSize: "1rem" }}
                        title="Clear"
                    >✕</button>
                ) : (
                    <span style={{ color: "#aaa", fontSize: "0.75rem", pointerEvents: "none" }}>▾</span>
                )}
            </div>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    background: "white", border: "1px solid #dee2e6", borderRadius: "0.375rem",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 9999,
                    maxHeight: "240px", overflowY: "auto",
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
                                    fontSize: "0.88rem",
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    {highlight(opt.label, query)}
                                </div>
                                {highlighted === idx && (
                                    <span style={{ color: "#C62828", fontSize: "0.75rem" }}>↵ select</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ----- Helper styles (your original button colours – unchanged) -----
const editBtn = {
    background: "#FFF8E1", border: "1px solid #F9A825", color: "#E65100",
    borderRadius: "8px", padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
};
const delBtn = {
    background: "#FFEBEE", border: "1px solid #EF9A9A", color: "#C62828",
    borderRadius: "8px", padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
};
const enableBtn = {
    background: "#E3F2FD", border: "1px solid #1E88E5", color: "#0D47A1",
    borderRadius: "8px", padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
};

// ----- Chip component (coloured inactive chips, active red – as you had) -----
function Chip({ label, active, onClick, style }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "6px 18px",
                borderRadius: "40px",
                border: "1px solid",
                borderColor: active ? "#C62828" : "#ddd",
                background: active ? "#C62828" : style?.background || "white",
                color: active ? "white" : style?.color || "#333",
                fontWeight: active ? 600 : 400,
                fontSize: "0.8rem",
                cursor: "pointer",
                transition: "all 0.2s",
            }}
        >
            {label}
        </button>
    );
}

export default function MenuPage() {
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('All'); // All, Available, Disabled
    const [searchTerm, setSearchTerm] = useState(''); // global search for menu items

    // Modal states
    const [showCatModal, setShowCatModal] = useState(false);
    const [editingCat, setEditingCat] = useState(null);
    const [catForm, setCatForm] = useState({ name: '' });

    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemForm, setItemForm] = useState({
        name: '', category: '', price: '', description: '', availability: true, imageFile: null
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // ----- Data loading -----
    const loadCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            if (!res.ok) throw new Error();
            const data = await res.json();
            setCategories(data);
        } catch {
            setError("Failed to load categories");
        }
    };

    const loadItems = async () => {
        try {
            const res = await fetch('/api/menu');
            if (!res.ok) throw new Error();
            const data = await res.json();
            setItems(data);
        } catch {
            setError("Failed to load menu items");
        }
    };

    useEffect(() => {
        loadCategories();
        loadItems();
    }, []);

    // ----- Category CRUD (Modal) -----
    const openAddCat = () => {
        setEditingCat(null);
        setCatForm({ name: '' });
        setShowCatModal(true);
        setError('');
    };

    const openEditCat = (cat) => {
        setEditingCat(cat);
        setCatForm({ name: cat.name });
        setShowCatModal(true);
        setError('');
    };

    const closeCatModal = () => {
        setShowCatModal(false);
        setEditingCat(null);
        setCatForm({ name: '' });
    };

    const saveCategory = async () => {
        if (!catForm.name.trim()) {
            Swal.fire("Missing", "Category name is required", "warning");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const method = editingCat ? 'PUT' : 'POST';
            const url = editingCat ? `/api/categories/${editingCat._id}` : '/api/categories';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: catForm.name.trim() })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Save failed');
            }
            closeCatModal();
            await loadCategories();
            Swal.fire("Success", editingCat ? "Category updated" : "Category added", "success");
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const deleteCategory = async (id) => {
        const result = await Swal.fire({
            title: "Delete this category?",
            text: "Items using it will become uncategorized.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete"
        });
        if (!result.isConfirmed) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Delete failed');
            }
            await loadCategories();
            await loadItems();
            Swal.fire("Deleted", "Category removed", "success");
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // ----- Menu Item CRUD (Modal) -----
    const openAddItem = () => {
        setEditingItem(null);
        setItemForm({ name: '', category: '', price: '', description: '', availability: true, imageFile: null });
        setShowItemModal(true);
        setError('');
    };

    const openEditItem = (item) => {
        setEditingItem(item);
        setItemForm({
            name: item.name,
            category: item.category?._id || item.category,
            price: item.price,
            description: item.description || '',
            availability: item.availability,
            imageFile: null
        });
        setShowItemModal(true);
        setError('');
    };

    const closeItemModal = () => {
        setShowItemModal(false);
        setEditingItem(null);
        setItemForm({ name: '', category: '', price: '', description: '', availability: true, imageFile: null });
    };

    const saveMenuItem = async () => {
        if (!itemForm.name.trim() || !itemForm.category || !itemForm.price) {
            Swal.fire("Missing", "Name, category, and price are required", "warning");
            return;
        }
        setLoading(true);
        setError('');
        try {
            if (editingItem) {
                const updateRes = await fetch(`/api/menu/${editingItem._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: itemForm.name,
                        category: itemForm.category,
                        price: itemForm.price,
                        description: itemForm.description,
                        availability: itemForm.availability
                    })
                });
                if (!updateRes.ok) throw new Error('Failed to update item');

                if (itemForm.imageFile) {
                    const imgData = new FormData();
                    imgData.append('image', itemForm.imageFile);
                    const imgRes = await fetch(`/api/menu/${editingItem._id}/image`, { method: 'PUT', body: imgData });
                    if (!imgRes.ok) throw new Error('Image update failed');
                }
                closeItemModal();
                await loadItems();
                Swal.fire("Success", "Item updated", "success");
            } else {
                const formData = new FormData();
                formData.append('name', itemForm.name);
                formData.append('category', itemForm.category);
                formData.append('price', itemForm.price);
                formData.append('description', itemForm.description || '');
                formData.append('availability', itemForm.availability);
                if (itemForm.imageFile) formData.append('image', itemForm.imageFile);

                const res = await fetch('/api/menu', { method: 'POST', body: formData });
                if (!res.ok) throw new Error('Failed to add item');
                closeItemModal();
                await loadItems();
                Swal.fire("Success", "Item added", "success");
            }
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const deleteMenuItem = async (id) => {
        const result = await Swal.fire({
            title: "Delete this menu item?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete"
        });
        if (!result.isConfirmed) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            await loadItems();
            Swal.fire("Deleted", "Item removed", "success");
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = async (item) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/menu/${item._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ availability: !item.availability })
            });
            if (!res.ok) throw new Error('Update failed');
            await loadItems();
        } catch (err) {
            Swal.fire("Error", err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Filtering menu items
    let filteredItems = [...items];
    if (selectedCategory) {
        filteredItems = filteredItems.filter(i => i.category?._id === selectedCategory);
    }
    if (availabilityFilter === 'Available') {
        filteredItems = filteredItems.filter(i => i.availability === true);
    } else if (availabilityFilter === 'Disabled') {
        filteredItems = filteredItems.filter(i => i.availability === false);
    }
    if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredItems = filteredItems.filter(i => i.name.toLowerCase().includes(term));
    }

    const categoryOptions = categories.map(cat => ({
        value: cat._id,
        label: cat.name
    }));

    return (
        <div className="container-fluid p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <h3 className="page-title mb-0">🍽️ Menu Management</h3>
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                        {filteredItems.length} of {items.length} item{items.length !== 1 ? "s" : ""} displayed
                    </p>
                </div>
                <button className="btn btn-warning" onClick={openAddItem}>
                    + Add New Item
                </button>
            </div>

            {/* Error alert */}
            {error && (
                <div className="alert alert-danger mb-3" style={{ backgroundColor: "#FFEBEE", color: "#C62828", border: "none", borderRadius: "10px" }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Categories Table Card */}
            <div className="card shadow mb-4">
                <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Categories</h5>
                    <button className="btn btn-sm btn-light" onClick={openAddCat}>+ Add Category</button>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0 bg-secondary">
                        <thead>
                            <tr>
                                <th>Category Name</th>
                                <th style={{ width: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat._id}>
                                    <td className="fw-semibold">{cat.name}</td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <button onClick={() => openEditCat(cat)} style={editBtn}>✏️ Edit</button>
                                            <button onClick={() => deleteCategory(cat._id)} style={delBtn}>🗑️ Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr>
                                    <td colSpan="2" className="text-center text-muted py-4">No categories yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Global Search Bar for Menu Items */}
            <div className="card shadow-sm p-3 mb-4">
                <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 Search menu items by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filters for Menu Items */}
            <div className="d-flex flex-wrap gap-2 mb-3">
                <Chip
                    label={`All (${items.length})`}
                    active={availabilityFilter === "All"}
                    onClick={() => setAvailabilityFilter("All")}
                />
                <Chip
                    label={`Available (${items.filter(i => i.availability).length})`}
                    active={availabilityFilter === "Available"}
                    onClick={() => setAvailabilityFilter("Available")}
                    style={{ background: "#E8F5E9", color: "#2E7D32" }}
                />
                <Chip
                    label={`Disabled (${items.filter(i => !i.availability).length})`}
                    active={availabilityFilter === "Disabled"}
                    onClick={() => setAvailabilityFilter("Disabled")}
                    style={{ background: "#FFEBEE", color: "#C62828" }}
                />
            </div>
            <div className="d-flex align-items-center gap-2 mb-4">
                <span className="text-muted">Filter by category:</span>
                <select
                    className="form-select w-auto"
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    style={{ width: "200px" }}
                >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
            </div>

            {/* Menu Items Table Card */}
            <div className="card shadow">
                <div className="card-header bg-danger text-white">
                    <h5 className="mb-0">Menu Items</h5>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Image</th><th>Name</th><th>Category</th><th>Price (₹)</th>
                                <th>Status</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-4">
                                        No menu items match the current filter
                                    </td>
                                </tr>
                            )}
                            {filteredItems.map(item => (
                                <tr key={item._id}>
                                    <td>
                                        {item.image ? (
                                            <img src={`http://localhost:5000${item.image}`} alt={item.name} style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 8 }} />
                                        ) : (
                                            <span style={{ fontSize: 28 }}>🍲</span>
                                        )}
                                    </td>
                                    <td className="fw-bold">{item.name}</td>
                                    <td>{item.category?.name || "—"}</td>
                                    <td className="fw-bold text-danger">₹{item.price}</td>
                                    <td>
                                        <span className="badge" style={{
                                            background: item.availability ? "#E8F5E9" : "#FFEBEE",
                                            color: item.availability ? "#2E7D32" : "#C62828",
                                            padding: "4px 12px",
                                            borderRadius: "40px",
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                        }}>
                                            {item.availability ? "Available" : "Disabled"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <button onClick={() => openEditItem(item)} style={editBtn}>✏️ Edit</button>
                                            <button onClick={() => toggleAvailability(item)} style={enableBtn}>
                                                {item.availability ? "Disable" : "Enable"}
                                            </button>
                                            <button onClick={() => deleteMenuItem(item._id)} style={delBtn}>🗑️ Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ----- Modal: Add/Edit Category (unchanged, using your original header gradient) ----- */}
            {showCatModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 pb-0" style={{ backgroundColor: "#f8f9fa", borderBottom: "4px solid #007bff" }}>
                                <h5 className="modal-title fw-bold text-dark mb-2">
                                    {editingCat ? "✏️ Edit Category" : "➕ Add Category"}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeCatModal}></button>
                            </div>
                            <div className="modal-body p-4 bg-white">
                                {error && (
                                    <div className="alert alert-danger mb-3" style={{ backgroundColor: "#FFEBEE", color: "#C62828", border: "none", borderRadius: "10px" }}>
                                        ⚠️ {error}
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label className="text-muted fw-bold mb-1">Category Name *</label>
                                    <input className="form-control" placeholder="e.g. Appetizer" value={catForm.name} onChange={e => setCatForm({ name: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0 pb-4 px-4">
                                <button className="btn-outline-red" onClick={closeCatModal}>Cancel</button>
                                <button className="btn-gradient-primary" onClick={saveCategory} disabled={loading}>
                                    {loading ? "Saving…" : editingCat ? "Update" : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ----- Modal: Add/Edit Menu Item (with searchable category dropdown) ----- */}
            {showItemModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header border-0 pb-0" style={{ backgroundColor: "#f8f9fa", borderBottom: "4px solid #007bff" }}>
                                <h5 className="modal-title fw-bold text-dark mb-2">
                                    {editingItem ? "✏️ Edit Menu Item" : "➕ Add Menu Item"}
                                </h5>
                                <button type="button" className="btn-close" onClick={closeItemModal}></button>
                            </div>
                            <div className="modal-body p-4 bg-white">
                                {error && (
                                    <div className="alert alert-danger mb-3" style={{ backgroundColor: "#FFEBEE", color: "#C62828", border: "none", borderRadius: "10px" }}>
                                        ⚠️ {error}
                                    </div>
                                )}
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Item Name *</label>
                                        <input className="form-control" placeholder="e.g. Margherita Pizza" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Category *</label>
                                        <SearchableSelect
                                            options={categoryOptions}
                                            value={itemForm.category}
                                            onChange={(val) => setItemForm({ ...itemForm, category: val })}
                                            placeholder="Search category..."
                                            emptyMsg="No categories found. Please create one first."
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Price (₹) *</label>
                                        <input className="form-control" type="number" step="0.01" min="0" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="text-muted fw-bold mb-1">Image</label>
                                        <input className="form-control" type="file" accept="image/*" onChange={e => setItemForm({ ...itemForm, imageFile: e.target.files[0] })} />
                                        {editingItem && editingItem.image && !itemForm.imageFile && (
                                            <small className="text-muted">Current image: {editingItem.image.split('/').pop()}</small>
                                        )}
                                    </div>
                                    <div className="col-12">
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox" checked={itemForm.availability} onChange={e => setItemForm({ ...itemForm, availability: e.target.checked })} id="availCheck" />
                                            <label className="form-check-label" htmlFor="availCheck">Available (visible on menu)</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0 pb-4 px-4">
                                <button className="btn-outline-red" onClick={closeItemModal}>Cancel</button>
                                <button className="btn-gradient-primary" onClick={saveMenuItem} disabled={loading}>
                                    {loading ? "Saving…" : editingItem ? "Update Item" : "Save Item"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}