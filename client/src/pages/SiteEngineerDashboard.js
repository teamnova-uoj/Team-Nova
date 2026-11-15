import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import { Radio, Thermometer, Bell, Mail, Sliders, CheckCircle2 } from 'lucide-react';
import './AdminAlerts.css';

function SiteEngineerDashboard() {
  const { user } = useAuth();
  const [siteData, setSiteData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [readings, setReadings] = useState([]);
  const [liveSensors, setLiveSensors] = useState({});
  const [availableParameters, setAvailableParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [thresholds, setThresholds] = useState([]);
  const [newParamId, setNewParamId] = useState('');

  useEffect(() => {
    fetchEngineerSiteData();
  }, [user]);

  const fetchEngineerSiteData = async () => {
    try {
      setLoading(true);
      setError('');

      const siteId = user?.assignedSite?._id || user?.assignedSite;
      if (!siteId) {
        setError('No site assigned to your engineer account yet.');
        setLoading(false);
        return;
      }

      const [siteRes, deviceRes, alertRes, paramRes, msgRes, readingsRes] = await Promise.all([
        api.get(`/sites/${siteId}`),
        api.get(`/devices?site=${siteId}`),
        api.get(`/alerts?limit=50`),
        api.get(`/parameters?site=${siteId}`),
        api.get(`/messages`),
        api.get(`/readings/latest`).catch(() => ({ data: { data: [] } }))
      ]);

      const siteObj = siteRes.data.data.site || siteRes.data.data;
      setSiteData(siteObj);
      setThresholds(siteObj.thresholds || []);
      setDevices(deviceRes.data.data || []);
      setAvailableParameters(paramRes.data.data || []);
      setAlerts(alertRes.data.data || []);
      setMessages(msgRes.data.data || []);
      setReadings(readingsRes.data.data || []);

      const sensorRes = await api.get(`/sensors?site=${siteId}`);
      setSensors(sensorRes.data.data || []);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load site engineer dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleNewReading = (newReading) => {
      if (!newReading) return;
      const getSensorId = (r) => (r.sensor?._id ? r.sensor._id.toString() : r.sensor ? r.sensor.toString() : null);
      const newSensorId = getSensorId(newReading);

      setReadings((prev) => {
        const exists = prev.some((r) => getSensorId(r) === newSensorId);
        if (exists) {
          return prev.map((r) => (getSensorId(r) === newSensorId ? newReading : r));
        } else {
          return [newReading, ...prev];
        }
      });

      if (newSensorId) {
        setLiveSensors((prev) => ({ ...prev, [newSensorId]: true }));
        setTimeout(() => {
          setLiveSensors((prev) => {
            const copy = { ...prev };
            delete copy[newSensorId];
            return copy;
          });
        }, 4000);
      }
    };

    socket.on('new_reading', handleNewReading);
    return () => {
      socket.off('new_reading', handleNewReading);
    };
  }, []);

  const handleResolveAlert = async (alertId) => {
    try {
      await api.put(`/alerts/${alertId}/status`, { status: 'resolved' });
      setSuccess('Alert marked as resolved!');
      fetchEngineerSiteData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resolve alert');
    }
  };

  const handleThresholdChange = (index, field, value) => {
    const updated = [...thresholds];
    updated[index][field] = Number(value);
    setThresholds(updated);
  };

  const handleAddThreshold = () => {
    if (!newParamId) return;
    const selectedParam = availableParameters.find(p => p._id === newParamId);
    if (!selectedParam) return;

    const existing = thresholds.find(t => (t.parameter?._id || t.parameter) === newParamId);
    if (existing) {
      setError('Parameter is already tracked at this site.');
      return;
    }

    setThresholds([
      ...thresholds,
      {
        parameter: selectedParam,
        min: selectedParam.valid_min ?? 0,
        max: selectedParam.valid_max ?? 100
      }
    ]);
    setNewParamId('');
  };

  const handleRemoveThreshold = (index) => {
    setThresholds(thresholds.filter((_, i) => i !== index));
  };

  const handleSaveThresholds = async () => {
    try {
      const siteId = siteData._id;
      const formattedThresholds = thresholds.map(t => ({
        parameter: t.parameter._id || t.parameter,
        min: t.min,
        max: t.max
      }));

      await api.put(`/sites/${siteId}/thresholds`, { thresholds: formattedThresholds });
      setSuccess('Site thresholds updated successfully!');
      fetchEngineerSiteData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update thresholds');
    }
  };

  const activeAlerts = alerts.filter(a => a.status !== 'resolved');

  return (
    <div className="am-page">
      {/* Admin Sidebar in Site Engineer mode */}
      <AdminSidebar activePage="dashboard" />

      <main className="am-main">
        {/* Header */}
        <div className="am-header">
          <div>
            <p className="am-breadcrumb">Site Engineer › Dashboard</p>
            <h1 className="am-title">Site Control Panel — {siteData?.name || 'Loading...'}</h1>
            <p className="am-subtitle">
              Location: <strong>{siteData?.location || '—'}</strong> ({siteData?.region || '—'} Region)
            </p>
          </div>
        </div>

        {error && <div className="am-error" style={{ marginBottom: '16px' }}>{error}</div>}
        {success && <div style={{ padding: '12px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '8px', marginBottom: '16px' }}>{success}</div>}

        {loading ? (
          <div className="am-loading">
            <div className="am-spinner" />
            <p>Loading dashboard…</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="am-stats" style={{ marginBottom: '20px' }}>
              {[
                { icon: <Radio size={22} color="#1d7068" />, val: devices.length, label: "Assigned Devices" },
                { icon: <Thermometer size={22} color="#164e3d" />, val: sensors.filter(s => s.status === 'active').length, label: "Active Sensors" },
                { icon: <Bell size={22} color="#d97706" />, val: activeAlerts.length, label: "Active Site Alerts" },
                { icon: <Mail size={22} color="#2b9388" />, val: messages.filter(m => m.status === 'unread').length, label: "Site Messages" }
              ].map((s, i) => (
                <div className="am-stat-card" key={i}>
                  <span className="am-stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</span>
                  <div>
                    <div className="am-stat-val">{s.val}</div>
                    <div className="am-stat-lbl">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Alerts Section */}
            <div className="am-card" style={{ padding: '18px 20px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1c3a2a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="#d97706" />
                <span>Active Site Breaches & Alerts</span>
              </h2>
              {activeAlerts.length === 0 ? (
                <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#166534" />
                  <span>No active breaches — all parameters operating within configured limits.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeAlerts.map(a => (
                    <div key={a._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{a.parameter_name}: {a.measured_value} {a.unit}</strong>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px', fontWeight: 500 }}>{a.message} (Device: {a.device?.device_id || '—'})</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`am-badge am-badge--${a.severity_level}`}>{a.severity_level}</span>
                        <button
                          onClick={() => handleResolveAlert(a._id)}
                          style={{ padding: '6px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <CheckCircle2 size={14} /> Resolve Alert
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Devices & Sensors Section */}
            <div className="am-grid-2col">
              <div className="am-card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1c3a2a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Radio size={18} color="#1d7068" />
                    <span>Monitored Devices</span>
                  </h2>
                  <Link to="/manage-devices" style={{ fontSize: '12px', color: '#1c3a2a', fontWeight: 600 }}>View All →</Link>
                </div>
                {devices.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>No devices registered for this site.</p>
                ) : devices.slice(0, 5).map(dev => (
                  <div key={dev._id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{dev.device_id}</strong>
                      <span className={`am-badge am-badge--${dev.status === 'active' ? 'rn' : 're'}`}>{dev.status}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', fontWeight: 500 }}>
                      Sampling interval: {dev.sampling_interval_seconds}s
                    </div>
                  </div>
                ))}
              </div>

              <div className="am-card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1c3a2a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Thermometer size={18} color="#164e3d" />
                    <span>Registered Probes & Sensors</span>
                  </h2>
                  <Link to="/manage-sensors" style={{ fontSize: '12px', color: '#1c3a2a', fontWeight: 600 }}>View All →</Link>
                </div>
                {sensors.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>No sensors registered for this site.</p>
                ) : sensors.slice(0, 5).map(sen => {
                  const senId = sen._id?.toString();
                  const latestR = readings.find(r => (r.sensor?._id?.toString() || r.sensor?.toString()) === senId);
                  const isLive = !!liveSensors[senId];

                  return (
                    <div key={sen._id} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ fontSize: '13px' }}>{sen.parameter?.label || 'Sensor'}</strong>
                          {isLive && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: '#e6f4ea',
                              color: '#137333',
                              border: '1px solid #ceead6',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '10px'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1e8e3e' }} />
                              LIVE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                          {sen.model_name} (SN: {sen.serial_number})
                          {latestR && <span style={{ fontWeight: 600, color: '#0f172a', marginLeft: '6px' }}>· Latest: {latestR.value} {sen.parameter?.unit || ''}</span>}
                        </div>
                      </div>
                      <span className={`am-badge am-badge--${sen.status === 'active' ? 'rn' : 'rs'}`}>{sen.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Threshold Adjustments Section */}
            <div className="am-card" style={{ padding: '18px 20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1c3a2a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="#164e3d" />
                <span>Adjust Site Parameter Thresholds</span>
              </h2>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '520px', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>Parameter</th>
                      <th style={{ padding: '8px 12px' }}>Min Limit</th>
                      <th style={{ padding: '8px 12px' }}>Max Limit</th>
                      <th style={{ padding: '8px 12px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {thresholds.map((t, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <strong>{t.parameter?.label || 'Parameter'}</strong> ({t.parameter?.unit || 'unitless'})
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            step="any"
                            style={{ width: '80px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            value={t.min}
                            onChange={e => handleThresholdChange(idx, 'min', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            step="any"
                            style={{ width: '80px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            value={t.max}
                            onChange={e => handleThresholdChange(idx, 'max', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <button
                            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => handleRemoveThreshold(idx)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={newParamId}
                  onChange={e => setNewParamId(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="">-- Select Parameter to Add --</option>
                  {availableParameters.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.label} ({p.unit || 'unitless'}) {p.scope === 'site' ? '[Site Local]' : '[Global]'}
                    </option>
                  ))}
                </select>
                <button
                  style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  onClick={handleAddThreshold}
                >
                  ＋ Add Threshold
                </button>
              </div>

              <button
                style={{ marginTop: '20px', padding: '10px 20px', background: '#1c3a2a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                onClick={handleSaveThresholds}
              >
                Save Threshold Configuration
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default SiteEngineerDashboard;
