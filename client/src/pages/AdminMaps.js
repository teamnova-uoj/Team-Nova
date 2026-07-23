import { Link } from "react-router-dom";
import "./AdminMaps.css";
import mangrove from "../assests/mangrove.png";

function AdminMaps() {
  return (
    <div
      className="admin-maps-page"
      style={{ backgroundImage: `url(${mangrove})` }}
    >
      <div className="admin-maps-overlay">

        {/* Navbar */}
        <div className="admin-navbar">

          <div className="logo">
            🌿 MangroveGuard Admin
          </div>

          <div className="nav-links">
            <Link to="/admin-dashboard">Dashboard</Link>
            <Link to="/manage-users">Users</Link>
            <Link to="/manage-devices">Devices</Link>
            <Link to="/admin-alerts">Alerts</Link>
            <Link to="/admin-maps">Sites</Link>
            <Link to="/admin-profile">Profile</Link>
          </div>

        </div>

        <h1 className="title">Mangrove Monitoring Sites</h1>

        <div className="sites-grid">

          <div className="site-card">
            <h3>Site A</h3>
            <p>Negombo Lagoon</p>
            <p>Status: Active</p>
          </div>

          <div className="site-card">
            <h3>Site B</h3>
            <p>Muthurajawela</p>
            <p>Status: Active</p>
          </div>

          <div className="site-card">
            <h3>Site C</h3>
            <p>Puttalam</p>
            <p>Status: Maintenance</p>
          </div>

          <div className="site-card">
            <h3>Site D</h3>
            <p>Kalpitiya</p>
            <p>Status: Active</p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default AdminMaps;