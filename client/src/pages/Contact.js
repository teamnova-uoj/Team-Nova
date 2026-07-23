import "./Contact.css";
import { Link } from "react-router-dom";
import mangrove from "../assests/mangrove.png";

function Contact() {
  return (
    <div className="contact-page">

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
        className="contact-hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >
        <div className="contact-container">

          <h1>Contact Us</h1>

          <p className="contact-text">
            Have questions or need assistance?
            Send us a message and we'll respond as soon as possible.
          </p>

          <form className="contact-form">

            <input
              type="text"
              placeholder="Full Name"
            />

            <input
              type="email"
              placeholder="Email Address"
            />

            <input
              type="text"
              placeholder="Subject"
            />

            <textarea
              rows="6"
              placeholder="Write your message..."
            ></textarea>

            <button type="submit">
              Send Message
            </button>

          </form>

          <div className="contact-info">

            <h3>Contact Information</h3>

            <p><strong>Email:</strong> mangroveguard@gmail.com</p>

            <p><strong>Phone:</strong> +94 77 123 4567</p>

            <p><strong>Address:</strong> University of Jaffna, Sri Lanka</p>

          </div>

        </div>
      </div>

    </div>
  );
}

export default Contact;