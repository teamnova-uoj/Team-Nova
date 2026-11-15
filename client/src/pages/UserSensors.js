import React, { useState, useEffect } from 'react';
import UserLayout from '../components/UserLayout';
import api from '../services/api';
import socket from '../services/socket';
import { Thermometer, Radio, CheckCircle2, AlertCircle } from 'lucide-react';

function UserSensors() {
  const [sensors, setSensors] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (deviceFilter) params.device = deviceFilter;

      const [sensorRes, deviceRes] = await Promise.all([
        api.get('/sensors', { params }),
        api.get('/devices')
      ]);

      let sensorList = sensorRes.data.data || [];
      if (statusFilter) {
        sensorList = sensorList.filter(s => s.status === statusFilter);
      }

      setSensors(sensorList);
      setDevices(deviceRes.data.data || []);
    } catch (err) {
      setError('Could not load sensor probes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [deviceFilter, statusFilter]);

  // Real-time status changes
  useEffect(() => {
    const handleStatusChange = () => {
      loadData();
    };
    socket.on('device_status_changed', handleStatusChange);
    return () => socket.off('device_status_changed', handleStatusChange);
  }, [deviceFilter, statusFilter]);

  const byStatus = (s) => sensors.filter(sensor => sensor.status === s).length;
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
    <UserLayout activePage="sensors">
      <div className="ul-header">
        <div>
          <p className="ul-breadcrumb">Monitoring &rsaquo; Sensors</p>
          <h1 className="ul-title">Sensors</h1>
          <p className="ul-subtitle">Calibrated water chemistry probes and telemetry telemetry sensors.</p>
        </div>
      </div>

      {error && <div className="ul-error">{error}</div>}

      {/* Summary Stats */}
      <div className="ul-stats">
        <div className="ul-stat-card">
          <span className="ul-stat-icon" style={{ color: '#1d7068' }}><Thermometer size={24} /></span>
          <div>
            <div className="ul-stat-val">{sensors.length}</div>
            <div className="ul-stat-lbl">Total Probes</div>
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
          <span className="ul-stat-icon" style={{ color: '#e24b4a' }}><AlertCircle size={24} /></span>
          <div>
            <div className="ul-stat-val">{byStatus('faulty') + byStatus('inactive')}</div>
            <div className="ul-stat-lbl">Faulty / Inactive</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="ul-filter-bar">
        <label className="ul-lbl">Filter by Device:</label>
        <select
          className="ul-select"
          value={deviceFilter}
          onChange={(e) => setDeviceFilter(e.target.value)}
        >
          <option value="">All Devices</option>
          {devices.map(d => (
            <option key={d._id} value={d._id}>{d.device_id} ({d.site?.name || 'Unassigned'})</option>
          ))}
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
          <option value="faulty">Faulty</option>
        </select>
      </div>

      {/* Read-Only Sensors Table */}
      <div className="ul-table-wrap">
        <table className="ul-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Sensor Model</th>
              <th>Serial Number</th>
              <th>Attached Device</th>
              <th>Status</th>
              <th>Valid Range</th>
              <th>Calibration Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="ul-loading">Loading sensors...</td>
              </tr>
            ) : sensors.length === 0 ? (
              <tr>
                <td colSpan="7" className="ul-loading">No sensors match your selection.</td>
              </tr>
            ) : (
              sensors.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 600, color: '#152b1f' }}>
                    {s.parameter?.label || s.parameter?.key || 'Parameter'}
                  </td>
                  <td>{s.model_name || 'Standard Probe'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#5c7c6a' }}>
                    {s.serial_number || '—'}
                  </td>
                  <td>
                    {s.device?.device_id ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Radio size={14} color="#1d7068" />
                        <strong>{s.device.device_id}</strong>
                      </span>
                    ) : 'Unassigned'}
                  </td>
                  <td>
                    <span className={`ul-badge ${statusBadgeClass(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#5c7c6a' }}>
                    {s.parameter?.valid_min !== undefined && s.parameter?.valid_max !== undefined
                      ? `${s.parameter.valid_min} – ${s.parameter.valid_max} ${s.parameter.unit || ''}`
                      : '—'}
                  </td>
                  <td style={{ fontSize: '12px', color: '#5c7c6a' }}>
                    {s.calibration_date ? new Date(s.calibration_date).toLocaleDateString('en-GB') : '—'}
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

export default UserSensors;

