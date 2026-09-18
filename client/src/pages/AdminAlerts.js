
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./AdminAlerts.css";

function AdminAlerts() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");

  const [openFilter, setOpenFilter] = useState(null);
  const filterRef = useRef(null);

  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 160,
  });

  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // -------------------------------------------------------
  // TOAST
  // -------------------------------------------------------
  const showToast = (message, type = "success") => {
    setToast({
      show: true,
      message,
      type,
    });

    setTimeout(() => {
      setToast({
        show: false,
        message: "",
        type: "success",
      });
    }, 3000);
  };

  // -------------------------------------------------------
  // CLOSE FILTER DROPDOWN WHEN CLICKING OUTSIDE
  // -------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      const clickedInsideTable =
        filterRef.current &&
        filterRef.current.contains(e.target);

      const clickedInsideDropdown =
        e.target.closest(".am-th-pop");

      if (!clickedInsideTable && !clickedInsideDropdown) {
        setOpenFilter(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // -------------------------------------------------------
  // GET ALERTS
  // GET /alerts
  // -------------------------------------------------------
  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (severityFilter) {
        params.severity = severityFilter;
      }

      if (siteFilter) {
        params.site = siteFilter;
      }

      const res = await api.get("/alerts", {
        params,
      });

      setAlerts(res.data?.data || []);
    } catch (err) {
      console.error("Error loading alerts:", err);

      setError(
        err.response?.data?.message ||
          "Could not load alerts. Check that the backend is running."
      );

      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // GET SITES
  // GET /sites
  // -------------------------------------------------------
  const loadSites = async () => {
    try {
      const res = await api.get("/sites");

      setSites(res.data?.data || []);
    } catch (err) {
      console.error("Error loading sites:", err);

      // Site filter is optional
      setSites([]);
    }
  };

  // Load sites once
  useEffect(() => {
    loadSites();
  }, []);

  // Reload alerts whenever filters change
  useEffect(() => {
    load();
  }, [statusFilter, severityFilter, siteFilter]);

  // -------------------------------------------------------
  // COUNTS
  // -------------------------------------------------------
  const bySeverity = (severity) => {
    return alerts.filter(
      (alert) =>
        alert.severity_level === severity
    ).length;
  };

  const byStatus = (status) => {
    return alerts.filter(
      (alert) =>
        alert.status === status
    ).length;
  };

  // -------------------------------------------------------
  // OPEN ALERT DETAILS
  // -------------------------------------------------------
  const openDetail = (alert) => {
    setSelected(alert);
    setShowDetail(true);
  };

  // -------------------------------------------------------
  // UPDATE ALERT STATUS
  // PUT /alerts/:id/status
  // -------------------------------------------------------
  const updateStatus = async (newStatus) => {
    if (!selected?._id) {
      return;
    }

    setSaving(true);

    try {
      await api.put(
        `/alerts/${selected._id}/status`,
        {
          status: newStatus,
        }
      );

      // Update selected alert locally
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
            }
          : prev
      );

      // Close modal
      setShowDetail(false);

      // Reload alerts from backend
      await load();

      showToast(
        `Alert marked as ${newStatus}.`
      );
    } catch (err) {
      console.error(
        "Error updating alert status:",
        err
      );

      showToast(
        err.response?.data?.message ||
          "Failed to update alert.",
        "delete"
      );
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------
  // MARK ALL READ
  // PUT /alerts/markallread
  // -------------------------------------------------------
  const markAllRead = async () => {
    try {
      await api.put("/alerts/markallread");

      await load();

      showToast(
        "All alerts marked as read."
      );
    } catch (err) {
      console.error(
        "Error marking alerts as read:",
        err
      );

      showToast(
        err.response?.data?.message ||
          "Failed to mark alerts as read.",
        "delete"
      );
    }
  };

  // -------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------
  const severityClass = (severity) => {
    return (
      {
        low: "rn",
        medium: "rs",
        high: "re",
        critical: "rw",
      }[severity] || "rn"
    );
  };

  const statusClass = (status) => {
    return (
      {
        unread: "rw",
        read: "rs",
        resolved: "rn",
      }[status] || "rn"
    );
  };

  const formatTime = (date) => {
    if (!date) {
      return "—";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString();
  };

  // -------------------------------------------------------
  // LOGOUT
  // -------------------------------------------------------
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // -------------------------------------------------------
  // FILTER DROPDOWN
  // -------------------------------------------------------
  const toggleFilter = (name, event) => {
    if (openFilter === name) {
      setOpenFilter(null);
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    setDropdownPos({
      top:
        rect.bottom +
        window.scrollY +
        6,
      left:
        rect.left +
        window.scrollX,
      width:
        rect.width + 40,
    });

    setOpenFilter(name);
  };

  const severityOptions = [
    {
      value: "",
      label: "All",
    },
    {
      value: "low",
      label: "Low",
    },
    {
      value: "medium",
      label: "Medium",
    },
    {
      value: "high",
      label: "High",
    },
    {
      value: "critical",
      label: "Critical",
    },
  ];

  const statusOptions = [
    {
      value: "",
      label: "All",
    },
    {
      value: "unread",
      label: "Unread",
    },
    {
      value: "read",
      label: "Read",
    },
    {
      value: "resolved",
      label: "Resolved",
    },
  ];

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
    <div className="am-page">

      {/* SIDEBAR */}
      <aside className="am-sidebar">

        <div className="am-brand">
          <span className="am-brand-icon">
            🌿
          </span>

          <div>
            <div className="am-brand-name">
              MangroveGuard
            </div>

            <div className="am-brand-role">
              Admin Panel
            </div>
          </div>
        </div>

        <nav className="am-nav">
          {[
            {
              to: "/admin-dashboard",
              icon: "⬛",
              label: "Dashboard",
            },
            {
              to: "/manage-users",
              icon: "👥",
              label: "Users",
            },
            {
              to: "/manage-devices",
              icon: "📡",
              label: "Devices",
            },
            {
              to: "/admin-alerts",
              icon: "🔔",
              label: "Alerts",
              active: true,
            },
            {
              to: "/admin-maps",
              icon: "📍",
              label: "Sites",
            },
            {
              to: "/admin-messages",
              icon: "✉️",
              label: "Messages",
            },
            {
              to: "/admin-profile",
              icon: "👤",
              label: "Profile",
            },
          ].map(
            ({
              to,
              icon,
              label,
              active,
            }) => (
              <Link
                key={to}
                to={to}
                className={`am-nav-link ${
                  active
                    ? "am-nav-link--active"
                    : ""
                }`}
              >
                <span className="am-nav-icon">
                  {icon}
                </span>

                <span>{label}</span>
              </Link>
            )
          )}
        </nav>

        <div className="am-sidebar-bottom">

          <div className="am-user-card">

            <div className="am-user-avatar">
              {user?.name?.[0]?.toUpperCase() ||
                "A"}
            </div>

            <div>
              <div className="am-user-name">
                {user?.name || "Admin"}
              </div>

              <div className="am-user-email">
                {user?.email || ""}
              </div>
            </div>

          </div>

          <button
            className="am-logout-btn"
            onClick={handleLogout}
          >
            ⏻ Logout
          </button>

        </div>
      </aside>

      {/* MAIN */}
      <main className="am-main">

        {/* HEADER */}
        <div className="am-header">

          <div>
            <p className="am-breadcrumb">
              Admin › Alerts
            </p>

            <h1 className="am-title">
              Alert Management
            </h1>

            <p className="am-subtitle">
              Review sensor alerts and update
              their status.
            </p>
          </div>

          <button
            className="am-btn-sec"
            onClick={markAllRead}
          >
            ✓ Mark All Read
          </button>

        </div>

        {/* STATISTICS */}
        <div className="am-stats">

          {[
            {
              icon: "🚨",
              val: byStatus("unread"),
              label: "Unread",
            },
            {
              icon: "🔴",
              val:
                bySeverity("critical") +
                bySeverity("high"),
              label: "High / Critical",
            },
            {
              icon: "🟠",
              val: bySeverity("medium"),
              label: "Medium",
            },
            {
              icon: "✅",
              val: byStatus("resolved"),
              label: "Resolved",
            },
          ].map((stat, index) => (
            <div
              className="am-stat-card"
              key={index}
            >
              <span className="am-stat-icon">
                {stat.icon}
              </span>

              <div>
                <div className="am-stat-val">
                  {stat.val}
                </div>

                <div className="am-stat-lbl">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}

        </div>

        {/* SITE FILTER */}
        <div
          className="am-card"
          style={{
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            gap: "14px",
            alignItems: "center",
          }}
        >
          <label
            className="am-lbl"
            style={{ margin: 0 }}
          >
            Filter by Site:
          </label>

          <select
            className="am-inp"
            style={{ width: "auto" }}
            value={siteFilter}
            onChange={(e) =>
              setSiteFilter(e.target.value)
            }
          >
            <option value="">
              All Sites
            </option>

            {sites.map((site) => (
              <option
                key={site._id}
                value={site._id}
              >
                {site.name}
              </option>
            ))}
          </select>
        </div>

        {/* ERROR */}
        {error && (
          <div className="am-error">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="am-loading">
            <div className="am-spinner" />

            <p>
              Loading alerts…
            </p>
          </div>
        ) : (
          <div className="am-card">

            <table
              className="am-table"
              ref={filterRef}
            >
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "17%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>

              <thead>
                <tr>

                  <th>#</th>

                  <th>
                    Parameter
                  </th>

                  {/* SEVERITY FILTER */}
                  <th className="am-th-rel">

                    <span
                      className="am-th-clickable"
                      onClick={(e) =>
                        toggleFilter(
                          "severity",
                          e
                        )
                      }
                    >
                      Severity{" "}
                      <span className="am-th-arrow">
                        ▾
                      </span>
                    </span>

                    {openFilter ===
                      "severity" &&
                      createPortal(
                        <div
                          className="am-th-pop"
                          style={{
                            position:
                              "absolute",
                            top:
                              dropdownPos.top,
                            left:
                              dropdownPos.left,
                            width:
                              dropdownPos.width,
                            zIndex: 99999,
                          }}
                        >
                          {severityOptions.map(
                            (option) => (
                              <div
                                key={
                                  option.value
                                }
                                className={`am-th-pop-item ${
                                  severityFilter ===
                                  option.value
                                    ? "am-th-pop-item--active"
                                    : ""
                                }`}
                                onClick={() => {
                                  setSeverityFilter(
                                    option.value
                                  );

                                  setOpenFilter(
                                    null
                                  );
                                }}
                              >
                                {
                                  option.label
                                }
                              </div>
                            )
                          )}
                        </div>,
                        document.body
                      )}

                  </th>

                  <th>
                    Device / Site
                  </th>

                  <th>
                    Value
                  </th>

                  {/* STATUS FILTER */}
                  <th className="am-th-rel">

                    <span
                      className="am-th-clickable"
                      onClick={(e) =>
                        toggleFilter(
                          "status",
                          e
                        )
                      }
                    >
                      Status{" "}
                      <span className="am-th-arrow">
                        ▾
                      </span>
                    </span>

                    {openFilter ===
                      "status" &&
                      createPortal(
                        <div
                          className="am-th-pop"
                          style={{
                            position:
                              "absolute",
                            top:
                              dropdownPos.top,
                            left:
                              dropdownPos.left,
                            width:
                              dropdownPos.width,
                            zIndex: 99999,
                          }}
                        >
                          {statusOptions.map(
                            (option) => (
                              <div
                                key={
                                  option.value
                                }
                                className={`am-th-pop-item ${
                                  statusFilter ===
                                  option.value
                                    ? "am-th-pop-item--active"
                                    : ""
                                }`}
                                onClick={() => {
                                  setStatusFilter(
                                    option.value
                                  );

                                  setOpenFilter(
                                    null
                                  );
                                }}
                              >
                                {
                                  option.label
                                }
                              </div>
                            )
                          )}
                        </div>,
                        document.body
                      )}

                  </th>

                  <th>
                    Time
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {alerts.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="am-empty"
                    >
                      No alerts found.
                    </td>
                  </tr>
                ) : (
                  alerts.map(
                    (alert, index) => (
                      <tr
                        key={alert._id}
                        className="am-tr"
                      >

                        <td className="am-td-num">
                          {index + 1}
                        </td>

                        <td className="am-td-name">
                          {alert.parameter_name ||
                            "—"}
                        </td>

                        <td>
                          <span
                            className={`am-badge am-badge--${severityClass(
                              alert.severity_level
                            )}`}
                          >
                            {alert.severity_level ||
                              "—"}
                          </span>
                        </td>

                        <td className="am-td-loc">
                          {alert.device
                            ?.device_id ||
                            "—"}

                          {alert.device?.site
                            ?.name
                            ? ` · ${alert.device.site.name}`
                            : ""}
                        </td>

                        <td className="am-td-data">
                          {alert.measured_value ??
                            "—"}
                        </td>

                        <td>
                          <span
                            className={`am-badge am-badge--${statusClass(
                              alert.status
                            )}`}
                          >
                            {alert.status ||
                              "—"}
                          </span>
                        </td>

                        <td className="am-td-dim">
                          {formatTime(
                            alert.created_at
                          )}
                        </td>

                        <td>
                          <div className="am-actions">

                            <button
                              className="am-act am-act--edit"
                              onClick={() =>
                                openDetail(
                                  alert
                                )
                              }
                            >
                              👁 View
                            </button>

                          </div>
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>
            </table>

          </div>
        )}

      </main>

      {/* ALERT DETAILS MODAL */}
      {showDetail && selected && (
        <div
          className="am-overlay"
          onClick={() =>
            setShowDetail(false)
          }
        >
          <div
            className="am-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="am-modal-head">

              <h2>
                Alert Details
              </h2>

              <button
                className="am-close"
                onClick={() =>
                  setShowDetail(false)
                }
              >
                ✕
              </button>

            </div>

            <div className="am-modal-body">

              <p>
                <strong>
                  Parameter:
                </strong>{" "}
                {selected.parameter_name ||
                  "—"}
              </p>

              <p>
                <strong>
                  Severity:
                </strong>{" "}
                {selected.severity_level ||
                  "—"}
              </p>

              <p>
                <strong>
                  Measured Value:
                </strong>{" "}
                {selected.measured_value ??
                  "—"}
              </p>

              <p>
                <strong>
                  Threshold:
                </strong>{" "}
                {selected.threshold_value ??
                  "—"}
              </p>

              <p>
                <strong>
                  Threshold Breached:
                </strong>{" "}
                {selected.threshold_breached ??
                  "—"}
              </p>

              <p>
                <strong>
                  Device:
                </strong>{" "}
                {selected.device?.device_id ||
                  "—"}
              </p>

              <p>
                <strong>
                  Site:
                </strong>{" "}
                {selected.device?.site?.name ||
                  "—"}
              </p>

              <p>
                <strong>
                  Message:
                </strong>{" "}
                {selected.message || "—"}
              </p>

              <p>
                <strong>
                  Reported:
                </strong>{" "}
                {formatTime(
                  selected.created_at
                )}
              </p>

              <p>
                <strong>
                  Current Status:
                </strong>{" "}
                {selected.status || "—"}
              </p>

              <div className="am-modal-foot">

                {selected.status !==
                  "read" &&
                  selected.status !==
                    "resolved" && (
                    <button
                      className="am-btn-sec"
                      onClick={() =>
                        updateStatus(
                          "read"
                        )
                      }
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : "Mark as Read"}
                    </button>
                  )}

                {selected.status !==
                  "resolved" && (
                  <button
                    className="am-btn-primary"
                    onClick={() =>
                      updateStatus(
                        "resolved"
                      )
                    }
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Mark Resolved"}
                  </button>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

      {/* TOAST */}
      {toast.show && (
        <div
          className={`am-toast am-toast--${toast.type}`}
        >
          <span className="am-toast-icon">
            {toast.type === "delete"
              ? "⚠️"
              : "✅"}
          </span>

          {toast.message}
        </div>
      )}

    </div>
  );
}

export default AdminAlerts;
