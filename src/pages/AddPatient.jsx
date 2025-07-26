import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Calendar, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';

const AddPatient = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('New patient data:', data);
    
    // In a real app, you would send this to your backend
    // For now, we'll just navigate back to patients
    navigate('/patients');
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
          <h2 className="text-2xl font-bold text-gray-900">Add New Patient</h2>
          <p className="text-gray-600">Register a new patient in your practice</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-5 h-5 text-dental-primary" />
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

        {/* Contact Information */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Phone className="w-5 h-5 text-dental-primary" />
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

        {/* Address Information */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-5 h-5 text-dental-primary" />
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

        {/* Medical Information */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Mail className="w-5 h-5 text-dental-primary" />
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

        {/* Insurance Information */}
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