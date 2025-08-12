import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Bell, User, Calendar, FileText, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { followUpService, patientService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { Patient, FollowUp } from '../types';
import { formatDate, getNextFollowUpDate } from '../utils/dateUtils';

interface FormData extends Omit<FollowUp, 'id' | 'userId' | 'patientId' | 'status' | 'createdAt' | 'updatedAt'> {
  patientId: string;
}

const followUpTypes = [
  { id: 'post-treatment', name: 'Post-Treatment', description: 'Follow-up after treatment', defaultDays: 30 },
  { id: 'appointment-reminder', name: 'Appointment Reminder', description: 'Reminder for upcoming appointment', defaultDays: 7 },
  { id: 'satisfaction-survey', name: 'Satisfaction Survey', description: 'Patient satisfaction survey', defaultDays: 14 },
  { id: 'treatment-decision', name: 'Treatment Decision', description: 'Follow-up for treatment decisions', defaultDays: 7 },
  { id: 'payment-reminder', name: 'Payment Reminder', description: 'Reminder for outstanding payments', defaultDays: 30 },
];

const AddFollowUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const preselectedPatientId = location.state?.patientId;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      patientId: preselectedPatientId || '',
      type: '',
      scheduledDate: '',
      scheduledTime: '',
      notes: '',
      priority: 'normal',
      sendReminder: false,
    }
  });

  const watchedPatientId = watch('patientId');
  const watchedType = watch('type');

  useEffect(() => {
    if (!currentUser) {
      console.error('No current user, skipping patient fetch');
      showError('You must be logged in to schedule a follow-up');
      setIsLoading(false);
      return;
    }

    const fetchPatients = async () => {
      try {
        console.log('Fetching patients for userId:', currentUser.uid);
        const { patients, error } = await patientService.getAll(currentUser.uid);
        if (error) {
          console.error('Patient fetch error:', error);
          showError(error);
        } else {
          console.log('Fetched patients:', patients);
          setPatients(patients);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Unexpected error fetching patients:', error);
        showError((error as Error).message);
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [currentUser, showError]);

  const selectedPatient = patients.find(p => p.id === watchedPatientId);
  const selectedFollowUpType = followUpTypes.find(ft => ft.id === watchedType);

  useEffect(() => {
    if (selectedPatient && selectedFollowUpType) {
      const suggestedDate = getNextFollowUpDate(selectedPatient.lastVisit, selectedFollowUpType);
      if (suggestedDate) {
        setValue('scheduledDate', formatDate(suggestedDate, 'yyyy-MM-dd'));
      }
    }
  }, [selectedPatient, selectedFollowUpType, setValue]);

  const onSubmit = async (data: FormData) => {
    if (!currentUser) {
      console.error('No current user, cannot schedule follow-up');
      showError('You must be logged in to schedule a follow-up');
      return;
    }

    if (!data.patientId) {
      console.error('No patient selected');
      showError('Please select a patient');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting follow-up for patientId:', data.patientId, 'userId:', currentUser.uid);
      console.log('Form data:', data);

      const { id, error } = await followUpService.create(data, currentUser.uid, data.patientId);
      if (error) {
        console.error('Follow-up creation error:', error, { userId: currentUser.uid, patientId: data.patientId, data });
        showError(`Failed to schedule follow-up: ${error}`);
      } else {
        console.log('Follow-up created successfully, id:', id);
        showSuccess('Follow-up scheduled successfully!');
        // Navigate back to PatientDetail if preselected, else to FollowUps
        navigate(preselectedPatientId ? `/patients/${preselectedPatientId}` : '/followups');
      }
    } catch (error) {
      console.error('Unexpected error creating follow-up:', error, { userId: currentUser.uid, patientId: data.patientId, data });
      showError(`Unexpected error: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate(preselectedPatientId ? `/patients/${preselectedPatientId}` : '/followups')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Schedule Follow-up</h2>
          <p className="text-gray-600">Create a new follow-up reminder for a patient</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Select Patient</h3>
          </div>
          
          <div>
            <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
              Patient *
            </label>
            <select
              id="patientId"
              {...register('patientId', { required: 'Please select a patient' })}
              className={`input-field ${errors.patientId ? 'border-red-500' : ''}`}
              disabled={preselectedPatientId || isSubmitting}
            >
              <option value="">Choose a patient...</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.phone}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
            )}
            
            {selectedPatient && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedPatient.name}</h4>
                    <p className="text-sm text-gray-600">{selectedPatient.phone}</p>
                    <p className="text-sm text-gray-600">
                      Last visit: {selectedPatient.lastVisit ? formatDate(selectedPatient.lastVisit) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Follow-up Type</h3>
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Type of Follow-up *
            </label>
            <select
              id="type"
              {...register('type', { required: 'Please select a follow-up type' })}
              className={`input-field ${errors.type ? 'border-red-500' : ''}`}
            >
              <option value="">Choose follow-up type...</option>
              {followUpTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
            )}

            {selectedFollowUpType && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{selectedFollowUpType.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{selectedFollowUpType.description}</p>
                <p className="text-sm text-gray-500">
                  Default timing: {selectedFollowUpType.defaultDays} days after last treatment
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Date *
              </label>
              <input
                id="scheduledDate"
                type="date"
                {...register('scheduledDate', { required: 'Please select a follow-up date' })}
                className={`input-field ${errors.scheduledDate ? 'border-red-500' : ''}`}
                min={formatDate(new Date(), 'yyyy-MM-dd')}
              />
              {errors.scheduledDate && (
                <p className="text-red-500 text-sm mt-1">{errors.scheduledDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time
              </label>
              <select
                id="scheduledTime"
                {...register('scheduledTime')}
                className="input-field"
              >
                <option value="">Any time</option>
                <option value="morning">Morning (9:00 AM - 12:00 PM)</option>
                <option value="afternoon">Afternoon (12:00 PM - 5:00 PM)</option>
                <option value="evening">Evening (5:00 PM - 8:00 PM)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Notes & Instructions</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Follow-up Notes *
              </label>
              <textarea
                id="notes"
                {...register('notes', { 
                  required: 'Please provide notes for this follow-up',
                  minLength: { value: 10, message: 'Notes must be at least 10 characters' }
                })}
                rows={4}
                className={`input-field resize-none ${errors.notes ? 'border-red-500' : ''}`}
                placeholder="Describe what this follow-up is for and any specific instructions..."
              />
              {errors.notes && (
                <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <select
                id="priority"
                {...register('priority')}
                className="input-field"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="sendReminder"
                type="checkbox"
                {...register('sendReminder')}
                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
              />
              <label htmlFor="sendReminder" className="text-sm font-medium text-gray-700">
                Send automatic reminder to patient
              </label>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate(preselectedPatientId ? `/patients/${preselectedPatientId}` : '/followups')}
            className="flex-1 btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Scheduling...
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Schedule Follow-up
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddFollowUp;