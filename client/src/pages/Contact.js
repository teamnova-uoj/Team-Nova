import { useState, useEffect } from "react";
import "./Contact.css";
import mangrove from "../assests/mangrove.png";
import axios from "axios";
import UserNavbar from "../components/UserNavbar";
import Footer from "../components/Footer";

const navClass = ({ isActive }) => (isActive ? "active" : "");

function Contact() {
  const [sites, setSites] = useState([]);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    site: "",
    message: ""
  });
  const [statusMsg, setStatusMsg] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/sites");
        setSites(res.data.data || []);
      } catch (err) {
        console.error("Could not fetch sites list for contact form", err);
      }
    };
    fetchSites();
  }, []);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    setSent(false);
    try {
      const response = await axios.post("http://localhost:5000/api/messages", formData);
      if (response.data.success) {
        setSent(true);
        setStatusMsg("Message sent successfully!");
        setFormData({ fullName: "", email: "", subject: "", message: "" });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setStatusMsg("Failed to send message. Please try again.");
    }
  };

  return (
    <div className="contact-page">
      {/* Navbar */}
      <UserNavbar />

      {/* Background Section */}
      <div
        className="contact-hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >
        <div className="contact-container">

          <div className="contact-info">
            <h2>📞 Contact Information</h2>
            <p><strong>Email:</strong> mangroveguard@gmail.com</p>
            <p><strong>Phone:</strong> +94 77 123 4567</p>
            <p><strong>Address:</strong> University of Jaffna, Sri Lanka</p>
          </div>

          <h1>Contact Us</h1>

          <p className="contact-text">
            Have questions or need assistance?
            Send us a message and we'll respond as soon as possible.
          </p>

          {sent && (
            <p className="contact-sent-msg">
              ✅ Thanks! Your message has been noted — we'll get back to you soon.
            </p>
          )}

          {statusMsg && !sent && (
            <p className="status-msg" style={{ color: "red", backgroundColor: "white", padding: "10px", borderRadius: "5px" }}>{statusMsg}</p>
          )}

          <form className="contact-form" onSubmit={handleSubmit}>

            <div className="input-row">
              <input
                type="text"
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", color: "#475569", display: "block", marginBottom: "4px" }}>Which site is this about? (optional)</label>
              <select
                name="site"
                className="input-row"
                style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", background: "#fff", fontSize: "14px" }}
                value={formData.site}
                onChange={handleChange}
              >
                <option value="">General inquiry (No specific site)</option>
                {sites.map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.region})</option>
                ))}
              </select>
            </div>

            <textarea
              name="message"
              rows="3"
              placeholder="Write your message..."
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
            <button type="submit">Send Message</button>
          </form>

        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Contact;