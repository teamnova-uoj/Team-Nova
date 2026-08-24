import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import Footer from '../components/Footer';
import './ParameterAdmin.css';

function ParameterAdmin() {
  const { user } = useAuth();
  const [parameters, setParameters] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    key: '',
    label: '',
    unit: '',
    valid_min: '',
    valid_max: '',
    description: '',
    scope: 'global',
    site: ''
  });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [paramRes, siteRes] = await Promise.all([
        api.get('/parameters?includeInactive=true'),
        api.get('/sites')
      ]);
      setParameters(paramRes.data.data || []);
      setSites(siteRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load parameters catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        key: formData.key,
        label: formData.label,
        unit: formData.unit,
        valid_min: formData.valid_min !== '' ? Number(formData.valid_min) : null,
        valid_max: formData.valid_max !== '' ? Number(formData.valid_max) : null,
        description: formData.description,
        scope: formData.scope,
        site: formData.scope === 'site' ? formData.site : null
      };

      let res;
      if (editingId) {
        res = await api.put(`/parameters/${editingId}`, payload);
        if (res.data?.pendingApproval) {
          setSuccess('Submitted for admin approval.');
        } else {
          setSuccess('Parameter updated successfully');
        }
      } else {
        res = await api.post('/parameters', payload);
        if (res.data?.pendingApproval) {
          setSuccess('Submitted for admin approval.');
        } else {
          setSuccess('New parameter created successfully');
        }
      }

      setFormData({ key: '', label: '', unit: '', valid_min: '', valid_max: '', description: '', scope: 'global', site: '' });
      setEditingId(null);
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (param) => {
    setEditingId(param._id);
    setFormData({
      key: param.key,
      label: param.label,
      unit: param.unit || '',
      valid_min: param.valid_min ?? '',
      valid_max: param.valid_max ?? '',
      description: param.description || '',
      scope: param.scope || 'global',
      site: param.site?._id || param.site || ''
    });
  };

  const handlePromote = async (paramId) => {
    try {
      setError('');
      const res = await api.put(`/parameters/${paramId}/promote`);
      setSuccess(res.data.message || 'Parameter promoted to Global status!');
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to promote parameter');
    }
  };

  const handleToggleActive = async (param) => {
    try {
      let res;
      if (param.active) {
        res = await api.delete(`/parameters/${param._id}`);
      } else {
        res = await api.put(`/parameters/${param._id}`, { active: true });
      }

      if (res.data?.pendingApproval) {
        setSuccess('Submitted for admin approval.');
      } else {
        setSuccess(`Parameter ${param.label} ${!param.active ? 'activated' : 'deactivated'}`);
      }
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change parameter status');
    }
  };

  return (
    <div className="mu-page">
      <AdminSidebar activePage="parameters" />

      <main className="mu-main">
        <div className="mu-header">
          <div>
            <p className="mu-breadcrumb">Admin › Parameter Catalog</p>
            <h1 className="mu-title">Global & Site Parameters</h1>
            <p className="mu-subtitle">
              {user?.role === 'admin'
                ? 'Configure global sensor parameters and promote site-scoped metrics.'
                : `Custom parameters created here will automatically scope to your assigned site (${user?.assignedSite?.name || 'Local Site'}).`}
            </p>
          </div>
        </div>

        {error && <div className="mu-error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <div className="parameter-grid">
          {/* Form Card */}
          <div className="mu-card parameter-form-card">
            <h2>{editingId ? 'Edit Parameter' : 'Add New Parameter'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="mu-lbl">Parameter Key (unique, e.g. "tds")</label>
                <input
                  className="mu-inp"
                  type="text"
                  name="key"
                  value={formData.key}
                  onChange={handleChange}
                  required
                  disabled={!!editingId}
                  placeholder="e.g. turbidity"
                />
              </div>

              <div className="form-group">
                <label className="mu-lbl">Label Name</label>
                <input
                  className="mu-inp"
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Turbidity"
                />
              </div>

              <div className="form-group">
                <label className="mu-lbl">Unit of Measure</label>
                <input
                  className="mu-inp"
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  placeholder="e.g. NTU, mg/L, °C"
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label className="mu-lbl">Valid Min Limit</label>
                  <input
                    className="mu-inp"
                    type="number"
                    step="any"
                    name="valid_min"
                    value={formData.valid_min}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
                <div className="form-group half">
                  <label className="mu-lbl">Valid Max Limit</label>
                  <input
                    className="mu-inp"
                    type="number"
                    step="any"
                    name="valid_max"
                    value={formData.valid_max}
                    onChange={handleChange}
                    placeholder="1000"
                  />
                </div>
              </div>

              {user?.role === 'admin' && (
                <div className="form-group">
                  <label className="mu-lbl">Catalog Scope</label>
                  <select className="mu-inp" name="scope" value={formData.scope} onChange={handleChange}>
                    <option value="global">Global (Available across all sites)</option>
                    <option value="site">Site-Scoped (Specific site only)</option>
                  </select>
                </div>
              )}

              {user?.role === 'admin' && formData.scope === 'site' && (
                <div className="form-group">
                  <label className="mu-lbl">Target Site</label>
                  <select className="mu-inp" name="site" value={formData.site} onChange={handleChange} required>
                    <option value="">-- Select Target Site --</option>
                    {sites.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.region})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="mu-lbl">Description</label>
                <textarea
                  className="mu-inp"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Parameter purpose and measurement context..."
                  style={{ height: '70px', resize: 'vertical' }}
                />
              </div>

              <div className="btn-group">
                <button type="submit" className="mu-btn-primary">
                  {editingId ? 'Update Parameter' : 'Create Parameter'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="mu-btn-sec"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ key: '', label: '', unit: '', valid_min: '', valid_max: '', description: '', scope: 'global', site: '' });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Table Card */}
          <div className="mu-card parameter-table-card">
            <h2>Parameter Catalog Entries</h2>
            {loading ? (
              <div className="mu-loading"><div className="mu-spinner" /><p>Loading catalog parameters...</p></div>
            ) : (
              <table className="mu-table">
                <thead>
                  <tr>
                    <th>Key & Label</th>
                    <th>Unit</th>
                    <th>Scope</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((param) => (
                    <tr key={param._id} className="mu-tr">
                      <td>
                        <strong className="mu-td-name">{param.label}</strong><br/>
                        <code className="mu-td-dim">{param.key}</code>
                      </td>
                      <td className="mu-td-dim">{param.unit || '—'}</td>
                      <td>
                        <span className={`scope-badge scope-${param.scope}`}>
                          {param.scope === 'global' ? '🌐 Global' : `📍 Site: ${param.site?.name || 'Local Site'}`}
                        </span>
                      </td>
                      <td>
                        <span className={`mu-badge ${param.active ? 'mu-badge--engineer' : 'mu-badge--admin'}`}>
                          {param.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="mu-actions">
                          <button className="mu-act mu-act--edit" onClick={() => handleEdit(param)}>
                            ✏ Edit
                          </button>

                          {user?.role === 'admin' && param.scope === 'site' && (
                            <button className="mu-act mu-act--edit" style={{ background: '#e6fcf5', color: '#0ca678' }} onClick={() => handlePromote(param._id)} title="Promote to Global Catalog">
                              🚀 Promote
                            </button>
                          )}

                          <button
                            className="mu-act mu-act--del"
                            onClick={() => handleToggleActive(param)}
                          >
                            {param.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
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

export default ParameterAdmin;
