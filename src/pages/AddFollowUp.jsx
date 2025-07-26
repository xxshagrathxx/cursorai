import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Bell, User, Calendar, FileText, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { samplePatients, followUpTypes } from '../data/sampleData';
import { formatDate, getNextFollowUpDate } from '../utils/dateUtils';

const AddFollowUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const preselectedPatientId = location.state?.patientId;
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      patientId: preselectedPatientId || '',
      type: '',
      scheduledDate: '',
      notes: ''
    }
  });

  const watchedPatientId = watch('patientId');
  const watchedType = watch('type');

  const selectedPatient = samplePatients.find(p => p.id === parseInt(watchedPatientId));
  const selectedFollowUpType = followUpTypes.find(ft => ft.id === watchedType);

  // Auto-calculate suggested date when patient and type are selected
  React.useEffect(() => {
    if (selectedPatient && selectedFollowUpType) {
      const suggestedDate = getNextFollowUpDate(selectedPatient.lastVisit, selectedFollowUpType);
      if (suggestedDate) {
        setValue('scheduledDate', formatDate(suggestedDate, 'yyyy-MM-dd'));
      }
    }
  }, [selectedPatient, selectedFollowUpType, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('New follow-up data:', {
      ...data,
      patientId: parseInt(data.patientId),
      patientName: selectedPatient?.name,
      followUpType: selectedFollowUpType
    });
    
    // In a real app, you would send this to your backend
    // For now, we'll navigate to the follow-ups page
    navigate('/followups');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Schedule Follow-up</h2>
          <p className="text-gray-600">Create a new follow-up reminder for a patient</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-5 h-5 text-dental-primary" />
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
              disabled={preselectedPatientId}
            >
              <option value="">Choose a patient...</option>
              {samplePatients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.phone}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
            )}
            
            {/* Patient Info Preview */}
            {selectedPatient && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-dental-primary rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedPatient.name}</h4>
                    <p className="text-sm text-gray-600">{selectedPatient.phone}</p>
                    <p className="text-sm text-gray-600">
                      Last visit: {formatDate(selectedPatient.lastVisit)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Follow-up Type */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5 text-dental-primary" />
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

            {/* Follow-up Type Info */}
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

        {/* Scheduling */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-5 h-5 text-dental-primary" />
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

        {/* Notes and Instructions */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-5 h-5 text-dental-primary" />
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
                className="w-4 h-4 text-dental-primary bg-gray-100 border-gray-300 rounded focus:ring-dental-primary focus:ring-2"
              />
              <label htmlFor="sendReminder" className="text-sm font-medium text-gray-700">
                Send automatic reminder to patient
              </label>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
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