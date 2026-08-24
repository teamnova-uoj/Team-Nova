import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
import Footer from "../components/Footer";
import api from "../services/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";
import "./AdminAlerts.css";


function getStatus(min, max, value) {
  if (value === null || value === undefined) return "unknown";
  if (min === undefined && max === undefined) return "unknown"; 
  if (min !== undefined && min !== null && value < min) return "breach";
  if (max !== undefined && max !== null && value > max) return "breach";
  return "normal";
}

const PARAM_KEY_MAP = { pH: "pH", Temp: "temperature", Salinity: "salinity", "DO₂": "dissolved_o2" };

function SiteAverageChart({ avgData, siteThresholds }) {
  if (!avgData) return null;

  const data = [
    { name: "pH", value: avgData.pH },
    { name: "Temp", value: avgData.temperature },
    { name: "Salinity", value: avgData.salinity },
    { name: "DO₂", value: avgData.dissolved_o2 },
  ];

  const colorFor = (name, value) => {
    if (value === null || value === undefined) return "#c9c9c9";
    const targetKey = (PARAM_KEY_MAP[name] || "").toLowerCase();
    let t = null;
    if (Array.isArray(siteThresholds)) {
      t = siteThresholds.find(entry => {
        const k = (entry.parameter?.key || "").toLowerCase();
        const lbl = (entry.parameter?.label || entry.parameter_name || "").toLowerCase();
        if (k === targetKey) return true;
        if ((targetKey === "ph") && (k === "ph" || lbl.includes("ph"))) return true;
        if ((targetKey === "temperature") && (k === "temperature" || k === "temp" || lbl.includes("temp"))) return true;
        if ((targetKey === "salinity") && (k === "salinity" || lbl.includes("salin"))) return true;
        if ((targetKey === "dissolved_o2") && (k === "dissolved_o2" || k === "do2" || lbl.includes("o2") || lbl.includes("oxygen"))) return true;
        return false;
      });
    } else if (siteThresholds && typeof siteThresholds === "object") {
      t = siteThresholds[targetKey] || siteThresholds[name];
    }

    const status = getStatus(t?.min, t?.max, value);
    if (status === "breach") return "#e24b4a";
    if (status === "normal") return "#5a9c5a";
    return "#c9c9c9";
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => (v !== null && v !== undefined ? v : "—")} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={colorFor(d.name, d.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", gap: "14px", fontSize: "11px", color: "#5a7a6c", marginTop: "6px" }}>
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#5a9c5a", borderRadius: 2, marginRight: 4 }} />Normal</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#e24b4a", borderRadius: 2, marginRight: 4 }} />Breaching threshold</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#c9c9c9", borderRadius: 2, marginRight: 4 }} />No data</span>
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
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Accordion: track which site rows are expanded (map of siteId -> boolean)
  const [expandedSiteIds, setExpandedSiteIds] = useState({});

  const handleLogout = () => { logout(); navigate("/"); };

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

  // ── derived stats ─────────────────────────────────────
  const activeDevices = devices.filter(d => d.status === "active").length;
  const attentionDevices = devices.filter(d => d.status === "faulty" || d.status === "inactive" || d.status === "maintenance");
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
      siteAttentionMap[site._id] = { siteId: site._id, siteName: site.name, count: 0, worst: a.severity_level, alerts: [] };
    }
    const entry = siteAttentionMap[site._id];
    entry.count++;
    entry.alerts.push(a);
    if (severityRank[a.severity_level] > severityRank[entry.worst]) entry.worst = a.severity_level;
  });

  const rankedSites = Object.values(siteAttentionMap)
    .sort((a, b) => severityRank[b.worst] - severityRank[a.worst])
    .slice(0, 5); // dashboard shows top 5; full list lives on /admin-alerts

  const toggleSite = (siteId) => {
    setExpandedSiteIds(prev => ({ ...prev, [siteId]: !prev[siteId] }));
  };

  // ── average latest readings across every device at a site ──
  const round1 = (n) => Math.round(n * 10) / 10;
  const getSiteAverages = (siteId) => {
    const siteReadings = readings.filter(r => r.device?.site?._id === siteId || r.device?.site === siteId);
    if (siteReadings.length === 0) return null;

    const extractVal = (r, paramKey) => {
      if (!r) return null;
      if (r[paramKey] !== undefined && r[paramKey] !== null) return r[paramKey];
      const pKey = r.sensor?.parameter?.key || "";
      const pLabel = (r.sensor?.parameter?.label || r.parameter_name || "").toLowerCase();
      if (pKey === paramKey) return r.value;
      if (paramKey === "pH" && (pKey === "pH" || pLabel.includes("ph"))) return r.value;
      if (paramKey === "temperature" && (pKey === "temperature" || pKey === "temp" || pLabel.includes("temp"))) return r.value;
      if (paramKey === "salinity" && (pKey === "salinity" || pLabel.includes("salin"))) return r.value;
      if ((paramKey === "dissolved_o2" || paramKey === "do2") && (pKey === "dissolved_o2" || pKey === "do2" || pLabel.includes("o2") || pLabel.includes("oxygen"))) return r.value;
      return null;
    };

    const avgVal = (paramKey) => {
      const validVals = siteReadings.map(r => extractVal(r, paramKey)).filter(v => v !== null && v !== undefined);
      return validVals.length ? round1(validVals.reduce((a, b) => a + b, 0) / validVals.length) : null;
    };

    return {
      deviceCount: siteReadings.length,
      pH: avgVal("pH"),
      temperature: avgVal("temperature"),
      salinity: avgVal("salinity"),
      dissolved_o2: avgVal("dissolved_o2"),
    };
  };

  const getSiteThresholds = (siteId) => sites.find(s => s._id === siteId)?.thresholds || null;

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
            {/* Stats */}
            <div className="am-stats">
              {[
                { icon: "🚨", val: unreadAlerts,          label: "Unread alerts"     },
                { icon: "📡", val: `${activeDevices}/${devices.length}`, label: "Devices active" },
                { icon: "📍", val: sites.length,          label: "Sites monitored"   },
                { icon: "👥", val: userCount ?? "—",       label: "Total users"       },
              ].map((s, i) => (
                <div className="am-stat-card" key={i}>
                  <span className="am-stat-icon">{s.icon}</span>
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
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1c3a2a" }}>📍 Sites needing attention</h2>
                <Link to="/admin-alerts" style={{ fontSize: "12px", color: "#1c3a2a" }}>View all →</Link>
              </div>

              {rankedSites.length === 0 ? (
                <div style={{ padding: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#166534", fontSize: "13px" }}>
                  🟢 All sites operating normally — no active parameter breaches.
                </div>
              ) : (
                <div style={{ border: "1px solid #deeae3", borderRadius: "10px", overflow: "hidden" }}>
                  {rankedSites.map((s, i) => {
                    const isOpen = !!expandedSiteIds[s.siteId];
                    const avgData = getSiteAverages(s.siteId);
                    const thresholds = getSiteThresholds(s.siteId);

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
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#1c3a2a" }}>{s.siteName}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              Severity: <strong style={{ color: severityText[s.worst] }}>{s.worst.toUpperCase()}</strong> · {s.count} active breach{s.count > 1 ? "es" : ""}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span className={`am-badge am-badge--${severityClass(s.worst)}`}>{s.worst}</span>
                            <span style={{
                              fontSize: "16px", color: "#8aaa98",
                              display: "inline-block", transform: isOpen ? "rotate(90deg)" : "none",
                              transition: "transform 0.15s",
                            }}>›</span>
                          </div>
                        </div>

                        {/* Expanded detail — parameter breach chart & alert list */}
                        {isOpen && (
                          <div style={{ padding: "14px 18px", background: "#fafcfb", borderTop: "1px solid #edf4ef" }}>
                            <div style={{ fontWeight: 600, fontSize: "12px", color: "#1c3a2a", marginBottom: "8px" }}>
                              Active Breaching Parameters:
                            </div>
                            {s.alerts.map(a => (
                              <div key={a._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: severityBg[a.severity_level] || "#fff", borderRadius: "6px", marginBottom: "6px", border: `1px solid ${severityBorder[a.severity_level] || "#ccc"}` }}>
                                <div>
                                  <strong style={{ fontSize: "13px", color: severityText[a.severity_level] }}>{a.parameter_name}: {a.measured_value} {a.unit}</strong>
                                  <div style={{ fontSize: "11px", color: "#475569" }}>Device: {a.device?.device_id || "—"} · {a.message}</div>
                                </div>
                                <span className={`am-badge am-badge--${severityClass(a.severity_level)}`}>{a.severity_level}</span>
                              </div>
                            ))}

                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#1c3a2a", margin: "14px 0 6px" }}>
                              Parameter Trend Chart ({s.siteName}):
                            </div>
                            <SiteAverageChart avgData={avgData} siteThresholds={thresholds} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sections */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>

              <div className="am-card" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1c3a2a" }}>📡 Devices needing attention</h2>
                  <Link to="/manage-devices" style={{ fontSize: "12px", color: "#1c3a2a" }}>View all →</Link>
                </div>
                {attentionDevices.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#3b6d11" }}>All devices online.</p>
                ) : attentionDevices.slice(0, 5).map(d => (
                  <div key={d._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #edf4ef" }}>
                    <span style={{ fontSize: "13px", color: "#2d4a3e" }}>{d.device_id} <span style={{ color: "#8aaa98" }}>· {d.site?.name || "—"}</span></span>
                    <span className={`am-badge am-badge--${statusClass(d.status)}`}>{d.status}</span>
                  </div>
                ))}
              </div>

              <div className="am-card" style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1c3a2a" }}>🚨 Recent alerts</h2>
                  <Link to="/admin-alerts" style={{ fontSize: "12px", color: "#1c3a2a" }}>View all →</Link>
                </div>
                {recentAlerts.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "#8aaa98" }}>No alerts found.</p>
                ) : recentAlerts.map(a => (
                  <div key={a._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #edf4ef" }}>
                    <span style={{ fontSize: "13px", color: "#2d4a3e" }}>{a.parameter_name} <span style={{ color: "#8aaa98" }}>· {a.device?.device_id || "—"}</span></span>
                    <span className={`am-badge am-badge--${severityClass(a.severity_level)}`}>{a.severity_level}</span>
                  </div>
                ))}
              </div>

            </div>

            <div className="am-card" style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1c3a2a" }}>🕒 Recently logged in</h2>
                <Link to="/recent-logins" style={{ fontSize: "12px", color: "#1c3a2a" }}>View all →</Link>
              </div>
              {recentLogins.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#8aaa98" }}>No login activity recorded yet.</p>
              ) : recentLogins.map(u => (
                <div key={u._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #edf4ef" }}>
                  <span style={{ fontSize: "13px", color: "#2d4a3e" }}>{u.name} <span style={{ color: "#8aaa98" }}>· {u.email}</span></span>
                  <span style={{ fontSize: "12px", color: "#8aaa98" }}>{timeAgo(u.lastLogin)}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <Footer />
      </main>
    </div>
  );
}

export default AdminDashboard;
