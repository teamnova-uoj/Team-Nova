
import { useEffect, useRef, useState } from "react";
import "./Alerts.css";
import { NavLink, Link, useNavigate } from "react-router-dom";
import mangrove from "../assests/mangrove.png";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_LABEL = {
  unread: "Pending",
  read: "Read",
  resolved: "Resolved",
};

const SEVERITY_LABEL = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const navClass = ({ isActive }) => (isActive ? "active" : "");

function formatDate(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB");
}

function formatTime(dateValue) {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Alerts() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const menuRef = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load alerts for the logged-in user
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/alerts", {
          params: {
            limit: 100,
          },
        });

        const alertData = response.data?.data || [];

        setAlerts(Array.isArray(alertData) ? alertData : []);
      } catch (err) {
        console.error("Error loading alerts:", err);

        setError(
          err.response?.data?.message ||
            "Couldn't load alerts from the server."
        );

        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    const value = searchTerm.trim();

    if (!value) return;

    navigate(`/search?q=${encodeURIComponent(value)}`);
    setSearchTerm("");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div>
      {/* Navbar */}
      <div className="dashboard-navbar">
        <div className="logo">🌿 MangroveGuard</div>

        <div className="nav-links">
          <NavLink to="/dashboard" className={navClass}>
            Dashboard
          </NavLink>

          <NavLink to="/sites" className={navClass}>
            Sites
          </NavLink>

          <NavLink to="/alerts" className={navClass}>
            Alerts
          </NavLink>

          <NavLink to="/about" className={navClass}>
            About
          </NavLink>

          <NavLink to="/contact" className={navClass}>
            Contact
          </NavLink>

          {/* Search */}
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <button
              type="submit"
              className="search-icon-btn"
              aria-label="Search"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>

          {/* Profile */}
          <div className="profile-menu" ref={menuRef}>
            <button
              type="button"
              className="avatar-btn"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {user?.name
                ? user.name.charAt(0).toUpperCase()
                : "👤"}
            </button>

            {menuOpen && (
              <div className="profile-dropdown">
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                >
                  👤 Profile
                </Link>

                <button type="button" onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Background */}
      <div
        className="alerts-hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >
        <h2 className="alerts-title">
          Alerts & Notifications
        </h2>

        {/* Logged-in user information */}
        {user && (
          <p className="alerts-user">
            Alerts for {user.name || user.email || "current user"}
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="alerts-error">
            {error}
          </div>
        )}

        {/* Alerts Table */}
        <div className="alerts-table-container">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Site Name</th>
                <th>Alert</th>
                <th>Severity</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="6"
                    className="table-empty-msg"
                  >
                    Loading alerts…
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="table-empty-msg"
                  >
                    No alerts to show
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => {
                  const severity =
                    alert.severity_level || "low";

                  const status =
                    alert.status || "unread";

                  return (
                    <tr
                      key={alert._id}
                      className={`severity-row-${severity}`}
                    >
                      {/* Site */}
                      <td>
                        {alert.device?.site?.name ||
                          alert.site?.name ||
                          "—"}
                      </td>

                      {/* Alert message */}
                      <td className="alert-message-cell">
                        {alert.message || "Alert generated"}
                      </td>

                      {/* Severity */}
                      <td>
                        <span
                          className={`severity-badge severity-${severity}`}
                        >
                          {SEVERITY_LABEL[severity] ||
                            severity}
                        </span>
                      </td>

                      {/* Date */}
                      <td>
                        {formatDate(alert.created_at)}
                      </td>

                      {/* Time */}
                      <td>
                        {formatTime(alert.created_at)}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`alert-status ${status}`}>
                          {STATUS_LABEL[status] || status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Alerts;
