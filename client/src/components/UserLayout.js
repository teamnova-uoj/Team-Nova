import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './ProfileModal';
import {
  LayoutDashboard,
  Radio,
  Thermometer,
  Bell,
  MapPin,
  Info,
  Phone,
  User,
  LogOut,
  ChevronDown,
  ChevronUp,
  Menu,
  Search,
  X
} from 'lucide-react';
import './UserLayout.css';
import logoImg from '../assests/logo.png';

const DEFAULT_MAIN_ITEMS = [
  { key: 'dashboard', to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { key: 'devices',   to: '/devices',   icon: <Radio size={18} />,           label: 'Devices' },
  { key: 'sensors',   to: '/sensors',   icon: <Thermometer size={18} />,     label: 'Sensors' },
  { key: 'alerts',    to: '/alerts',    icon: <Bell size={18} />,            label: 'Alerts' },
  { key: 'sites',     to: '/sites',     icon: <MapPin size={18} />,          label: 'Sites' },
];

const DEFAULT_SECONDARY_ITEMS = [
  { key: 'about',   to: '/about',   icon: <Info size={18} />,  label: 'About' },
  { key: 'contact', to: '/contact', icon: <Phone size={18} />, label: 'Contact' },
];

function UserLayout({
  activePage,
  children,
  menuItems = DEFAULT_MAIN_ITEMS,
  secondaryItems = DEFAULT_SECONDARY_ITEMS
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const accountMenuRef = useRef(null);

  // Close account dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && drawerOpen) {
        setDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawerOpen]);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setDrawerOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim() === '') return;
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    setSearchTerm('');
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Mobile drawer backdrop overlay */}
      <div
        className={`ul-drawer-overlay ${drawerOpen ? 'ul-drawer-overlay--visible' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      <div className={`ul-page ${sidebarCollapsed ? 'ul-page--collapsed' : ''}`}>
        {/* ── Sidebar ── */}
        <aside className={`ul-sidebar ${drawerOpen ? 'ul-sidebar--open' : ''}`}>
          <div className="ul-brand" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={logoImg} alt="MangroveGuard Logo" style={{ height: '46px', width: 'auto' }} />
              <div className="ul-brand-name">MangroveGuard</div>
            </div>
            <button
              type="button"
              className="ul-sidebar-close-btn"
              onClick={toggleSidebar}
              title="Hide sidebar"
              aria-label="Hide sidebar"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search inside drawer for mobile */}
          <div className="ul-drawer-search">
            <form className="ul-search-form" onSubmit={handleSearch}>
              <input
                type="text"
                className="ul-search-input"
                placeholder="Search sites, hardware, alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="ul-search-btn" title="Search">
                <Search size={16} />
              </button>
            </form>
          </div>

          <nav className="ul-nav" aria-label="Main Navigation">
            {menuItems.map(({ key, to, icon, label }) => {
              const isActive = activePage === key;
              return (
                <Link
                  key={key}
                  to={to}
                  className={`ul-nav-link ${isActive ? 'ul-nav-link--active' : ''}`}
                  onClick={() => setDrawerOpen(false)}
                >
                  <span className="ul-nav-icon">{icon}</span>
                  <span style={{ flex: 1 }}>{label}</span>
                </Link>
              );
            })}

            <div className="ul-nav-divider" />

            {secondaryItems.map(({ key, to, icon, label }) => {
              const isActive = activePage === key;
              return (
                <Link
                  key={key}
                  to={to}
                  className={`ul-nav-link ${isActive ? 'ul-nav-link--active' : ''}`}
                  onClick={() => setDrawerOpen(false)}
                >
                  <span className="ul-nav-icon">{icon}</span>
                  <span style={{ flex: 1 }}>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Card & Dropdown */}
          <div className="ul-sidebar-bottom" ref={accountMenuRef}>
            <div
              className="ul-user-card"
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              title="Click for account options"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setAccountMenuOpen(!accountMenuOpen);
              }}
            >
              <div className="ul-user-avatar">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="ul-user-info">
                <div className="ul-user-name">{user?.name || 'User'}</div>
                <div className="ul-user-email">{user?.email || ''}</div>
              </div>
              <span className="ul-dropdown-arrow">
                {accountMenuOpen ? <ChevronUp size={14} color="#6fcf97" /> : <ChevronDown size={14} color="rgba(255,255,255,0.5)" />}
              </span>
            </div>

            {accountMenuOpen && (
              <div className="ul-account-dropdown">
                <button
                  type="button"
                  className="ul-account-item"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    setIsProfileOpen(true);
                  }}
                >
                  <User size={15} />
                  <span>Profile / Settings</span>
                </button>
                <button
                  type="button"
                  className="ul-account-item ul-account-item--logout"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ── Content Column ── */}
        <main className="ul-main">
          {/* Top Bar with Sidebar Hide/Show Toggle */}
          <div className="ul-topbar">
            <div className="ul-topbar-left">
              <button
                type="button"
                className="ul-menu-btn"
                onClick={toggleSidebar}
                title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                aria-label="Toggle navigation menu"
              >
                <Menu size={20} />
              </button>

              {/* Mobile-only brand logo */}
              <div className="ul-topbar-mobile-brand" onClick={() => navigate('/dashboard')}>
                <img src={logoImg} alt="MangroveGuard Logo" style={{ height: "34px", width: "auto" }} />
                <span>MangroveGuard</span>
              </div>

              <form className="ul-search-form" onSubmit={handleSearch}>
                <input
                  type="text"
                  className="ul-search-input"
                  placeholder="Search sites, hardware, alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="ul-search-btn" title="Search">
                  <Search size={16} />
                </button>
              </form>
            </div>

            {/* Topbar Right - avatar / quick profile button */}
            <div className="ul-topbar-right">
              <button
                type="button"
                className="ul-topbar-avatar"
                onClick={() => setIsProfileOpen(true)}
                title="Account Profile / Settings"
                aria-label="Open user profile settings"
              >
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </button>
            </div>
          </div>

          {/* Page Body */}
          <div className="ul-content">
            {children}
          </div>

          {/* Slim Footer under content column */}
          <footer className="ul-footer">
            &copy; 2026 MangroveGuard &nbsp;&middot;&nbsp; Protecting Sri Lanka's Coastal Mangrove Ecosystems &nbsp;&middot;&nbsp; All Rights Reserved.
          </footer>
        </main>
      </div>

      {/* Profile Settings Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}

export default UserLayout;
