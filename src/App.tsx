import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home, Users, Calendar, Bell, Settings, Plus } from 'lucide-react';

// Import contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';

// Import pages
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import FollowUps from './pages/FollowUps';
import AddPatient from './pages/AddPatient';
import EditPatient from './pages/EditPatient';
import AddFollowUp from './pages/AddFollowUp';
import SettingsPage from './pages/Settings';
import AddTreatment from './components/AddTreatment';
import Login from './pages/Login';

// Import components
import BottomNavigation from './components/BottomNavigation';
import TopBar from './components/TopBar';

// Define types for navigation items
interface NavigationItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string;
  isAction?: boolean;
}

interface AddMenuItem {
  label: string;
  path: string;
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  return <>{children}</>;
};

// Main App Component
const AppContent: React.FC = () => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const { currentUser } = useAuth();

  const navigationItems: NavigationItem[] = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/' },
    { id: 'patients', icon: Users, label: 'Patients', path: '/patients' },
    { id: 'add', icon: Plus, label: 'Add', isAction: true },
    { id: 'followups', icon: Bell, label: 'Follow-ups', path: '/followups' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const addMenuItems: AddMenuItem[] = [
    { label: 'Add Patient', path: '/add-patient' },
    { label: 'Add Follow-up', path: '/add-followup' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 transition-colors duration-300">
      <TopBar />
      <main className="px-4 py-6 max-w-md mx-auto">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <Patients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <ProtectedRoute>
                <PatientDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/followups"
            element={
              <ProtectedRoute>
                <FollowUps />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-patient"
            element={
              <ProtectedRoute>
                <AddPatient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:id/edit"
            element={
              <ProtectedRoute>
                <EditPatient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-followup"
            element={
              <ProtectedRoute>
                <AddFollowUp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients/:patientId/treatments/new"
            element={
              <ProtectedRoute>
                <AddTreatment />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {currentUser && (
        <BottomNavigation
          items={navigationItems}
          showAddMenu={showAddMenu}
          setShowAddMenu={setShowAddMenu}
          addMenuItems={addMenuItems}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <AppContent />
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;