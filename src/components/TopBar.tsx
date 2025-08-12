import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

const TopBar: React.FC = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const { showSuccess, showError } = useToast();

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
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {/* Placeholder for notification count */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </button>
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