import "./Sites.css";
import { Link } from "react-router-dom";
import mangrove from "../assests/mangrove.png";

function Sites() {
  return (
    <div className="sites-page">

      {/* Navbar */}
      <div className="dashboard-navbar">

        <div className="logo">
          🌿 MangroveGuard
        </div>

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
        className="sites-hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >

        <div className="sites-overlay">

          <h2 className="sites-title">
            Mangrove Monitoring Sites
          </h2>

          <div className="sites-container">

            {/* Clickable Negombo Card */}

            <Link to="/negombo" className="site-link">

              <div className="site-card">
                <h3>Site 1</h3>
                <p><strong>Location:</strong> Negombo Lagoon</p>
                <p><strong>Devices Installed:</strong> 3</p>
                <p><strong>Status:</strong> Active</p>
              </div>

            </Link>

            {/* Site 2 */}

            <div className="site-card">
              <h3>Site 2</h3>
              <p><strong>Location:</strong> Puttalam Mangrove Forest</p>
              <p><strong>Devices Installed:</strong> 2</p>
              <p><strong>Status:</strong> Active</p>
            </div>

            {/* Site 3 */}

            <div className="site-card">
              <h3>Site 3</h3>
              <p><strong>Location:</strong> Kalpitiya Coast</p>
              <p><strong>Devices Installed:</strong> 4</p>
              <p><strong>Status:</strong> Maintenance</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Sites;