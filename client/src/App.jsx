import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SignUp from './pages/SignUp';
import VerifyEmailPending from './pages/VerifyEmailPending';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import ProfileSetup from './pages/ProfileSetup';
import MyProfile from './pages/MyProfile';
import FindMatch from './pages/FindMatch';
import QuizLanding from './pages/QuizLanding';
import QuizAttempt from './pages/QuizAttempt';
import QuizResult from './pages/QuizResult';
import MatchedProfile from './pages/MatchedProfile';
import SwapRequests from './pages/SwapRequests';
import ActiveSwap from './pages/ActiveSwap';
import CooldownSelection from './pages/CooldownSelection';
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageSkills from './pages/admin/ManageSkills';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import Meeting from './pages/Meeting';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-email-pending" element={<VerifyEmailPending />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile-setup" element={
          <ProtectedRoute>
            <ProfileSetup />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <MyProfile />
          </ProtectedRoute>
        } />
        <Route path="/find-match" element={
          <ProtectedRoute>
            <FindMatch />
          </ProtectedRoute>
        } />
        <Route path="/quiz-landing" element={
          <ProtectedRoute>
            <QuizLanding />
          </ProtectedRoute>
        } />
        <Route path="/quiz-attempt" element={
          <ProtectedRoute>
            <QuizAttempt />
          </ProtectedRoute>
        } />
        <Route path="/quiz-result" element={
          <ProtectedRoute>
            <QuizResult />
          </ProtectedRoute>
        } />
        <Route path="/profile/:userId" element={
          <ProtectedRoute>
            <MatchedProfile />
          </ProtectedRoute>
        } />
        <Route path="/swap-requests" element={
          <ProtectedRoute>
            <SwapRequests />
          </ProtectedRoute>
        } />
        <Route path="/active-swap/:id" element={
          <ProtectedRoute>
            <ActiveSwap />
          </ProtectedRoute>
        } />
        <Route path="/cooldown-selection/:id" element={
          <ProtectedRoute>
            <CooldownSelection />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="/chat/:conversationId" element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/meeting/:id" element={
          <ProtectedRoute>
            <Meeting />
          </ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        <Route path="/admin/skills" element={
          <AdminRoute>
            <ManageSkills />
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        } />
        <Route path="/admin/users/:id" element={
          <AdminRoute>
            <AdminUserDetail />
          </AdminRoute>
        } />
        <Route path="/admin/reports" element={
          <AdminRoute>
            <AdminReports />
          </AdminRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;