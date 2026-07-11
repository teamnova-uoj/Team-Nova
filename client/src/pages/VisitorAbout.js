import "./home.css";
import Navbar from "../components/navbar";
import mangrove from "../assests/mangrove.png";

function VisitorAbout() {
  return (
    <div className="about-page">

      {/* Home Page Navbar */}
      <Navbar />

      {/* Background */}
      <div
        className="hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >

        {/* About Content */}
        <div
          className="login-box"
          style={{
            width: "650px",
            margin: "0 auto",
            background: "rgba(255,255,255,0.88)"
          }}
        >
          <h2>About Mangrove Guard</h2>

          <p>
            Mangrove Guard is an IoT-based environmental monitoring system
            developed to protect and conserve mangrove ecosystems. The platform
            collects real-time environmental data from sensor devices installed
            in mangrove areas.
          </p>

          <p><strong>Key parameters monitored include:</strong></p>

          <ul style={{ textAlign: "left", lineHeight: "1.8" }}>
            <li>🌊 Water Level Monitoring</li>
            <li>🌡 Temperature Monitoring</li>
            <li>🧂 Salinity Monitoring</li>
            <li>🔋 Device Battery Status</li>
            <li>⚠ Real-Time Environmental Alerts</li>
          </ul>

          <p>
            The collected data is displayed through an interactive dashboard,
            allowing administrators, researchers, and conservation teams to
            monitor environmental conditions, identify risks early, and make
            informed decisions.
          </p>

          <p>
            Our mission is to combine IoT technology with environmental
            conservation to ensure healthier and more sustainable mangrove
            ecosystems for future generations.
          </p>

        </div>

      </div>

    </div>
  );
}

export default VisitorAbout;