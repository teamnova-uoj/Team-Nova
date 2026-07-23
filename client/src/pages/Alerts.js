import "./Alerts.css";
import { Link } from "react-router-dom";
import mangrove from "../assests/mangrove.png";

function Alerts() {
  return (
    <div>

      {/* Navbar */}
      <div className="dashboard-navbar">
        <div className="logo">🌿 MangroveGuard</div>

        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/sites">Sites</Link>
          <Link to="/alerts">Alerts</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/profile">Profile</Link>
        </div>
      </div>

      {/* Background */}
      <div
        className="alerts-hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >

        <h2 className="alerts-title">
          Alerts & Notifications
        </h2>

        {/* Alerts Table */}

        <div className="alerts-table-container">

          <table className="alerts-table">

            <thead>

              <tr>
                <th>Site Name</th>
                <th>Problem</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              <tr>
                <td>Site A</td>
                <td>High Salinity</td>
                <td>12/03/2026</td>
                <td>10:30 AM</td>
                <td><span className="pending">Pending</span></td>
              </tr>

              <tr>
                <td>Site B</td>
                <td>Water Level Rising</td>
                <td>12/03/2026</td>
                <td>09:45 AM</td>
                <td><span className="resolved">Resolved</span></td>
              </tr>

              <tr>
                <td>Site C</td>
                <td>Low Battery</td>
                <td>11/03/2026</td>
                <td>08:10 PM</td>
                <td><span className="pending">Pending</span></td>
              </tr>

              <tr>
                <td>Site D</td>
                <td>Sensor Offline</td>
                <td>11/03/2026</td>
                <td>03:15 PM</td>
                <td><span className="resolved">Resolved</span></td>
              </tr>

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Alerts;