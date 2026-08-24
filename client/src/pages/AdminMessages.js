import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./AdminMessages.css";

import AdminSidebar from "../components/AdminSidebar";
import Footer from "../components/Footer";

function AdminMessages() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [modalMsg, setModalMsg]       = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ to: "", subject: "", body: "" });
  const [sendStatus, setSendStatus]   = useState("");

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get("/messages");
      setMessages(res.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMessages(); }, []);

  const toggleStatus = async (id, currentStatus, e) => {
    e.stopPropagation();
    const newStatus = currentStatus === "unread" ? "read" : "unread";
    try {
      await api.put(`/messages/${id}/status`, { status: newStatus });
      setMessages(messages.map(msg =>
        msg._id === id ? { ...msg, status: newStatus } : msg
      ));
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  const handleSendReply = async (e) => {
    if (e) e.preventDefault();
    if (!composeData.body.trim()) {
      setSendStatus("error");
      return;
    }
    try {
      await api.post(`/messages/${modalMsg._id}/reply`, {
        subject: composeData.subject,
        body: composeData.body
      });
      setSendStatus("sent");
      setTimeout(() => {
        setShowCompose(false);
        setSendStatus("");
      }, 1500);
    } catch (err) {
      console.error(err);
      setSendStatus("error");
    }
  };

  const unreadCount = messages.filter(m => m.status === 'unread').length;
  const readCount   = messages.filter(m => m.status === 'read').length;

  return (
    <div className="msg-page">
      <AdminSidebar activePage="messages" />

      {/* ── Main ── */}
      <main className="msg-main">

        {/* Header */}
        <div className="msg-header">
          <div>
            <p className="msg-breadcrumb">Admin › Messages</p>
            <h1 className="msg-title">Contact Messages</h1>
            <p className="msg-subtitle">View and manage messages from users and visitors.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="msg-stats">
          {[
            { icon: "✉️", val: messages.length, label: "Total Messages"  },
            { icon: "🔴", val: unreadCount,     label: "Unread Messages" },
            { icon: "🟢", val: readCount,       label: "Read Messages"   },
          ].map((s, i) => (
            <div className="msg-stat-card" key={i}>
              <span className="msg-stat-icon">{s.icon}</span>
              <div>
                <div className="msg-stat-val">{s.val}</div>
                <div className="msg-stat-lbl">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && <div className="msg-error">{error}</div>}

        {/* Loading */}
        {loading ? (
          <div className="msg-loading">
            <div className="msg-spinner" />
            <p>Loading messages…</p>
          </div>
        ) : (
          <div className="msg-card">
            <table className="msg-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sender</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="msg-empty">No messages found.</td>
                  </tr>
                ) : messages.map((msg) => (
                  <tr
                    key={msg._id}
                    className={`msg-tr ${msg.status === 'unread' ? 'msg-tr--unread' : ''}`}
                    onClick={() => setModalMsg(msg)}
                  >
                    <td className="msg-td-dim">{new Date(msg.createdAt).toLocaleDateString()}</td>
                    <td className="msg-td-name">{msg.fullName}</td>
                    <td className="msg-td-loc">{msg.email}</td>
                    <td className="msg-td-data">{msg.subject}</td>
                    <td className="msg-td-message">
                      {msg.message?.length > 60
                        ? msg.message.substring(0, 60) + "…"
                        : msg.message}
                      {msg.message?.length > 60 && (
                        <span className="msg-read-more-btn">Read More</span>
                      )}
                    </td>
                    <td>
                      <span className={`msg-badge msg-badge--${msg.status === 'unread' ? 'rs' : 're'}`}>
                        {msg.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="msg-actions">
                        <button
                          className={`msg-act msg-act--${msg.status === 'unread' ? 'edit' : 'thresh'}`}
                          onClick={(e) => toggleStatus(msg._id, msg.status, e)}
                        >
                          {msg.status === "unread" ? "Mark as Read" : "Mark as Unread"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Footer />
      </main>

      {/* ── Full Message Modal ── */}
      {modalMsg && (
        <div className="msg-overlay" onClick={() => setModalMsg(null)}>
          <div className="msg-modal" onClick={e => e.stopPropagation()}>
            <div className="msg-modal-head">
              <div>
                <h2>{modalMsg.subject}</h2>
                <p className="msg-modal-meta">
                  From <strong>{modalMsg.fullName}</strong> · {modalMsg.email}
                </p>
              </div>
              <button className="msg-modal-close" onClick={() => setModalMsg(null)}>✕</button>
            </div>
            <div className="msg-modal-body">
              {modalMsg.message}
            </div>
            <div className="msg-modal-foot">
              <button
                type="button"
                className="msg-reply-link"
                onClick={() => {
                  setComposeData({
                    to: modalMsg.email,
                    subject: `Re: ${modalMsg.subject}`,
                    body: ""
                  });
                  setShowCompose(true);
                }}
              >
                ✉️ Reply via Email
              </button>
              <button type="button" className="msg-close-btn" onClick={() => setModalMsg(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Compose Box ── */}
      {showCompose && (
        <div className="compose-box">
          <div className="compose-head">
            <span>New Message</span>
            <button type="button" className="compose-close" onClick={() => { setShowCompose(false); setSendStatus(""); }}>✕</button>
          </div>
          <div className="compose-body">
            <div className="compose-field">
              <label>To</label>
              <input
                type="email"
                value={composeData.to}
                onChange={e => setComposeData({ ...composeData, to: e.target.value })}
              />
            </div>
            <div className="compose-field">
              <label>Subject</label>
              <input
                type="text"
                value={composeData.subject}
                onChange={e => setComposeData({ ...composeData, subject: e.target.value })}
              />
            </div>
            <textarea
              className="compose-textarea"
              placeholder="Write your reply..."
              value={composeData.body}
              onChange={e => setComposeData({ ...composeData, body: e.target.value })}
            />
            {sendStatus && (
              <p className={`compose-status ${sendStatus === "sent" ? "compose-status--ok" : "compose-status--err"}`}>
                {sendStatus === "sent" ? "✅ Reply sent successfully!" : "❌ Failed to send. Try again."}
              </p>
            )}
            <div className="compose-foot">
              <button type="button" className="compose-send-btn" onClick={handleSendReply}>
                ✉️ Send
              </button>
               <button type="button" className="compose-discard-btn" onClick={() => { setShowCompose(false); setSendStatus(""); }}>
                🗑 Discard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminMessages;