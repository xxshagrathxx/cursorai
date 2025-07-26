import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Filter, Search, Clock, CheckCircle, AlertTriangle, User, Phone } from 'lucide-react';
import { samplePatients } from '../data/sampleData';
import { formatDate, isOverdue, getTimeAgo } from '../utils/dateUtils';

const FollowUps = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Flatten all follow-ups with patient information
  const allFollowUps = samplePatients.flatMap(patient => 
    patient.followUps.map(followUp => ({
      ...followUp,
      patientName: patient.name,
      patientPhone: patient.phone,
      patientId: patient.id
    }))
  );

  // Filter follow-ups
  const filteredFollowUps = allFollowUps
    .filter(followUp => {
      const matchesSearch = followUp.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           followUp.notes.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      switch (filter) {
        case 'pending':
          return followUp.status === 'pending';
        case 'overdue':
          return followUp.status === 'overdue';
        case 'completed':
          return followUp.status === 'completed';
        case 'today':
          return formatDate(followUp.scheduledDate) === formatDate(new Date());
        default:
          return true;
      }
    })
    .sort((a, b) => {
      // Sort by status priority (overdue, pending, completed) then by date
      const statusPriority = { overdue: 0, pending: 1, completed: 2 };
      const aPriority = statusPriority[a.status];
      const bPriority = statusPriority[b.status];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      return new Date(a.scheduledDate) - new Date(b.scheduledDate);
    });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'post-treatment': 'bg-blue-100 text-blue-800',
      'appointment-reminder': 'bg-green-100 text-green-800',
      'satisfaction-survey': 'bg-purple-100 text-purple-800',
      'treatment-decision': 'bg-orange-100 text-orange-800',
      'payment-reminder': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const FollowUpCard = ({ followUp }) => (
    <div 
      className="card cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/patients/${followUp.patientId}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getStatusIcon(followUp.status)}
          <div>
            <h3 className="font-semibold text-gray-900">{followUp.patientName}</h3>
            <p className="text-sm text-gray-600">{followUp.patientPhone}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(followUp.type)}`}>
          {followUp.type.replace('-', ' ')}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-gray-900 mb-1">{followUp.notes}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Scheduled: {formatDate(followUp.scheduledDate)}
          </span>
          <span className={`status-${followUp.status}`}>
            {followUp.status}
          </span>
        </div>
      </div>

      {followUp.status !== 'completed' && (
        <div className="flex space-x-2">
          <button 
            className="flex-1 py-2 px-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Mark as completed logic would go here
              console.log('Mark as completed:', followUp.id);
            }}
          >
            Mark Complete
          </button>
          <button 
            className="flex-1 py-2 px-3 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              // Call patient logic would go here
              window.open(`tel:${followUp.patientPhone}`);
            }}
          >
            <Phone className="w-4 h-4 mr-1 inline" />
            Call
          </button>
        </div>
      )}
    </div>
  );

  const FilterButton = ({ id, label, count }) => (
    <button
      onClick={() => setFilter(id)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        filter === id
          ? 'bg-dental-primary text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
          filter === id ? 'bg-white text-dental-primary' : 'bg-gray-200 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  // Calculate counts for filter buttons
  const pendingCount = allFollowUps.filter(f => f.status === 'pending').length;
  const overdueCount = allFollowUps.filter(f => f.status === 'overdue').length;
  const completedCount = allFollowUps.filter(f => f.status === 'completed').length;
  const todayCount = allFollowUps.filter(f => formatDate(f.scheduledDate) === formatDate(new Date())).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Follow-ups</h2>
        <p className="text-gray-600">Manage patient follow-up communications</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search follow-ups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <FilterButton id="all" label="All" count={allFollowUps.length} />
        <FilterButton id="overdue" label="Overdue" count={overdueCount} />
        <FilterButton id="pending" label="Pending" count={pendingCount} />
        <FilterButton id="today" label="Today" count={todayCount} />
        <FilterButton id="completed" label="Completed" count={completedCount} />
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredFollowUps.length} follow-up{filteredFollowUps.length !== 1 ? 's' : ''} found
        </p>
        {filter !== 'all' && (
          <button
            onClick={() => setFilter('all')}
            className="text-sm text-dental-primary font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Follow-ups List */}
      <div className="space-y-4">
        {filteredFollowUps.length > 0 ? (
          filteredFollowUps.map((followUp) => (
            <FollowUpCard key={`${followUp.patientId}-${followUp.id}`} followUp={followUp} />
          ))
        ) : (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No follow-ups found</p>
            <p className="text-sm text-gray-400">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Schedule some follow-ups to get started'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredFollowUps.length > 0 && (
        <div className="card bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUps;