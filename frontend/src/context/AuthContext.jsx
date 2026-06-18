import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser && token) setUser(JSON.parse(storedUser));
    }, [token]);

    const login = (newToken, userData) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

    const hasRole = (role) => user?.role?.toLowerCase() === role.toLowerCase();

    // Check if user has any of the provided roles
    const hasAnyRole = (roles) => {
        if (!user) return false;
        const userRole = user.role?.toLowerCase();
        return roles.some(role => role.toLowerCase() === userRole);
    };

    // Check if user has all of the provided roles (usually just one)
    const hasAllRoles = (roles) => hasAnyRole(roles);

    // Check if user has admin or manager role
    const isManagerOrAbove = () => hasAnyRole(["admin", "manager"]);

    // Check if user is admin
    const isAdmin = () => hasRole("admin");

    const value = {
        user,
        token,
        login,
        logout,
        hasRole,
        hasAnyRole,
        hasAllRoles,
        isManagerOrAbove,
        isAdmin
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}