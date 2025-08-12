import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useToast } from '../components/Toast';
import { treatmentService } from '../services/firestoreService';
import { Treatment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save } from 'lucide-react';

interface FormData {
  treatment: string;
  date: string;
  cost: string;
  notes: string;
}

const AddTreatment: React.FC = () => {
  const { patientId } = useParams<{ patientId?: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showSuccess, showError: originalShowError } = useToast();
  const showError = (message: string) => {
    console.log('AddTreatment: Showing error toast', { message, timestamp: new Date().toISOString() });
    originalShowError(message);
  };
  const wrappedShowSuccess = (message: string) => {
    console.log('AddTreatment: Showing success toast', { message, timestamp: new Date().toISOString() });
    showSuccess(message);
  };
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      treatment: '',
      date: new Date().toISOString().split('T')[0],
      cost: '',
      notes: '',
    },
  });

  useEffect(() => {
    console.log('AddTreatment: Navigation triggered', { path: window.location.pathname, timestamp: new Date().toISOString() });
    if (!patientId) {
      console.error('AddTreatment: Invalid patientId, redirecting to /patients', { patientId });
      showError('Invalid patient ID');
      navigate('/patients');
    }
    if (!currentUser) {
      console.error('AddTreatment: No authenticated user, redirecting to /login');
      showError('You must be logged in to add a treatment');
      navigate('/login');
    }
    return () => console.log('AddTreatment: Component unmounted', { timestamp: new Date().toISOString() });
  }, [patientId, currentUser, navigate, showError]);

  const onSubmit: SubmitHandler<FormData> = async (data, event) => {
    event?.preventDefault();
    console.log('AddTreatment: Form submitted', { data, timestamp: new Date().toISOString() });

    if (!currentUser) {
      console.error('AddTreatment: No current user, cannot add treatment', { patientId });
      showError('You must be logged in to add a treatment');
      navigate('/login');
      return;
    }

    if (!patientId) {
      console.error('AddTreatment: Invalid patient ID, cannot add treatment', { patientId, userId: currentUser.uid });
      showError('Invalid patient ID');
      navigate('/patients');
      return;
    }

    setLoading(true);
    try {
      let costValue: number | null = null;
      if (data.cost) {
        const parsedCost = Number(data.cost);
        if (isNaN(parsedCost)) {
          console.error('AddTreatment: Invalid cost value', { cost: data.cost });
          showError('Cost must be a valid number');
          setLoading(false);
          return;
        }
        costValue = parsedCost;
      }

      const treatmentData: Omit<Treatment, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        patientId,
        treatment: data.treatment.trim(),
        date: data.date,
        cost: costValue,
        notes: data.notes ? data.notes.trim() : null,
      };

      console.log('AddTreatment: treatmentData (raw):', treatmentData);
      console.log('AddTreatment: Submitting treatmentData', {
        treatmentData: JSON.stringify(treatmentData, null, 2),
        userId: currentUser.uid,
      });

      const { id, error } = await treatmentService.create(treatmentData, currentUser.uid);
      if (error !== null) {
        console.error('AddTreatment: Error adding treatment:', error, {
          patientId,
          userId: currentUser.uid,
          treatmentData,
        });
        showError(`Failed to create treatment: ${error}`);
        setLoading(false);
        return;
      }
      console.log('AddTreatment: Treatment created successfully', { id, timestamp: new Date().toISOString() });
      wrappedShowSuccess('Treatment added successfully!');
      setTimeout(() => {
        console.log('AddTreatment: Navigating to patient page', { patientId, timestamp: new Date().toISOString() });
        navigate(`/patients/${patientId}`);
      }, 3000); // Delay navigation to allow toast to display
    } catch (error: any) {
      console.error('AddTreatment: Unexpected error adding treatment:', error, {
        patientId,
        userId: currentUser.uid,
      });
      showError(`Failed to add treatment: ${error.message || 'Unknown error'}`);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto mt-8">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/patients/${patientId || ''}`)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          disabled={loading}
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Add Treatment</h2>
          <p className="text-gray-600">Add a new treatment for the patient</p>
        </div>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="treatment" className="block text-sm font-medium text-gray-700 mb-2">
              Treatment *
            </label>
            <input
              id="treatment"
              type="text"
              {...register('treatment', {
                required: 'Treatment is required',
                minLength: { value: 1, message: 'Treatment cannot be empty' },
              })}
              className={`input-field ${errors.treatment ? 'border-red-500' : ''}`}
              placeholder="Enter treatment name"
            />
            {errors.treatment && (
              <p className="text-red-500 text-sm mt-1">{errors.treatment.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date *
            </label>
            <input
              id="date"
              type="date"
              {...register('date', { required: 'Date is required' })}
              className={`input-field ${errors.date ? 'border-red-500' : ''}`}
              placeholder="Enter treatment date"
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
              Cost
            </label>
            <input
              id="cost"
              type="number"
              step="0.01"
              {...register('cost', {
                validate: (value) =>
                  !value || !isNaN(Number(value)) || 'Cost must be a valid number',
              })}
              className={`input-field ${errors.cost ? 'border-red-500' : ''}`}
              placeholder="Enter cost (optional)"
            />
            {errors.cost && (
              <p className="text-red-500 text-sm mt-1">{errors.cost.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={4}
              className={`input-field resize-none ${errors.notes ? 'border-red-500' : ''}`}
              placeholder="Enter any additional notes (optional)"
            />
            {errors.notes && (
              <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/patients/${patientId || ''}`)}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Treatment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTreatment;