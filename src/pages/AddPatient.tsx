import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Calendar, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { patientService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { Patient } from '../types';
import { isBefore, parse } from 'date-fns';

interface FormData extends Omit<Patient, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastVisit'> {}

const AddPatient: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
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
      notes: '',
      nextAppointment: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!currentUser) {
      console.error('No current user, cannot add patient. Auth state:', currentUser);
      showError('You must be logged in to add a patient');
      return;
    }

    // Clean up data to remove undefined fields and ensure compatibility with Firestore
    const cleanedData: Omit<Patient, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastVisit'> = {
      name: data.name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      dateOfBirth: data.dateOfBirth?.trim() || null,
      gender: data.gender?.trim() || null,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      zipCode: data.zipCode?.trim() || null,
      emergencyContact: data.emergencyContact?.trim() || null,
      allergies: data.allergies?.trim() || null,
      medications: data.medications?.trim() || null,
      medicalHistory: data.medicalHistory?.trim() || null,
      insuranceProvider: data.insuranceProvider?.trim() || null,
      policyNumber: data.policyNumber?.trim() || null,
      notes: data.notes?.trim() || null,
      nextAppointment: data.nextAppointment?.trim() || null,
    };

    console.log('Submitting patient with userId:', currentUser.uid);
    console.log('Cleaned form data:', cleanedData);

    setIsSubmitting(true);
    try {
      const { id, error } = await patientService.create(cleanedData, currentUser.uid);
      if (error) {
        console.error('Patient creation error:', error, { userId: currentUser.uid, data: cleanedData });
        showError(`Failed to add patient: ${error}`);
      } else {
        console.log('Patient created successfully, id:', id);
        showSuccess('Patient added successfully!');
        navigate('/patients');
      }
    } catch (error) {
      console.error('Unexpected error creating patient:', error, { userId: currentUser.uid, data: cleanedData });
      showError(`Unexpected error: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Add New Patient</h2>
          <p className="text-gray-600">Register a new patient in your practice</p>
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
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
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
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                {...register('dateOfBirth', {
                  validate: (value) => {
                    if (!value) return true; // Allow empty (optional field)
                    const dob = parse(value, 'yyyy-MM-dd', new Date());
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Normalize to start of day
                    return isBefore(dob, today) || 'Date of birth must be before today';
                  },
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
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                {...register('phone')}
                className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address',
                  },
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

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={4}
                className="input-field resize-none"
                placeholder="Any additional notes..."
              />
            </div>

            <div>
              <label htmlFor="nextAppointment" className="block text-sm font-medium text-gray-700 mb-2">
                Next Appointment
              </label>
              <input
                id="nextAppointment"
                type="date"
                {...register('nextAppointment')}
                className="input-field"
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
                Save Patient
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPatient;