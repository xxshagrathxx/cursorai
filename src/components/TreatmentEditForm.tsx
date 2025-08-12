import React, { useState } from 'react';
import { Treatment } from '../types';

interface TreatmentEditFormProps {
  treatment: Treatment;
  onSave: (formData: Partial<Treatment>) => void;
  onCancel: () => void;
}

const TreatmentEditForm: React.FC<TreatmentEditFormProps> = React.memo(({ treatment, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Treatment>>({
    treatment: treatment.treatment,
    date: treatment.date,
    cost: treatment.cost,
    notes: treatment.notes,
    patientId: treatment.patientId,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof typeof formData
  ) => {
    setFormData((prev) => ({ ...prev, [field]: field === 'cost' ? Number(e.target.value) : e.target.value }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-600">Treatment</label>
        <input
          type="text"
          value={formData.treatment || ''}
          onChange={(e) => handleChange(e, 'treatment')}
          className="mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter treatment name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Date</label>
        <input
          type="date"
          value={formData.date || ''}
          onChange={(e) => handleChange(e, 'date')}
          className="mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Cost</label>
        <input
          type="number"
          value={formData.cost || ''}
          onChange={(e) => handleChange(e, 'cost')}
          className="mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter cost"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Notes</label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => handleChange(e, 'notes')}
          className="mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter notes"
          rows={4}
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(formData)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          Save
        </button>
      </div>
    </div>
  );
});

export default TreatmentEditForm;