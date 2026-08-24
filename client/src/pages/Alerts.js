import { useEffect, useState } from "react";
import "./Alerts.css";
import mangrove from "../assests/mangrove.png";
import api from "../services/api";
import UserNavbar from "../components/UserNavbar";
import Footer from "../components/Footer";

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

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-GB"); // dd/mm/yyyy, matches the old placeholder format
}

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const res = await api.get("/alerts", { params: { limit: 100 } });
        setAlerts(res.data.data || []);
      } catch (err) {
        setError("Couldn't load alerts from the server.");
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, []);

  return (
    <div>

      {/* Navbar */}
      <UserNavbar />

      {/* Background */}
      <div
        className="alerts-hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >

        <h2 className="alerts-title">
          Alerts & Notifications
        </h2>

        {error && <div className="alerts-error">{error}</div>}

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
                  <td colSpan="6" className="table-empty-msg">Loading alerts…</td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-empty-msg">No alerts to show</td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert._id} className={`severity-row-${alert.severity_level}`}>
                    <td>{alert.device?.site?.name || "—"}</td>
                    <td className="alert-message-cell">{alert.message}</td>
                    <td>
                      <span className={`severity-badge severity-${alert.severity_level}`}>
                        {SEVERITY_LABEL[alert.severity_level] || alert.severity_level}
                      </span>
                    </td>
                    <td>{formatDate(alert.created_at)}</td>
                    <td>{formatTime(alert.created_at)}</td>
                    <td>
                      <span className={alert.status}>
                        {STATUS_LABEL[alert.status] || alert.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

      <Footer />
    </div>
  );
}

export default Alerts;