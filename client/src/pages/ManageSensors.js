import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import Footer from '../components/Footer';
import './ManageSensors.css';

function ManageSensors() {
  const { user } = useAuth();
  const [sensors, setSensors] = useState([]);
  const [devices, setDevices] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    device: '',
    parameter: '',
    model_name: '',
    serial_number: '',
    status: 'active'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [sensorRes, deviceRes] = await Promise.all([
        api.get('/sensors'),
        api.get('/devices')
      ]);

      const deviceList = deviceRes.data.data || [];
      setSensors(sensorRes.data.data || []);
      setDevices(deviceList);

      if (deviceList.length > 0) {
        const initialDev = deviceList[0];
        setFormData(prev => ({ ...prev, device: initialDev._id }));
        fetchParametersForDevice(initialDev);
      } else {
        const paramRes = await api.get('/parameters');
        setParameters(paramRes.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sensors and devices');
    } finally {
      setLoading(false);
    }
  };

  const fetchParametersForDevice = async (deviceObj) => {
    try {
      const siteId = deviceObj.site?._id || deviceObj.site;
      const paramUrl = siteId ? `/parameters?site=${siteId}` : '/parameters';
      const paramRes = await api.get(paramUrl);
      const fetchedParams = paramRes.data.data || [];
      setParameters(fetchedParams);
      if (fetchedParams.length > 0) {
        setFormData(prev => ({ ...prev, parameter: fetchedParams[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load site parameters', err);
    }
  };

  const handleDeviceChange = (e) => {
    const selectedDevId = e.target.value;
    setFormData(prev => ({ ...prev, device: selectedDevId }));
    const selectedDev = devices.find(d => d._id === selectedDevId);
    if (selectedDev) {
      fetchParametersForDevice(selectedDev);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const [editingSensor, setEditingSensor] = useState(null);

  const handleEditClick = (sensor) => {
    setEditingSensor(sensor);
    setFormData({
      device: sensor.device?._id || sensor.device || '',
      parameter: sensor.parameter?._id || sensor.parameter || '',
      model_name: sensor.model_name || '',
      serial_number: sensor.serial_number || '',
      status: sensor.status || 'active'
    });
    const selectedDev = devices.find(d => d._id === (sensor.device?._id || sensor.device));
    if (selectedDev) fetchParametersForDevice(selectedDev);
  };

  const handleCancelEdit = () => {
    setEditingSensor(null);
    setFormData({
      device: devices[0]?._id || '',
      parameter: parameters[0]?._id || '',
      model_name: '',
      serial_number: '',
      status: 'active'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingSensor) {
        const res = await api.put(`/sensors/${editingSensor._id}`, formData);
        if (res.data?.pendingApproval) {
          setSuccess('Submitted for admin approval.');
        } else {
          setSuccess('Sensor probe updated successfully!');
        }
        setEditingSensor(null);
      } else {
        const res = await api.post('/sensors', formData);
        if (res.data?.pendingApproval) {
          setSuccess('Submitted for admin approval.');
        } else {
          setSuccess('Sensor probe registered successfully!');
        }
      }

      setFormData(prev => ({
        ...prev,
        model_name: '',
        serial_number: '',
        status: 'active'
      }));
      const res = await api.get('/sensors');
      setSensors(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (sensorId) => {
    if (!window.confirm('Are you sure you want to remove this sensor probe?')) return;
    try {
      const res = await api.delete(`/sensors/${sensorId}`);
      if (res.data?.pendingApproval) {
        setSuccess('Submitted for admin approval.');
      } else {
        setSuccess('Sensor removed successfully');
        setSensors(sensors.filter(s => s._id !== sensorId));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete sensor');
    }
  };

  return (
    <div className="mu-page">
      <AdminSidebar activePage="sensors" />

      <main className="mu-main">
        <div className="mu-header">
          <div>
            <p className="mu-breadcrumb">Admin › Physical Sensors</p>
            <h1 className="mu-title">Sensor Probe Management</h1>
            <p className="mu-subtitle">
              Register, edit, calibrate, and track physical sensor probes attached to hardware monitoring devices.
            </p>
          </div>
        </div>

        {error && <div className="mu-error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <div className="sensors-layout">
          <div className="mu-card form-card" style={{ padding: '24px' }}>
            <h2>{editingSensor ? 'Edit Sensor Probe' : 'Register Sensor Probe'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="mu-lbl">Target Hardware Device</label>
                <select className="mu-inp" name="device" value={formData.device} onChange={handleDeviceChange} required>
                  {devices.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.device_id} ({d.site?.name || 'Unassigned Site'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="mu-lbl">Monitored Parameter</label>
                <select className="mu-inp" name="parameter" value={formData.parameter} onChange={handleChange} required>
                  {parameters.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.label} ({p.unit || 'unitless'}) {p.scope === 'site' ? '📍 [Site Local]' : '🌐 [Global]'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="mu-lbl">Model Name / Type</label>
                <input
                  className="mu-inp"
                  type="text"
                  name="model_name"
                  value={formData.model_name}
                  onChange={handleChange}
                  placeholder="e.g. Atlas Scientific pH Probe"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label className="mu-lbl">Serial Number</label>
                <input
                  className="mu-inp"
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  placeholder="e.g. SN-PH-1092"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="mu-lbl">Operational Status</label>
                <select className="mu-inp" name="status" value={formData.status} onChange={handleChange}>
                  <option value="active">Active (Normal)</option>
                  <option value="inactive">Inactive</option>
                  <option value="faulty">Faulty (Requires Calibration)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="mu-btn-primary">
                  {editingSensor ? 'Update Sensor Probe' : 'Register Sensor Probe'}
                </button>
                {editingSensor && (
                  <button type="button" className="mu-act" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="mu-card table-card">
            <h2 style={{ padding: '20px 24px 10px', fontSize: '1.1rem', color: '#1c3a2a' }}>Registered Physical Sensors</h2>
            {loading ? (
              <div className="mu-loading"><div className="mu-spinner" /><p>Loading sensors...</p></div>
            ) : (
              <table className="mu-table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Parameter</th>
                    <th>Model</th>
                    <th>Serial #</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sensors.map(s => (
                    <tr key={s._id} className="mu-tr">
                      <td><code className="mu-td-num">{s.device?.device_id || 'Unknown'}</code></td>
                      <td><strong className="mu-td-name">{s.parameter?.label || 'Unassigned'}</strong> ({s.parameter?.unit})</td>
                      <td className="mu-td-dim">{s.model_name}</td>
                      <td className="mu-td-dim">{s.serial_number || '—'}</td>
                      <td>
                        <span className={`mu-badge ${s.status === 'active' ? 'mu-badge--engineer' : s.status === 'faulty' ? 'mu-badge--admin' : 'mu-badge--user'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '6px' }}>
                        <button className="mu-act" onClick={() => handleEditClick(s)}>
                          ✏️ Edit
                        </button>
                        <button className="mu-act mu-act--del" onClick={() => handleDelete(s._id)}>
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
}

export default ManageSensors;
