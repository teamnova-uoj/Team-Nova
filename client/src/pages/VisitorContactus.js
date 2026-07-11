import "./VisitorContactus.css";
import Navbar from "../components/navbar";
import mangrove from "../assests/mangrove.png";

function VisitorContactus() {
  return (
    <div className="visitor-contact-page">

      {/* Home Navbar */}
      <Navbar />

      {/* Background */}
      <div
        className="visitor-contact-hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >

        <div className="visitor-contact-container">

          <h1>Contact Us</h1>

          <p className="visitor-contact-text">
            Have questions or need assistance?
            Send us a message and we'll respond as soon as possible.
          </p>

          <form className="visitor-contact-form">

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

          <div className="visitor-contact-info">

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

export default VisitorContactus;