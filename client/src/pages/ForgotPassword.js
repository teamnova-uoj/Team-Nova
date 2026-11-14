import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/navbar";
import Footer from "../components/Footer";
import mangrove from "../assests/mangrove.png";
import "./ForgotPassword.css";

function ForgotPassword() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | sent | error
  const [message, setMessage] = useState("");
  const [devResetUrl, setDevResetUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    setDevResetUrl(null);

    try {
      const res = await forgotPassword(email);
      setStatus("sent");
      setMessage(res.message || "If an account with that email exists, a reset link has been sent.");

      // Only present in dev mode (no real email service configured on the backend)
      if (res.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      }
    } catch (err) {
      setStatus("error");
      setMessage(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  return (
    <div
      className="forgot-password-page"
      style={{ backgroundImage: `url(${mangrove})` }}
    >
      <Navbar />

      <div className="forgot-password-overlay">
        <div className="forgot-password-card">
          <h2>Forgot Password</h2>
          <p className="subtitle">
            Enter your account email and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit}>
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" className="submit-btn" disabled={status === "loading"}>
              {status === "loading" ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          {message && (
            <p className={`status-message ${status === "error" ? "error" : "success"}`}>
              {message}
            </p>
          )}

          {devResetUrl && (
            <div className="dev-reset-box">
              <p><strong>Dev mode</strong> — no email service is configured yet, so here's the link directly:</p>
              <Link to={devResetUrl.replace(window.location.origin + process.env.PUBLIC_URL, "")}>
                {devResetUrl}
              </Link>
            </div>
          )}

          <p className="back-link">
            <Link to="/">Back to Home</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ForgotPassword;
