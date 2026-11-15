import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ProfileModal from './ProfileModal';
import {
  LayoutDashboard,
  FileText,
  Users,
  Radio,
  Thermometer,
  Sliders,
  Bell,
  MapPin,
  Mail,
  User,
  LogOut,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Menu,
  X
} from 'lucide-react';
import './AdminSidebar.css';
import logoImg from '../assests/logo.png';

function AdminSidebar({ activePage }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const accountMenuRef = useRef(null);

  const isEngineer = user?.role === 'site_engineer';

  // ── Sync body class for main-content margin offset ───────────────
  useEffect(() => {
    if (sidebarCollapsed) {
      document.body.classList.add('admin-sb--collapsed');
    } else {
      document.body.classList.remove('admin-sb--collapsed');
    }
    return () => document.body.classList.remove('admin-sb--collapsed');
  }, [sidebarCollapsed]);

  // ── Outside click closes account dropdown ───────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Escape key closes mobile drawer ────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  // ── Resize: close mobile drawer when returning to desktop ───────
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && drawerOpen) setDrawerOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawerOpen]);

  // ── Pending counts (admin only) ────────────────────────────────
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchCounts = async () => {
        try {
          const [crRes, userRes] = await Promise.all([
            api.get('/change-requests/pending-count'),
            api.get('/users/pending-count')
          ]);
          if (crRes.data?.success) setPendingCount(crRes.data.count || 0);
          if (userRes.data?.success) setPendingUsersCount(userRes.data.count || 0);
        } catch (err) {
          console.error('Failed to fetch pending counts', err);
        }
      };
      fetchCounts();
      const interval = setInterval(fetchCounts, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setDrawerOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Admin Navigation Links
  const adminNavItems = [
    { key: 'dashboard',        to: '/admin-dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { key: 'pending-requests', to: '/pending-requests', icon: <FileText size={18} />, label: 'Pending Requests', badge: pendingCount + pendingUsersCount },
    { key: 'users',            to: '/manage-users',    icon: <Users size={18} />, label: 'Users', badge: pendingUsersCount },
    { key: 'devices',          to: '/manage-devices',  icon: <Radio size={18} />, label: 'Devices' },
    { key: 'sensors',          to: '/manage-sensors',  icon: <Thermometer size={18} />, label: 'Sensors' },
    { key: 'parameters',       to: '/parameter-admin', icon: <Sliders size={18} />, label: 'Parameters' },
    { key: 'alerts',           to: '/admin-alerts',    icon: <Bell size={18} />, label: 'Alerts' },
    { key: 'sites',            to: '/admin-maps',      icon: <MapPin size={18} />, label: 'Sites' },
    { key: 'messages',         to: '/admin-messages',  icon: <Mail size={18} />, label: 'Messages' }
  ];

  // Site Engineer Navigation Links
  const engineerNavItems = [
    { key: 'dashboard',   to: '/site-engineer-dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { key: 'my-requests', to: '/my-requests',             icon: <ClipboardList size={18} />, label: 'My Requests' },
    { key: 'sites',       to: '/admin-maps',              icon: <MapPin size={18} />, label: 'Sites' },
    { key: 'devices',     to: '/manage-devices',          icon: <Radio size={18} />, label: 'Devices' },
    { key: 'sensors',     to: '/manage-sensors',          icon: <Thermometer size={18} />, label: 'Sensors' },
    { key: 'parameters',  to: '/parameter-admin',         icon: <Sliders size={18} />, label: 'Parameters' },
    { key: 'alerts',      to: '/admin-alerts',           icon: <Bell size={18} />, label: 'Alerts' },
    { key: 'messages',    to: '/admin-messages',         icon: <Mail size={18} />, label: 'Messages' }
  ];

  const navItems = isEngineer ? engineerNavItems : adminNavItems;

  return (
    <>
      {/* ── Mobile Drawer Backdrop ──────────────────────── */}
      <div
        className={`admin-sb-overlay${drawerOpen ? ' admin-sb-overlay--visible' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile Top Bar (Admin & Site Engineer) ──────── */}
      <header className="admin-mobile-topbar">
        <button
          type="button"
          className="admin-mobile-hamburger"
          onClick={toggleSidebar}
          title="Open navigation menu"
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
        >
          <Menu size={22} />
        </button>

        <div
          className="admin-mobile-brand"
          onClick={() => {
            setDrawerOpen(false);
            navigate(isEngineer ? '/site-engineer-dashboard' : '/admin-dashboard');
          }}
        >
          <img src={logoImg} alt="MangroveGuard Logo" style={{ height: '34px', width: 'auto' }} />
          <div className="admin-mobile-titles">
            <span className="admin-mobile-brand-name">MangroveGuard</span>
            <span className="admin-mobile-badge">{isEngineer ? 'Site Engineer' : 'Admin'}</span>
          </div>
        </div>

        <button
          type="button"
          className="admin-mobile-avatar-btn"
          onClick={() => {
            setDrawerOpen(false);
            setIsProfileOpen(true);
          }}
          title="Profile & Settings"
          aria-label="Profile and Settings"
        >
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </button>
      </header>

      {/* ── Floating hamburger button (Desktop Collapsed only) ── */}
      <button
        type="button"
        className={`admin-sb-fab${sidebarCollapsed ? ' admin-sb-fab--show' : ''}`}
        onClick={toggleSidebar}
        title="Show navigation"
        aria-label="Open navigation menu"
      >
        <Menu size={20} />
      </button>

      {/* ── Sidebar ────────────────────────────────────── */}
      <aside className={`mu-sidebar${sidebarCollapsed ? ' mu-sidebar--hidden' : ''}${drawerOpen ? ' mu-sidebar--drawer-open' : ''}`}>

        {/* Brand header */}
        <div className="mu-brand">
          <img src={logoImg} alt="MangroveGuard Logo" className="mu-brand-icon" style={{ height: '58px', width: 'auto' }} />
          <div style={{ flex: 1 }}>
            <div className="mu-brand-name">MangroveGuard</div>
          </div>
          {/* X close button */}
          <button
            type="button"
            className="mu-sidebar-close-btn"
            onClick={toggleSidebar}
            title="Hide sidebar"
            aria-label="Hide sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="mu-nav">
          {navItems.map(({ key, to, icon, label, badge }) => {
            const isActive = activePage === key;
            return (
              <Link
                key={key}
                to={to}
                className={`mu-nav-link ${isActive ? 'mu-nav-link--active' : ''}`}
                onClick={() => setDrawerOpen(false)}
              >
                <span className="mu-nav-icon">{icon}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {badge > 0 && (
                  <span className="mu-sidebar-badge">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Account Card & Dropdown Menu */}
        <div className="mu-sidebar-bottom" ref={accountMenuRef}>
          <div
            className="mu-user-card mu-user-card--clickable"
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            title="Click to open profile options"
          >
            <div className="mu-user-avatar">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="mu-user-info">
              <div className="mu-user-name">{user?.name || 'User'}</div>
              <div className="mu-user-email">{user?.email || ''}</div>
            </div>
            <span className="mu-dropdown-arrow">
              {accountMenuOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </div>

          {accountMenuOpen && (
            <div className="mu-account-dropdown">
              <button
                className="mu-account-item"
                onClick={() => {
                  setAccountMenuOpen(false);
                  setIsProfileOpen(true);
                }}
              >
                <User size={15} />
                <span>Profile / Settings</span>
              </button>
              <button
                className="mu-account-item mu-account-item--logout"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}

export default AdminSidebar;
