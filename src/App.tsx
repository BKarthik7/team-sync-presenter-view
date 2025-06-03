import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';
import LabAssistantDashboard from './components/LabAssistantDashboard';
import CreateTeacher from './components/CreateTeacher';
import TeamFormation from './components/TeamFormation';
import PresenterDashboard from './components/PresenterDashboard';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/logout" element={<Navigate to="/login" replace />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['lab_instructor', 'teacher']}>
              <LabAssistantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/presenter-dashboard"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <PresenterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-teacher"
          element={
            <ProtectedRoute allowedRoles={['lab_instructor']}>
              <CreateTeacher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team-formation"
          element={<TeamFormation />}
        />
        
        <Route
          path="/classes"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluations"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-team"
          element={
            <ProtectedRoute allowedRoles={['peer']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirect root to appropriate dashboard based on role */}
        <Route
          path="/"
          element={
            user ? (
              user.role === 'peer' ? (
                <Navigate to="/peer-dashboard" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
