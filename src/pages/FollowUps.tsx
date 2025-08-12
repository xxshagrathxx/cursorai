// FollowUps.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Filter, Search } from 'lucide-react';
import { followUpService, patientService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { FollowUp, Patient } from '../types';
import { formatDate } from '../utils/dateUtils';
import LoadingScreen from '../components/LoadingScreen';
import FollowUpCard from '../components/FollowUpCard';

const ITEMS_PER_PAGE = 10;

const FollowUps = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!currentUser?.uid) {
      showError('You must be logged in to view follow-ups');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { followUps, error: followUpError } = await followUpService.getAll(currentUser.uid);
        if (followUpError) {
          showError(followUpError);
        } else {
          setFollowUps(followUps);
        }

        const { patients, error: patientError } = await patientService.getAll(currentUser.uid);
        if (patientError) {
          showError(patientError);
        } else {
          setPatients(patients);
        }
        setLoading(false);
      } catch (error) {
        showError((error as Error).message);
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, showError]);

  const handleUpdateFollowUp = async (followUpId: string, formData: Partial<FollowUp>) => {
    if (!currentUser?.uid) {
      showError('Cannot update follow-up: please log in again');
      return;
    }
    try {
      const response = await followUpService.update(followUpId, formData, currentUser.uid);
      if (response.error) {
        showError(`Failed to update follow-up: ${response.error}`);
        return;
      }
      setFollowUps((prev) => prev.map((f) => (f.id === followUpId ? { ...f, ...formData } : f)));
      showSuccess('Follow-up updated successfully!');
    } catch (error) {
      const errorMessage = (error as Error).message.includes('permission-denied')
        ? 'You do not have permission to update this follow-up. Please contact support.'
        : `Failed to update follow-up: ${(error as Error).message}`;
      showError(errorMessage);
    }
  };

  const handleDeleteFollowUp = async (followUpId: string) => {
    if (!currentUser?.uid) {
      showError('Cannot delete follow-up: please log in again');
      return;
    }
    try {
      const { error } = await followUpService.delete(followUpId, currentUser.uid);
      if (error) {
        showError(`Failed to delete follow-up: ${error}`);
        return;
      }
      setFollowUps(prev => prev.filter(f => f.id !== followUpId));
      showSuccess('Follow-up deleted successfully!');
    } catch (error) {
      const errorMessage = (error as Error).message.includes('permission-denied')
        ? 'Permission denied: check Firestore rules'
        : `Unexpected error deleting follow-up: ${(error as Error).message}`;
      showError(errorMessage);
    }
  };
  
  const enrichedFollowUps = followUps.map(followUp => {
    const patient = patients.find(p => p.id === followUp.patientId);
    return {
      ...followUp,
      patientName: patient?.name || 'Unknown',
      patientPhone: patient?.phone || 'N/A',
    };
  });

  const filteredFollowUps = enrichedFollowUps
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
      const statusPriority = { overdue: 0, pending: 1, completed: 2 };
      const aPriority = statusPriority[a.status];
      const bPriority = statusPriority[b.status];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });

  // Pagination
  const totalPages = Math.ceil(filteredFollowUps.length / ITEMS_PER_PAGE);
  const paginatedFollowUps = filteredFollowUps.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const FilterButton = ({ id, label, count }: { id: string; label: string; count?: number }) => (
    <button
      onClick={() => {
        setFilter(id);
        setCurrentPage(1); // reset page on filter change
      }}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        filter === id
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
          filter === id ? 'bg-white text-primary' : 'bg-gray-200 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const pendingCount = followUps.filter(f => f.status === 'pending').length;
  const overdueCount = followUps.filter(f => f.status === 'overdue').length;
  const completedCount = followUps.filter(f => f.status === 'completed').length;
  const todayCount = followUps.filter(f => formatDate(f.scheduledDate) === formatDate(new Date())).length;

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Follow-ups</h2>
        <p className="text-gray-600">Manage patient follow-up communications</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search follow-ups..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // reset page on search
          }}
          className="input-field pl-10"
        />
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        <FilterButton id="all" label="All" count={followUps.length} />
        <FilterButton id="overdue" label="Overdue" count={overdueCount} />
        <FilterButton id="pending" label="Pending" count={pendingCount} />
        <FilterButton id="today" label="Today" count={todayCount} />
        <FilterButton id="completed" label="Completed" count={completedCount} />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredFollowUps.length} follow-up{filteredFollowUps.length !== 1 ? 's' : ''} found
        </p>
        {filter !== 'all' && (
          <button
            onClick={() => setFilter('all')}
            className="text-sm text-primary font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="space-y-4">
        {paginatedFollowUps.length > 0 ? (
          paginatedFollowUps.map((followUp) => (
            <FollowUpCard
              key={`${followUp.patientId}-${followUp.id}`}
              followUp={followUp}
              onUpdate={handleUpdateFollowUp}
              onDelete={handleDeleteFollowUp}
            />
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

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

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
