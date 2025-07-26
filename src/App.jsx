import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home, Users, Calendar, Bell, Settings, Plus } from 'lucide-react';

// Import pages
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import FollowUps from './pages/FollowUps';
import AddPatient from './pages/AddPatient';
import AddFollowUp from './pages/AddFollowUp';

// Import components
import BottomNavigation from './components/BottomNavigation';
import TopBar from './components/TopBar';

function App() {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const navigationItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/' },
    { id: 'patients', icon: Users, label: 'Patients', path: '/patients' },
    { id: 'add', icon: Plus, label: 'Add', isAction: true },
    { id: 'followups', icon: Bell, label: 'Follow-ups', path: '/followups' },
    { id: 'calendar', icon: Calendar, label: 'Calendar', path: '/calendar' },
  ];

  const addMenuItems = [
    { label: 'Add Patient', path: '/add-patient' },
    { label: 'Add Follow-up', path: '/add-followup' },
  ];

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 pb-20">
        <TopBar />
        
        <main className="px-4 py-6 max-w-md mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/followups" element={<FollowUps />} />
            <Route path="/add-patient" element={<AddPatient />} />
            <Route path="/add-followup" element={<AddFollowUp />} />
            <Route path="/calendar" element={<div className="text-center py-8 text-gray-500">Calendar feature coming soon!</div>} />
          </Routes>
        </main>

        <BottomNavigation 
          items={navigationItems}
          showAddMenu={showAddMenu}
          setShowAddMenu={setShowAddMenu}
          addMenuItems={addMenuItems}
        />
      </div>
    </Router>
  );
}

export default App;