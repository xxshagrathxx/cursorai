// Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Bell, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import LoadingScreen from '../components/LoadingScreen';
import { Patient, FollowUp } from '../types';
import { formatDate } from '../utils/dateUtils';
import { patientService, followUpService } from '../services/firestoreService';

const toDate = (value: any): Date | null => {
  if (!value) return null;
  // Firestore Timestamp
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate();
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const StatCard: React.FC<{
  icon: React.ElementType;
  title: string;
  value: number;
  subtitle?: string;
  color?: string;
  onClick?: () => void;
}> = ({ icon: Icon, title, value, subtitle, color = 'blue', onClick }) => (
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showError } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [patientsRes, followUpsRes] = await Promise.all([
          patientService.getAll(currentUser.uid),
          followUpService.getAll(currentUser.uid),
        ]);

        if (patientsRes.error) {
          showError(patientsRes.error);
          setPatients([]);
        } else {
          setPatients(patientsRes.patients || []);
        }

        if (followUpsRes.error) {
          showError(followUpsRes.error);
          setFollowUps([]);
        } else {
          setFollowUps(followUpsRes.followUps || []);
        }
      } catch (err) {
        showError((err as Error).message || 'Failed to load dashboard data');
        setPatients([]);
        setFollowUps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [currentUser, showError]);

  if (loading) return <LoadingScreen />;

  // Build a map for quick lookup of patient name
  const patientMap = patients.reduce<Record<string, Patient>>((acc, p) => {
    if (p && p.id) acc[p.id] = p;
    return acc;
  }, {});

  // Flatten follow-ups and enrich with patient name (if not present)
  const allFollowUps = followUps.map((fu) => ({
    ...fu,
    patientName: (fu as any).patientName || patientMap[fu.patientId]?.name || 'Unknown',
  }));

  // Stats
  const totalPatients = patients.length;
  const pendingFollowUps = allFollowUps.filter((f) => f.status === 'pending').length;
  const overdueFollowUps = allFollowUps.filter((f) => f.status === 'overdue').length;
  const completedToday = allFollowUps.filter((f) => {
    if (f.status !== 'completed') return false;
    const scheduled = toDate((f as any).scheduledDate) ?? new Date((f as any).scheduledDate);
    return formatDate(scheduled) === formatDate(new Date());
  }).length;

  // 4 most recent follow-ups (by scheduledDate desc)
  const recentFollowUps = [...allFollowUps]
    .sort((a, b) => {
      const da = toDate((a as any).scheduledDate);
      const db = toDate((b as any).scheduledDate);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db.getTime() - da.getTime();
    })
    .slice(0, 4);

  // 4 nearest future appointments
  const now = new Date().getTime();
  const upcomingAppointments = [...patients]
    .filter((p) => {
      if (!p.nextAppointment) return false;
      const dt = toDate((p as any).nextAppointment);
      return dt ? dt.getTime() >= now : new Date(p.nextAppointment).getTime() >= now;
    })
    .sort((a, b) => {
      const da = toDate((a as any).nextAppointment) ?? new Date(a.nextAppointment as any);
      const db = toDate((b as any).nextAppointment) ?? new Date(b.nextAppointment as any);
      return da.getTime() - db.getTime();
    })
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, Doctor!</h2>
        <p className="text-gray-600">Here's your practice overview for today</p>
      </div>

      {/* Stats */}
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
          <button onClick={() => navigate('/followups')} className="text-dental-primary text-sm font-medium">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {recentFollowUps.length > 0 ? (
            recentFollowUps.map((followUp) => (
              <div
                key={followUp.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{followUp.patientName}</p>
                  <p className="text-sm text-gray-600">{(followUp as any).notes || ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{formatDate(toDate((followUp as any).scheduledDate) ?? (followUp as any).scheduledDate)}</p>
                  <span className={`status-${followUp.status}`}>{followUp.status}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent follow-ups</p>
          )}
        </div>
      </div>

      {/* Upcoming Appointments */}
      {/* <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
          <Calendar className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((patient) => (
              <div
                key={patient.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{patient.name}</p>
                  <p className="text-sm text-gray-600">{patient.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-dental-primary">
                    {formatDate(toDate((patient as any).nextAppointment) ?? (patient as any).nextAppointment)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming appointments</p>
          )}
        </div>
      </div> */}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => navigate('/add-patient')} className="card text-center hover:shadow-md transition-shadow">
          <Users className="w-8 h-8 text-dental-primary mx-auto mb-2" />
          <p className="font-medium text-gray-900">Add Patient</p>
          <p className="text-sm text-gray-600">Register new patient</p>
        </button>
        <button onClick={() => navigate('/add-followup')} className="card text-center hover:shadow-md transition-shadow">
          <Bell className="w-8 h-8 text-dental-primary mx-auto mb-2" />
          <p className="font-medium text-gray-900">Schedule Follow-up</p>
          <p className="text-sm text-gray-600">Create follow-up reminder</p>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
