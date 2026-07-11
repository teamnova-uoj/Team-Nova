import "./VisitorSites.css";
import Navbar from "../components/navbar";
import mangrove from "../assests/mangrove.png";

function VisitorSites() {
  return (
    <div className="visitor-sites-page">

      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section
        className="visitor-sites-hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >

        <div className="visitor-sites-overlay">

          <div className="visitor-sites-content">

            <h2 className="visitor-sites-title">
              Mangrove Monitoring Sites
            </h2>

            <div className="visitor-sites-container">

              <div className="visitor-site-card">

                <h3>Site 1</h3>

                <p><strong>Location:</strong> Negombo Lagoon</p>

                <p><strong>Devices Installed:</strong> 3</p>

                <p><strong>Status:</strong> Active</p>

              </div>

              <div className="visitor-site-card">

                <h3>Site 2</h3>

                <p><strong>Location:</strong> Puttalam Mangrove Forest</p>

                <p><strong>Devices Installed:</strong> 2</p>

                <p><strong>Status:</strong> Active</p>

              </div>

              <div className="visitor-site-card">

                <h3>Site 3</h3>

                <p><strong>Location:</strong> Kalpitiya Coast</p>

                <p><strong>Devices Installed:</strong> 4</p>

                <p><strong>Status:</strong> Maintenance</p>

              </div>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default VisitorSites;