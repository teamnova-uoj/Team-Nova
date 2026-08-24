import React, { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import Footer from '../components/Footer';
import api from '../services/api';
import './PendingRequests.css';

function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/change-requests?status=pending');
      if (res.data?.success) {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      setError('Failed to load pending change requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      setError('');
      const res = await api.put(`/change-requests/${id}/approve`);
      if (res.data?.success) {
        setSuccessMessage('Change request approved and changes applied successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchPendingRequests();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve change request.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (id) => {
    try {
      setProcessingId(id);
      setError('');
      const res = await api.put(`/change-requests/${id}/reject`, { adminNote });
      if (res.data?.success) {
        setSuccessMessage('Change request rejected.');
        setTimeout(() => setSuccessMessage(''), 4000);
        setRejectingId(null);
        setAdminNote('');
        fetchPendingRequests();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject change request.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'all') return true;
    return r.entityType === activeTab;
  });

  const renderPayloadDiff = (req) => {
    const payload = req.payload || {};
    const { changes, form, targetSummary } = payload;

    if (req.action === 'delete') {
      return (
        <div className="pr-diff-delete-notice">
          ⚠️ <strong>Deletion Request</strong> for {targetSummary || 'target entity'}
        </div>
      );
    }

    if (req.action === 'update' && changes && Object.keys(changes).length > 0) {
      return (
        <div className="pr-diff-container">
          <div className="pr-diff-header">
            <strong>Field Modifications ({targetSummary || 'Target Entity'}):</strong>
          </div>
          <div className="pr-diff-list">
            {Object.entries(changes).map(([field, values]) => (
              <div key={field} className="pr-diff-row">
                <span className="pr-diff-fieldname">{field}:</span>
                <span className="pr-diff-old">{String(values.old ?? 'empty')}</span>
                <span className="pr-diff-arrow">➔</span>
                <span className="pr-diff-new">{String(values.new ?? 'empty')}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const dataObj = form || payload;
    const entries = Object.entries(dataObj).filter(([k]) => !['changes', 'form', 'targetSummary'].includes(k));

    if (entries.length === 0) return <em>No payload details specified</em>;

    return (
      <div className="pr-payload-grid">
        {entries.map(([key, val]) => (
          <div key={key} className="pr-payload-item">
            <span className="pr-payload-key">{key}:</span>{' '}
            <span className="pr-payload-val">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
          </div>
        ))}
      </div>
    );
  };

  const getCountByEntity = (entity) => {
    if (entity === 'all') return requests.length;
    return requests.filter((r) => r.entityType === entity).length;
  };

  return (
    <div className="mu-page">
      <AdminSidebar activePage="pending-requests" />
      <div className="mu-main">
        <header className="mu-header">
          <div>
            <h1 className="mu-title">Pending Approval Requests</h1>
            <p className="mu-subtitle">Review, compare diffs, and approve operational changes submitted by Site Engineers</p>
          </div>
        </header>

        <div className="mu-content">
          {error && <div className="mu-alert mu-alert--error">{error}</div>}
          {successMessage && <div className="mu-alert mu-alert--success">{successMessage}</div>}

          {/* Categorization Tabs */}
          <div className="pr-category-tabs">
            {[
              { id: 'all', label: 'All Requests' },
              { id: 'device', label: 'Devices 📡' },
              { id: 'sensor', label: 'Sensors 🔬' },
              { id: 'parameter', label: 'Parameters ⚙️' }
            ].map((tab) => {
              const count = getCountByEntity(tab.id);
              return (
                <button
                  key={tab.id}
                  className={`pr-tab-btn ${activeTab === tab.id ? 'pr-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label} {count > 0 && <span className="pr-tab-count">{count}</span>}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="pr-loading">Loading pending requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="pr-empty-card">
              <span className="pr-empty-icon">✅</span>
              <h3>No Pending Requests</h3>
              <p>No operational change requests found in this category.</p>
            </div>
          ) : (
            <div className="pr-cards-list">
              {filteredRequests.map((req) => (
                <div key={req._id} className="pr-card">
                  <div className="pr-card-header">
                    <div className="pr-card-tags">
                      <span className={`pr-badge pr-badge--${req.entityType}`}>{req.entityType.toUpperCase()}</span>
                      <span className={`pr-badge pr-badge--${req.action}`}>{req.action.toUpperCase()}</span>
                    </div>
                    <span className="pr-time">{new Date(req.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="pr-card-body">
                    <div className="pr-info-grid">
                      <div>
                        <strong>Site:</strong> {req.site?.name || 'Unknown Site'} ({req.site?.location || ''})
                      </div>
                      <div>
                        <strong>Requester:</strong> {req.requestedBy?.name || 'Engineer'} ({req.requestedBy?.email || ''})
                      </div>
                    </div>

                    <div className="pr-payload-box">
                      {renderPayloadDiff(req)}
                    </div>

                    {rejectingId === req._id ? (
                      <div className="pr-reject-box">
                        <textarea
                          placeholder="Optional admin note / reason for rejection..."
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          rows={2}
                          className="pr-reject-textarea"
                        />
                        <div className="pr-reject-actions">
                          <button
                            className="pr-btn pr-btn--confirm-reject"
                            disabled={processingId === req._id}
                            onClick={() => handleRejectSubmit(req._id)}
                          >
                            {processingId === req._id ? 'Rejecting...' : 'Confirm Reject'}
                          </button>
                          <button
                            className="pr-btn pr-btn--cancel"
                            onClick={() => { setRejectingId(null); setAdminNote(''); }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pr-card-actions">
                        <button
                          className="pr-btn pr-btn--approve"
                          disabled={processingId === req._id}
                          onClick={() => handleApprove(req._id)}
                        >
                          {processingId === req._id ? 'Approving...' : '✓ Approve Change'}
                        </button>
                        <button
                          className="pr-btn pr-btn--reject"
                          disabled={processingId === req._id}
                          onClick={() => setRejectingId(req._id)}
                        >
                          ✕ Reject
                        </button>
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

export default PendingRequests;
