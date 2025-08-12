import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  User,
  FileText,
  Bell,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { patientService, followUpService, treatmentService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { formatDate, calculateAge } from '../utils/dateUtils';
import LoadingScreen from '../components/LoadingScreen';
import { Patient, FollowUp, Treatment } from '../types';
import TreatmentEditForm from '../components/TreatmentEditForm';
import FollowUpCard from '../components/FollowUpCard';

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const itemsPerPage = 10;

  const [state, setState] = useState<{
    activeTab: string;
    patient: Patient | null;
    treatments: Treatment[];
    followUps: FollowUp[];
    isDeleting: boolean;
    showDeleteModal: boolean;
    deletingTreatmentId: string | null;
    loading: boolean;
    error: string | null;
    treatmentsPage: number;
    followUpsPage: number;
  }>({
    activeTab: 'overview',
    patient: null,
    treatments: [],
    followUps: [],
    isDeleting: false,
    showDeleteModal: false,
    deletingTreatmentId: null,
    loading: true,
    error: null,
    treatmentsPage: 1,
    followUpsPage: 1,
  });

  const fetchData = useCallback(async () => {
    if (!id) {
      showError('Invalid patient ID');
      setState((prev) => ({ ...prev, error: 'Invalid patient ID', loading: false }));
      navigate('/patients');
      return;
    }

    if (!currentUser) {
      showError('You must be logged in to view patient details');
      setState((prev) => ({ ...prev, error: 'Authentication required', loading: false }));
      navigate('/patients');
      return;
    }

    try {
      const [patientResponse, treatmentResponse, followUpResponse] = await Promise.all([
        patientService.getById(id),
        treatmentService.getByPatient(id, currentUser.uid),
        followUpService.getByPatient(id, currentUser.uid),
      ]);

      if (patientResponse.error || !patientResponse.patient) {
        showError(patientResponse.error || 'Patient not found');
        setState((prev) => ({ ...prev, error: patientResponse.error || 'Patient not found', loading: false }));
        navigate('/patients');
        return;
      }

      if (patientResponse.patient.userId !== currentUser.uid) {
        showError('Unauthorized: you cannot view this patient');
        setState((prev) => ({ ...prev, error: 'Unauthorized access', loading: false }));
        navigate('/patients');
        return;
      }

      setState((prev) => ({
        ...prev,
        patient: patientResponse.patient,
        treatments: treatmentResponse.error
          ? []
          : (treatmentResponse.treatments || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        followUps: followUpResponse.error
          ? []
          : (followUpResponse.followUps || []).sort(
              (a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
            ),
        loading: false,
        error: treatmentResponse.error || followUpResponse.error || null,
        treatmentsPage: 1,
        followUpsPage: 1,
      }));

      if (treatmentResponse.error) {
        showError(`Error fetching treatments: ${treatmentResponse.error}`);
      }
      if (followUpResponse.error) {
        showError(`Error fetching follow-ups: ${followUpResponse.error}`);
      }
    } catch (err) {
      const errorMessage = (err as Error).message.includes('permission-denied')
        ? 'Permission denied: check Firestore rules'
        : `Unexpected error fetching patient: ${(err as Error).message}`;
      showError(errorMessage);
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      navigate('/patients');
    }
  }, [id, currentUser, navigate, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = () => {
    if (!currentUser || !id || !state.patient) {
      showError('Cannot delete: missing user, ID, or patient data');
      return;
    }
    setState((prev) => ({ ...prev, showDeleteModal: true, deletingTreatmentId: null }));
  };

  const confirmDelete = async () => {
    if (!currentUser || !id || !state.patient) {
      showError('Cannot delete: missing user, ID, or patient data');
      setState((prev) => ({ ...prev, showDeleteModal: false, deletingTreatmentId: null }));
      return;
    }

    if (state.deletingTreatmentId) {
      // Handle treatment deletion
      setState((prev) => ({ ...prev, isDeleting: true }));
      try {
        const { error } = await treatmentService.delete(state.deletingTreatmentId, currentUser.uid);
        if (error) {
          showError(`Failed to delete treatment: ${error}`);
          setState((prev) => ({ ...prev, isDeleting: false, showDeleteModal: false, deletingTreatmentId: null }));
          return;
        }
        setState((prev) => ({
          ...prev,
          treatments: prev.treatments.filter((t) => t.id !== state.deletingTreatmentId),
          isDeleting: false,
          showDeleteModal: false,
          deletingTreatmentId: null,
        }));
        showSuccess('Treatment deleted successfully!');
      } catch (err) {
        const errorMessage = (err as Error).message.includes('permission-denied')
          ? 'Insufficient permissions: please check your access rights'
          : `Unexpected error deleting treatment: ${(err as Error).message}`;
        showError(errorMessage);
        setState((prev) => ({ ...prev, isDeleting: false, showDeleteModal: false, deletingTreatmentId: null }));
      }
    } else {
      // Handle patient deletion
      setState((prev) => ({ ...prev, isDeleting: true }));
      try {
        const { error: followUpError } = await followUpService.deleteByPatientId(id, currentUser.uid);
        if (followUpError) {
          showError(`Failed to delete follow-ups: ${followUpError}`);
          setState((prev) => ({ ...prev, isDeleting: false, showDeleteModal: false }));
          return;
        }

        const { error: treatmentError } = await treatmentService.deleteByPatientId(id, currentUser.uid);
        if (treatmentError) {
          showError(`Failed to delete treatments: ${treatmentError}`);
          setState((prev) => ({ ...prev, isDeleting: false, showDeleteModal: false }));
          return;
        }

        const { error } = await patientService.delete(id, currentUser.uid);
        if (error) {
          showError(`Failed to delete patient: ${error}`);
          setState((prev) => ({ ...prev, isDeleting: false, showDeleteModal: false }));
          return;
        }

        showSuccess('Patient deleted successfully!');
        navigate('/patients', { replace: true });
      } catch (err) {
        const errorMessage = (err as Error).message.includes('permission-denied')
          ? 'Permission denied: check Firestore rules'
          : `Unexpected error: ${(err as Error).message}`;
        showError(errorMessage);
        setState((prev) => ({ ...prev, isDeleting: false, showDeleteModal: false }));
      }
    }
  };

  const handleAddTreatment = () => {
    if (!state.patient?.id) {
      showError('Invalid patient ID');
      return;
    }
    navigate(`/patients/${state.patient.id}/treatments/new`, { state: { patientId: state.patient.id } });
  };

  const handleUpdateTreatment = async (treatmentId: string, formData: Partial<Treatment>) => {
    if (!currentUser || !state.patient) {
      showError('Cannot update treatment: please log in again');
      return;
    }
    try {
      const response = await treatmentService.update(treatmentId, formData, currentUser.uid);
      if (response.error) {
        showError(`Failed to update treatment: ${response.error}`);
        return;
      }
      setState((prev) => ({
        ...prev,
        treatments: prev.treatments.map((t) => (t.id === treatmentId ? { ...t, ...formData } : t)),
      }));
      showSuccess('Treatment updated successfully!');
    } catch (err) {
      const errorMessage = (err as Error).message.includes('permission-denied')
        ? 'Permission denied: check Firestore rules'
        : `Failed to update treatment: ${(err as Error).message}`;
      showError(errorMessage);
    }
  };

  const handleDeleteTreatment = async (treatmentId: string) => {
    if (!currentUser?.uid) {
      showError('Cannot delete treatment: please log in again');
      return;
    }
    setState((prev) => ({ ...prev, showDeleteModal: true, deletingTreatmentId: treatmentId }));
  };

  const handleUpdateFollowUp = async (followUpId: string, formData: Partial<FollowUp>) => {
    if (!currentUser || !state.patient) {
      showError('Cannot update follow-up: please log in again');
      return;
    }
    try {
      const response = await followUpService.update(followUpId, formData, currentUser.uid);
      if (response.error) {
        showError(`Failed to update follow-up: ${response.error}`);
        return;
      }
      setState((prev) => ({
        ...prev,
        followUps: prev.followUps.map((f) => (f.id === followUpId ? { ...f, ...formData } : f)),
      }));
      showSuccess('Follow-up updated successfully!');
    } catch (err) {
      const errorMessage = (err as Error).message.includes('permission-denied')
        ? 'Permission denied: check Firestore rules'
        : `Failed to update follow-up: ${(err as Error).message}`;
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
      setState((prev) => ({
        ...prev,
        followUps: prev.followUps.filter((f) => f.id !== followUpId),
      }));
      showSuccess('Follow-up deleted successfully!');
    } catch (err) {
      const errorMessage = (err as Error).message.includes('permission-denied')
        ? 'Insufficient permissions: please check your access rights'
        : `Unexpected error deleting follow-up: ${(err as Error).message}`;
      showError(errorMessage);
    }
  };

  const handleTreatmentsPageChange = (page: number) => {
    setState((prev) => ({ ...prev, treatmentsPage: page }));
  };

  const handleFollowUpsPageChange = (page: number) => {
    setState((prev) => ({ ...prev, followUpsPage: page }));
  };

  if (state.loading) {
    return <LoadingScreen />;
  }

  if (state.error || !state.patient) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{state.error || 'Patient not found'}</p>
        <button
          onClick={() => navigate('/patients')}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Back to Patients
        </button>
      </div>
    );
  }

  const totalTreatmentsPages = Math.ceil(state.treatments.length / itemsPerPage);
  const totalFollowUpsPages = Math.ceil(state.followUps.length / itemsPerPage);
  const paginatedTreatments = state.treatments.slice(
    (state.treatmentsPage - 1) * itemsPerPage,
    state.treatmentsPage * itemsPerPage
  );
  const paginatedFollowUps = state.followUps.slice(
    (state.followUpsPage - 1) * itemsPerPage,
    state.followUpsPage * itemsPerPage
  );

  const completedFollowUps = state.followUps.filter((f) => f.status === 'completed');
  const pendingFollowUps = state.followUps.filter((f) => f.status === 'pending');
  const overdueFollowUps = state.followUps.filter((f) => f.status === 'overdue');

  const TreatmentCard = ({ treatment }: { treatment: Treatment }) => {
    const [isEditing, setIsEditing] = useState(false);

    return (
      <div className="border-b border-gray-100 py-2 last:border-b-0">
        {isEditing ? (
          <TreatmentEditForm
            treatment={treatment}
            onSave={(formData) => {
              handleUpdateTreatment(treatment.id, formData);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{treatment.treatment}</p>
              <p className="text-sm text-gray-600">Date: {formatDate(treatment.date)}</p>
              {treatment.cost && (
                <p className="text-sm text-gray-600">Cost: ${treatment.cost.toFixed(2)}</p>
              )}
              {treatment.notes && (
                <p className="text-sm text-gray-600">Notes: {treatment.notes}</p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Edit className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTreatment(treatment.id);
                }}
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TabButton = ({ id, label, count }: { id: string; label: string; count?: number }) => (
    <button
      onClick={() => setState((prev) => ({ ...prev, activeTab: id }))}
      className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
        state.activeTab === id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${state.activeTab === id ? 'bg-white text-blue-500' : 'bg-gray-300 text-gray-600'}`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/patients')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{state.patient.name}</h2>
          <p className="text-gray-600">{state.patient.dateOfBirth ? calculateAge(state.patient.dateOfBirth) : 'Age not specified'} years old</p>
        </div>
        <button onClick={handleDelete} className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{state.patient.phone}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{state.patient.email || 'N/A'}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Last visit: {state.patient.lastVisit ? formatDate(state.patient.lastVisit) : 'N/A'}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>Gender: {state.patient.gender || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4">
          <p className="text-gray-600">{state.patient.notes || 'No notes available'}</p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingFollowUps.length}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{overdueFollowUps.length}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedFollowUps.length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </div>

      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
        <TabButton id="overview" label="Overview" />
        <TabButton id="followups" label="Follow-ups" count={state.followUps.length} />
        <TabButton id="treatments" label="Treatments" count={state.treatments.length} />
      </div>

      {state.activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white shadow-md rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {paginatedFollowUps.length > 0 ? (
                paginatedFollowUps.slice(0, 3).map((followUp) => (
                  <div key={followUp.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{followUp.notes}</p>
                      <p className="text-sm text-gray-600">{formatDate(followUp.scheduledDate)}</p>
                    </div>
                    <span className="capitalize text-sm font-medium text-gray-600">{followUp.status}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No recent activity</p>
              )}
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Treatment</h3>
            {paginatedTreatments.length > 0 ? (
              <TreatmentCard treatment={paginatedTreatments[0]} />
            ) : (
              <div className="text-center py-4 text-gray-600">
                <p>No recent treatment</p>
              </div>
            )}
          </div>
        </div>
      )}

      {state.activeTab === 'followups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Follow-ups</h3>
            <button
              onClick={() => navigate('/add-followup', { state: { patientId: state.patient!.id } })}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Add Follow-up
            </button>
          </div>

          {paginatedFollowUps.length > 0 ? (
            <div className="space-y-3">
              {paginatedFollowUps.map((followUp) => (
                <FollowUpCard
                  key={followUp.id}
                  followUp={{
                    ...followUp,
                    patientName: state.patient!.name,
                    patientPhone: state.patient!.phone,
                  }}
                  onUpdate={handleUpdateFollowUp}
                  onDelete={handleDeleteFollowUp}
                />
              ))}

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => handleFollowUpsPageChange(state.followUpsPage - 1)}
                  disabled={state.followUpsPage === 1}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    state.followUpsPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>

                <span className="text-gray-600">Page {state.followUpsPage} of {totalFollowUpsPages}</span>

                <button
                  onClick={() => handleFollowUpsPageChange(state.followUpsPage + 1)}
                  disabled={state.followUpsPage === totalFollowUpsPages}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    state.followUpsPage === totalFollowUpsPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No follow-ups scheduled</p>
            </div>
          )}
        </div>
      )}

      {state.activeTab === 'treatments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Treatment History</h3>
            <button onClick={handleAddTreatment} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              <Plus className="w-4 h-4 mr-2 inline" />
              Add Treatment
            </button>
          </div>

          {paginatedTreatments.length > 0 ? (
            <div className="space-y-3">
              {paginatedTreatments.map((treatment) => (
                <TreatmentCard key={treatment.id} treatment={treatment} />
              ))}

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => handleTreatmentsPageChange(state.treatmentsPage - 1)}
                  disabled={state.treatmentsPage === 1}
                  className={`px-4 py-2 rounded-lg flex items-center ${state.treatmentsPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </button>

                <span className="text-gray-600">Page {state.treatmentsPage} of {totalTreatmentsPages}</span>

                <button
                  onClick={() => handleTreatmentsPageChange(state.treatmentsPage + 1)}
                  disabled={state.treatmentsPage === totalTreatmentsPages}
                  className={`px-4 py-2 rounded-lg flex items-center ${state.treatmentsPage === totalTreatmentsPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No treatment history available</p>
            </div>
          )}
        </div>
      )}

      {state.showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-md w-full border border-gray-200 dark:border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <Trash2 className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                {state.deletingTreatmentId ? (
                  <>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      Delete {state.treatments.find((t) => t.id === state.deletingTreatmentId)?.treatment || 'Treatment'}?
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This action cannot be undone. The treatment will be permanently removed.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">Delete {state.patient!.name}?</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This action cannot be undone. All associated data will be permanently removed.
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                onClick={() => setState((prev) => ({ ...prev, showDeleteModal: false, deletingTreatmentId: null }))}
                disabled={state.isDeleting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center"
                onClick={confirmDelete}
                disabled={state.isDeleting}
              >
                {state.isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetail;