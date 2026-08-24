import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
import Footer from "../components/Footer";
import api from "../services/api";
import "./ManageDevices.css";

function ManageDevices() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data
  const [devices, setDevices] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [siteFilter, setSiteFilter] = useState("");

  // which header dropdown is currently open: "status" | null
  const [openFilter, setOpenFilter] = useState(null);
  const filterRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 160,
});

  // Modals
  const [showAdd, setShowAdd]     = useState(false);
  const [showEdit, setShowEdit]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected]   = useState(null);

  // Forms
  const emptyForm = { device_id: "", installation_date: "", status: "active", site: "" };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving]   = useState(false);
  const [formErr, setFormErr] = useState("");

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  // ── close dropdown when clicking outside ───────────────
useEffect(() => {
  const handleClickOutside = (e) => {
    const clickedInsideTable = filterRef.current && filterRef.current.contains(e.target);
    const clickedInsideDropdown = e.target.closest(".am-th-pop");
    if (!clickedInsideTable && !clickedInsideDropdown) {
      setOpenFilter(null);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

  // ── fetch ─────────────────────────────────────────────
  const load = async () => {
  setLoading(true);
  setError("");

  try {
    const params = {};

    if (statusFilter) params.status = statusFilter;
    if (siteFilter) params.site = siteFilter;

    console.log("Status Filter:", statusFilter);
    console.log("Request Params:", params);

    const [devicesRes, sitesRes] = await Promise.all([
      api.get("/devices", { params }),
      api.get("/sites"),
    ]);

    console.log("Returned Devices:", devicesRes.data.data);

    setDevices(devicesRes.data.data || []);
    setSites(sitesRes.data.data || []);
  } catch (err) {
    console.error(err);
    setError("Could not load devices. Check that the backend is running.");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { load(); }, [statusFilter, siteFilter]);

  // ── counts ────────────────────────────────────────────
  const byStatus = (s) => devices.filter(d => d.status === s).length;

  // ── add ───────────────────────────────────────────────
  const openAdd = () => {
    setForm({ ...emptyForm, site: sites[0]?._id || "" });
    setFormErr("");
    setShowAdd(true);
  };
  const doAdd = async (e) => {
    e.preventDefault();
    if (!form.device_id.trim() || !form.installation_date || !form.site) {
      setFormErr("Device ID, installation date, and site are required.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/devices", form);
      setShowAdd(false);
      load();
      showToast("Device created successfully!");
    } catch (err) {
      setFormErr(err.response?.data?.message || "Failed to create device.");
    } finally {
      setSaving(false);
    }
  };

  // ── edit ──────────────────────────────────────────────
  const openEdit = (device) => {
    setSelected(device);
    setForm({
      device_id: device.device_id,
      installation_date: device.installation_date
        ? new Date(device.installation_date).toISOString().slice(0, 10)
        : "",
      status: device.status,
      site: device.site?._id || device.site || "",
    });
    setFormErr("");
    setShowEdit(true);
  };
  const doEdit = async (e) => {
    e.preventDefault();
    if (!form.device_id.trim() || !form.installation_date || !form.site) {
      setFormErr("Device ID, installation date, and site are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/devices/${selected._id}`, form);
      setShowEdit(false);
      load();
      if (res.data?.pendingApproval) {
        showToast("Submitted for admin approval.", "success");
      } else {
        showToast("Device updated successfully!");
      }
    } catch (err) {
      setFormErr(err.response?.data?.message || "Failed to update device.");
    } finally {
      setSaving(false);
    }
  };

  // ── delete ────────────────────────────────────────────
  const openDelete = (device) => { setSelected(device); setShowEdit(false); setShowDelete(true); };
  const doDelete = async () => {
    setSaving(true);
    try {
      const res = await api.delete(`/devices/${selected._id}`);
      setShowDelete(false);
      load();
      if (res.data?.pendingApproval) {
        showToast("Submitted for admin approval.", "success");
      } else {
        showToast("Device deleted successfully.", "delete");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete device.");
    } finally {
      setSaving(false);
    }
  };

  // ── helpers ───────────────────────────────────────────
  const fc = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const statusClass = (s) => ({ active: "rn", inactive: "rs", maintenance: "re", faulty: "rw" }[s] || "rn");
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : "—";
  const handleLogout = () => { logout(); navigate("/"); };

  const toggleFilter = (name, event) => {
  if (openFilter === name) {
    setOpenFilter(null);
    return;
  }

  const rect = event.currentTarget.getBoundingClientRect();

  setDropdownPos({
    top: rect.bottom + window.scrollY + 6,
    left: rect.left + window.scrollX,
    width: rect.width + 40,
  });

  setOpenFilter(name);
};

  const statusOptions = [
    { value: "", label: "All" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "maintenance", label: "Maintenance" },
    { value: "faulty", label: "Faulty" },
  ];

  // ── render ────────────────────────────────────────────
  return (
    <div className="am-page">

      {/* ── Sidebar ── */}
      <AdminSidebar activePage="devices" />

      {/* ── Main ── */}
      <main className="am-main">

        {/* Header */}
        <div className="am-header">
          <div>
            <p className="am-breadcrumb">Admin › Devices</p>
            <h1 className="am-title">Manage Devices</h1>
            <p className="am-subtitle">Monitor and manage sensor devices across all sites.</p>
          </div>
          <button className="am-btn-primary" onClick={openAdd}>＋ Add New Device</button>
        </div>

        {/* Stats */}
        <div className="am-stats">
          {[
            { icon: "📡", val: devices.length,          label: "Total Devices" },
            { icon: "🟢", val: byStatus("active"),      label: "Active"        },
            { icon: "🛠️", val: byStatus("maintenance"), label: "Maintenance"   },
            { icon: "🔴", val: byStatus("faulty") + byStatus("inactive"), label: "Faulty / Inactive" },
          ].map((s, i) => (
            <div className="am-stat-card" key={i}>
              <span className="am-stat-icon">{s.icon}</span>
              <div>
                <div className="am-stat-val">{s.val}</div>
                <div className="am-stat-lbl">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Site filter — separate bar above the table */}
        {user?.role !== "site_engineer" && (
          <div className="am-card" style={{ padding: "16px 20px", marginBottom: "20px", display: "flex", gap: "14px", alignItems: "center" }}>
            <label className="am-lbl" style={{ margin: 0 }}>Filter by Site:</label>
            <select className="am-inp" style={{ width: "auto" }} value={siteFilter} onChange={e => setSiteFilter(e.target.value)}>
              <option value="">All Sites</option>
              {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Error */}
        {error && <div className="am-error">{error}</div>}

        {/* Loading */}
        {loading ? (
          <div className="am-loading">
            <div className="am-spinner" />
            <p>Loading devices…</p>
          </div>
        ) : (
          /* Table */
          <div className="am-card">
            <table className="am-table" ref={filterRef}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Device ID</th>
                  <th>Site</th>

              <th className="am-th-rel">
  <span
    className="am-th-clickable"
    onClick={(e) => toggleFilter("status", e)}
  >
    Status
    <span className="am-th-arrow">▾</span>
  </span>

  {openFilter === "status" &&
    createPortal(
      <div
        className="am-th-pop"
        style={{
          position: "absolute",
          top: dropdownPos.top,
          left: dropdownPos.left,
          width: dropdownPos.width,
          zIndex: 99999,
        }}
      >
        {statusOptions.map((opt) => (
          <div
            key={opt.value}
            className={`am-th-pop-item ${
              statusFilter === opt.value
                ? "am-th-pop-item--active"
                : ""
            }`}
            onClick={() => {
              setStatusFilter(opt.value);
              setOpenFilter(null);
            }}
          >
            {opt.label}
          </div>
        ))}
      </div>,
      document.body
    )}
</th>

                  <th>Installed</th>
                  <th>Last Seen</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="am-empty">
                      No devices found. Click <strong>＋ Add New Device</strong> to get started.
                    </td>
                  </tr>
                ) : devices.map((device, i) => (
                  <tr key={device._id} className="am-tr">
                    <td className="am-td-num">{i + 1}</td>
                    <td className="am-td-name">{device.device_id}</td>
                    <td className="am-td-loc">{device.site?.name || "—"}</td>
                    <td>
                      <span className={`am-badge am-badge--${statusClass(device.status)}`}>{device.status}</span>
                    </td>
                    <td className="am-td-data">{formatDate(device.installation_date)}</td>
                    <td className="am-td-dim">{device.lastSeen ? formatDate(device.lastSeen) : "Never"}</td>
                    <td>
                      <div className="am-actions">
                        <button className="am-act am-act--edit" onClick={() => openEdit(device)}>✏ Edit</button>
                        <button className="am-act am-act--del"  onClick={() => openDelete(device)}>🗑 Delete</button>
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

      {/* ═══════ MODALS ═══════ */}

      {/* Add */}
      {showAdd && (
        <div className="am-overlay" onClick={() => setShowAdd(false)}>
          <div className="am-modal" onClick={e => e.stopPropagation()}>
            <div className="am-modal-head">
              <h2>Add New Device</h2>
              <button className="am-close" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <form className="am-modal-body" onSubmit={doAdd}>
              {formErr && <p className="am-ferr">{formErr}</p>}
              <label className="am-lbl">Device ID</label>
              <input className="am-inp" name="device_id" value={form.device_id} onChange={fc} placeholder="e.g. MGV-005" />
              <label className="am-lbl">Site</label>
              <select className="am-inp" name="site" value={form.site} onChange={fc}>
                {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <label className="am-lbl">Installation Date</label>
              <input type="date" className="am-inp" name="installation_date" value={form.installation_date} onChange={fc} />
              <label className="am-lbl">Status</label>
              <select className="am-inp" name="status" value={form.status} onChange={fc}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="faulty">Faulty</option>
              </select>
              <div className="am-modal-foot">
                <button type="button" className="am-btn-sec" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="am-btn-primary" disabled={saving}>{saving ? "Saving…" : "Create Device"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit */}
      {showEdit && (
        <div className="am-overlay" onClick={() => setShowEdit(false)}>
          <div className="am-modal" onClick={e => e.stopPropagation()}>
            <div className="am-modal-head">
              <h2>Edit Device</h2>
              <button className="am-close" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            <form className="am-modal-body" onSubmit={doEdit}>
              {formErr && <p className="am-ferr">{formErr}</p>}
              <label className="am-lbl">Device ID</label>
              <input className="am-inp" name="device_id" value={form.device_id} onChange={fc} />
              <label className="am-lbl">Site</label>
              <select className="am-inp" name="site" value={form.site} onChange={fc}>
                {sites.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <label className="am-lbl">Installation Date</label>
              <input type="date" className="am-inp" name="installation_date" value={form.installation_date} onChange={fc} />
              <label className="am-lbl">Status</label>
              <select className="am-inp" name="status" value={form.status} onChange={fc}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="faulty">Faulty</option>
              </select>
              <div className="am-modal-foot">
                <button type="button" className="am-btn-sec" onClick={() => setShowEdit(false)}>Cancel</button>
                <button type="submit" className="am-btn-primary" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete */}
      {showDelete && (
        <div className="am-overlay" onClick={() => setShowDelete(false)}>
          <div className="am-modal" onClick={e => e.stopPropagation()}>
            <div className="am-modal-head">
              <h2>Confirm Delete</h2>
              <button className="am-close" onClick={() => setShowDelete(false)}>✕</button>
            </div>
            <div className="am-modal-body">
              <p>Are you sure you want to delete <strong>{selected?.device_id}</strong>?</p>
              <div className="am-modal-foot">
                <button type="button" className="am-btn-sec" onClick={() => setShowDelete(false)}>Cancel</button>
                <button type="button" className="am-btn-danger" onClick={doDelete} disabled={saving}>
                  {saving ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`am-toast am-toast--${toast.type}`}>
          <span className="am-toast-icon">{toast.type === "delete" ? "🗑️" : "✅"}</span>
          {toast.message}
        </div>
      )}

    </div>
  );
}

export default ManageDevices;