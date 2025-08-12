import React from 'react';
import { useForm } from 'react-hook-form';
import { Bell, Calendar, FileText, Save, X } from 'lucide-react';
import { FollowUp } from '../types';
import { formatDate } from '../utils/dateUtils';

interface FollowUpEditFormProps {
  followUp: FollowUp;
  onSave: (formData: Partial<FollowUp>) => void;
  onCancel: () => void;
}

const followUpTypes = [
  { id: 'post-treatment', name: 'Post-Treatment' },
  { id: 'appointment-reminder', name: 'Appointment Reminder' },
  { id: 'satisfaction-survey', name: 'Satisfaction Survey' },
  { id: 'treatment-decision', name: 'Treatment Decision' },
  { id: 'payment-reminder', name: 'Payment Reminder' },
];

const FollowUpEditForm: React.FC<FollowUpEditFormProps> = ({ followUp, onSave, onCancel }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<Partial<FollowUp>>({
    defaultValues: {
      type: followUp.type,
      scheduledDate: formatDate(followUp.scheduledDate, 'yyyy-MM-dd'),
      scheduledTime: followUp.scheduledTime || '',
      notes: followUp.notes,
      priority: followUp.priority,
      sendReminder: followUp.sendReminder,
    },
  });

  const onSubmit = (data: Partial<FollowUp>) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
          <Bell className="w-4 h-4 mr-2 text-blue-500" />
          Follow-up Type *
        </label>
        <select
          id="type"
          {...register('type', { required: 'Please select a follow-up type' })}
          className={`w-full px-3 py-2 border rounded-lg ${errors.type ? 'border-red-500' : 'border-gray-300'}`}
        >
          <option value="">Choose type...</option>
          {followUpTypes.map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
        {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
      </div>

      <div>
        <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-blue-500" />
          Scheduled Date *
        </label>
        <input
          id="scheduledDate"
          type="date"
          {...register('scheduledDate', { required: 'Please select a date' })}
          className={`w-full px-3 py-2 border rounded-lg ${errors.scheduledDate ? 'border-red-500' : 'border-gray-300'}`}
          min={formatDate(new Date(), 'yyyy-MM-dd')}
        />
        {errors.scheduledDate && <p className="text-red-500 text-sm mt-1">{errors.scheduledDate.message}</p>}
      </div>

      <div>
        <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700 mb-1">
          Preferred Time
        </label>
        <select
          id="scheduledTime"
          {...register('scheduledTime')}
          className="w-full px-3 py-2 border rounded-lg border-gray-300"
        >
          <option value="">Any time</option>
          <option value="morning">Morning (9:00 AM - 12:00 PM)</option>
          <option value="afternoon">Afternoon (12:00 PM - 5:00 PM)</option>
          <option value="evening">Evening (5:00 PM - 8:00 PM)</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
          <FileText className="w-4 h-4 mr-2 text-blue-500" />
          Notes *
        </label>
        <textarea
          id="notes"
          {...register('notes', { required: 'Please provide notes', minLength: { value: 10, message: 'Notes must be at least 10 characters' } })}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg resize-none ${errors.notes ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>}
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
          Priority
        </label>
        <select
          id="priority"
          {...register('priority')}
          className="w-full px-3 py-2 border rounded-lg border-gray-300"
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
          className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="sendReminder" className="text-sm font-medium text-gray-700">
          Send automatic reminder
        </label>
      </div>

      <div className="flex space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          <X className="w-4 h-4 mr-2 inline" />
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Save className="w-4 h-4 mr-2 inline" />
          Save
        </button>
      </div>
    </form>
  );
};

export default FollowUpEditForm;