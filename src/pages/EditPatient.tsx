import React, { useState, useEffect } from 'react';
  import { useNavigate, useParams } from 'react-router-dom';
  import { ArrowLeft, User, Phone, Mail, Calendar, Save } from 'lucide-react';
  import { useForm } from 'react-hook-form';
  import { patientService } from '../services/firestoreService';
  import { useAuth } from '../contexts/AuthContext';
  import { useToast } from '../components/Toast';
  import { Patient } from '../types';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';

  interface FormData extends Omit<Patient, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'treatmentHistory' | 'followUps'> {}

  const EditPatient = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { currentUser } = useAuth();
    const { showSuccess, showError } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
      defaultValues: {
        name: '',
        phone: '',
        email: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        city: '',
        zipCode: '',
        emergencyContact: '',
        allergies: '',
        medications: '',
        medicalHistory: '',
        insuranceProvider: '',
        policyNumber: '',
      }
    });

    useEffect(() => {
      if (!currentUser || !id) {
        console.error('No current user or patient ID', { currentUser, id });
        showError('You must be logged in to edit a patient');
        setIsLoading(false);
        return;
      }

      const fetchPatient = async () => {
        console.log('Fetching patient with id:', id, 'userId:', currentUser.uid);
        try {
          const { patient, error } = await patientService.getById(id);
          if (error || !patient) {
            console.error('Error fetching patient:', error, { id, userId: currentUser.uid });
            showError(`Failed to load patient: ${error}`);
            setIsLoading(false);
            return;
          }
          if (patient.userId !== currentUser.uid) {
            console.error('Unauthorized: patient userId does not match', { patientUserId: patient.userId, userId: currentUser.uid });
            showError('Unauthorized: you cannot edit this patient');
            setIsLoading(false);
            return;
          }
          console.log('Fetched patient data:', patient);
          reset({
            name: patient.name || '',
            phone: patient.phone || '',
            email: patient.email || '',
            dateOfBirth: patient.dateOfBirth || '',
            gender: patient.gender || '',
            address: patient.address || '',
            city: patient.city || '',
            zipCode: patient.zipCode || '',
            emergencyContact: patient.emergencyContact || '',
            allergies: patient.allergies || '',
            medications: patient.medications || '',
            medicalHistory: patient.medicalHistory || '',
            insuranceProvider: patient.insuranceProvider || '',
            policyNumber: patient.policyNumber || '',
          });
          setIsLoading(false);
        } catch (error) {
          console.error('Unexpected error fetching patient:', error, { id, userId: currentUser.uid });
          showError(`Unexpected error: ${(error as Error).message}`);
          setIsLoading(false);
        }
      };

      fetchPatient();
    }, [currentUser, id, reset, showError]);

    const onSubmit = async (data: FormData) => {
      if (!currentUser || !id) {
        console.error('No current user or patient ID', { currentUser, id });
        showError('You must be logged in to edit a patient');
        return;
      }

      console.log('Submitting update for patient id:', id, 'userId:', currentUser.uid);
      console.log('Form data:', data);

      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        console.log('Current auth state in onSubmit:', user?.uid || 'null');
      });

      setIsSubmitting(true);
      try {
        const { error } = await patientService.update(id, data, currentUser.uid);
        if (error) {
          console.error('Patient update error:', error, { id, userId: currentUser.uid, data });
          showError(`Failed to update patient: ${error}`);
        } else {
          console.log('Patient updated successfully, id:', id);
          showSuccess('Patient updated successfully!');
          navigate('/patients', { replace: true });
        }
      } catch (error) {
        console.error('Unexpected error updating patient:', error, { id, userId: currentUser.uid, data });
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
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Edit Patient</h2>
            <p className="text-gray-600">Update patient information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name', { 
                    required: 'Full name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="Enter patient's full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth', { 
                    required: 'Date of birth is required'
                  })}
                  className={`input-field ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                />
                {errors.dateOfBirth && (
                  <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  id="gender"
                  {...register('gender')}
                  className="input-field"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Phone className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register('phone', { 
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[\+]?[1-9][\d]{0,15}$/,
                      message: 'Please enter a valid phone number'
                    }
                  })}
                  className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="patient@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                <input
                  id="emergencyContact"
                  type="text"
                  {...register('emergencyContact')}
                  className="input-field"
                  placeholder="Emergency contact name and phone"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  id="address"
                  type="text"
                  {...register('address')}
                  className="input-field"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    {...register('city')}
                    className="input-field"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    id="zipCode"
                    type="text"
                    {...register('zipCode')}
                    className="input-field"
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-2">
                  Allergies
                </label>
                <textarea
                  id="allergies"
                  {...register('allergies')}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="List any known allergies..."
                />
              </div>

              <div>
                <label htmlFor="medications" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Medications
                </label>
                <textarea
                  id="medications"
                  {...register('medications')}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="List current medications..."
                />
              </div>

              <div>
                <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-2">
                  Medical History
                </label>
                <textarea
                  id="medicalHistory"
                  {...register('medicalHistory')}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Relevant medical history..."
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insurance Information</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="insuranceProvider" className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Provider
                </label>
                <input
                  id="insuranceProvider"
                  type="text"
                  {...register('insuranceProvider')}
                  className="input-field"
                  placeholder="Insurance company name"
                />
              </div>

              <div>
                <label htmlFor="policyNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Policy Number
                </label>
                <input
                  id="policyNumber"
                  type="text"
                  {...register('policyNumber')}
                  className="input-field"
                  placeholder="Policy/member number"
                />
              </div>
            </div>
          </div>

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
                  Saving...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Patient
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  export default EditPatient;