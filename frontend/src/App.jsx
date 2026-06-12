import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Website from './pages/Website';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorDashboard from './pages/doctor/Dashboard';
import PatientAnalysisForm from './pages/PatientAnalysisForm';
import SearchResult from './pages/SearchResult';
import ReportAnalysis from './pages/ReportAnalysis';
import ReportAnalyzer from './pages/ReportAnalyzer';
import Prescription from './pages/Prescription';
import PatientPortal from './pages/PatientPortal';
import DigitalPharmacy from './pages/DigitalPharmacy';
import Appointments from './pages/Appointments';
import ClinicProfile from './pages/ClinicProfile';
import PatientRegister from './pages/PatientRegister';
import NewCase from './pages/NewCase';
import Payment from './pages/Payment';
import Referral from './pages/Referral';
import VideoLibrary from './pages/VideoLibrary';
import AdminDashboard from './pages/admin/AdminDashboard';
import DoctorManagement from './pages/admin/DoctorManagement';
import SubscriptionManager from './pages/admin/SubscriptionManager';
import RevenueAnalytics from './pages/admin/RevenueAnalytics';
import SystemSettings from './pages/admin/SystemSettings';
import ChangePassword from './pages/ChangePassword';
import AdminShell from './components/admin/AdminShell';
import SuperAdmin from './pages/SuperAdmin';
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin';
import {
  ProtectedRoute,
  PublicRoute,
  SuperAdminRoute,
  SuperAdminPublicRoute,
  SuperAdminEntryRedirect,
  AdminOnlyRoute,
  AdminPublicRoute,
  ChangePasswordRoute
} from './security/routeGuards';
import AdminLogin from './pages/admin/AdminLogin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — no login */}
        <Route path="/" element={<Welcome />} />
        <Route path="/website" element={<Website />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/welcome" element={<Navigate to="/" replace />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/change-password"
          element={
            <ChangePasswordRoute>
              <ChangePassword />
            </ChangePasswordRoute>
          }
        />

        {/* Super Admin — master control */}
        <Route
          path="/super-admin/login"
          element={
            <SuperAdminPublicRoute>
              <SuperAdminLogin />
            </SuperAdminPublicRoute>
          }
        />
        <Route path="/super-admin" element={<SuperAdminEntryRedirect />} />
        <Route
          path="/super-admin/*"
          element={
            <SuperAdminRoute>
              <SuperAdmin />
            </SuperAdminRoute>
          }
        />

        {/* Admin panel — separate login & layout */}
        <Route
          path="/admin/login"
          element={
            <AdminPublicRoute>
              <AdminLogin />
            </AdminPublicRoute>
          }
        />
        <Route element={<AdminOnlyRoute />}>
          <Route element={<AdminShell />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/doctors" element={<DoctorManagement />} />
            <Route path="/admin/subscriptions" element={<SubscriptionManager />} />
            <Route path="/admin/revenue" element={<RevenueAnalytics />} />
            <Route path="/admin/settings" element={<SystemSettings />} />
          </Route>
        </Route>

        {/* Protected — doctor app */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DoctorDashboard />} />
          <Route path="/pharmacy" element={<DigitalPharmacy />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/profile" element={<ClinicProfile />} />
          <Route path="/clinic-profile" element={<Navigate to="/profile" replace />} />
          <Route path="/search" element={<PatientAnalysisForm />} />
          <Route path="/search/result" element={<SearchResult />} />
          <Route path="/formula-maker" element={<Navigate to="/search" replace />} />
          <Route path="/reports" element={<ReportAnalysis />} />
          <Route path="/report-analysis" element={<ReportAnalyzer />} />
          <Route path="/prescription" element={<Prescription />} />
          <Route path="/patient" element={<PatientPortal />} />
          <Route path="/patient/register" element={<PatientRegister />} />
          <Route path="/case/new" element={<NewCase />} />
          <Route path="/case/cdss" element={<Navigate to="/search" replace />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/videos" element={<VideoLibrary />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
