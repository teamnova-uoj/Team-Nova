import { Link } from "react-router-dom";
import "./home.css";
import Navbar from "../components/navbar";
import mangrove from "../assests/mangrove.png";

function Home() {
  return (
    <div className="home">

      {/* Navigation Bar */}
      <Navbar />

      {/* Hero Section */}
      <section
        className="hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >
        <div className="hero-overlay">

          <div className="hero-content">
            <h1>Mangrove Guard</h1>

            <h3>
              Monitoring Mangrove Ecosystem & Water Quality
            </h3>

            <p className="hero-description">
              Our mission is to ensure the health and preservation of vital
              mangrove forests through advanced monitoring and data analysis.
            </p>

            <div className="hero-buttons">
              <Link to="/visitor-about">
                <button className="learn-btn">
                  Learn More
                </button>
              </Link>

              <Link to="/visitor-sites">
                <button className="sites-btn">
                  View Monitoring Sites
                </button>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ================= About Mangroves Section ================= */}

      <section className="about-section">

        <h2>Why Mangroves Matter</h2>

        <p className="section-intro">
          Mangroves are among the world's most valuable coastal ecosystems.
          They protect shorelines, improve water quality, support biodiversity,
          and help combat climate change by storing large amounts of carbon.
        </p>

        <div className="about-grid">

          <div className="about-card">
            <h3>🌿 What are Mangroves?</h3>

            <p>
              Mangroves are salt-tolerant trees and shrubs that grow along
              tropical and subtropical coastlines. Their complex root systems
              stabilize coastal soils and provide habitats for many species.
            </p>
          </div>

          <div className="about-card">
            <h3>🌊 Why Monitor Water Quality?</h3>

            <p>
              Water salinity, temperature and water level directly affect
              mangrove health. Continuous monitoring helps detect changes early
              and supports effective conservation efforts.
            </p>
          </div>

          <div className="about-card">
            <h3>🐟 Rich Biodiversity</h3>

            <p>
              Mangrove forests provide breeding and nursery habitats for fish,
              crabs, shrimp, birds and many endangered wildlife species.
            </p>
          </div>

          <div className="about-card">
            <h3>🌎 Climate Protection</h3>

            <p>
              Mangroves capture and store significantly more carbon than most
              terrestrial forests, making them an important natural solution
              for reducing climate change.
            </p>
          </div>

          <div className="about-card">
            <h3>🛡 Coastal Protection</h3>

            <p>
              Dense mangrove roots reduce coastal erosion and protect nearby
              communities from storms, floods and tidal waves.
            </p>
          </div>

          <div className="about-card">
            <h3>📊 Smart Monitoring</h3>

            <p>
              Mangrove Guard provides real-time monitoring of water level,
              salinity, temperature and battery status to assist researchers
              and environmental authorities.
            </p>
          </div>

        </div>

      </section>

      {/* ================= FAQ Section ================= */}

      <section className="faq-section">

        <h2>Frequently Asked Questions</h2>

        <div className="faq-container">

          <div className="faq-item">
            <h3>Why are mangroves important?</h3>

            <p>
              Mangroves protect coastlines, support fisheries, improve water
              quality and absorb large amounts of carbon dioxide.
            </p>
          </div>

          <div className="faq-item">
            <h3>What parameters are monitored?</h3>

            <p>
              Water level, salinity, water temperature and device battery
              status are monitored in real time.
            </p>
          </div>

          <div className="faq-item">
            <h3>Who can use this system?</h3>

            <p>
              Researchers, environmental organizations, government agencies
              and conservation volunteers can use the monitoring platform.
            </p>
          </div>

          <div className="faq-item">
            <h3>How does real-time monitoring help?</h3>

            <p>
              It helps detect environmental changes early, enabling faster
              conservation decisions and better ecosystem management.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}

export default Home;