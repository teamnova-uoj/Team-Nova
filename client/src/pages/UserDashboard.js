import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import api from "../services/api";
import socket from "../services/socket";
import {
  MapPin,
  Radio,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  Wrench,
  Clock,
  ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";
import { buildSeriesWithGaps } from "../utils/chartGaps";
import { getDayTicks, makeDayAwareTick, formatTooltipTime } from "../utils/timeAxis";
import "./UserDashboard.css";

// Sensor metadata
const PARAM_META = {
  pH: { label: "pH", unit: "", max: 14 },
  temperature: { label: "Temperature", unit: "°C", max: 40 },
  salinity: { label: "Salinity", unit: " ppt", max: 60 },
  dissolved_o2: { label: "Dissolved O₂", unit: " mg/L", max: 15 },
};

const PARAM_COLORS = {
  pH: "#2f5d50",
  temperature: "#d97706",
  salinity: "#2563eb",
  dissolved_o2: "#059669",
};

const PARAM_LABELS = {
  pH: "pH",
  temperature: "Temperature (°C)",
  salinity: "Salinity (ppt)",
  dissolved_o2: "Dissolved O₂ (mg/L)",
};

const RANGE_OPTIONS = [
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

function findThreshold(siteThresholds, paramKey) {
  if (!siteThresholds || !Array.isArray(siteThresholds)) return null;
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
  if (!entry || (entry.min === undefined && entry.max === undefined)) return null;
  return entry;
}

const getStatusFor = (val, paramKey, siteThresholds) => {
  if (val === null || val === undefined) return "unknown";
  const entry = findThreshold(siteThresholds, paramKey);
  if (!entry) return "unknown";
  if (entry.min !== null && entry.min !== undefined && val < entry.min) return "breach";
  if (entry.max !== null && entry.max !== undefined && val > entry.max) return "breach";
  return "normal";
};

// Relative time helper
function timeAgo(isoString) {
  if (!isoString) return "never";
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Geometry helpers for speedometer gauge
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arcPath(cx, cy, r, fracStart, fracEnd) {
  const angleStart = 180 - fracStart * 180;
  const angleEnd = 180 - fracEnd * 180;
  const p1 = polarToCartesian(cx, cy, r, angleStart);
  const p2 = polarToCartesian(cx, cy, r, angleEnd);
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`;
}

// Single Param Gauge
function ParamGauge({ label, value, unit, max, threshold, isLive }) {
  const cx = 60, cy = 60, r = 48;
  const hasValue = value !== null && value !== undefined;
  const hasThreshold = threshold && (threshold.min !== undefined || threshold.max !== undefined);

  let status = "In safe range";
  let statusColor = "#639922";
  let needleAngle = 90;

  if (!hasValue) {
    status = "No data";
    statusColor = "#6b7280";
  } else if (!hasThreshold) {
    status = "No threshold set";
    statusColor = "#6b7280";
    const clamped = Math.max(0, Math.min(value, max));
    needleAngle = 180 - (clamped / max) * 180;
  } else {
    const clamped = Math.max(0, Math.min(value, max));
    needleAngle = 180 - (clamped / max) * 180;
    if (threshold.min !== undefined && threshold.min !== null && value < threshold.min) {
      status = "Below safe range";
      statusColor = "#e24b4a";
    } else if (threshold.max !== undefined && threshold.max !== null && value > threshold.max) {
      status = "Above safe range";
      statusColor = "#e24b4a";
    } else {
      status = "In safe range";
      statusColor = "#639922";
    }
  }

  const safeMinFrac = hasThreshold && threshold.min !== undefined && threshold.min !== null
    ? Math.max(0, Math.min(threshold.min / max, 1))
    : 0;
  const safeMaxFrac = hasThreshold && threshold.max !== undefined && threshold.max !== null
    ? Math.max(0, Math.min(threshold.max / max, 1))
    : 1;

  const needleTip = polarToCartesian(cx, cy, 38, needleAngle);

  return (
    <div className="gauge-card" style={{ background: "#ffffff", border: "1px solid #deeae3", padding: "18px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "6px" }}>
        <p className="gauge-label" style={{ margin: 0, color: "#1c3a2a" }}>{label}</p>
        {isLive && (
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

      <svg viewBox="0 0 120 68" className="gauge-svg">
        {safeMinFrac > 0 && (
          <path d={arcPath(cx, cy, r, 0, safeMinFrac)} className="gauge-arc gauge-arc-danger" style={{ stroke: "#e24b4a" }} />
        )}
        <path d={arcPath(cx, cy, r, safeMinFrac, safeMaxFrac)} className="gauge-arc gauge-arc-safe" style={{ stroke: "#639922" }} />
        {safeMaxFrac < 1 && (
          <path d={arcPath(cx, cy, r, safeMaxFrac, 1)} className="gauge-arc gauge-arc-danger" style={{ stroke: "#e24b4a" }} />
        )}
        {hasValue && (
          <>
            <line
              x1={cx} y1={cy}
              x2={needleTip.x} y2={needleTip.y}
              className="gauge-needle" style={{ stroke: "#1f4d3a", strokeWidth: 2.5 }}
            />
            <circle cx={cx} cy={cy} r="4" style={{ fill: "#1f4d3a" }} />
          </>
        )}
      </svg>

      <p className="gauge-value" style={{ margin: "8px 0 2px", fontWeight: 700, fontSize: "18px", color: hasValue ? "#1c3a2a" : "#6b7280" }}>
        {hasValue ? `${value.toFixed(1)}${unit}` : "No data"}
      </p>
      <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: statusColor }}>
        {status}
      </p>
    </div>
  );
}

// Site History Chart Component
function SiteHistoryChart({ siteId, devices, sites }) {
  const site = sites?.find(s => s._id === siteId);
  const [selectedParam, setSelectedParam] = useState("pH");
  const [rangeHours, setRangeHours] = useState(24);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

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
        // Silently handle error
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [siteId, devices, rangeHours]);

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
    const fill = status === "breach" ? "#e24b4a" : status === "normal" ? "#5a9c5a" : "#c9c9c9";
    return <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3.5} stroke="none" fill={fill} />;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && !payload[0].payload?.isGap) {
      const val = payload[0].value;
      const status = getStatusFor(val, selectedParam, site?.thresholds);
      const isBreach = status === "breach";

      return (
        <div style={{
          backgroundColor: isBreach ? "#fdecea" : "#fff",
          border: `1px solid ${isBreach ? "#e24b4a" : "#deeae3"}`,
          padding: "8px 12px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontSize: "12px",
          color: isBreach ? "#a32d2d" : "#1c3a2a"
        }}>
          <p style={{ margin: "0 0 4px 0", fontWeight: 700 }}>{formatTooltipTime(payload[0].payload.timeKey)}</p>
          <p style={{ margin: 0 }}>
            {PARAM_LABELS[selectedParam]}: <strong>{val}</strong>
            {isBreach && " (Breaching threshold)"}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {Object.keys(PARAM_COLORS).map(key => (
            <button
              key={key}
              onClick={() => setSelectedParam(key)}
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                border: `1px solid ${selectedParam === key ? PARAM_COLORS[key] : "#deeae3"}`,
                background: selectedParam === key ? PARAM_COLORS[key] : "#fff",
                color: selectedParam === key ? "#fff" : "#1c3a2a",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {key}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "4px" }}>
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.hours}
              onClick={() => setRangeHours(opt.hours)}
              style={{
                padding: "3px 8px",
                borderRadius: "4px",
                border: "none",
                background: rangeHours === opt.hours ? "#1c3a2a" : "#eef3f0",
                color: rangeHours === opt.hours ? "#fff" : "#3d6052",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: "200px", width: "100%" }}>
        {loading ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#5c7c6a", fontSize: "12px" }}>
            Loading telemetry chart...
          </div>
        ) : historyData.length === 0 ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#5c7c6a", fontSize: "12px" }}>
            No telemetry recorded in this time window.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e0d9" />
              <XAxis
                dataKey="timeKey"
                type="number"
                scale="time"
                domain={xDomain}
                height={36}
                ticks={xTicks}
                interval={0}
                tick={makeDayAwareTick(xTicks, { fontSize: 10, fill: "#898781", timeRange: rangeHours })}
              />
              <YAxis tick={{ fontSize: 10, fill: "#898781" }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                name={PARAM_LABELS[selectedParam]}
                dataKey={selectedParam}
                stroke={PARAM_COLORS[selectedParam]}
                strokeWidth={2}
                dot={(p) => renderCustomDot(p, selectedParam)}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function UserDashboard() {
  const [sites, setSites] = useState([]);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [readings, setReadings] = useState([]);
  const [liveSensors, setLiveSensors] = useState({});
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Accordion state
  const [expandedSiteIds, setExpandedSiteIds] = useState({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [devicesRes, alertsRes, sitesRes, readingsRes] = await Promise.all([
          api.get("/devices"),
          api.get("/alerts"),
          api.get("/sites"),
          api.get("/readings/latest").catch(() => ({ data: { data: [] } }))
        ]);

        if (cancelled) return;

        const siteList = sitesRes.data.data || [];
        setDevices(devicesRes.data.data || []);
        setAlerts(alertsRes.data.data || []);
        setSites(siteList);
        setReadings(readingsRes.data.data || []);

        if (siteList.length > 0) {
          setSelectedSiteId((prev) => prev || siteList[0]._id);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Could not load dashboard telemetry from server.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // Socket listener for incoming readings and alerts
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

    const handleNewAlert = (newAlert) => {
      if (!newAlert) return;
      setAlerts((prev) => [newAlert, ...prev]);
    };

    const handleDeviceChange = () => {
      api.get("/devices").then(res => setDevices(res.data.data || [])).catch(() => {});
    };

    socket.on("new_reading", handleNewReading);
    socket.on("new_alert", handleNewAlert);
    socket.on("device_status_changed", handleDeviceChange);

    return () => {
      socket.off("new_reading", handleNewReading);
      socket.off("new_alert", handleNewAlert);
      socket.off("device_status_changed", handleDeviceChange);
    };
  }, []);

  // Derived stats
  const activeDevices = devices.filter(d => d.status === "active").length;
  const activeAlerts = alerts.filter(a => a.status !== "resolved");
  const attentionDevices = devices.filter(
    d => d.status === "faulty" || d.status === "inactive" || d.status === "maintenance" ||
         (d.sensors && d.sensors.some(s => s.status === "faulty" || s.status === "inactive"))
  );
  const recentAlerts = [...alerts]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const severityRank = { critical: 3, high: 2, medium: 1, low: 0 };
  const severityBorder = { critical: "#e24b4a", high: "#d85a30", medium: "#efc97a", low: "#97c459" };
  const severityText = { critical: "#a32d2d", high: "#993c1d", medium: "#854f0b", low: "#3b6d11" };
  const severityClass = (s) => ({ low: "rn", medium: "rs", high: "re", critical: "rw" }[s] || "rn");
  const statusClass = (s) => ({ active: "rn", inactive: "rs", maintenance: "re", faulty: "rw" }[s] || "rn");

  // Rank sites needing attention
  const siteAttentionMap = {};
  activeAlerts.forEach(a => {
    const site = a.device?.site;
    if (!site?._id) return;
    if (!siteAttentionMap[site._id]) {
      siteAttentionMap[site._id] = { siteId: site._id, siteName: site.name, count: 0, worst: "low", alertsMap: {} };
    }
    const entry = siteAttentionMap[site._id];
    const alertKey = a.parameter_name || a._id;
    if (!entry.alertsMap[alertKey]) {
      entry.alertsMap[alertKey] = a;
    }
  });

  Object.values(siteAttentionMap).forEach(entry => {
    entry.alerts = Object.values(entry.alertsMap);
    entry.count = entry.alerts.length;
    entry.worst = entry.alerts.reduce((w, a) => severityRank[a.severity_level] > severityRank[w] ? a.severity_level : w, "low");
  });

  const rankedSites = Object.values(siteAttentionMap)
    .sort((a, b) => severityRank[b.worst] - severityRank[a.worst])
    .slice(0, 5);

  const toggleSite = (siteId) => {
    setExpandedSiteIds(prev => ({ ...prev, [siteId]: !prev[siteId] }));
  };

  // Selected site gauges
  const selectedSite = sites.find(s => s._id === selectedSiteId);
  const siteReadings = readings.filter(r => (r.device?.site?._id || r.device?.site) === selectedSiteId);

  return (
    <UserLayout activePage="dashboard">
      <div className="ul-header">
        <div>
          <p className="ul-breadcrumb">Monitoring &rsaquo; Overview</p>
          <h1 className="ul-title">Dashboard</h1>
          <p className="ul-subtitle">Live water quality parameters, telemetry status, and system alerts.</p>
        </div>
      </div>

      {error && <div className="ul-error">{error}</div>}

      {/* Summary Cards */}
      <div className="ul-stats">
        <div className="ul-stat-card">
          <span className="ul-stat-icon" style={{ color: "#d97706" }}><Bell size={24} /></span>
          <div>
            <div className="ul-stat-val">{loading ? "…" : activeAlerts.length}</div>
            <div className="ul-stat-lbl">Active Alerts</div>
          </div>
        </div>

        <div className="ul-stat-card">
          <span className="ul-stat-icon" style={{ color: "#1d7068" }}><Radio size={24} /></span>
          <div>
            <div className="ul-stat-val">{loading ? "…" : `${activeDevices}/${devices.length}`}</div>
            <div className="ul-stat-lbl">Devices Active</div>
          </div>
        </div>

        <div className="ul-stat-card">
          <span className="ul-stat-icon" style={{ color: "#164e3d" }}><MapPin size={24} /></span>
          <div>
            <div className="ul-stat-val">{loading ? "…" : sites.length}</div>
            <div className="ul-stat-lbl">Sites Monitored</div>
          </div>
        </div>
      </div>

      {/* Sites Needing Attention Accordion */}
      <div className="ul-card" style={{ padding: "18px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1c3a2a", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            <MapPin size={18} color="#164e3d" />
            <span>Sites Needing Attention</span>
          </h2>
          <Link to="/alerts" style={{ fontSize: "12px", color: "#1d7068", fontWeight: 600, textDecoration: "none" }}>
            View all →
          </Link>
        </div>

        {rankedSites.length === 0 ? (
          <div style={{ padding: "14px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", color: "#166534", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={16} color="#166534" />
            <span>All sites operating normally — no active parameter breaches.</span>
          </div>
        ) : (
          <div style={{ border: "1px solid #deeae3", borderRadius: "10px", overflow: "hidden" }}>
            {rankedSites.map((s, i) => {
              const isOpen = !!expandedSiteIds[s.siteId];
              return (
                <div key={s.siteId} style={{ borderTop: i > 0 ? "1px solid #deeae3" : "none" }}>
                  <div
                    onClick={() => toggleSite(s.siteId)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      cursor: "pointer",
                      background: "#fff",
                      borderLeft: `4px solid ${severityBorder[s.worst] || "#e24b4a"}`
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#1c3a2a" }}>
                        {s.siteName}
                      </div>
                      <div style={{ fontSize: "11px", color: "#475569", fontWeight: 500, marginTop: "2px" }}>
                        Severity: <strong style={{ color: severityText[s.worst] }}>{s.worst.toUpperCase()}</strong> · {s.count} active breach{s.count > 1 ? "es" : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className={`ul-badge ul-badge--${severityClass(s.worst)}`}>{s.worst}</span>
                      <span style={{ color: "#5c7c6a", fontSize: "12px" }}>{isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ padding: "14px 16px", background: "#f9fbf9", borderTop: "1px solid #edf4ef" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#3d6052", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Active Parameter Breaches
                        </span>
                        <Link to={`/sites/${s.siteId}`} style={{ fontSize: "12px", color: "#1d7068", fontWeight: 600, textDecoration: "none" }}>
                          View site details →
                        </Link>
                      </div>

                      {s.alerts.map(a => (
                        <div
                          key={a._id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 10px",
                            background: "#fff",
                            border: "1px solid #deeae3",
                            borderRadius: "6px",
                            marginBottom: "6px"
                          }}
                        >
                          <div>
                            <span style={{ fontSize: "13px", fontWeight: 600, color: "#1c3a2a" }}>
                              {a.parameter_name || "Telemetry Breach"}
                            </span>
                            <span style={{ fontSize: "12px", color: "#5c7c6a", marginLeft: "6px" }}>
                              · {a.message}
                            </span>
                          </div>
                          <span className={`ul-badge ul-badge--${severityClass(a.severity_level)}`}>{a.severity_level}</span>
                        </div>
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

      {/* Two Column Section: Devices Needing Maintenance (read-only) & Recent Alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "20px" }}>
        {/* Devices Needing Maintenance */}
        <div className="ul-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1c3a2a", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <Radio size={18} color="#1d7068" />
              <span>Devices Needing Maintenance</span>
            </h2>
            <Link to="/devices" style={{ fontSize: "12px", color: "#1d7068", fontWeight: 600, textDecoration: "none" }}>
              View all →
            </Link>
          </div>

          {attentionDevices.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#3b6d11", margin: 0 }}>All devices and sensor probes online and healthy.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
              {attentionDevices.map(d => (
                <div
                  key={d._id}
                  style={{
                    padding: "10px 12px",
                    background: "#fbfcfb",
                    border: "1px solid #deeae3",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "13px", color: "#1c3a2a", fontWeight: 700 }}>{d.device_id}</span>
                      <span style={{ fontSize: "12px", color: "#5c7c6a", marginLeft: "6px" }}>· {d.site?.name || "Unassigned"}</span>
                    </div>
                    <span className={`ul-badge ul-badge--${statusClass(d.status)}`}>{d.status}</span>
                  </div>

                  <div style={{ fontSize: "11px", color: "#475569", background: "#f1f5f3", padding: "5px 8px", borderRadius: "5px" }}>
                    <div><strong>Reason:</strong> {d.fault_reason || (d.status === "maintenance" ? "Scheduled maintenance" : "Telemetry flagged")}</div>
                    <div style={{ marginTop: "2px" }}><strong>Since:</strong> {d.faulty_since ? `${new Date(d.faulty_since).toLocaleString()} (${timeAgo(d.faulty_since)})` : (d.updated_at ? new Date(d.updated_at).toLocaleString() : "—")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="ul-card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1c3a2a", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <Bell size={18} color="#d97706" />
              <span>Recent Alerts</span>
            </h2>
            <Link to="/alerts" style={{ fontSize: "12px", color: "#1d7068", fontWeight: 600, textDecoration: "none" }}>
              View all →
            </Link>
          </div>

          {recentAlerts.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#5c7c6a", fontWeight: 500, margin: 0 }}>No recent alerts found.</p>
          ) : (
            recentAlerts.map(a => (
              <div
                key={a._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid #edf4ef"
                }}
              >
                <div>
                  <span style={{ fontSize: "13px", color: "#2d4a3e", fontWeight: 600 }}>
                    {a.parameter_name || (a.type === "device_offline" ? "Device Offline" : a.type === "system_offline" ? "System Offline" : "Alert")}
                  </span>
                  <span style={{ color: "#5c7c6a", fontSize: "12px", marginLeft: "6px" }}>
                    · {a.device?.site?.name || a.device?.device_id || "Site"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#898781" }}>{timeAgo(a.created_at)}</span>
                  <span className={`ul-badge ul-badge--${severityClass(a.severity_level)}`}>{a.severity_level}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sensor Data Overview (Speedometer Gauges) with Site Selector */}
      <div className="ul-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1c3a2a", margin: 0 }}>
              Sensor Data Overview
            </h2>
            <p style={{ fontSize: "12px", color: "#5c7c6a", margin: "2px 0 0" }}>
              Real-time environmental telemetry evaluated against site-specific safe threshold ranges.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", width: "100%", maxWidth: "420px" }}>
            <label className="ul-lbl" style={{ margin: 0, whiteSpace: "nowrap" }}>Monitoring Site:</label>
            <select
              className="ul-select"
              style={{ flex: 1, minWidth: "180px" }}
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              disabled={loading || sites.length === 0}
            >
              {sites.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.location})</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="ul-loading">Loading telemetry sensor readings…</div>
        ) : siteReadings.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#6b7280", border: "1px dashed #c4d8ce", borderRadius: "10px" }}>
            No sensor readings received yet for {selectedSite?.name || "this site"}.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            {Object.keys(PARAM_META).map(param => {
              const meta = PARAM_META[param];

              const extractValue = (r, pKey) => {
                if (!r) return null;
                if (r[pKey] !== undefined && r[pKey] !== null) return r[pKey];
                const k = r.sensor?.parameter?.key || "";
                const lbl = (r.sensor?.parameter?.label || r.parameter_name || "").toLowerCase();
                if (k === pKey || (pKey === "pH" && (k === "pH" || lbl.includes("ph"))) ||
                    (pKey === "temperature" && (k === "temperature" || k === "temp" || lbl.includes("temp"))) ||
                    (pKey === "salinity" && (k === "salinity" || lbl.includes("salin"))) ||
                    (pKey === "dissolved_o2" && (k === "dissolved_o2" || k === "do2" || lbl.includes("o2") || lbl.includes("oxygen")))) {
                  return r.value;
                }
                return null;
              };

              const validValues = siteReadings
                .map(r => extractValue(r, param))
                .filter(v => v !== null && v !== undefined);

              const avg = validValues.length > 0
                ? validValues.reduce((a, b) => a + b, 0) / validValues.length
                : null;

              const isParamLive = siteReadings.some(r => {
                const sId = r.sensor?._id?.toString() || r.sensor?.toString();
                const pKey = r.sensor?.parameter?.key || "";
                const pLabel = (r.sensor?.parameter?.label || r.parameter_name || "").toLowerCase();
                const matchesParam = pKey === param ||
                  (param === "pH" && (pKey === "pH" || pLabel.includes("ph"))) ||
                  (param === "temperature" && (pKey === "temperature" || pKey === "temp" || pLabel.includes("temp"))) ||
                  (param === "salinity" && (pKey === "salinity" || pLabel.includes("salin"))) ||
                  (param === "dissolved_o2" && (pKey === "dissolved_o2" || pKey === "do2" || pLabel.includes("o2") || pLabel.includes("oxygen")));
                return matchesParam && liveSensors[sId];
              });

              // Find site threshold for this parameter from site's thresholds array
              const siteThreshold = findThreshold(selectedSite?.thresholds, param);

              return (
                <ParamGauge
                  key={param}
                  label={meta.label}
                  value={avg}
                  unit={meta.unit}
                  max={meta.max}
                  threshold={siteThreshold}
                  isLive={isParamLive}
                />
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
}

export default UserDashboard;
