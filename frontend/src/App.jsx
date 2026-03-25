/**
 * App.jsx – routing, providers, and sidebar-aware layout
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import PredictionsPage from './pages/PredictionsPage';
import UploadPage from './pages/UploadPage';
import ModelMetricsPage from './pages/ModelMetricsPage';
import StudentInputPage from './pages/StudentInputPage';
import StudentDashboardPage from './pages/StudentDashboardPage';

/** Protected route wrapper */
function ProtectedRoute({ children, teacherOnly = false, studentOnly = false }) {
  const { isAuthenticated, isTeacher } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (teacherOnly && !isTeacher) return <Navigate to="/my-dashboard" replace />;
  if (studentOnly && isTeacher) return <Navigate to="/dashboard" replace />;
  return children;
}

/** Layout with sidebar – reads collapse state to adjust main-content margin */
function AppLayout({ children }) {
  const { collapsed, mobileOpen, toggle } = useSidebar();

  return (
    <div className="app-layout">
      <Sidebar />

      {/* Mobile backdrop – clicking outside closes sidebar */}
      {mobileOpen && (
        <div
          onClick={toggle}
          className="sidebar-backdrop"
        />
      )}

      <main className={`main-content${collapsed ? ' sidebar-collapsed' : ''}`}>
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, isTeacher } = useAuth();
  const defaultPath = isAuthenticated ? (isTeacher ? '/dashboard' : '/my-dashboard') : '/login';

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"  element={isAuthenticated ? <Navigate to={defaultPath} /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={defaultPath} /> : <SignupPage />} />

      {/* Teacher */}
      <Route path="/dashboard" element={<ProtectedRoute teacherOnly><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/students"  element={<ProtectedRoute teacherOnly><AppLayout><StudentsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/upload"    element={<ProtectedRoute teacherOnly><AppLayout><UploadPage /></AppLayout></ProtectedRoute>} />
      <Route path="/model-metrics" element={<ProtectedRoute teacherOnly><AppLayout><ModelMetricsPage /></AppLayout></ProtectedRoute>} />

      {/* Shared */}
      <Route path="/predictions" element={<ProtectedRoute><AppLayout><PredictionsPage /></AppLayout></ProtectedRoute>} />

      {/* Student */}
      <Route path="/my-dashboard" element={<ProtectedRoute studentOnly><AppLayout><StudentDashboardPage /></AppLayout></ProtectedRoute>} />
      <Route path="/submit"       element={<ProtectedRoute studentOnly><AppLayout><StudentInputPage /></AppLayout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SidebarProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#1f2937',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
              }
            }}
          />
        </SidebarProvider>
      </AuthProvider>
    </Router>
  );
}
