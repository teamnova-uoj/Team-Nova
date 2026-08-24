import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import mangrove from "../assests/mangrove.png";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import UserNavbar from "../components/UserNavbar";
import Footer from "../components/Footer";

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const [avatarPreview, setAvatarPreview] = useState(null);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [editingField, setEditingField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const startEdit = (field) => {
    setFieldError("");
    setEditingField(field);
    if (field === "password") {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setFieldError("");
    setName(user?.name || "");
    setEmail(user?.email || "");
  };

  const saveNameOrEmail = async () => {
    setFieldError("");
    setSaving(true);
    try {
      const res = await api.put("/users/profile", { name, email });
      const updatedUser = res.data.data;
      localStorage.setItem("mg_user", JSON.stringify({ ...user, ...updatedUser }));
      setEditingField(null);
      window.location.reload();
    } catch (err) {
      setFieldError(err.response?.data?.message || "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    setFieldError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFieldError("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldError("New passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setFieldError("New password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.put("/auth/updatepassword", {
        currentPassword,
        newPassword,
      });
      localStorage.setItem("mg_token", res.data.token);
      setEditingField(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setFieldError(err.response?.data?.message || "Couldn't update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="profile-page"
      style={{ backgroundImage: `url(${mangrove})` }}
    >
      <div className="profile-overlay">

        {/* Navbar */}
        <UserNavbar />

        {/* Header */}
        <div className="profile-header">
          <h1>User Profile</h1>
        </div>

        {/* Centered Profile Card */}
        <div className="profile-container">

          <div className="profile-card">

            <div className="profile-image">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" />
              ) : (
                <div className="default-avatar">👤</div>
              )}
            </div>

            <label className="upload-btn">
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                hidden
              />
            </label>

            <hr />

            {fieldError && <p className="field-error">{fieldError}</p>}

            <div className="profile-details">

              {/* Name */}
              <div className="detail-row">
                <span>Full Name</span>

                {editingField === "name" ? (
                  <div className="edit-inline">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                    />
                    <button className="save-btn" onClick={saveNameOrEmail} disabled={saving}>✓</button>
                    <button className="cancel-btn" onClick={cancelEdit} disabled={saving}>✕</button>
                  </div>
                ) : (
                  <div className="value-inline">
                    <strong>{user?.name}</strong>
                    <button className="pencil-btn" onClick={() => startEdit("name")}>✎</button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="detail-row">
                <span>Email</span>

                {editingField === "email" ? (
                  <div className="edit-inline">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                    />
                    <button className="save-btn" onClick={saveNameOrEmail} disabled={saving}>✓</button>
                    <button className="cancel-btn" onClick={cancelEdit} disabled={saving}>✕</button>
                  </div>
                ) : (
                  <div className="value-inline">
                    <strong>{user?.email}</strong>
                    <button className="pencil-btn" onClick={() => startEdit("email")}>✎</button>
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="detail-row password-row">
                <span>Password</span>

                {editingField === "password" ? (
                  <div className="edit-inline password-edit">
                    <input
                      type="password"
                      placeholder="Current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoFocus
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <div className="password-edit-actions">
                      <button className="save-btn" onClick={savePassword} disabled={saving}>Save</button>
                      <button className="cancel-btn" onClick={cancelEdit} disabled={saving}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="value-inline">
                    <strong>••••••••</strong>
                    <button className="pencil-btn" onClick={() => startEdit("password")}>✎</button>
                  </div>
                )}
              </div>

            </div>

            <button className="logout-btn" onClick={handleLogout}>
              🚪 Log Out
            </button>

          </div>

        </div>

      </div>
      <Footer />
    </div>
  );
}

export default Profile;