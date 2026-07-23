import { Link } from "react-router-dom";
import "./ManageUsers.css";
import mangrove from "../assests/mangrove.png";

function ManageUsers() {
  return (
    <div
      className="manage-users-page"
      style={{ backgroundImage: `url(${mangrove})` }}
    >
      <div className="manage-users-overlay">

        {/* Navbar */}
        <div className="admin-navbar">

          <div className="logo">
            🌿 MangroveGuard Admin
          </div>

          <div className="nav-links">
            <Link to="/admin-dashboard">Dashboard</Link>
            <Link to="/manage-users">Users</Link>
            <Link to="/manage-devices">Devices</Link>
            <Link to="/admin-alerts">Alerts</Link>
            <Link to="/admin-maps">Sites</Link>
            <Link to="/admin-profile">Profile</Link>
          </div>

        </div>

        <h1 className="title">Manage Users</h1>

        <div className="table-container">

          <table>

            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              <tr>
                <td>1</td>
                <td>Kasun Perera</td>
                <td>kasun@gmail.com</td>
                <td>User</td>
                <td>Active</td>
              </tr>

              <tr>
                <td>2</td>
                <td>Nimal Fernando</td>
                <td>nimal@gmail.com</td>
                <td>User</td>
                <td>Active</td>
              </tr>

              <tr>
                <td>3</td>
                <td>Ayesha Silva</td>
                <td>ayesha@gmail.com</td>
                <td>Admin</td>
                <td>Active</td>
              </tr>

            </tbody>

          </table>

        </div>

      </div>
    </div>
  );
}

export default ManageUsers;