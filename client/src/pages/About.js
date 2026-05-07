import "./home.css"; // reuse same styles
import Navbar from "../components/navbar";
import mangrove from "../assests/mangrove.png";

function About() {
  return (
    <div className="home">

      {/* Navbar */}
      <Navbar />

      {/* Background Section */}
      <div
        className="hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >

        {/* About Box (same style as login-box) */}
        <div className="login-box" style={{ width: "500px" }}>

          <h2>About Mangrove Guard</h2>

          <p>
            Mangrove Guard is an IoT-based system designed to monitor and
            protect mangrove ecosystems. The system collects environmental
            data such as water level, salinity and temperature.
          </p>

          <p>
            This platform helps administrators monitor mangrove forests and
            detect environmental changes early.
          </p>

        </div>

      </div>
    </div>
  );
}

export default About;