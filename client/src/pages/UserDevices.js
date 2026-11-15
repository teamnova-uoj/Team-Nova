import React, { useState, useEffect } from 'react';
import UserLayout from '../components/UserLayout';
import api from '../services/api';
import socket from '../services/socket';
import { Radio, CheckCircle2, Wrench, AlertCircle } from 'lucide-react';

function UserDevices() {
  const [devices, setDevices] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (siteFilter) params.site = siteFilter;

      const [devicesRes, sitesRes] = await Promise.all([
        api.get('/devices', { params }),
        api.get('/sites')
      ]);

      setDevices(devicesRes.data.data || []);
      setSites(sitesRes.data.data || []);
    } catch (err) {
      setError('Could not load devices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, siteFilter]);

  // Real-time status changes
  useEffect(() => {
    const handleStatusChange = () => {
      loadData();
    };
    socket.on('device_status_changed', handleStatusChange);
    return () => socket.off('device_status_changed', handleStatusChange);
  }, [statusFilter, siteFilter]);

  const byStatus = (s) => devices.filter(d => d.status === s).length;
  const statusBadgeClass = (s) => {
    switch (s) {
      case 'active': return 'ul-badge--rn';
      case 'maintenance': return 'ul-badge--re';
      case 'faulty': return 'ul-badge--rw';
      case 'inactive': return 'ul-badge--rs';
      default: return 'ul-badge--rs';
    }
  };

  return (
    <UserLayout activePage="devices">
      <div className="ul-header">
        <div>
          <p className="ul-breadcrumb">Monitoring &rsaquo; Hardware</p>
          <h1 className="ul-title">Devices</h1>
          <p className="ul-subtitle">Live status and sensor configuration across coastal monitoring units.</p>
        </div>
      </div>

      {error && <div className="ul-error">{error}</div>}

      {/* Summary Stats */}
      <div className="ul-stats">
        <div className="ul-stat-card">
          <span className="ul-stat-icon" style={{ color: '#1d7068' }}><Radio size={24} /></span>
          <div>
            <div className="ul-stat-val">{devices.length}</div>
            <div className="ul-stat-lbl">Total Devices</div>
          </div>
        </div>
        <div className="ul-stat-card">
          <span className="ul-stat-icon" style={{ color: '#166534' }}><CheckCircle2 size={24} /></span>
          <div>
            <div className="ul-stat-val">{byStatus('active')}</div>
            <div className="ul-stat-lbl">Active Online</div>
          </div>
        </div>
        <div className="ul-stat-card">
          <span className="ul-stat-icon" style={{ color: '#d97706' }}><Wrench size={24} /></span>
          <div>
            <div className="ul-stat-val">{byStatus('maintenance')}</div>
            <div className="ul-stat-lbl">In Maintenance</div>
          </div>
        </div>
        <div className="ul-stat-card">
          <span className="ul-stat-icon" style={{ color: '#e24b4a' }}><AlertCircle size={24} /></span>
          <div>
            <div className="ul-stat-val">{byStatus('faulty') + byStatus('inactive')}</div>
            <div className="ul-stat-lbl">Faulty / Inactive</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="ul-filter-bar">
        <label className="ul-lbl">Filter by Site:</label>
        <select
          className="ul-select"
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
        >
          <option value="">All Sites</option>
          {sites.map(s => <option key={s._id} value={s._id}>{s.name} ({s.region})</option>)}
        </select>

        <label className="ul-lbl">Status:</label>
        <select
          className="ul-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
          <option value="faulty">Faulty</option>
        </select>
      </div>

      {/* Read-Only Devices Table */}
      <div className="ul-table-wrap">
        <table className="ul-table">
          <thead>
            <tr>
              <th>Device ID</th>
              <th>Site Location</th>
              <th>Status</th>
              <th>Attached Sensors</th>
              <th>Installed On</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="ul-loading">Loading devices...</td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan="6" className="ul-loading">No devices match your criteria.</td>
              </tr>
            ) : (
              devices.map(d => (
                <tr key={d._id}>
                  <td style={{ fontWeight: 600, color: '#152b1f' }}>{d.device_id}</td>
                  <td>{d.site?.name || 'Unassigned'} &middot; <span style={{ color: '#5c7c6a', fontSize: '12px' }}>{d.site?.location || '—'}</span></td>
                  <td>
                    <span className={`ul-badge ${statusBadgeClass(d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    {d.sensors && d.sensors.length > 0 ? (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {d.sensors.map(s => (
                          <span
                            key={s._id}
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #dcfce7',
                              color: '#166534',
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '6px'
                            }}
                          >
                            {s.parameter?.label || s.parameter?.key || 'Sensor'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#898781', fontSize: '12px' }}>None attached</span>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: '#5c7c6a' }}>
                    {d.installation_date ? new Date(d.installation_date).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td style={{ fontSize: '12px', color: '#5c7c6a' }}>
                    {d.lastSeen ? new Date(d.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </UserLayout>
  );
}

export default UserDevices;

