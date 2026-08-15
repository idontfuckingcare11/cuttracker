import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AppContexts.jsx';
import { Loading } from './components/ui/Loading.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Food from './pages/Food.jsx';
import Weight from './pages/Weight.jsx';
import Workout from './pages/Workout.jsx';
import Progress from './pages/Progress.jsx';
import Profile from './pages/Profile.jsx';

function AuthGuard() {
  const { user, needsOnboarding, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

function OnboardingGuard() {
  const { user, needsOnboarding, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!needsOnboarding) return <Navigate to="/app" replace />;
  return <Outlet />;
}

function GuestGuard() {
  const { user, needsOnboarding, loading } = useAuth();
  if (loading) return <Loading />;
  if (user) return <Navigate to={needsOnboarding ? '/onboarding' : '/app'} replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<GuestGuard />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>
      <Route element={<OnboardingGuard />}>
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>
      <Route element={<AuthGuard />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="food" element={<Food />} />
          <Route path="weight" element={<Weight />} />
          <Route path="weiqht" element={<Navigate to="/app/weight" replace />} />
          <Route path="workout" element={<Workout />} />
          <Route path="progress" element={<Progress />} />
          <Route path="calculator" element={<Navigate to="/app/profile" replace />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
