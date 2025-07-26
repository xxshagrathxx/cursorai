import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Bell, Calendar, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { samplePatients } from '../data/sampleData';
import { formatDate, isOverdue } from '../utils/dateUtils';

const Dashboard = () => {
  const navigate = useNavigate();

  // Calculate statistics
  const totalPatients = samplePatients.length;
  const allFollowUps = samplePatients.flatMap(patient => 
    patient.followUps.map(followUp => ({ ...followUp, patientName: patient.name }))
  );
  
  const pendingFollowUps = allFollowUps.filter(f => f.status === 'pending').length;
  const overdueFollowUps = allFollowUps.filter(f => f.status === 'overdue').length;
  const completedToday = allFollowUps.filter(f => 
    f.status === 'completed' && 
    formatDate(f.scheduledDate) === formatDate(new Date())
  ).length;

  const recentFollowUps = allFollowUps
    .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))
    .slice(0, 5);

  const upcomingAppointments = samplePatients
    .filter(patient => patient.nextAppointment)
    .sort((a, b) => new Date(a.nextAppointment) - new Date(b.nextAppointment))
    .slice(0, 3);

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue', onClick }) => (
    <div 
      className={`card cursor-pointer transform transition-all duration-200 hover:scale-105 ${
        onClick ? 'hover:shadow-md' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 bg-${color}-100 rounded-full`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, Doctor!</h2>
        <p className="text-gray-600">Here's your practice overview for today</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Users}
          title="Total Patients"
          value={totalPatients}
          subtitle="Active patients"
          color="blue"
          onClick={() => navigate('/patients')}
        />
        <StatCard
          icon={Bell}
          title="Pending Follow-ups"
          value={pendingFollowUps}
          subtitle="Need attention"
          color="yellow"
          onClick={() => navigate('/followups')}
        />
        <StatCard
          icon={AlertTriangle}
          title="Overdue"
          value={overdueFollowUps}
          subtitle="Requires immediate action"
          color="red"
          onClick={() => navigate('/followups')}
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Today"
          value={completedToday}
          subtitle="Follow-ups done"
          color="green"
        />
      </div>

      {/* Recent Follow-ups */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Follow-ups</h3>
          <button 
            onClick={() => navigate('/followups')}
            className="text-dental-primary text-sm font-medium"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {recentFollowUps.length > 0 ? (
            recentFollowUps.map((followUp) => (
              <div key={followUp.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{followUp.patientName}</p>
                  <p className="text-sm text-gray-600">{followUp.notes}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{formatDate(followUp.scheduledDate)}</p>
                  <span className={`status-${followUp.status}`}>
                    {followUp.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent follow-ups</p>
          )}
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((patient) => (
              <div key={patient.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{patient.name}</p>
                  <p className="text-sm text-gray-600">{patient.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-dental-primary">
                    {formatDate(patient.nextAppointment)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming appointments</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('/add-patient')}
          className="card text-center hover:shadow-md transition-shadow"
        >
          <Users className="w-8 h-8 text-dental-primary mx-auto mb-2" />
          <p className="font-medium text-gray-900">Add Patient</p>
          <p className="text-sm text-gray-600">Register new patient</p>
        </button>
        <button 
          onClick={() => navigate('/add-followup')}
          className="card text-center hover:shadow-md transition-shadow"
        >
          <Bell className="w-8 h-8 text-dental-primary mx-auto mb-2" />
          <p className="font-medium text-gray-900">Schedule Follow-up</p>
          <p className="text-sm text-gray-600">Create follow-up reminder</p>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;