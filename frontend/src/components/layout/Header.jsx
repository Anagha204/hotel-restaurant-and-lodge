
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

export default function Header({ toggleSidebar }) {
  const { mode, toggleMode } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark";
    setIsDarkMode(isDark);
    if (isDark) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode ? "dark" : "light";
    setIsDarkMode(!isDarkMode);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  };

  const handleNotificationClick = () => {
    navigate("/notifications");
  };

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/notifications");

        const notifs = res.data.filter(n => {
          // If already marked read globally, don't count
          if (n.isRead) return false;

          // Don't count messages the user sent themselves
          if (n.senderRole?.toLowerCase() === user?.role?.toLowerCase()) return false;

          // Only count messages specifically targeted to the user's role or name, or "All Staff"
          if (n.recipient === "All Staff") return true;
          if (n.recipient?.toLowerCase() === user?.role?.toLowerCase()) return true;
          if (n.recipient === user?.name) return true;

          return false;
        });
        setUnreadCount(notifs.length);
      } catch (err) {
        console.error("Error fetching notifications for badge", err);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [user]);

  // Determine title based on current mode
  const title = mode === "lodge" ? (
    <>Lodge Dashboard <i className="bi bi-building ms-1"></i></>
  ) : (
    <>Restaurant Dashboard <i className="bi bi-cup-hot ms-1"></i></>
  );

  return (
    <>
      {/* Full screen blur overlay loader */}
      {isSwitching && createPortal(
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div className="spinner-border text-primary" role="status" style={{ width: "4rem", height: "4rem", borderWidth: "0.25rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="mt-4 text-dark fw-bold" style={{ textShadow: "0 2px 4px rgba(255,255,255,0.8)" }}>
            Switching to {mode === "lodge" ? (
              <>Restaurant <i className="bi bi-cup-hot"></i></>
            ) : (
              <>Lodge <i className="bi bi-building"></i></>
            )}...
          </h4>
        </div>,
        document.body
      )}

      <div className="header d-flex flex-wrap justify-content-between align-items-center p-2 bg-white shadow-sm">
        {/* ☰ BUTTON (visible on mobile) */}
        <button className="btn btn-dark d-md-none" onClick={toggleSidebar}>
          ☰
        </button>

        <h5 className="m-0 d-none d-md-block">{title}</h5>

        {/* Right side controls */}
        <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
          {/* Theme Toggle */}
          <button
            className="btn btn-light btn-sm p-1 border-0 bg-transparent flex-shrink-0"
            onClick={toggleTheme}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <i className="bi bi-sun fs-5 text-warning"></i> : <i className="bi bi-moon-stars fs-5 text-dark"></i>}
          </button>

          {/* Notification Icon for all roles */}
          <button
            className="btn btn-light btn-sm position-relative p-1 border-0 bg-transparent flex-shrink-0"
            onClick={handleNotificationClick}
            title="Notifications"
          >
            <i className={`bi bi-bell fs-5 ${isDarkMode ? "text-light" : "text-dark"}`}></i>
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light" style={{ fontSize: "0.55rem" }}>
                {unreadCount}
                <span className="visually-hidden">unread messages</span>
              </span>
            )}
          </button>

          <button className="btn btn-warning btn-sm d-flex align-items-center gap-2 flex-shrink-0" onClick={() => {
            setIsSwitching(true);
            setTimeout(() => {
              toggleMode();
              navigate("/");
              setIsSwitching(false);
            }, 1000);
          }}>
            <i className={mode === "lodge" ? "bi bi-cup-hot" : "bi bi-building"}></i>
            <span className="d-none d-sm-inline">
              {mode === "lodge" ? "Switch to Restaurant" : "Switch to Lodge"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}