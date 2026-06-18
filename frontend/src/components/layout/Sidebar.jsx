import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, NavLink } from "react-router-dom";
import logo from "../../assets/logo.png";

export default function Sidebar({ isOpen, closeSidebar }) {
  const { mode } = useApp();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isBillingOpen, setIsBillingOpen] = useState(false);

  const handleClick = () => {
    if (closeSidebar) closeSidebar();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
    if (closeSidebar) closeSidebar();
  };

  const userRole = user?.role?.toLowerCase();
  const isAdmin = userRole === "admin";
  const isManager = userRole === "manager";
  const isCashier = userRole === "cashier";
  const isWaiter = userRole === "waiter";
  const isKitchen = userRole === "kitchen" || userRole === "kitchen staff" || userRole === "staff";

  return (
    <div className={`sidebar ${isOpen ? "active" : ""}`}>
      <button
        className="btn btn-sm btn-light position-absolute top-0 end-0 m-2 d-md-none"
        onClick={closeSidebar}
        style={{ zIndex: 1050 }}
      >
        ✖
      </button>

      {/* LOGO */}
      <div className="text-center mb-2 pt-3 flex-shrink-0">
        <img src={logo} alt="Logo" style={{ width: "160px", maxWidth: "90%", height: "auto" }} />
      </div>

      {/* Scrollable Nav Area */}
      <div className="flex-grow-1 sidebar-menu-scroll" style={{ overflowY: "auto", padding: "0 10px" }}>

        {/* DASHBOARD (always visible) */}
        <NavLink to="/" onClick={handleClick} className="nav-link">
          <i className="bi bi-speedometer2 me-2"></i> Dashboard
        </NavLink>

        {mode === "lodge" ? (
          // ==================== LODGE MODE MENU ====================
          <>
            {!(isWaiter || isCashier) && <h6 className="mt-3 text-muted">Lodge</h6>}
            {/* Admin or Manager sees full lodge menu */}
            {(isAdmin || isManager) && (
              <>
                <NavLink to="/room" onClick={handleClick} className="nav-link">
                  <i className="bi bi-building me-2"></i> Rooms
                </NavLink>
                <NavLink to="/guest" onClick={handleClick} className="nav-link">
                  <i className="bi bi-people me-2"></i> Guests
                </NavLink>
                <NavLink to="/booking" onClick={handleClick} className="nav-link">
                  <i className="bi bi-calendar-check me-2"></i> Booking
                </NavLink>
                <NavLink to="/id-verification" onClick={handleClick} className="nav-link">
                  <i className="bi bi-person-badge me-2"></i> ID Verification
                </NavLink>
                <NavLink to="/checkin" onClick={handleClick} className="nav-link">
                  <i className="bi bi-arrow-left-right me-2"></i> Check‑in/Check‑out
                </NavLink>

                <NavLink to="/room-service" onClick={handleClick} className="nav-link">
                  <i className="bi bi-basket me-2"></i> Room Service
                </NavLink>
                <NavLink to="/amenity" onClick={handleClick} className="nav-link">
                  <i className="bi bi-gift me-2"></i> Amenity
                </NavLink>
                {/* <NavLink to="/room_avail" onClick={handleClick} className="nav-link">
                <i className="bi bi-calendar-check me-2"></i> Availability
              </NavLink> */}
                {/* Billing sub‑menu – visible to admin, manager, cashier */}
                {(isAdmin || isManager || isCashier) && (
                  <>
                    <a
                      className="nav-link"
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.preventDefault();
                        setIsBillingOpen(!isBillingOpen);
                      }}
                    >
                      <i className="bi bi-receipt me-2"></i>
                      <span>Billing</span>
                      <i
                        className={`bi bi-chevron-${isBillingOpen ? "up" : "down"} float-end`}
                        style={{ fontSize: "0.85rem", marginTop: "3px" }}
                      ></i>
                    </a>
                    {isBillingOpen && (
                      <div className="ms-4 mb-2">
                        <NavLink
                          to="/room-billing"
                          onClick={handleClick}
                          className="nav-link py-2"
                          style={{ fontSize: "0.95rem" }}
                        >
                          <i
                            className="bi bi-circle-fill me-2"
                            style={{ fontSize: "0.4rem", verticalAlign: "middle" }}
                          ></i>
                          Room Billing
                        </NavLink>
                        <NavLink
                          to="/combined-billing"
                          onClick={handleClick}
                          className="nav-link py-2"
                          style={{ fontSize: "0.95rem" }}
                        >
                          <i
                            className="bi bi-circle-fill me-2"
                            style={{ fontSize: "0.4rem", verticalAlign: "middle" }}
                          ></i>
                          Combined Billing
                        </NavLink>
                      </div>
                    )}
                  </>
                )}
                <NavLink to="/housekeeping" onClick={handleClick} className="nav-link">
                  <i className="bi bi-bucket me-2"></i> Housekeeping
                </NavLink>
                <NavLink to="/night-audit" onClick={handleClick} className="nav-link">
                  <i className="bi bi-moon-stars me-2"></i> Night Audit
                </NavLink>
                <NavLink to="/lodge-reports" onClick={handleClick} className="nav-link">
                  <i className="bi bi-bar-chart me-2"></i> Reports
                </NavLink>
              </>
            )}
            {isKitchen && (
              <>
                <NavLink to="/menu" onClick={handleClick} className="nav-link">
                  <i className="bi bi-card-list me-2"></i> Menu
                </NavLink>
                <NavLink to="/kds" onClick={handleClick} className="nav-link">
                  <i className="bi bi-fork-knife me-2"></i> KDS
                </NavLink>
                <NavLink to="/inventory" onClick={handleClick} className="nav-link">
                  <i className="bi bi-box-seam me-2"></i> Inventory
                </NavLink>
              </>
            )}

            {/* Waiter */}
            {isWaiter && (
              <>
                <NavLink to="/tables" onClick={handleClick} className="nav-link">
                  <i className="bi bi-table me-2"></i> Tables
                </NavLink>
                <NavLink to="/menu" onClick={handleClick} className="nav-link">
                  <i className="bi bi-card-list me-2"></i> Menu
                </NavLink>
                <NavLink to="/orders" onClick={handleClick} className="nav-link">
                  <i className="bi bi-receipt me-2"></i> Orders
                </NavLink>
                {/* <NavLink to="/kds" onClick={handleClick} className="nav-link">
                <i className="bi bi-fork-knife me-2"></i> KDS
              </NavLink> */}
                <NavLink to="/room-service" onClick={handleClick} className="nav-link">
                  <i className="bi bi-basket me-2"></i> Room Service
                </NavLink>
                <NavLink to="/customers" onClick={handleClick} className="nav-link">
                  <i className="bi bi-people me-2"></i> Customers
                </NavLink>
                <NavLink to="/reservation" onClick={handleClick} className="nav-link">
                  <i className="bi bi-calendar-check me-2"></i> Reservation
                </NavLink>
              </>
            )}

            {/* Cashier – only billing and reservation related */}
            {isCashier && (
              <>
                <NavLink to="/billing" onClick={handleClick} className="nav-link">
                  <i className="bi bi-cash-coin me-2"></i> Billing
                </NavLink>
                <NavLink to="/reservation" onClick={handleClick} className="nav-link">
                  <i className="bi bi-calendar-check me-2"></i> Reservation
                </NavLink>
                <NavLink to="/customers" onClick={handleClick} className="nav-link">
                  <i className="bi bi-people me-2"></i> Customers
                </NavLink>
                <NavLink to="/receipts" onClick={handleClick} className="nav-link">
                  <i className="bi bi-receipt-cutoff me-2"></i> Receipts
                </NavLink>
              </>
            )}


          </>
        ) : (
          // ==================== RESTAURANT MODE MENU ====================
          <>
            <h6 className="mt-3 text-muted">Restaurant</h6>

            {/* Admin */}
            {isAdmin && (
              <>
                <NavLink to="/users" onClick={handleClick} className="nav-link">
                  <i className="bi bi-people me-2"></i> User Roles
                </NavLink>
                <NavLink to="/tables" onClick={handleClick} className="nav-link">
                  <i className="bi bi-table me-2"></i> Tables
                </NavLink>
                <NavLink to="/menu" onClick={handleClick} className="nav-link">
                  <i className="bi bi-card-list me-2"></i> Menu
                </NavLink>
                <NavLink to="/orders" onClick={handleClick} className="nav-link">
                  <i className="bi bi-receipt me-2"></i> Orders
                </NavLink>
                <NavLink to="/kds" onClick={handleClick} className="nav-link">
                  <i className="bi bi-fork-knife me-2"></i> KDS
                </NavLink>
                <NavLink to="/billing" onClick={handleClick} className="nav-link">
                  <i className="bi bi-cash-stack me-2"></i> Billing
                </NavLink>
                <NavLink to="/inventory" onClick={handleClick} className="nav-link">
                  <i className="bi bi-box-seam me-2"></i> Inventory
                </NavLink>
                <NavLink to="/supplier" onClick={handleClick} className="nav-link">
                  <i className="bi bi-truck me-2"></i> Supplier
                </NavLink>
                <NavLink to="/purchase" onClick={handleClick} className="nav-link">
                  <i className="bi bi-cart-check me-2"></i> Purchase
                </NavLink>
                <NavLink to="/reservation" onClick={handleClick} className="nav-link">
                  <i className="bi bi-calendar-event me-2"></i> Reservation
                </NavLink>
                <NavLink to="/customers" onClick={handleClick} className="nav-link">
                  <i className="bi bi-people me-2"></i> Customers
                </NavLink>
                <NavLink to="/deliveries" onClick={handleClick} className="nav-link">
                  <i className="bi bi-bicycle me-2"></i> Delivery
                </NavLink>
                <NavLink to="/restaurant-reports" onClick={handleClick} className="nav-link">
                  <i className="bi bi-bar-chart me-2"></i> Reports
                </NavLink>
                <NavLink to="/notifications" onClick={handleClick} className="nav-link">
                  <i className="bi bi-bell me-2"></i> Notifications
                </NavLink>
                <NavLink to="/receipts" onClick={handleClick} className="nav-link">
                  <i className="bi bi-receipt-cutoff me-2"></i> Receipts
                </NavLink>
              </>
            )}

            {/* Manager – all restaurant features (no user management) */}
            {isManager && (
              <>
                <NavLink to="/tables" onClick={handleClick} className="nav-link">
                  <i className="bi bi-table me-2"></i> Tables
                </NavLink>
                <NavLink to="/menu" onClick={handleClick} className="nav-link">
                  <i className="bi bi-card-list me-2"></i> Menu
                </NavLink>
                <NavLink to="/orders" onClick={handleClick} className="nav-link">
                  <i className="bi bi-receipt me-2"></i> Orders
                </NavLink>
                <NavLink to="/kds" onClick={handleClick} className="nav-link">
                  <i className="bi bi-fork-knife me-2"></i> KDS
                </NavLink>
                <NavLink to="/billing" onClick={handleClick} className="nav-link">
                  <i className="bi bi-cash-stack me-2"></i> Billing
                </NavLink>
                <NavLink to="/inventory" onClick={handleClick} className="nav-link">
                  <i className="bi bi-box-seam me-2"></i> Inventory
                </NavLink>
                <NavLink to="/supplier" onClick={handleClick} className="nav-link">
                  <i className="bi bi-truck me-2"></i> Supplier
                </NavLink>
                <NavLink to="/purchase" onClick={handleClick} className="nav-link">
                  <i className="bi bi-cart-check me-2"></i> Purchase
                </NavLink>
                <NavLink to="/reservation" onClick={handleClick} className="nav-link">
                  <i className="bi bi-calendar-event me-2"></i> Reservation
                </NavLink>
                <NavLink to="/customers" onClick={handleClick} className="nav-link">
                  <i className="bi bi-people me-2"></i> Customers
                </NavLink>
                <NavLink to="/deliveries" onClick={handleClick} className="nav-link">
                  <i className="bi bi-bicycle me-2"></i> Delivery
                </NavLink>
                <NavLink to="/restaurant-reports" onClick={handleClick} className="nav-link">
                  <i className="bi bi-bar-chart me-2"></i> Reports
                </NavLink>
                <NavLink to="/notifications" onClick={handleClick} className="nav-link">
                  <i className="bi bi-bell me-2"></i> Notifications
                </NavLink>
                <NavLink to="/receipts" onClick={handleClick} className="nav-link">
                  <i className="bi bi-receipt-cutoff me-2"></i> Receipts
                </NavLink>
              </>
            )}

            {/* Kitchen Staff */}
            {isKitchen && (
              <>
                <NavLink to="/menu" onClick={handleClick} className="nav-link">
                  <i className="bi bi-card-list me-2"></i> Menu
                </NavLink>
                <NavLink to="/kds" onClick={handleClick} className="nav-link">
                  <i className="bi bi-fork-knife me-2"></i> KDS
                </NavLink>
                <NavLink to="/inventory" onClick={handleClick} className="nav-link">
                  <i className="bi bi-box-seam me-2"></i> Inventory
                </NavLink>
              </>
            )}

            {/* Waiter */}
            {isWaiter && (
              <>
                <NavLink to="/tables" onClick={handleClick} className="nav-link">
                  <i className="bi bi-table me-2"></i> Tables
                </NavLink>
                <NavLink to="/menu" onClick={handleClick} className="nav-link">
                  <i className="bi bi-card-list me-2"></i> Menu
                </NavLink>
                <NavLink to="/orders" onClick={handleClick} className="nav-link">
                  <i className="bi bi-receipt me-2"></i> Orders
                </NavLink>
                {/* <NavLink to="/kds" onClick={handleClick} className="nav-link">
                <i className="bi bi-fork-knife me-2"></i> KDS
              </NavLink> */}
                <NavLink to="/room-service" onClick={handleClick} className="nav-link">
                  <i className="bi bi-basket me-2"></i> Room Service
                </NavLink>
                <NavLink to="/customers" onClick={handleClick} className="nav-link">
                  <i className="bi bi-people me-2"></i> Customers
                </NavLink>
                <NavLink to="/reservation" onClick={handleClick} className="nav-link">
                  <i className="bi bi-calendar-check me-2"></i> Reservation
                </NavLink>
              </>
            )}

            {/* Cashier – only billing and reservation related */}
            {isCashier && (
              <>
                <NavLink to="/billing" onClick={handleClick} className="nav-link">
                  <i className="bi bi-cash-coin me-2"></i> Billing
                </NavLink>
                <NavLink to="/reservation" onClick={handleClick} className="nav-link">
                  <i className="bi bi-calendar-check me-2"></i> Reservation
                </NavLink>
                <NavLink to="/customers" onClick={handleClick} className="nav-link">
                  <i className="bi bi-people me-2"></i> Customers
                </NavLink>
                <NavLink to="/receipts" onClick={handleClick} className="nav-link">
                  <i className="bi bi-receipt-cutoff me-2"></i> Receipts
                </NavLink>
              </>
            )}
          </>
        )}

      </div> {/* End Scrollable Nav Area */}

      {/* LOGOUT BUTTON */}
      <div className="p-3 border-top flex-shrink-0 mt-auto" style={{ backgroundColor: "var(--sidebar-bg)" }}>
        <button
          onClick={handleLogout}
          className="nav-link text-danger bg-transparent border-0 w-100 text-start m-0 p-2"
        >
          <i className="bi bi-box-arrow-right me-2"></i>
          Logout
        </button>
      </div>
    </div>
  );
}