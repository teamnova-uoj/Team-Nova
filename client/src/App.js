import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/home";
import About from "./pages/About";
import VisitorAbout from "./pages/VisitorAbout";
import VisitorSites from "./pages/VisitorSites";
import VisitorContactus from "./pages/VisitorContactus";
import SearchResults from "./pages/SearchResults";   // <-- NEW IMPORT
import Contact from "./pages/Contact";
import Sites from "./pages/Sites";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import Alerts from "./pages/Alerts";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import ManageUsers from "./pages/ManageUsers";
import ManageDevices from "./pages/ManageDevices";
import AdminAlerts from "./pages/AdminAlerts";
import AdminMaps from "./pages/AdminMaps";
import AdminProfile from "./pages/AdminProfile";
import NegomboLagoon from "./pages/NegomboLagoon";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ================= Visitor Pages ================= */}

          <Route path="/" element={<Home />} />

          <Route
            path="/visitor-about"
            element={<VisitorAbout />}
          />

          <Route
            path="/visitor-sites"
            element={<VisitorSites />}
          />

          <Route
            path="/visitor-contactus"
            element={<VisitorContactus />}
          />

          {/* NEW SEARCH PAGE */}

          <Route
            path="/search"
            element={<SearchResults />}
          />

          {/* ================= User Pages ================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sites"
            element={
              <ProtectedRoute>
                <Sites />
              </ProtectedRoute>
            }
          />

          <Route
            path="/about"
            element={<About />}
          />

          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contact"
            element={<Contact />}
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* ================= Admin Pages ================= */}

          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manage-users"
            element={
              <ProtectedRoute adminOnly>
                <ManageUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manage-devices"
            element={
              <ProtectedRoute adminOnly>
                <ManageDevices />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-alerts"
            element={
              <ProtectedRoute adminOnly>
                <AdminAlerts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-maps"
            element={
              <ProtectedRoute adminOnly>
                <AdminMaps />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-profile"
            element={
              <ProtectedRoute adminOnly>
                <AdminProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/negombo"
            element={<NegomboLagoon />}
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;