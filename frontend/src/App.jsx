import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Signup from './pages/Signup.jsx'
import Login from './pages/Login.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import Contact from './pages/Contact.jsx'
import About from './pages/About.jsx'
import Services from './pages/Services.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx';
import 'remixicon/fonts/remixicon.css';
import ResetPassword from './pages/ResetPassword';
import MoreAbout from './pages/MoreAbout.jsx';
// Dashboards
import ClientDashboard from './Client-Pages/ClientDashboard.jsx';
import MechanicDashboard from './Mechanic-Pages/MechanicDashboard.jsx';
import RepairDetails from './Mechanic-Pages/Repairdetails.jsx';
import ReceptionistDashboard from './Receptionist-Pages/ReceptionistDashboard.jsx';
import ReceptionistClientDetails from './Receptionist-Pages/ReceptionistClientDetails';
import PartsManagerDashboard from './PartsManager-Pages/PartsManagerDashboard.jsx';
import SupervisorDashboard from './Supervisor-Pages/SupervisorDashboard.jsx';
import UserProfile from './pages/UserProfile.jsx';
import RepairVisualizer from './Receptionist-Pages/RepairVisualizer';

import './App.css'

// 🔥 FIX: Use the deployed URL instead of localhost
export const API_URL = 'https://mecapro.orkestr.run/api';

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('ACCESS_TOKEN');
  let userRole = localStorage.getItem('USER_ROLE');

  // Normalize role to ensure 'Client' matches 'client'
  const cleanRole = userRole ? userRole.trim().toLowerCase() : '';
  const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

  if (!token) return <Navigate to="/login" replace />;

  if (!normalizedAllowed.includes(cleanRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

function App() {
  const location = useLocation();

  const publicRoutes = [
    '/', '/login', '/signup', '/verify-otp', '/about', '/contact', '/services',
    '/forgot-password', '/unauthorized', '/moreabout'
  ];

  const showLayout = publicRoutes.includes(location.pathname) || location.pathname.startsWith('/reset-password');

  return (
    <div className="app-root">

      {showLayout && <Navbar />}

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verifyemail" element={<VerifyEmail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/moreabout" element={<MoreAbout />} />

        <Route path="/unauthorized" element={
          <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}>
            <h2>Access Denied</h2>
            <p>Your role is not authorized. Try logging out and back in.</p>
          </div>
        } />

        {/* --- PROTECTED ROUTES --- */}

        {/* CLIENT */}
        <Route element={<ProtectedRoute allowedRoles={['client']} />}>
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/client/profile" element={<UserProfile />} />
        </Route>

        {/* MECHANIC */}
        <Route element={<ProtectedRoute allowedRoles={['mechanic']} />}>
          <Route path="/mechanic/dashboard" element={<MechanicDashboard />} />
          <Route path="/mechanic/repair/:jobId" element={<RepairDetails />} />
          <Route path="/mechanic/profile" element={<UserProfile />} />
        </Route>

        {/* RECEPTIONIST */}
        <Route element={<ProtectedRoute allowedRoles={['receptionist']} />}>
          <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/profile" element={<UserProfile />} />
          <Route path="/receptionist/client/:id/:name" element={<ReceptionistClientDetails />} />
          <Route path="/track-repair/:repairId" element={<RepairVisualizer />} />
        </Route>

        {/* SUPERVISOR */}
        <Route element={<ProtectedRoute allowedRoles={['supervisor']} />}>
          <Route path="/supervisor/dashboard" element={<SupervisorDashboard />} />
          <Route path="/supervisor/profile" element={<UserProfile />} />
        </Route>

        {/* PARTS MANAGER */}
        <Route element={<ProtectedRoute allowedRoles={['parts_manager']} />}>
          <Route path="/partsmanager/dashboard" element={<PartsManagerDashboard />} />
          <Route path="/partsmanager/profile" element={<UserProfile />} />
        </Route>

      </Routes>

      {showLayout && <Footer />}

    </div>
  )
}

export default App;