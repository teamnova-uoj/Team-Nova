import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import Footer from '../components/Footer';
import api from '../services/api';
import './MyRequests.css';

function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/change-requests');
      if (res.data?.success) {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      setError('Failed to fetch your change requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || r.entityType === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const renderPayloadDiff = (req) => {
    const payload = req.payload || {};
    const { changes, form, targetSummary } = payload;

    if (req.action === 'delete') {
      return (
        <div className="mr-diff-delete-notice">
          ⚠️ <strong>Deletion Request</strong> for {targetSummary || 'target entity'}
        </div>
      );
    }

    if (req.action === 'update' && changes && Object.keys(changes).length > 0) {
      return (
        <div className="mr-diff-container">
          <div className="mr-diff-header">
            <strong>Proposed Field Modifications ({targetSummary || 'Target Entity'}):</strong>
          </div>
          <div className="mr-diff-list">
            {Object.entries(changes).map(([field, values]) => (
              <div key={field} className="mr-diff-row">
                <span className="mr-diff-fieldname">{field}:</span>
                <span className="mr-diff-old">{String(values.old ?? 'empty')}</span>
                <span className="mr-diff-arrow">➔</span>
                <span className="mr-diff-new">{String(values.new ?? 'empty')}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const dataObj = form || payload;
    const entries = Object.entries(dataObj).filter(([k]) => !['changes', 'form', 'targetSummary'].includes(k));

    if (entries.length === 0) return <em>No details specified</em>;

    return (
      <div className="mr-payload-grid">
        {entries.map(([key, val]) => (
          <div key={key} className="mr-payload-item">
            <span className="mr-payload-key">{key}:</span>{' '}
            <span className="mr-payload-val">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mu-page">
      <AdminSidebar activePage="my-requests" />
      <div className="mu-main">
        <header className="mu-header">
          <div>
            <h1 className="mu-title">My Operational Requests</h1>
            <p className="mu-subtitle">Track status of operational changes submitted for admin approval</p>
          </div>
        </header>

        <div className="mu-content">
          {error && <div className="mu-alert mu-alert--error">{error}</div>}

          {/* Filters Bar */}
          <div className="mr-filters-bar">
            <div className="mr-filter-group">
              <span className="mr-filter-label">Category:</span>
              {['all', 'device', 'sensor', 'parameter'].map((cat) => (
                <button
                  key={cat}
                  className={`mr-filter-btn ${categoryFilter === cat ? 'mr-filter-btn--active' : ''}`}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat.toUpperCase()} {cat !== 'all' && `(${requests.filter((r) => r.entityType === cat).length})`}
                </button>
              ))}
            </div>

            <div className="mr-filter-group">
              <span className="mr-filter-label">Status:</span>
              {['all', 'pending', 'approved', 'rejected'].map((st) => (
                <button
                  key={st}
                  className={`mr-filter-btn ${statusFilter === st ? 'mr-filter-btn--active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st.toUpperCase()} {st !== 'all' && `(${requests.filter((r) => r.status === st).length})`}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="mr-loading">Loading your requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="mr-empty-card">
              <span className="mr-empty-icon">📋</span>
              <h3>No Requests Found</h3>
              <p>You have no operational change requests matching the selected filters.</p>
            </div>
          ) : (
            <div className="mr-cards-list">
              {filteredRequests.map((req) => (
                <div key={req._id} className={`mr-card mr-card--status-${req.status}`}>
                  <div className="mr-card-header">
                    <div className="mr-card-tags">
                      <span className={`mr-badge mr-badge--${req.entityType}`}>{req.entityType.toUpperCase()}</span>
                      <span className={`mr-badge mr-badge--${req.action}`}>{req.action.toUpperCase()}</span>
                    </div>
                    <div className="mr-status-pill-wrap">
                      <span className={`mr-status-pill mr-status-pill--${req.status}`}>
                        {req.status === 'pending' && '⏳ Pending Approval'}
                        {req.status === 'approved' && '✓ Approved'}
                        {req.status === 'rejected' && '✕ Rejected'}
                      </span>
                    </div>
                  </div>

                  <div className="mr-card-body">
                    <div className="mr-info-grid">
                      <div>
                        <strong>Target Site:</strong> {req.site?.name || 'Site'}
                      </div>
                      <div>
                        <strong>Submitted:</strong> {new Date(req.createdAt).toLocaleString()}
                      </div>
                      {req.reviewedAt && (
                        <div>
                          <strong>Reviewed:</strong> {new Date(req.reviewedAt).toLocaleString()} by{' '}
                          {req.reviewedBy?.name || 'Admin'}
                        </div>
                      )}
                    </div>

                    <div className="mr-payload-box">
                      {renderPayloadDiff(req)}
                    </div>

                    {req.status === 'rejected' && req.adminNote && (
                      <div className="mr-admin-note">
                        <strong>Admin Feedback:</strong> {req.adminNote}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default MyRequests;
