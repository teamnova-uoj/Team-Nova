import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/home";
import About from "./pages/About";
import VisitorAbout from "./pages/VisitorAbout";
import VisitorSites from "./pages/VisitorSites";
import VisitorContactus from "./pages/VisitorContactus";
import SearchResults from "./pages/SearchResults";
import Contact from "./pages/Contact";
import Sites from "./pages/Sites";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserDashboard from "./pages/UserDashboard";
import UserDevices from "./pages/UserDevices";
import UserSensors from "./pages/UserSensors";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import ManageUsers from "./pages/ManageUsers";
import ManageDevices from "./pages/ManageDevices";
import AdminAlerts from "./pages/AdminAlerts";
import AdminMaps from "./pages/AdminMaps";
import AdminProfile from "./pages/AdminProfile";
import SiteDetails from "./pages/SiteDetails";
import AdminMessages from "./pages/AdminMessages";
import ParameterAdmin from "./pages/ParameterAdmin";
import ManageSensors from "./pages/ManageSensors";
import SiteEngineerDashboard from "./pages/SiteEngineerDashboard";
import RecentLogins from "./pages/RecentLogins";
import PendingRequests from "./pages/PendingRequests";
import MyRequests from "./pages/MyRequests";

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <AuthProvider>
        <Routes>

          {/* ================= Visitor Pages ================= */}

          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/visitor-about" element={<VisitorAbout />} />
          <Route path="/visitor-sites" element={<VisitorSites />} />
          <Route path="/visitor-contactus" element={<VisitorContactus />} />

          {/* User Pages (behind login) */}
          <Route path="/dashboard" element={
            <ProtectedRoute><UserDashboard /></ProtectedRoute>
          } />
          <Route path="/devices" element={
            <ProtectedRoute><UserDevices /></ProtectedRoute>
          } />
          <Route path="/sensors" element={
            <ProtectedRoute><UserSensors /></ProtectedRoute>
          } />
          <Route path="/sites" element={
            <ProtectedRoute><Sites /></ProtectedRoute>
          } />
          <Route path="/sites/:id" element={
            <ProtectedRoute><SiteDetails /></ProtectedRoute>
          } />
          <Route path="/about" element={<About />} />
          <Route path="/alerts" element={
            <ProtectedRoute><Alerts /></ProtectedRoute>
          } />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Home />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Admin Pages (behind login + admin role) */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/pending-requests" element={
            <ProtectedRoute adminOnly><PendingRequests /></ProtectedRoute>
          } />
          <Route path="/manage-users" element={
            <ProtectedRoute adminOnly><ManageUsers /></ProtectedRoute>
          } />
          <Route path="/recent-logins" element={
            <ProtectedRoute adminOnly><RecentLogins /></ProtectedRoute>
          } />
          <Route path="/manage-devices" element={
            <ProtectedRoute allowedRoles={['admin', 'site_engineer']}><ManageDevices /></ProtectedRoute>
          } />
          <Route path="/admin-alerts" element={
            <ProtectedRoute allowedRoles={['admin', 'site_engineer']}><AdminAlerts /></ProtectedRoute>
          } />
          <Route path="/admin-maps" element={
            <ProtectedRoute allowedRoles={['admin', 'site_engineer']}><AdminMaps /></ProtectedRoute>
          } />
          <Route path="/admin-profile" element={
            <ProtectedRoute adminOnly><AdminProfile /></ProtectedRoute>
          } />
          <Route path="/admin-messages" element={
            <ProtectedRoute allowedRoles={['admin', 'site_engineer']}><AdminMessages /></ProtectedRoute>
          } />

          {/* Shared Admin & Site Engineer Pages */}
          <Route path="/my-requests" element={
            <ProtectedRoute allowedRoles={['admin', 'site_engineer']}><MyRequests /></ProtectedRoute>
          } />
          <Route path="/parameter-admin" element={
            <ProtectedRoute allowedRoles={['admin', 'site_engineer']}><ParameterAdmin /></ProtectedRoute>
          } />
          <Route path="/manage-sensors" element={
            <ProtectedRoute allowedRoles={['admin', 'site_engineer']}><ManageSensors /></ProtectedRoute>
          } />
          <Route path="/site-engineer-dashboard" element={
            <ProtectedRoute allowedRoles={['site_engineer', 'admin']}><SiteEngineerDashboard /></ProtectedRoute>
          } />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
