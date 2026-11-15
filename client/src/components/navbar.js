import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Menu, X } from "lucide-react";
import logoImg from "../assests/logo.png";
import "./navbar.css";

function Navbar() {

  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("login") === "true" || location.pathname === "/login") {
      setShowLogin(true);
      const emailParam = params.get("email");
      if (emailParam) {
        setLoginData(prev => ({ ...prev, email: emailParam }));
      }
    }
  }, [location]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setShowLogin(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mobile drawer when resizing back to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 800 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);

  const handleOpenLogin = () => {
    setLoginError("");
    setMobileMenuOpen(false);
    setShowLogin(true);
  };

  const handleCloseLogin = () => {
    setLoginError("");
    setShowLogin(false);
  };

  const handleChange = (e) => {
    if (loginError) setLoginError("");
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const user = await login(loginData.email, loginData.password);
      setShowLogin(false);
      setLoginData({ email: "", password: "" });
      if (user?.role === "admin") navigate("/admin-dashboard");
      else if (user?.role === "site_engineer") navigate("/site-engineer-dashboard");
      else navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 403) {
        setLoginError(err.response?.data?.message || "Your account is pending administrator approval.");
      } else if (err.response?.status === 401) {
        setLoginError("Invalid email or password. Please check your credentials and try again.");
      } else if (err.response?.data?.message) {
        setLoginError(err.response.data.message);
      } else if (err.message === "Network Error" || !err.response) {
        setLoginError("Unable to reach the server. Please check your internet connection and try again.");
      } else {
        setLoginError("Something went wrong. Please try again later.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() === "") return;
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    setSearchTerm("");
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* ================= MOBILE OVERLAY ================= */}
      <div
        className={`navbar-overlay ${mobileMenuOpen ? "navbar-overlay--visible" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ================= NAVBAR ================= */}

      <nav className="navbar">

        <Link to="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
          <img src={logoImg} alt="MangroveGuard Logo" className="logo-icon" style={{ height: "48px", width: "auto" }} />
          <span>MangroveGuard</span>
        </Link>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="navbar-mobile-toggle"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Collapsible Content: desktop inline, mobile drawer */}
        <div className={`navbar-content ${mobileMenuOpen ? "navbar-content--open" : ""}`}>

          {/* Navigation Links */}
          <ul className="nav-links">
            <li>
              <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setMobileMenuOpen(false)}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/visitor-sites" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setMobileMenuOpen(false)}>
                Sites
              </NavLink>
            </li>
            <li>
              <NavLink to="/visitor-about" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setMobileMenuOpen(false)}>
                About
              </NavLink>
            </li>
            <li>
              <NavLink to="/visitor-contactus" className={({ isActive }) => (isActive ? "active" : "")} onClick={() => setMobileMenuOpen(false)}>
                Contact
              </NavLink>
            </li>
          </ul>

          {/* Search */}
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="search-icon-btn"
              title="Search"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>

          {/* Login Button */}
          <div className="nav-buttons">
            <button
              className="login-nav-btn"
              onClick={handleOpenLogin}
            >
              Login
            </button>
          </div>

        </div>

      </nav>

      {/* ================= LOGIN POPUP ================= */}

      {showLogin && (

        <div
          className="popup-overlay"
          onClick={handleCloseLogin}
        >

          <div
            className="login-popup"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="close-btn"
              onClick={handleCloseLogin}
            >
              ×
            </button>

            <h2>Login</h2>

            {loginError && (
              <div className="login-error-alert">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin}>

              <label>Email Address</label>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={loginData.email}
                onChange={handleChange}
                required
              />

              <label>Password</label>

              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={handleChange}
                required
              />

              <button
                type="submit"
                className="popup-login-btn"
                disabled={loginLoading}
              >
                {loginLoading ? "Signing In..." : "Login"}
              </button>

            </form>

            <p className="forgot-password">
              <Link to="/forgot-password" onClick={() => setShowLogin(false)}>
                Forgot Password?
              </Link>
            </p>

            <p className="register-link">
              Don't have an account?
              <Link to="/register">
                Register
              </Link>
            </p>

          </div>

        </div>

      )}

    </>
  );
}

export default Navbar;