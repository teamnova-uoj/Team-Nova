import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
import api from "../services/api";
import socket from "../services/socket";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { buildSeriesWithGaps } from "../utils/chartGaps";
import { getDayTicks, makeDayAwareTick, formatTooltipTime } from "../utils/timeAxis";
import { Bell, Radio, MapPin, Users, CheckCircle2, Clock } from "lucide-react";
import "./AdminAlerts.css";


const PARAM_COLORS = {
  pH: "#2a78d6",
  temperature: "#eb6834",
  salinity: "#1baf7a",
  dissolved_o2: "#eda100",
};

const PARAM_LABELS = {
  pH: "pH",
  temperature: "Temperature (°C)",
  salinity: "Salinity (ppt)",
  dissolved_o2: "Dissolved O₂ (mg/L)",
};

const TIME_RANGES = [
  { label: "1h", hours: 1 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 168 },
];

function classifyParam(key, label) {
  const k = (key || "").toLowerCase();
  const lbl = (label || "").toLowerCase();
  if (k === "ph" || lbl.includes("ph")) return "pH";
  if (k === "temperature" || k === "temp" || lbl.includes("temp")) return "temperature";
  if (k === "salinity" || lbl.includes("salin")) return "salinity";
  if (k === "dissolved_o2" || k === "do2" || lbl.includes("o2") || lbl.includes("oxygen")) return "dissolved_o2";
  return null;
}

const getStatusFor = (val, paramKey, siteThresholds) => {
  if (val === null || val === undefined) return "unknown";
  if (!siteThresholds || !Array.isArray(siteThresholds)) return "unknown";

  const targetKey = paramKey.toLowerCase();
  const entry = siteThresholds.find(t => {
    const k = (t.parameter?.key || "").toLowerCase();
    const lbl = (t.parameter?.label || t.parameter_name || "").toLowerCase();
    if (k === targetKey) return true;
    if (targetKey === "ph" && (k === "ph" || lbl.includes("ph"))) return true;
    if (targetKey === "temperature" && (k === "temperature" || k === "temp" || lbl.includes("temp"))) return true;
    if (targetKey === "salinity" && (k === "salinity" || lbl.includes("salin"))) return true;
    if (targetKey === "dissolved_o2" && (k === "dissolved_o2" || k === "do2" || lbl.includes("o2") || lbl.includes("oxygen"))) return true;
    return false;
  });

  if (!entry || (entry.min === undefined && entry.max === undefined)) return "unknown";
  if (entry.min !== null && entry.min !== undefined && val < entry.min) return "breach";
  if (entry.max !== null && entry.max !== undefined && val > entry.max) return "breach";
  return "normal";
};

function SiteHistoryChart({ siteId, devices, sites }) {
  const site = sites?.find(s => s._id === siteId);
  const [selectedParam, setSelectedParam] = useState("pH");
  const [rangeHours, setRangeHours] = useState(24);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const siteDevices = devices.filter(d => (d.site?._id || d.site) === siteId);
      if (siteDevices.length === 0) {
        setHistoryData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);
      try {
        const fromDate = new Date(Date.now() - rangeHours * 60 * 60 * 1000).toISOString();
        const responses = await Promise.all(
          siteDevices.map(d => api.get(`/readings?device=${d._id}&limit=2000&from=${fromDate}`))
        );

        let allReadings = [];
        responses.forEach(res => {
          if (res.data?.data) allReadings = allReadings.concat(res.data.data);
        });
        allReadings.sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

        const labelOptions = rangeHours > 24
          ? { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
          : { hour: "2-digit", minute: "2-digit" };

        const dataMap = {};
        allReadings.forEach(r => {
          const paramKey = classifyParam(r.sensor?.parameter?.key, r.sensor?.parameter?.label || r.parameter_name);
          if (!paramKey) return;

          const timeKey = new Date(r.recorded_at).setSeconds(0, 0);
          if (!dataMap[timeKey]) {
            dataMap[timeKey] = {
              timeKey,
              timeLabel: new Date(timeKey).toLocaleString([], labelOptions),
            };
          }
          dataMap[timeKey][paramKey] = r.value;
        });

        if (!cancelled) setHistoryData(Object.values(dataMap).sort((a, b) => a.timeKey - b.timeKey));
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [siteId, devices, rangeHours]);

  const controls = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {Object.keys(PARAM_COLORS).map(key => (
          <button
            key={key}
            onClick={() => setSelectedParam(key)}
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              border: `1px solid ${selectedParam === key ? PARAM_COLORS[key] : "#deeae3"}`,
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: selectedParam === key ? 700 : 500,
              background: selectedParam === key ? PARAM_COLORS[key] : "#fff",
              color: selectedParam === key ? "#fff" : "#3a4a42",
            }}
          >
            {key === "pH" ? "pH" : key === "temperature" ? "Temp" : key === "salinity" ? "Salinity" : "DO₂"}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        {TIME_RANGES.map(opt => (
          <button
            key={opt.hours}
            onClick={() => setRangeHours(opt.hours)}
            style={{
              padding: "4px 10px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: rangeHours === opt.hours ? 700 : 500,
              background: rangeHours === opt.hours ? "#1f4d3a" : "#e6ede9",
              color: rangeHours === opt.hours ? "#fff" : "#3a4a42",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <div>{controls}<p style={{ textAlign: "center", color: "#5c7c6a", fontSize: "13px", margin: "24px 0" }}>Loading history…</p></div>;
  }
  if (error) {
    return <div>{controls}<p style={{ textAlign: "center", color: "#5c7c6a", fontSize: "13px", margin: "24px 0" }}>Couldn't load history for this site.</p></div>;
  }
  if (historyData.length === 0) {
    return <div>{controls}<p style={{ textAlign: "center", color: "#5c7c6a", fontSize: "13px", margin: "24px 0" }}>No historical data for this range.</p></div>;
  }

  const chartData = buildSeriesWithGaps(historyData, selectedParam);
  const xTicks = getDayTicks(chartData, rangeHours);

  const xDomain = (() => {
    if (!chartData || chartData.length === 0) return [0, 1];
    const min = chartData[0]?.timeKey;
    const max = chartData[chartData.length - 1]?.timeKey;
    return min === max ? [min - 3600000, max + 3600000] : [min, max];
  })();

  const renderCustomDot = (props, paramKey) => {
    const { cx, cy, value } = props;
    if (value === null || value === undefined) return null;
    const status = getStatusFor(value, paramKey, site?.thresholds);
    const fill = status === "breach" ? "#e24b4a" : status === "normal" ? "#5a9c5a" : PARAM_COLORS[paramKey] || "#c9c9c9";
    return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4} stroke="none" fill={fill} />;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && !payload[0].payload?.isGap) {
      const val = payload[0].value;
      const paramKey = selectedParam;
      const status = getStatusFor(val, paramKey, site?.thresholds);
      const isBreach = status === "breach";

      return (
        <div style={{
          backgroundColor: isBreach ? "#fdecea" : "#fff",
          border: `1px solid ${isBreach ? "#e24b4a" : "#ccc"}`,
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          color: isBreach ? "#a32d2d" : "#333"
        }}>
          <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>{formatTooltipTime(payload[0].payload.timeKey)}</p>
          <p style={{ margin: 0 }}>
            {payload[0].name}: {val ?? "—"}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {controls}
      <div style={{ height: "220px", width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e0d9" />
            <XAxis
              dataKey="timeKey"
              type="number"
              scale="time"
              domain={xDomain}
              height={40}
              ticks={xTicks}
              interval={0}
              tick={makeDayAwareTick(xTicks, { fontSize: 11, fill: "#898781", timeRange: rangeHours })}
            />
            <YAxis tick={{ fontSize: 11, fill: "#898781" }} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              name={PARAM_LABELS[selectedParam]}
              dataKey={selectedParam}
              stroke={PARAM_COLORS[selectedParam]}
              strokeWidth={2}
              dot={(p) => renderCustomDot(p, selectedParam)}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sites, setSites] = useState([]);
  const [recentLogins, setRecentLogins] = useState([]);
  const [userCount, setUserCount] = useState(null);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [readings, setReadings] = useState([]);
  const [liveSensors, setLiveSensors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Accordion: track which site rows are expanded (map of siteId -> boolean)
  const [expandedSiteIds, setExpandedSiteIds] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  const handleLogout = () => { logout(); navigate("/"); };

  const refreshDevices = async () => {
    try {
      const res = await api.get("/devices");
      setDevices(res.data.data || []);
    } catch (err) {
      console.error("Failed to refresh devices:", err);
    }
  };

  const handleSetDeviceActive = async (deviceId) => {
    setActionLoading(prev => ({ ...prev, [deviceId]: true }));
    try {
      await api.put(`/devices/${deviceId}`, {
        status: "active",
        fault_reason: null,
        faulty_since: null,
        auto_flagged: false
      });
      await refreshDevices();
    } catch (err) {
      console.error("Failed to set device active:", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [deviceId]: false }));
    }
  };

  const handleSetSensorActive = async (sensorId) => {
    setActionLoading(prev => ({ ...prev, [sensorId]: true }));
    try {
      await api.put(`/sensors/${sensorId}`, {
        status: "active",
        fault_reason: null,
        faulty_since: null,
        auto_flagged: false
      });
      await refreshDevices();
    } catch (err) {
      console.error("Failed to set sensor active:", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [sensorId]: false }));
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [devicesRes, alertsRes, sitesRes] = await Promise.all([
          api.get("/devices"),
          api.get("/alerts"),
          api.get("/sites"),
        ]);
        setDevices(devicesRes.data.data || []);
        setAlerts(alertsRes.data.data || []);
        setSites(sitesRes.data.data || []);

        try {
          const readingsRes = await api.get("/readings/latest");
          setReadings(readingsRes.data.data || []);
        } catch {
          setReadings([]);
        }

        try {
          const usersRes = await api.get("/users");
          setUserCount((usersRes.data.data || []).length);
        } catch {
          setUserCount(null);
        }
        try {
          const pendingRes = await api.get("/users/pending-count");
          setPendingUsersCount(pendingRes.data.count || 0);
        } catch {
          setPendingUsersCount(0);
        }
        try {
          const loginsRes = await api.get("/users/recent-logins");
          setRecentLogins(loginsRes.data.data || []);
        } catch {
          setRecentLogins([]);
        }
      } catch {
        setError("Could not load dashboard data. Check that the backend is running.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const handleNewReading = (newReading) => {
      if (!newReading) return;
      const getSensorId = (r) => (r.sensor?._id ? r.sensor._id.toString() : r.sensor ? r.sensor.toString() : null);
      const newSensorId = getSensorId(newReading);

      setReadings((prev) => {
        const exists = prev.some((r) => getSensorId(r) === newSensorId);
        if (exists) {
          return prev.map((r) => (getSensorId(r) === newSensorId ? newReading : r));
        } else {
          return [newReading, ...prev];
        }
      });

      if (newSensorId) {
        setLiveSensors((prev) => ({ ...prev, [newSensorId]: true }));
        setTimeout(() => {
          setLiveSensors((prev) => {
            const copy = { ...prev };
            delete copy[newSensorId];
            return copy;
          });
        }, 4000);
      }
    };

    socket.on("new_reading", handleNewReading);
    return () => {
      socket.off("new_reading", handleNewReading);
    };
  }, []);

  useEffect(() => {
    const handleStatusChange = () => {
      refreshDevices();
    };

    socket.on("device_status_changed", handleStatusChange);
    return () => {
      socket.off("device_status_changed", handleStatusChange);
    };
  }, []);

  // ── derived stats ─────────────────────────────────────
  const activeDevices = devices.filter(d => d.status === "active").length;
  const attentionDevices = devices.filter(
    d => d.status === "faulty" || d.status === "inactive" || d.status === "maintenance" ||
         (d.sensors && d.sensors.some(s => s.status === "faulty" || s.status === "inactive"))
  );
  const unreadAlerts = alerts.filter(a => a.status === "unread").length;
  const recentAlerts = [...alerts]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const severityClass = (s) => ({ low: "rn", medium: "rs", high: "re", critical: "rw" }[s] || "rn");
  const statusClass = (s) => ({ active: "rn", inactive: "rs", maintenance: "re", faulty: "rw" }[s] || "rn");

  // ── ranked "needs attention" sites, worst severity first ──
  const severityRank = { critical: 3, high: 2, medium: 1, low: 0 };
  const activeAlerts = alerts.filter(a => a.status !== "resolved");

  const siteAttentionMap = {};
  activeAlerts.forEach(a => {
    const site = a.device?.site;
    if (!site?._id) return;
    if (!siteAttentionMap[site._id]) {
      siteAttentionMap[site._id] = { siteId: site._id, siteName: site.name, count: 0, worst: 'low', alertsMap: {} };
    }
    const entry = siteAttentionMap[site._id];
    // Key by parameter_name or alert ID to safely support device/system offline alerts
    const alertKey = a.parameter_name || a._id;
    if (!entry.alertsMap[alertKey]) {
      entry.alertsMap[alertKey] = a;
    }
  });

  Object.values(siteAttentionMap).forEach(entry => {
    entry.alerts = Object.values(entry.alertsMap);
    entry.count = entry.alerts.length;
    entry.worst = entry.alerts.reduce((w, a) => severityRank[a.severity_level] > severityRank[w] ? a.severity_level : w, 'low');
  });

  const rankedSites = Object.values(siteAttentionMap)
    .sort((a, b) => severityRank[b.worst] - severityRank[a.worst])
    .slice(0, 5); // dashboard shows top 5; full list lives on /admin-alerts

  const toggleSite = (siteId) => {
    setExpandedSiteIds(prev => ({ ...prev, [siteId]: !prev[siteId] }));
  };

  // ── relative time, e.g. "5m ago", "3h ago", "2d ago" ──
  const timeAgo = (d) => {
    if (!d) return "never";
    const diffMs = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const severityBg = { critical: "#fcebeb", high: "#faece7", medium: "#faeeda", low: "#eaf3de" };
  const severityBorder = { critical: "#e24b4a", high: "#d85a30", medium: "#efc97a", low: "#97c459" };
  const severityText = { critical: "#a32d2d", high: "#993c1d", medium: "#854f0b", low: "#3b6d11" };

  // ── render ────────────────────────────────────────────
  return (
    <div className="am-page">

      {/* ── Sidebar ── */}
      <AdminSidebar activePage="dashboard" />

      {/* ── Main ── */}
      <main className="am-main">

        {/* Header */}
        <div className="am-header">
          <div>
            <p className="am-breadcrumb">Admin › Dashboard</p>
            <h1 className="am-title">Admin Dashboard</h1>
            <p className="am-subtitle">Overview of devices, sites, alerts and users.</p>
          </div>
        </div>

        {/* Error */}
        {error && <div className="am-error">{error}</div>}

        {loading ? (
          <div className="am-loading">
            <div className="am-spinner" />
            <p>Loading dashboard…</p>
          </div>
        ) : (
          <>
            {/* Pending User Registrations Banner */}
            {pendingUsersCount > 0 && (
              <div style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "10px",
                padding: "14px 18px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                boxShadow: "0 2px 6px rgba(217, 119, 6, 0.08)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "#fef3c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Clock size={19} color="#b45309" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#92400e" }}>
                      {pendingUsersCount} User Registration{pendingUsersCount > 1 ? "s" : ""} Awaiting Review
                    </div>
                    <div style={{ fontSize: "12px", color: "#b45309" }}>
                      Unapproved users cannot log in or view dashboard/site details.
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Link
                    to="/pending-requests"
                    style={{
                      background: "#164e3d",
                      color: "#fff",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      textDecoration: "none",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Pending Requests →
                  </Link>
                  <Link
                    to="/manage-users"
                    style={{
                      background: "#d97706",
                      color: "#fff",
                      padding: "7px 14px",
                      borderRadius: "6px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      textDecoration: "none",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Users →
                  </Link>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="am-stats">
              {[
                { icon: <Bell size={22} color="#d97706" />, val: unreadAlerts, label: "Unread alerts" },
                { icon: <Radio size={22} color="#1d7068" />, val: `${activeDevices}/${devices.length}`, label: "Devices active" },
                { icon: <MapPin size={22} color="#164e3d" />, val: sites.length, label: "Sites monitored" },
                { icon: <Users size={22} color="#2b9388" />, val: userCount ?? "—", label: "Total users" },
              ].map((s, i) => (
                <div className="am-stat-card" key={i}>
                  <span className="am-stat-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</span>
                  <div>
                    <div className="am-stat-val">{s.val}</div>
                    <div className="am-stat-lbl">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sites needing attention — ranked accordion showing ONLY breaching sites sorted by severity */}
            <div className="am-card" style={{ padding: "18px 20px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1c3a2a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={18} color="#164e3d" />
                  <span>Sites needing attention</span>
                </h2>
                <Link to="/admin-alerts" style={{ fontSize: "12px", color: "#1c3a2a" }}>View all →</Link>
              </div>

              {rankedSites.length === 0 ? (
                <div style={{ padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#166534", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={16} color="#166534" />
                  <span>All sites operating normally — no active parameter breaches.</span>
                </div>
              ) : (
                <div style={{ border: "1px solid #deeae3", borderRadius: "10px", overflow: "hidden" }}>
                  {rankedSites.map((s, i) => {
                    const isOpen = !!expandedSiteIds[s.siteId];
                    const isSiteLive = readings.some((r) => {
                      const sId = r.sensor?._id?.toString() || r.sensor?.toString();
                      const rSiteId = r.device?.site?._id || r.device?.site;
                      return (rSiteId === s.siteId || rSiteId === s.siteId?.toString()) && liveSensors[sId];
                    });

                    return (
                      <div key={s.siteId} style={{ borderTop: i > 0 ? "1px solid #deeae3" : "none" }}>
                        {/* Row header */}
                        <div
                          onClick={() => toggleSite(s.siteId)}
                          style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "12px 16px", cursor: "pointer", background: "#fff",
                            borderLeft: `4px solid ${severityBorder[s.worst] || "#e24b4a"}`,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1c3a2a", display: "flex", alignItems: "center", gap: "8px" }}>
                              {s.siteName}
                              {isSiteLive && (
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  background: "#e6f4ea",
                                  color: "#137333",
                                  border: "1px solid #ceead6",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: "10px"
                                }}>
                                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1e8e3e" }} />
                                  LIVE
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "11px", color: "#475569", fontWeight: 500 }}>
                              Severity: <strong style={{ color: severityText[s.worst] }}>{s.worst.toUpperCase()}</strong> · {s.count} active breach{s.count > 1 ? "es" : ""}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span className={`am-badge am-badge--${severityClass(s.worst)}`}>{s.worst}</span>
                            <span style={{
                              fontSize: "16px", color: "#5c7c6a", fontWeight: 600,
                              display: "inline-block", transform: isOpen ? "rotate(90deg)" : "none",
                              transition: "transform 0.15s",
                            }}>›</span>
                          </div>
                        </div>

                        {/* Expanded detail — parameter breach chart & alert list */}
                        {isOpen && (
                          <div style={{ padding: "14px 18px", background: "#fafcfb", borderTop: "1px solid #edf4ef" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{ fontWeight: 600, fontSize: "12px", color: "#1c3a2a" }}>
                                Active Breaching Parameters:
                              </span>
                              <Link to={`/sites/${s.siteId}`} state={{ fromAdmin: true }} style={{ fontSize: "12px", color: "#164e3d", fontWeight: 600, textDecoration: "none" }}>
                                View site details →
                              </Link>
                            </div>
                            {s.alerts.map(a => (
                              <Link
                                key={a._id}
                                to={`/sites/${s.siteId}`}
                                state={{ fromAdmin: true }}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "8px 12px",
                                  background: severityBg[a.severity_level] || "#fff",
                                  borderRadius: "6px",
                                  marginBottom: "6px",
                                  border: `1px solid ${severityBorder[a.severity_level] || "#ccc"}`,
                                  textDecoration: "none",
                                  color: "inherit"
                                }}
                              >
                                <div>
                                  <strong style={{ fontSize: "13px", color: severityText[a.severity_level] }}>{a.parameter_name || "Alert"}{a.measured_value !== undefined && a.measured_value !== null ? `: ${a.measured_value} ${a.unit || ""}` : ""}</strong>
                                  <div style={{ fontSize: "11px", color: "#334155", fontWeight: 500 }}>Device: {a.device?.device_id || "—"} · {a.message}</div>
                                </div>
                                <span className={`am-badge am-badge--${severityClass(a.severity_level)}`}>{a.severity_level}</span>
                              </Link>
                            ))}

                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#1c3a2a", margin: "14px 0 6px" }}>
                              Parameter History ({s.siteName}):
                            </div>
                            <SiteHistoryChart siteId={s.siteId} devices={devices} sites={sites} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sections */}
            <div className="am-grid-2col">

              <div className="am-card" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1c3a2a", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Radio size={18} color="#1d7068" />
                    <span>Devices needing maintenance</span>
                  </h2>
                  <Link to="/manage-devices" style={{ fontSize: "12px", color: "#1c3a2a" }}>View all →</Link>
                </div>
                {attentionDevices.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#3b6d11" }}>All devices and sensors online and healthy.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "380px", overflowY: "auto" }}>
                    {attentionDevices.map(d => {
                      const isDeviceProblem = d.status === "faulty" || d.status === "inactive" || d.status === "maintenance";
                      const problemSensors = (d.sensors || []).filter(s => s.status === "faulty" || s.status === "inactive");

                      return (
                        <div
                          key={d._id}
                          style={{
                            padding: "10px 12px",
                            background: "#fbfcfb",
                            border: "1px solid #deeae3",
                            borderRadius: "8px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                            <div>
                              <span style={{ fontSize: "13px", color: "#1c3a2a", fontWeight: 700 }}>{d.device_id}</span>
                              <span style={{ fontSize: "12px", color: "#5c7c6a", marginLeft: "6px" }}>· {d.site?.name || "—"}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span className={`am-badge am-badge--${statusClass(d.status)}`}>{d.status}</span>
                              {isDeviceProblem && (
                                <button
                                  className="am-act am-act--edit"
                                  style={{ padding: "3px 8px", fontSize: "11px" }}
                                  disabled={actionLoading[d._id]}
                                  onClick={() => handleSetDeviceActive(d._id)}
                                >
                                  {actionLoading[d._id] ? "Saving…" : "Set Active"}
                                </button>
                              )}
                            </div>
                          </div>

                          {isDeviceProblem && (
                            <div style={{ fontSize: "11px", color: "#475569", background: "#f1f5f3", padding: "5px 8px", borderRadius: "5px" }}>
                              <div><strong>Reason:</strong> {d.fault_reason || (d.status === "maintenance" ? "Scheduled maintenance" : "Manually flagged")}</div>
                              <div style={{ marginTop: "2px" }}><strong>Since:</strong> {d.faulty_since ? `${new Date(d.faulty_since).toLocaleString()} (${timeAgo(d.faulty_since)})` : (d.updated_at ? new Date(d.updated_at).toLocaleString() : "—")}</div>
                            </div>
                          )}

                          {problemSensors.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Problem Sensors:
                              </span>
                              {problemSensors.map(s => (
                                <div
                                  key={s._id}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "5px 8px",
                                    background: "#ffffff",
                                    border: "1px solid #edf4ef",
                                    borderRadius: "6px",
                                    fontSize: "11px"
                                  }}
                                >
                                  <div>
                                    <strong style={{ color: "#1c3a2a" }}>{s.parameter?.label || s.parameter?.key || s.model_name || "Sensor"}</strong>
                                    <span className={`am-badge am-badge--${statusClass(s.status)}`} style={{ marginLeft: "6px", padding: "2px 7px", fontSize: "10px" }}>
                                      {s.status}
                                    </span>
                                    <div style={{ color: "#64748b", fontSize: "10px", marginTop: "2px" }}>
                                      Reason: {s.fault_reason || "Manually flagged"} · Since: {s.faulty_since ? `${new Date(s.faulty_since).toLocaleString()} (${timeAgo(s.faulty_since)})` : (s.updated_at ? new Date(s.updated_at).toLocaleString() : "—")}
                                    </div>
                                  </div>
                                  <button
                                    className="am-act am-act--edit"
                                    style={{ padding: "3px 8px", fontSize: "11px" }}
                                    disabled={actionLoading[s._id]}
                                    onClick={() => handleSetSensorActive(s._id)}
                                  >
                                    {actionLoading[s._id] ? "Saving…" : "Set Active"}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="am-card" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1c3a2a", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Bell size={18} color="#d97706" />
                    <span>Recent alerts</span>
                  </h2>
                  <Link to="/admin-alerts" style={{ fontSize: "12px", color: "#1c3a2a" }}>View all →</Link>
                </div>
                {recentAlerts.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#5c7c6a", fontWeight: 500 }}>No alerts found.</p>
                ) : recentAlerts.map(a => (
                  <div key={a._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #edf4ef" }}>
                    <span style={{ fontSize: "13px", color: "#2d4a3e", fontWeight: 500 }}>{a.parameter_name || (a.type === 'device_offline' ? 'Device Offline' : a.type === 'system_offline' ? 'System Offline' : 'Alert')} <span style={{ color: "#5c7c6a" }}>· {a.device?.device_id || "—"}</span></span>
                    <span className={`am-badge am-badge--${severityClass(a.severity_level)}`}>{a.severity_level}</span>
                  </div>
                ))}
              </div>

            </div>

            <div className="am-card" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1c3a2a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock size={18} color="#164e3d" />
                  <span>Recently logged in</span>
                </h2>
                <Link to="/recent-logins" style={{ fontSize: "12px", color: "#1c3a2a" }}>View all →</Link>
              </div>
              {recentLogins.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#5c7c6a", fontWeight: 500 }}>No login activity recorded yet.</p>
              ) : recentLogins.map(u => (
                <div key={u._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #edf4ef" }}>
                  <span style={{ fontSize: "13px", color: "#2d4a3e", fontWeight: 500 }}>{u.name} <span style={{ color: "#5c7c6a" }}>· {u.email}</span></span>
                  <span style={{ fontSize: "12px", color: "#5c7c6a", fontWeight: 500 }}>{timeAgo(u.lastLogin)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
