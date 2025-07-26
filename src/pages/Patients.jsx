import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Phone, Mail, Calendar, ChevronRight, Users } from 'lucide-react';
import { samplePatients } from '../data/sampleData';
import { formatDate, calculateAge } from '../utils/dateUtils';

const Patients = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filteredPatients = samplePatients
    .filter(patient => 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'lastVisit':
          return new Date(b.lastVisit) - new Date(a.lastVisit);
        case 'nextAppointment':
          if (!a.nextAppointment) return 1;
          if (!b.nextAppointment) return -1;
          return new Date(a.nextAppointment) - new Date(b.nextAppointment);
        default:
          return 0;
      }
    });

  const PatientCard = ({ patient }) => {
    const age = calculateAge(patient.dateOfBirth);
    const pendingFollowUps = patient.followUps.filter(f => f.status === 'pending').length;
    const overdueFollowUps = patient.followUps.filter(f => f.status === 'overdue').length;

    return (
      <div 
        className="card cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(`/patients/${patient.id}`)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{patient.name}</h3>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-1 mb-3">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                {patient.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {patient.email}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-500">Age: </span>
                <span className="font-medium">{age} years</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Last visit: </span>
                <span className="font-medium">{formatDate(patient.lastVisit)}</span>
              </div>
            </div>

            {/* Follow-up Status */}
            {(pendingFollowUps > 0 || overdueFollowUps > 0) && (
              <div className="flex items-center space-x-2 mt-3">
                {pendingFollowUps > 0 && (
                  <span className="status-pending">
                    {pendingFollowUps} pending
                  </span>
                )}
                {overdueFollowUps > 0 && (
                  <span className="status-overdue">
                    {overdueFollowUps} overdue
                  </span>
                )}
              </div>
            )}

            {/* Next Appointment */}
            {patient.nextAppointment && (
              <div className="flex items-center mt-2 text-sm">
                <Calendar className="w-4 h-4 mr-2 text-dental-primary" />
                <span className="text-dental-primary font-medium">
                  Next: {formatDate(patient.nextAppointment)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Patients</h2>
        <p className="text-gray-600">Manage your patient records</p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-dental-primary focus:border-transparent"
          >
            <option value="name">Name</option>
            <option value="lastVisit">Last Visit</option>
            <option value="nextAppointment">Next Appointment</option>
          </select>
        </div>
      </div>

      {/* Patient Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Patients List */}
      <div className="space-y-4">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No patients found</p>
            <p className="text-sm text-gray-400">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Patients;