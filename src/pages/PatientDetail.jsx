import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Calendar, User, FileText, Bell, Plus, Edit } from 'lucide-react';
import { samplePatients } from '../data/sampleData';
import { formatDate, calculateAge, getTimeAgo } from '../utils/dateUtils';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const patient = samplePatients.find(p => p.id === parseInt(id));

  if (!patient) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Patient not found</p>
        <button 
          onClick={() => navigate('/patients')}
          className="btn-primary mt-4"
        >
          Back to Patients
        </button>
      </div>
    );
  }

  const age = calculateAge(patient.dateOfBirth);
  const pendingFollowUps = patient.followUps.filter(f => f.status === 'pending');
  const overdueFollowUps = patient.followUps.filter(f => f.status === 'overdue');
  const completedFollowUps = patient.followUps.filter(f => f.status === 'completed');

  const TabButton = ({ id, label, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-dental-primary text-white'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
          activeTab === id ? 'bg-white text-dental-primary' : 'bg-gray-200 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const FollowUpCard = ({ followUp }) => (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`status-${followUp.status}`}>
              {followUp.status}
            </span>
            <span className="text-sm text-gray-500">
              {followUp.type.replace('-', ' ')}
            </span>
          </div>
          <p className="text-gray-900 font-medium mb-1">{followUp.notes}</p>
          <p className="text-sm text-gray-500">
            Scheduled: {formatDate(followUp.scheduledDate)}
          </p>
        </div>
        <Bell className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );

  const TreatmentCard = ({ treatment }) => (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{treatment.treatment}</h4>
          <p className="text-sm text-gray-600 mb-2">{treatment.notes}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{formatDate(treatment.date)}</span>
            <span className="text-sm font-medium text-dental-primary">${treatment.cost}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/patients')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
          <p className="text-gray-600">Patient Details</p>
        </div>
        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Edit className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Patient Info Card */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-dental-primary rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{patient.name}</h3>
            <p className="text-gray-600">{age} years old</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center text-gray-600">
            <Phone className="w-4 h-4 mr-3" />
            <span>{patient.phone}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Mail className="w-4 h-4 mr-3" />
            <span>{patient.email}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-3" />
            <span>Born: {formatDate(patient.dateOfBirth)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-500">Last Visit</p>
            <p className="font-medium">{formatDate(patient.lastVisit)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Next Appointment</p>
            <p className="font-medium text-dental-primary">
              {patient.nextAppointment ? formatDate(patient.nextAppointment) : 'Not scheduled'}
            </p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{pendingFollowUps.length}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{overdueFollowUps.length}</div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{completedFollowUps.length}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
        <TabButton id="overview" label="Overview" />
        <TabButton id="followups" label="Follow-ups" count={patient.followUps.length} />
        <TabButton id="treatments" label="Treatments" count={patient.treatmentHistory.length} />
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {patient.followUps.slice(0, 3).map((followUp) => (
                <div key={followUp.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{followUp.notes}</p>
                    <p className="text-sm text-gray-500">{getTimeAgo(followUp.scheduledDate)}</p>
                  </div>
                  <span className={`status-${followUp.status}`}>
                    {followUp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Treatment</h3>
            {patient.treatmentHistory.length > 0 && (
              <TreatmentCard treatment={patient.treatmentHistory[0]} />
            )}
          </div>
        </div>
      )}

      {activeTab === 'followups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Follow-ups</h3>
            <button 
              onClick={() => navigate('/add-followup', { state: { patientId: patient.id } })}
              className="btn-primary text-sm py-2 px-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Follow-up
            </button>
          </div>
          
          {patient.followUps.length > 0 ? (
            <div className="space-y-3">
              {patient.followUps.map((followUp) => (
                <FollowUpCard key={followUp.id} followUp={followUp} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No follow-ups scheduled</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'treatments' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Treatment History</h3>
          {patient.treatmentHistory.length > 0 ? (
            <div className="space-y-3">
              {patient.treatmentHistory.map((treatment, index) => (
                <TreatmentCard key={index} treatment={treatment} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No treatment history available</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => navigate('/add-followup', { state: { patientId: patient.id } })}
          className="btn-secondary"
        >
          <Bell className="w-4 h-4 mr-2" />
          Schedule Follow-up
        </button>
        <button className="btn-primary">
          <Phone className="w-4 h-4 mr-2" />
          Call Patient
        </button>
      </div>
    </div>
  );
};

export default PatientDetail;