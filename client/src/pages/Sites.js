import "./home.css"; // reuse home styles
import "./Sites.css";
import Navbar from "../components/navbar";
import mangrove from "../assests/mangrove.png";

function Sites() {
  return (
    <div className="home">

      {/* Navbar */}
      <Navbar />

      {/* Background */}
      <div
        className="hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >

        {/* Sites Container */}
        <div className="sites-container">

          <div className="site-card">
            <h3>Site 1</h3>
            <p>Location: Negombo Lagoon</p>
            <p>Devices Installed: 3</p>
          </div>

          <div className="site-card">
            <h3>Site 2</h3>
            <p>Location: Puttalam Mangrove Forest</p>
            <p>Devices Installed: 2</p>
          </div>

          <div className="site-card">
            <h3>Site 3</h3>
            <p>Location: Kalpitiya Coast</p>
            <p>Devices Installed: 4</p>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Sites;