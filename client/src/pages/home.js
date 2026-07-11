import "./home.css";
import Navbar from "../components/navbar";
import mangrove from "../assests/mangrove.png";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);

      // Redirect based on role
      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <Navbar />

      <div
        className="hero"
        style={{ backgroundImage: `url(${mangrove})` }}
      >
        <div className="login-box">
          <h2>Login</h2>

          <form onSubmit={handleLogin}>

            {error && (
              <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>
                {error}
              </p>
            )}

            <label>Email Address</label>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button className="login-btn" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>

            <p className="forgot">Forgot password?</p>

          </form>
        </div>

        <div className="content">
          <h1>Mangrove Guard</h1>
          <h3>Monitoring Mangrove Ecosystem & Water Quality</h3>
          <div className="info-box">
            <p>
              Welcome to Mangrove Guard, your comprehensive solution for
              monitoring and protecting mangrove ecosystems.
            </p>
            <p>
              Our mission is to ensure the health and preservation of vital
              mangrove forests through advanced monitoring and data analysis.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Home;