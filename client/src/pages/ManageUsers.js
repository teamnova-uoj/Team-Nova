import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
import api from "../services/api";
import {
  Users,
  ShieldCheck,
  HardHat,
  User,
  MapPin,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import "./ManageUsers.css";

function ManageUsers() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // ─────────────────────────────────────────────
  // Data
  // ─────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Role filter
  const [roleFilter, setRoleFilter] = useState("all");

  // ─────────────────────────────────────────────
  // Modal state
  // ─────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);

  // ─────────────────────────────────────────────
  // Form state
  // ─────────────────────────────────────────────
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "registered_user",
    assignedSite: "",
  });

  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  // ─────────────────────────────────────────────
  // Toast
  // ─────────────────────────────────────────────
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({
      show: true,
      message,
      type,
    });

    setTimeout(() => {
      setToast({
        show: false,
        message: "",
        type: "success",
      });
    }, 3000);
  };

  // ─────────────────────────────────────────────
  // Load users and sites
  // ─────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [userRes, siteRes] = await Promise.all([
        api.get("/users"),
        api.get("/sites"),
      ]);

      setUsers(userRes.data.data || []);
      setSites(siteRes.data.data || []);
    } catch (err) {
      console.error(err);
      setError(
        "Could not load user or site data. Check backend status."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ─────────────────────────────────────────────
  // Role counts
  // ─────────────────────────────────────────────
  const countByRole = (role) => {
    return users.filter((u) => u.role === role).length;
  };

  // ─────────────────────────────────────────────
  // Role filtering
  // ─────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    if (roleFilter === "all") {
      return true;
    }

    return u.role === roleFilter;
  });

  // ─────────────────────────────────────────────
  // Add User
  // ─────────────────────────────────────────────
  const openAdd = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      role: "registered_user",
      assignedSite: "",
    });

    setFormErr("");
    setShowAdd(true);
  };

  const doAdd = async (e) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password.trim()
    ) {
      setFormErr("Name, email and password are required.");
      return;
    }

    if (
      form.role === "site_engineer" &&
      !form.assignedSite
    ) {
      setFormErr(
        "Selecting an assigned site is required when setting role to Site Engineer."
      );
      return;
    }

    setSaving(true);

    try {
      const res = await api.post("/users", form);

      const newUserId = res.data.data._id;

      if (form.role === "site_engineer") {
        await api.put(`/users/${newUserId}/role`, {
          role: form.role,
          assignedSite: form.assignedSite,
        });
      }

      setShowAdd(false);

      await load();

      showToast("User created successfully!");
    } catch (err) {
      setFormErr(
        err.response?.data?.message ||
          "Failed to create user."
      );
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Edit User
  // ─────────────────────────────────────────────
  const openEdit = (u) => {
    setSelected(u);

    const siteId =
      u.assignedSite?._id ||
      u.assignedSite ||
      "";

    setForm({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      assignedSite: siteId,
    });

    setFormErr("");
    setShowEdit(true);
  };

  const doEdit = async (e) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim()
    ) {
      setFormErr(
        "Name and email are required."
      );
      return;
    }

    if (
      form.role === "site_engineer" &&
      !form.assignedSite
    ) {
      setFormErr(
        "Selecting an assigned site is required when setting role to Site Engineer."
      );
      return;
    }

    setSaving(true);

    try {
      // Update basic information
      await api.put(
        `/users/${selected._id}`,
        {
          name: form.name,
          email: form.email,
        }
      );

      // Update role and site assignment
      await api.put(
        `/users/${selected._id}/role`,
        {
          role: form.role,
          assignedSite: form.assignedSite,
        }
      );

      setShowEdit(false);

      await load();

      showToast(
        "User updated successfully!"
      );
    } catch (err) {
      setFormErr(
        err.response?.data?.message ||
          "Failed to update user."
      );
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Delete User
  // ─────────────────────────────────────────────
  const openDelete = (u) => {
    setSelected(u);
    setShowDelete(true);
  };

  const doDelete = async () => {
    if (!selected) return;

    setSaving(true);

    try {
      await api.delete(
        `/users/${selected._id}`
      );

      setShowDelete(false);
      setSelected(null);

      await load();

      showToast(
        "User deleted successfully.",
        "delete"
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Failed to delete user."
      );
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Form change
  // ─────────────────────────────────────────────
  const fc = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,

      // Remove site when changing away
      // from Site Engineer
      ...(name === "role" &&
      value !== "site_engineer"
        ? { assignedSite: "" }
        : {}),
    }));
  };

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  const roleClass = (role) => {
    const classes = {
      admin: "mu-badge--admin",
      site_engineer:
        "mu-badge--engineer",
      registered_user:
        "mu-badge--user",
    };

    return (
      classes[role] ||
      "mu-badge--user"
    );
  };

  const roleLabel = (role) => {
    const labels = {
      admin: "Admin",
      site_engineer:
        "Site Engineer",
      registered_user:
        "Registered User",
    };

    return labels[role] || role;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) {
      return "—";
    }

    return new Date(
      dateStr
    ).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="mu-page">
      {/* Sidebar */}
      <AdminSidebar activePage="users" />

      {/* Main */}
      <main className="mu-main">
        {/* Header */}
        <div className="mu-header">
          <div>
            <p className="mu-breadcrumb">
              Admin › Users
            </p>

            <h1 className="mu-title">
              Manage Users
            </h1>

            <p className="mu-subtitle">
              View, create, edit and
              assign roles/sites to
              system users.
            </p>
          </div>

          <button
            type="button"
            className="mu-btn-primary"
            onClick={openAdd}
          >
            ＋ Create User
          </button>
        </div>

        {/* Stats */}
        <div className="mu-stats">
          <div className="mu-stat-card">
            <span className="mu-stat-icon">
              <Users
                size={22}
                color="#2b9388"
              />
            </span>

            <div>
              <div className="mu-stat-val">
                {users.length}
              </div>

              <div className="mu-stat-lbl">
                Total Users
              </div>
            </div>
          </div>

          <div className="mu-stat-card">
            <span className="mu-stat-icon">
              <ShieldCheck
                size={22}
                color="#164e3d"
              />
            </span>

            <div>
              <div className="mu-stat-val">
                {countByRole("admin")}
              </div>

              <div className="mu-stat-lbl">
                Admins
              </div>
            </div>
          </div>

          <div className="mu-stat-card">
            <span className="mu-stat-icon">
              <HardHat
                size={22}
                color="#d97706"
              />
            </span>

            <div>
              <div className="mu-stat-val">
                {countByRole(
                  "site_engineer"
                )}
              </div>

              <div className="mu-stat-lbl">
                Site Engineers
              </div>
            </div>
          </div>

          <div className="mu-stat-card">
            <span className="mu-stat-icon">
              <User
                size={22}
                color="#1d7068"
              />
            </span>

            <div>
              <div className="mu-stat-val">
                {countByRole(
                  "registered_user"
                )}
              </div>

              <div className="mu-stat-lbl">
                Registered Users
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mu-error">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="mu-loading">
            <div className="mu-spinner" />

            <p>Loading users…</p>
          </div>
        ) : (
          <div className="mu-card">
            {/* FILTER */}
            <div className="mu-filter-bar">
              <div className="mu-filter-left">
                <label
                  htmlFor="roleFilter"
                  className="mu-filter-label"
                >
                  Filter by Role
                </label>

                <select
                  id="roleFilter"
                  className="mu-filter-select"
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter(
                      e.target.value
                    )
                  }
                >
                  <option value="all">
                    All Roles
                  </option>

                  <option value="admin">
                    Admin
                  </option>

                  <option value="site_engineer">
                    Site Engineer
                  </option>

                  <option value="registered_user">
                    Registered User
                  </option>
                </select>
              </div>

              <div className="mu-filter-result">
                Showing{" "}
                <strong>
                  {filteredUsers.length}
                </strong>{" "}
                of{" "}
                <strong>
                  {users.length}
                </strong>{" "}
                users
              </div>
            </div>

            {/* USER TABLE */}
            <div className="mu-table-wrapper">
              <table className="mu-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>
                      Role & Assignment
                    </th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="mu-empty"
                      >
                        {users.length ===
                        0 ? (
                          <>
                            No users found.
                            Click{" "}
                            <strong>
                              ＋ Create User
                            </strong>{" "}
                            to add one.
                          </>
                        ) : (
                          <>
                            No{" "}
                            {roleLabel(
                              roleFilter
                            )}{" "}
                            users found.
                          </>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(
                      (u, i) => (
                        <tr
                          key={u._id}
                          className="mu-tr"
                        >
                          <td className="mu-td-num">
                            {i + 1}
                          </td>

                          <td className="mu-td-name">
                            <div className="mu-name-row">
                              <div className="mu-avatar">
                                {u.name?.[0]?.toUpperCase() ||
                                  "U"}
                              </div>

                              {u.name}
                            </div>
                          </td>

                          <td className="mu-td-email">
                            {u.email}
                          </td>

                          <td>
                            <span
                              className={`mu-badge ${roleClass(
                                u.role
                              )}`}
                            >
                              {roleLabel(
                                u.role
                              )}
                            </span>

                            {u.role ===
                              "site_engineer" && (
                              <div className="mu-site-assignment">
                                <MapPin
                                  size={13}
                                />

                                <span>
                                  {u
                                    .assignedSite
                                    ?.name ||
                                    "Unassigned Site"}
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="mu-td-dim">
                            {formatDate(
                              u.created_at ||
                                u.createdAt
                            )}
                          </td>

                          <td>
                            <div className="mu-actions">
                              <button
                                type="button"
                                className="mu-act mu-act--edit"
                                onClick={() =>
                                  openEdit(
                                    u
                                  )
                                }
                              >
                                <Pencil
                                  size={
                                    13
                                  }
                                />
                                Edit
                              </button>

                              <button
                                type="button"
                                className="mu-act mu-act--del"
                                onClick={() =>
                                  openDelete(
                                    u
                                  )
                                }
                              >
                                <Trash2
                                  size={
                                    13
                                  }
                                />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────
          ADD USER MODAL
      ───────────────────────────────────────── */}
      {showAdd && (
        <div
          className="mu-overlay"
          onClick={() =>
            setShowAdd(false)
          }
        >
          <div
            className="mu-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="mu-modal-head">
              <h2>Create New User</h2>

              <button
                type="button"
                className="mu-close"
                onClick={() =>
                  setShowAdd(false)
                }
              >
                ✕
              </button>
            </div>

            <form
              className="mu-modal-body"
              onSubmit={doAdd}
            >
              {formErr && (
                <p className="mu-ferr">
                  {formErr}
                </p>
              )}

              <label className="mu-lbl">
                Full Name
              </label>

              <input
                className="mu-inp"
                name="name"
                value={form.name}
                onChange={fc}
                placeholder="e.g. Kasun Perera"
              />

              <label className="mu-lbl">
                Email Address
              </label>

              <input
                className="mu-inp"
                type="email"
                name="email"
                value={form.email}
                onChange={fc}
                placeholder="e.g. kasun@gmail.com"
              />

              <label className="mu-lbl">
                Password
              </label>

              <input
                className="mu-inp"
                type="password"
                name="password"
                value={form.password}
                onChange={fc}
                placeholder="Minimum 6 characters"
              />

              <label className="mu-lbl">
                Role
              </label>

              <select
                className="mu-inp"
                name="role"
                value={form.role}
                onChange={fc}
              >
                <option value="registered_user">
                  Registered User
                </option>

                <option value="site_engineer">
                  Site Engineer
                </option>

                <option value="admin">
                  Admin
                </option>
              </select>

              {form.role ===
                "site_engineer" && (
                <>
                  <label className="mu-lbl">
                    Assigned Site
                  </label>

                  <select
                    className="mu-inp"
                    name="assignedSite"
                    value={
                      form.assignedSite
                    }
                    onChange={fc}
                  >
                    <option value="">
                      -- Select Assigned
                      Site --
                    </option>

                    {sites.map((s) => (
                      <option
                        key={s._id}
                        value={s._id}
                      >
                        {s.name}
                        {s.region
                          ? ` (${s.region})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <div className="mu-modal-foot">
                <button
                  type="button"
                  className="mu-btn-sec"
                  onClick={() =>
                    setShowAdd(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="mu-btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Creating…"
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────
          EDIT USER MODAL
      ───────────────────────────────────────── */}
      {showEdit && (
        <div
          className="mu-overlay"
          onClick={() =>
            setShowEdit(false)
          }
        >
          <div
            className="mu-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="mu-modal-head">
              <h2>
                Edit User & Role
                Assignment
              </h2>

              <button
                type="button"
                className="mu-close"
                onClick={() =>
                  setShowEdit(false)
                }
              >
                ✕
              </button>
            </div>

            <form
              className="mu-modal-body"
              onSubmit={doEdit}
            >
              {formErr && (
                <p className="mu-ferr">
                  {formErr}
                </p>
              )}

              <label className="mu-lbl">
                Full Name
              </label>

              <input
                className="mu-inp"
                name="name"
                value={form.name}
                onChange={fc}
              />

              <label className="mu-lbl">
                Email Address
              </label>

              <input
                className="mu-inp"
                type="email"
                name="email"
                value={form.email}
                onChange={fc}
              />

              <label className="mu-lbl">
                System Role
              </label>

              <select
                className="mu-inp"
                name="role"
                value={form.role}
                onChange={fc}
              >
                <option value="registered_user">
                  Registered User
                </option>

                <option value="site_engineer">
                  Site Engineer
                </option>

                <option value="admin">
                  Admin
                </option>
              </select>

              {form.role ===
                "site_engineer" && (
                <>
                  <label className="mu-lbl">
                    Assigned Site
                  </label>

                  <select
                    className="mu-inp"
                    name="assignedSite"
                    value={
                      form.assignedSite
                    }
                    onChange={fc}
                  >
                    <option value="">
                      -- Select Assigned
                      Site --
                    </option>

                    {sites.map((s) => (
                      <option
                        key={s._id}
                        value={s._id}
                      >
                        {s.name}
                        {s.region
                          ? ` (${s.region})`
                          : ""}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <div className="mu-modal-foot">
                <button
                  type="button"
                  className="mu-btn-sec"
                  onClick={() =>
                    setShowEdit(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="mu-btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving…"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────
          DELETE MODAL
      ───────────────────────────────────────── */}
      {showDelete && (
        <div
          className="mu-overlay"
          onClick={() =>
            setShowDelete(false)
          }
        >
          <div
            className="mu-modal mu-modal--sm"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="mu-modal-head">
              <h2>Confirm Delete</h2>

              <button
                type="button"
                className="mu-close"
                onClick={() =>
                  setShowDelete(false)
                }
              >
                ✕
              </button>
            </div>

            <div className="mu-del-body">
              <div className="mu-del-icon">
                <Trash2
                  size={36}
                  color="#e24b4a"
                />
              </div>

              <p>
                Are you sure you want to
                delete{" "}
                <strong>
                  {selected?.name}
                </strong>
                ?
              </p>

              <p className="mu-del-warn">
                This action cannot be
                undone. All data
                associated with this user
                will be permanently
                removed.
              </p>
            </div>

            <div className="mu-modal-foot">
              <button
                type="button"
                className="mu-btn-sec"
                onClick={() =>
                  setShowDelete(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="mu-btn-danger"
                onClick={doDelete}
                disabled={saving}
              >
                {saving
                  ? "Deleting…"
                  : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div
          className={`mu-toast mu-toast--${toast.type}`}
        >
          <span className="mu-toast-icon">
            {toast.type ===
            "delete" ? (
              <Trash2 size={16} />
            ) : (
              <CheckCircle2
                size={16}
              />
            )}
          </span>

          {toast.message}
        </div>
      )}
    </div>
  );
}

export default ManageUsers;