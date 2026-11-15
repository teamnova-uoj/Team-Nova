import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProfileModal from "./ProfileModal";
import { User, LogOut, Menu, X } from "lucide-react";
import logoImg from "../assests/logo.png";
import "./navbar.css";

const navClass = ({ isActive }) => (isActive ? "active" : "");

function UserNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape key closes menus
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Window resize closes mobile menu
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 800 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() === "") return;
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    setSearchTerm("");
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />;

  return (
    <>
      {/* Mobile drawer backdrop */}
      <div
        className={`navbar-overlay ${mobileMenuOpen ? "navbar-overlay--visible" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div className="dashboard-navbar">
        <div
          className="logo"
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          onClick={() => {
            setMobileMenuOpen(false);
            navigate(user?.role === "admin" ? "/admin-dashboard" : user?.role === "site_engineer" ? "/site-engineer-dashboard" : "/dashboard");
          }}
        >
          <img src={logoImg} alt="MangroveGuard Logo" style={{ height: "46px", width: "auto" }} />
          <span>MangroveGuard</span>
        </div>

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

        {/* Desktop inline / Mobile drawer content */}
        <div className={`nav-links ${mobileMenuOpen ? "nav-links--mobile-open" : ""}`}>
          <NavLink to="/dashboard" className={navClass} onClick={() => setMobileMenuOpen(false)}>Dashboard</NavLink>
          <NavLink to="/sites" className={navClass} onClick={() => setMobileMenuOpen(false)}>Sites</NavLink>
          <NavLink to="/alerts" className={navClass} onClick={() => setMobileMenuOpen(false)}>Alerts</NavLink>
          <NavLink to="/about" className={navClass} onClick={() => setMobileMenuOpen(false)}>About</NavLink>
          <NavLink to="/contact" className={navClass} onClick={() => setMobileMenuOpen(false)}>Contact</NavLink>

          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="search-icon-btn" title="Search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>

          {/* Desktop profile menu dropdown */}
          <div className="profile-menu d-desktop-only" ref={menuRef}>
            <button
              className="avatar-btn"
              onClick={() => setMenuOpen((open) => !open)}
              title="Account Options"
            >
              {initial}
            </button>

            {menuOpen && (
              <div className="profile-dropdown">
                <button
                  type="button"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  onClick={() => {
                    setMenuOpen(false);
                    setIsProfileOpen(true);
                  }}
                >
                  <User size={15} />
                  <span>Profile / Settings</span>
                </button>
                <button type="button" style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={handleLogout}>
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Profile & Logout links inside drawer */}
          <div className="d-mobile-only" style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "10px", marginTop: "6px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <button
              type="button"
              className="un-mobile-action-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsProfileOpen(true);
              }}
            >
              <User size={16} />
              <span>Profile / Settings ({user?.name || "User"})</span>
            </button>
            <button
              type="button"
              className="un-mobile-action-btn un-mobile-action-btn--logout"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}

export default UserNavbar;
