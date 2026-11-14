import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Share2, MessageSquare } from "lucide-react";
import logoImg from "../assests/logo.png";
import "./Footer.css";

function Footer() {
  const handleShare = (e) => {
    e.preventDefault();
    if (navigator.share) {
      navigator.share({
        title: 'MangroveGuard',
        text: 'Safeguarding Sri Lanka\'s coastal mangrove ecosystems through continuous IoT water chemistry telemetry.',
        url: `${window.location.origin}${process.env.PUBLIC_URL}/`
      }).catch(console.error);
    } else {
      alert("Sharing is not supported on this browser.");
    }
  };

  return (
    <footer className="app-footer">
      <div className="app-footer-grid">
        {/* Column 1: Brand & Mission */}
        <div className="footer-col footer-col-brand">
          <Link to="/" className="footer-brand">
            <img src={logoImg} alt="MangroveGuard Logo" className="footer-logo-icon" />
            <span>MangroveGuard</span>
          </Link>
          <p className="footer-blurb">
            Safeguarding Sri Lanka's coastal mangrove ecosystems through continuous IoT water quality monitoring, automated environmental alerts, and ecological research.
          </p>
        </div>



        {/* Column 2: Contact & Social */}
        <div className="footer-col">
          <h4 className="footer-col-title">Contact & Connectivity</h4>
          <div className="footer-contact-info">
            <a href="mailto:mangroveguard.team@gmail.com" className="footer-contact-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Mail size={16} />
              <span>mangroveguard.team@gmail.com</span>
            </a>
            <a href="tel:+94704884982" className="footer-contact-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Phone size={16} />
              <span>+94 70 488 4982</span>
            </a>
            <a href="https://www.google.com/maps/search/?api=1&query=University+of+Jaffna" target="_blank" rel="noreferrer" className="footer-contact-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <MapPin size={16} />
              <span>University of Jaffna, Sri Lanka</span>
            </a>
          </div>
          <div className="footer-socials">
            <a href="#share" aria-label="Share" onClick={handleShare}><Share2 size={18} /></a>
            <Link to="/visitor-contactus" aria-label="Contact"><MessageSquare size={18} /></Link>
          </div>
        </div>
      </div>

      <div className="app-footer-bottom">
        <p className="app-footer-text">
          &copy; 2026 MangroveGuard | Protecting Sri Lanka's Mangrove Ecosystems. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
