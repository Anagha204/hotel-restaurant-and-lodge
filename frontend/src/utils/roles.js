// Role-Based Access Control Constants and Utilities
// Import this file where you need role-based access checks

export const ROLES = {
    ADMIN: "admin",
    MANAGER: "manager",
    KITCHEN_STAFF: "kitchen_staff",
    WAITER: "waiter",
    CASHIER: "cashier"
};

export const ROLE_DISPLAY_NAMES = {
    admin: "Admin",
    manager: "Manager",
    kitchen_staff: "Kitchen Staff",
    waiter: "Waiter",
    cashier: "Cashier"
};

export const ROLE_PERMISSIONS = {
    admin: {
        name: "Admin",
        description: "System configuration, user roles, all data. Full access to all modules.",
        access: [
            "rooms",
            "guests",
            "bookings",
            "checkin",
            "housekeeping",
            "room-service",
            "room-billing",
            "combined-billing",
            "amenities",
            "availability",
            "night-audit",
            "reports",
            "id-verification",
            "tables",
            "menu",
            "orders",
            "kds",
            "billing",
            "inventory",
            "suppliers",
            "purchase",
            "reservations",
            "customers",
            "deliveries",
            "notifications",
            "receipts",
            "user-management"
        ]
    },
    manager: {
        name: "Manager",
        description: "Operations, reporting, inventory, staff, reservations, night audit. All modules except User Management and KDS config.",
        access: [
            "rooms",
            "guests",
            "bookings",
            "checkin",
            "housekeeping",
            "room-service",
            "room-billing",
            "combined-billing",
            "amenities",
            "availability",
            "night-audit",
            "reports",
            "id-verification",
            "tables",
            "menu",
            "orders",
            "billing",
            "inventory",
            "suppliers",
            "purchase",
            "reservations",
            "customers",
            "deliveries",
            "notifications",
            "receipts"
        ]
    },
    kitchen_staff: {
        name: "Kitchen Staff",
        description: "Order queue, food preparation status. Full access to Kitchen Display System.",
        access: [
            "menu",
            "kds",
            "inventory"
        ]
    },
    waiter: {
        name: "Waiter",
        description: "Order taking, table status, room service, customer management.",
        access: [
            "menu",
            "orders",
            "tables",
            "room-service",
            "customers"
        ]
    },
    cashier: {
        name: "Cashier",
        description: "Billing, payments, check-in/out, walk-in bookings, guest management.",
        access: [
            "billing",
            "booking",
            "checkin",
            "room-billing",
            "combined-billing",
            "id-verification"
        ]
    }
};

export const ROLE_COLORS = {
    admin: "danger",
    manager: "primary",
    kitchen_staff: "success",
    waiter: "info",
    cashier: "warning"
};

export const ROLE_ICONS = {
    admin: "bi-shield-lock",
    manager: "bi-person-badge",
    kitchen_staff: "bi-fire",
    waiter: "bi-people-fill",
    cashier: "bi-cash-coin"
};

/**
 * Check if a user has access to a specific module
 * @param {string} userRole - The role of the user
 * @param {string} module - The module to check access for
 * @returns {boolean} - Whether the user has access
 */
export const hasModuleAccess = (userRole, module) => {
    const rolePermissions = ROLE_PERMISSIONS[userRole?.toLowerCase()];
    return rolePermissions?.access.includes(module) || false;
};

/**
 * Get all permissions for a role
 * @param {string} role - The role to get permissions for
 * @returns {Object} - The role permissions object
 */
export const getRolePermissions = (role) => {
    return ROLE_PERMISSIONS[role?.toLowerCase()] || null;
};

/**
 * Get all accessible routes for a role
 * @param {string} role - The role to get routes for
 * @returns {Array} - Array of accessible routes
 */
export const getAccessibleRoutes = (role) => {
    const permissions = getRolePermissions(role);
    return permissions?.access || [];
};
