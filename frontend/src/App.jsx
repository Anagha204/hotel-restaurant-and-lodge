import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/AdminLogin";   // your existing login page

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Sidebar from "./components/layout/Sidebar.jsx";
import Header from "./components/layout/Header.jsx";
import Footer from "./components/layout/Footer.jsx";

// Dashboard Pages - Role Based
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import ManagerDashboard from "./pages/dashboard/ManagerDashboard.jsx";
import KitchenStaffDashboard from "./pages/dashboard/KitchenStaffDashboard.jsx";
import WaiterDashboard from "./pages/dashboard/WaiterDashboard.jsx";
import CashierDashboard from "./pages/dashboard/CashierDashboard.jsx";
import Room from "./pages/lodge/Rooms/Room.jsx";
import Guest from "./pages/lodge/Guests/Guest.jsx";
import Checkin from "./pages/lodge/Checkin/Checkin.jsx";
import Booking from "./pages/lodge/Booking/Booking.jsx";
import Housekeeping from "./pages/lodge/housekeeping/Housekeeping";
import RoomService from "./pages/lodge/room_service/roomService";
import RoomBilling from "./pages/lodge/room_billing/roomBilling";
import AmenityService from "./pages/lodge/aminity/aminity.jsx";
import RoomCalendar from "./pages/lodge/room_availability/roomCalender.jsx";
import NightAudit from "./pages/lodge/night_audit/NightAudit.jsx";
import LodgeReports from "./pages/lodge/reports/LodgeReports.jsx";
import IdVerification from "./pages/lodge/id_verification/IdVerification.jsx";
import CombinedBilling from "./pages/lodge/combined_billing/CombinedBilling.jsx";

// Restaurant Pages
import TablesPage from "./pages/restaurant/Tables/TablesPage.jsx";
import FloorLayout from "./pages/restaurant/Tables/FloorLayout.jsx";
import OrdersPage from "./pages/restaurant/Orders/OrdersPage.jsx";
import MenuPage from "./pages/restaurant/Menu/MenuPage.jsx";
import KDSPage from "./pages/restaurant/KDS/KDSPage.jsx";
import BillingPayment from "./pages/restaurant/billing/billing.jsx";
import Inventory from "./pages/restaurant/inventory/inventory.jsx";
import SupplierManagement from "./pages/restaurant/suppliers/SupplierManagement.jsx";
import PurchaseManagement from "./pages/restaurant/purchase/PurchaseManagement.jsx";
import ReservationManagement from "./pages/restaurant/reservation/ReservationManagement";
import CustomerManagement from "./pages/restaurant/customers/CustomerManagement.jsx";
import DeliveryManagement from "./pages/restaurant/delivery/DeliveryManagement.jsx";
import RestaurantReports from "./pages/restaurant/reports/Reports.jsx";
import Notifications from "./pages/restaurant/notifications/Notifications.jsx";
import Receipts from "./pages/restaurant/receipts/Receipts.jsx";

// User Management (new)
import UserManagement from "./pages/UserManagement";

// Protected route wrapper
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

// Role-based Dashboard Router
function RoleDashboard() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  const role = user.role?.toLowerCase();

  switch (role) {
    case "admin":
      return <Dashboard />;
    case "manager":
      return <ManagerDashboard />;
    case "kitchen":
    case "kitchen staff":
    case "staff":
      return <KitchenStaffDashboard />;
    case "waiter":
      return <WaiterDashboard />;
    case "cashier":
      return <CashierDashboard />;
    default:
      return <Dashboard />; // Fallback to admin dashboard
  }
}

// Role-based access control for specific routes
function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  const userRole = user.role?.toLowerCase();

  if (allowedRoles.includes(userRole)) {
    return children;
  }

  return <Navigate to="/" />;
}

// Layout for authenticated pages (includes sidebar, header, footer)
function AuthenticatedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay d-md-none" onClick={closeSidebar} />
      )}
      <ToastContainer />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <div className="main-content d-flex flex-column min-vh-100">
        <Header toggleSidebar={toggleSidebar} />
        <div className="p-4 flex-grow-1">
          <Routes>
            {/* Dashboard - Role Based */}
            <Route path="/" element={<RoleDashboard />} />

            {/* Lodge Routes */}
            <Route path="/room" element={<Room />} />
            <Route path="/guest" element={<Guest />} />
            <Route path="/checkin" element={<Checkin />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/housekeeping" element={<Housekeeping />} />
            <Route path="/room-service" element={<RoomService />} />
            <Route path="/room-billing" element={<RoomBilling />} />
            <Route path="/amenity" element={<AmenityService />} />
            <Route path="/room_avail" element={<RoomCalendar />} />
            <Route path="/night-audit" element={<NightAudit />} />
            <Route path="/lodge-reports" element={<LodgeReports />} />
            <Route path="/id-verification" element={<IdVerification />} />
            <Route path="/combined-billing" element={<CombinedBilling />} />

            {/* Restaurant Routes */}
            <Route path="/tables" element={<TablesPage />} />
            <Route path="/floor" element={<FloorLayout />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/kds" element={<KDSPage />} />
            <Route path="/billing" element={<BillingPayment />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/supplier" element={<SupplierManagement />} />
            <Route path="/purchase" element={<PurchaseManagement />} />
            <Route path="/reservation" element={<ReservationManagement />} />
            <Route path="/customers" element={<CustomerManagement />} />
            <Route path="/deliveries" element={<DeliveryManagement />} />
            <Route path="/restaurant-reports" element={<RestaurantReports />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/receipts" element={<Receipts />} />

            {/* User Management (admin only) */}
            <Route
              path="/users"
              element={
                <RoleRoute allowedRoles={["admin", "manager"]}>
                  <UserManagement />
                </RoleRoute>
              }
            />
          </Routes>
        </div>
        <Footer />
      </div>
    </div>
  );
}

// Main routing component
function AppRoutes() {
  return (
    <Routes>
      {/* Public login route – no sidebar, no dashboard */}
      <Route path="/login" element={<Login />} />

      {/* All other routes are protected and use the authenticated layout */}
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <AuthenticatedLayout />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

// App wrapper
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;