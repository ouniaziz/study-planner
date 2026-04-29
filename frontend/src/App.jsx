import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage       from './pages/AuthPage';
import Dashboard      from './pages/Dashboard';
import SubjectsPage   from './pages/SubjectsPage';
import PlannerPage    from './pages/PlannerPage';
import ProgressPage   from './pages/ProgressPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/subjects"  element={<ProtectedRoute><SubjectsPage /></ProtectedRoute>} />
          <Route path="/planner"   element={<ProtectedRoute><PlannerPage /></ProtectedRoute>} />
          <Route path="/progress"  element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
