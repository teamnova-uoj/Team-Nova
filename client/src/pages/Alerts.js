import React, { useEffect, useState } from 'react';
import UserLayout from '../components/UserLayout';
import api from '../services/api';
import socket from '../services/socket';

const STATUS_LABEL = {
  unread: 'Pending',
  read: 'Read',
  resolved: 'Resolved',
};

const SEVERITY_LABEL = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB');
}

function formatTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');

  // Initial load of sites
  useEffect(() => {
    const loadSites = async () => {
      try {
        const res = await api.get('/sites');
        setSites(res.data.data || []);
      } catch (err) {
        console.error('Failed to load sites for alerts filter', err);
      }
    };
    loadSites();
  }, []);

  const loadAlerts = async (pageNum, reset = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = { limit: 15, page: pageNum };
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      if (siteFilter) params.site = siteFilter;

      const res = await api.get('/alerts', { params });
      const raw = res.data.data || [];
      const newAlerts = raw.filter(
        a => a.type !== 'system_offline' && a.device
      );
      setAlerts(prev => (reset || pageNum === 1) ? newAlerts : [...prev, ...newAlerts]);
      setHasMore(pageNum < (res.data.pages || 1));
    } catch (err) {
      setError("Couldn't load alerts from the server.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadAlerts(1, true);
  }, [statusFilter, severityFilter, siteFilter]);

  const handleNextPage = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadAlerts(nextPage, false);
  };

  // Socket listener for new incoming alerts
  useEffect(() => {
    const handleNewAlert = (newAlert) => {
      if (!newAlert || newAlert.type === 'system_offline' || !newAlert.device) return;
      setAlerts(prev => [newAlert, ...prev]);
    };
    socket.on('new_alert', handleNewAlert);
    return () => socket.off('new_alert', handleNewAlert);
  }, []);

  const severityBadgeClass = (sev) => {
    switch (sev) {
      case 'critical': return 'ul-badge--rw';
      case 'high': return 'ul-badge--re';
      case 'medium': return 'ul-badge--rs';
      case 'low': return 'ul-badge--rn';
      default: return 'ul-badge--rs';
    }
  };

  const statusBadgeClass = (st) => {
    switch (st) {
      case 'resolved': return 'ul-badge--rn';
      case 'read': return 'ul-badge--rs';
      case 'unread': return 'ul-badge--rw';
      default: return 'ul-badge--rs';
    }
  };

  return (
    <UserLayout activePage="alerts">
      <div className="ul-header">
        <div>
          <p className="ul-breadcrumb">Monitoring &rsaquo; Alerts</p>
          <h1 className="ul-title">Alerts & Notifications</h1>
          <p className="ul-subtitle">Real-time water quality threshold breaches and hardware alerts.</p>
        </div>
      </div>

      {error && <div className="ul-error">{error}</div>}

      {/* Filter bar */}
      <div className="ul-filter-bar">
        <label className="ul-lbl">Site:</label>
        <select
          className="ul-select"
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
        >
          <option value="">All Sites</option>
          {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>

        <label className="ul-lbl">Severity:</label>
        <select
          className="ul-select"
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <label className="ul-lbl">Status:</label>
        <select
          className="ul-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="unread">Pending (Unread)</option>
          <option value="read">Read</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Read-Only Alerts Table */}
      <div className="ul-table-wrap">
        <table className="ul-table">
          <thead>
            <tr>
              <th>Site Name</th>
              <th>Alert Message</th>
              <th>Severity</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="ul-loading">Loading alerts…</td>
              </tr>
            ) : alerts.length === 0 ? (
              <tr>
                <td colSpan="6" className="ul-loading">No alerts match your current filters.</td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert._id}>
                  <td style={{ fontWeight: 600, color: '#152b1f' }}>
                    {alert.device?.site?.name || '—'}
                  </td>
                  <td style={{ maxWidth: '380px', color: '#2d4a3e' }}>
                    {alert.message}
                  </td>
                  <td>
                    <span className={`ul-badge ${severityBadgeClass(alert.severity_level)}`}>
                      {SEVERITY_LABEL[alert.severity_level] || alert.severity_level}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#5c7c6a' }}>
                    {formatDate(alert.created_at)}
                  </td>
                  <td style={{ fontSize: '12px', color: '#5c7c6a' }}>
                    {formatTime(alert.created_at)}
                  </td>
                  <td>
                    <span className={`ul-badge ${statusBadgeClass(alert.status)}`}>
                      {STATUS_LABEL[alert.status] || alert.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {hasMore && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <button
              type="button"
              className="ul-btn-sec"
              onClick={handleNextPage}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading more...' : 'Load More Alerts'}
            </button>
          </div>
        )}
      </div>
    </UserLayout>
  );
}

export default Alerts;
