import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import Footer from '../components/Footer';
import api from '../services/api';
import './AdminAlerts.css';

function RecentLogins() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecentLogins = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/users/recent-logins');
        setUsers(res.data.data || []);
      } catch (err) {
        setError('Could not load recent login activity.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecentLogins();
  }, []);

  const timeAgo = (d) => {
    if (!d) return 'never';
    const diffMs = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const roleBadgeClass = (r) => {
    if (r === 'admin') return 'am-badge--rw';
    if (r === 'site_engineer') return 'am-badge--rn';
    return 'am-badge--re';
  };

  return (
    <div className="am-page">
      <AdminSidebar activePage="users" />

      <main className="am-main">
        <div className="am-header">
          <div>
            <p className="am-breadcrumb">Admin › Activity Feed</p>
            <h1 className="am-title">Recently Logged In Users</h1>
            <p className="am-subtitle">User login activity recorded over the past 30 days.</p>
          </div>
        </div>

        {error && <div className="am-error">{error}</div>}

        {loading ? (
          <div className="am-loading">
            <div className="am-spinner" />
            <p>Loading login activity…</p>
          </div>
        ) : (
          <div className="am-card">
            <table className="am-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Assigned Site</th>
                  <th>Last Login</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="am-empty">
                      No user logins recorded within the past 30 days.
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr key={u._id} className="am-tr">
                      <td className="am-td-num">{i + 1}</td>
                      <td className="am-td-name">{u.name}</td>
                      <td className="am-td-dim">{u.email}</td>
                      <td>
                        <span className={`am-badge ${roleBadgeClass(u.role)}`}>
                          {u.role === 'admin' ? 'Admin' : u.role === 'site_engineer' ? 'Site Engineer' : 'Registered User'}
                        </span>
                      </td>
                      <td className="am-td-loc">{u.assignedSite?.name || '—'}</td>
                      <td className="am-td-data" style={{ fontWeight: 600, color: '#1c3a2a' }}>
                        {timeAgo(u.lastLogin)}
                      </td>
                      <td className="am-td-dim">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <Footer />
      </main>
    </div>
  );
}

export default RecentLogins;
