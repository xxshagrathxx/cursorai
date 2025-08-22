import React, { useState, useEffect } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useToast } from './Toast';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import { FollowUp } from '../types';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await logout();
      if (error) {
        showError(error);
      } else {
        showSuccess('Signed out successfully');
      }
    } catch (error: any) {
      showError('Failed to sign out');
      console.error('Logout error:', error);
    }
  };

  const handleNotificationClick = (followUp: FollowUp) => {
    markAsRead(followUp.id);
    navigate(`/patients/${followUp.patientId}`);
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as HTMLElement).closest('.notification-bell')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  return (
    <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-100 dark:border-slate-700 sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">DentalCare</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {userProfile?.displayName || currentUser?.displayName || 'Follow-up Manager'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative notification-bell">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadCount}
                  </div>
                )}
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-gray-500 dark:text-gray-400">No due follow-ups</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className="p-4 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      >
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{notif.type.replace('-', ' ')}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{notif.notes}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Scheduled: {formatDate(notif.scheduledDate)} {notif.scheduledTime ? `(${notif.scheduledTime})` : ''}
                        </p>
                        <span className={`text-xs font-medium ${notif.status === 'overdue' ? 'text-red-500' : 'text-yellow-500'}`}>
                          {notif.status.toUpperCase()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;