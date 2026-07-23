import { Link } from "react-router-dom";
import { useState } from "react";
import "./Profile.css";
import mangrove from "../assests/mangrove.png";

function Profile() {

  const [profileImage, setProfileImage] = useState(null);

  const [profile, setProfile] = useState({
    fullName: "John Doe",
    email: "johndoe@gmail.com",
    status: "Active",
    memberSince: "January 2026",
    password: "",
    confirmPassword: "",
  });

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (profile.password !== profile.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    alert("Profile Updated Successfully!");
  };

  return (
    <div
      className="profile-page"
      style={{ backgroundImage: `url(${mangrove})` }}
    >
      <div className="profile-overlay">

        {/* Navbar */}

        <div className="dashboard-navbar">

          <div className="logo">
            🌿 MangroveGuard
          </div>

          <div className="nav-links">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/sites">Sites</Link>
            <Link to="/alerts">Alerts</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/profile">Profile</Link>
          </div>

        </div>

        {/* Header */}

        <div className="profile-header">
          <h1>User Profile</h1>
        </div>

        <div className="profile-container">

          {/* Left Card */}

          <div className="profile-card">

            <div className="profile-image">

              {profileImage ? (
                <img src={profileImage} alt="Profile" />
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

            <div className="profile-details">

              <div className="detail-row">
                <span>Full Name</span>
                <strong>{profile.fullName}</strong>
              </div>

              <div className="detail-row">
                <span>Email</span>
                <strong>{profile.email}</strong>
              </div>

              <div className="detail-row">
                <span>Status</span>
                <strong className="active-status">
                  {profile.status}
                </strong>
              </div>

              <div className="detail-row">
                <span>Member Since</span>
                <strong>{profile.memberSince}</strong>
              </div>

            </div>

          </div>

          {/* Right Card */}

          <div className="edit-card">

            <h2>Edit Profile</h2>

            <form onSubmit={handleSubmit}>

              <label>Full Name</label>

              <input
                type="text"
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
              />

              <label>Email Address</label>

              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
              />

              <label>Status</label>

              <select
                name="status"
                value={profile.status}
                onChange={handleChange}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>

              <label>Member Since</label>

              <input
                type="month"
                name="memberSince"
                value={profile.memberSince}
                onChange={handleChange}
              />

              <label>New Password</label>

              <input
                type="password"
                name="password"
                value={profile.password}
                onChange={handleChange}
                placeholder="Enter New Password"
              />

              <label>Confirm Password</label>

              <input
                type="password"
                name="confirmPassword"
                value={profile.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
              />

              <button type="submit">
                Save Changes
              </button>

            </form>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Profile;