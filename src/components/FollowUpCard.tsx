// components/FollowUpCard.tsx
import React, { useState } from 'react';
import { Phone, Edit, Trash2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { FollowUp } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { formatDate } from '../utils/dateUtils';
import FollowUpEditForm from './FollowUpEditForm';
import { useNavigate } from 'react-router-dom';

interface FollowUpCardProps {
  followUp: FollowUp & { patientName?: string; patientPhone?: string };
  onUpdate: (followUpId: string, formData: Partial<FollowUp>) => void;
  onDelete: (followUpId: string) => void;
}

const FollowUpCard: React.FC<FollowUpCardProps> = ({ followUp, onUpdate, onDelete }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'post-treatment': 'bg-blue-100 text-blue-800',
      'appointment-reminder': 'bg-green-100 text-green-800',
      'satisfaction-survey': 'bg-purple-100 text-purple-800',
      'treatment-decision': 'bg-orange-100 text-orange-800',
      'payment-reminder': 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleDeleteFollowUp = () => {
    if (!currentUser?.uid) {
      console.error('FollowUpCard: Cannot delete follow-up: missing currentUser or uid');
      showError('Cannot delete follow-up: please log in again');
      setShowDeleteModal(null);
      return;
    }
    // Let parent handle Firestore delete
    onDelete(followUp.id);
    setShowDeleteModal(null);
  };

  const handleMarkComplete = () => {
    onUpdate(followUp.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString() // REQUIRED by rules
    });
  };

  return (
    <div
      className="card cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => !isEditing && navigate(`/patients/${followUp.patientId}`)}
    >
      {isEditing ? (
        <FollowUpEditForm
          followUp={followUp}
          onSave={(formData) => {
            onUpdate(followUp.id, formData);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              {getStatusIcon(followUp.status)}
              <div>
                <h3 className="font-semibold text-gray-900">{followUp.patientName || 'Unknown'}</h3>
                <p className="text-sm text-gray-600">{followUp.patientPhone || 'N/A'}</p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(followUp.type)}`}>
              {followUp.type.replace('-', ' ')}
            </span>
          </div>

          <div className="mb-3">
            <p className="text-gray-900 mb-1">{followUp.notes}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Scheduled: {formatDate(followUp.scheduledDate)}</span>
              <span className={`capitalize status-${followUp.status}`}>{followUp.status}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              title="Edit Follow-up"
            >
              <Edit className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(followUp.id);
              }}
              className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
              title="Delete Follow-up"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            {followUp.status !== 'completed' && (
              <>
                <button
                  className="flex-1 py-2 px-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkComplete();
                  }}
                >
                  Mark Complete
                </button>
                <button
                  className="flex-1 py-2 px-3 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${followUp.patientPhone || ''}`);
                  }}
                >
                  <Phone className="w-4 h-4 mr-1 inline" />
                  Call
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-md w-full border border-gray-200 dark:border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <Trash2 className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">Delete Follow-up?</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This action cannot be undone. The follow-up record will be permanently removed.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                onClick={() => setShowDeleteModal(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center"
                onClick={handleDeleteFollowUp}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpCard;
