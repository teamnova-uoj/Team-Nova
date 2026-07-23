import "./home.css";
import { Link } from "react-router-dom";
import mangrove from "../assests/mangrove.png";

function About() {
  return (
    <div className="about-page">

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

      {/* Background Section */}
      <div
        className="hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >
        {/* About Content Box */}
        <div className="login-box" style={{ width: "500px" }}>
          <h2>About Mangrove Guard</h2>

          <p>
            Mangrove Guard is an IoT-based environmental monitoring system
            developed to protect and conserve mangrove ecosystems. The
            platform gathers real-time data from sensors deployed in
            mangrove areas.
          </p>

          <p>
            Key parameters monitored include:
          </p>

          <ul style={{ textAlign: "left" }}>
            <li>🌊 Water Level Monitoring</li>
            <li>🌡 Temperature Monitoring</li>
            <li>🧂 Salinity Monitoring</li>
            <li>🔋 Device Battery Status</li>
            <li>⚠ Real-Time Environmental Alerts</li>
          </ul>

          <p>
            The collected data is displayed through an interactive dashboard,
            allowing administrators and researchers to track environmental
            conditions, identify risks early, and support mangrove
            conservation efforts.
          </p>

          <p>
            Our mission is to combine IoT technology and environmental
            protection to ensure healthier and more sustainable mangrove
            ecosystems for future generations.
          </p>
        </div>
      </div>

    </div>
  );
}

export default About;