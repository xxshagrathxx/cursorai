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
import AddFollowUp from './pages/AddFollowUp';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';

// Import components
import BottomNavigation from './components/BottomNavigation';
import TopBar from './components/TopBar';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Login />;
  }
  
  return children;
};

// Main App Component
const AppContent = () => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const { currentUser } = useAuth();

  const navigationItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/' },
    { id: 'patients', icon: Users, label: 'Patients', path: '/patients' },
    { id: 'add', icon: Plus, label: 'Add', isAction: true },
    { id: 'followups', icon: Bell, label: 'Follow-ups', path: '/followups' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const addMenuItems = [
    { label: 'Add Patient', path: '/add-patient' },
    { label: 'Add Follow-up', path: '/add-followup' },
  ];

  // Show login if not authenticated
  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 transition-colors duration-300">
      <TopBar />
      
      <main className="px-4 py-6 max-w-md mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/followups" element={<FollowUps />} />
          <Route path="/add-patient" element={<AddPatient />} />
          <Route path="/add-followup" element={<AddFollowUp />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      <BottomNavigation 
        items={navigationItems}
        showAddMenu={showAddMenu}
        setShowAddMenu={setShowAddMenu}
        addMenuItems={addMenuItems}
      />
    </div>
  );
};

function App() {
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
}

export default App;