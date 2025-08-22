import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { followUpService } from '../services/firestoreService';
import { FollowUp } from '../types';
import { useToast } from '../components/Toast';

interface NotificationContextType {
  notifications: FollowUp[];
  unreadCount: number;
  markAsRead: (followUpId: string) => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { showError } = useToast();
  const [notifications, setNotifications] = useState<FollowUp[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async (userId: string) => {
    try {
      // Update overdue statuses first
      const { error: statusError } = await followUpService.updateOverdueStatus(userId);
      if (statusError) {
        showError(`Failed to update overdue statuses: ${statusError}`);
        return;
      }

      // Fetch pending and overdue follow-ups
      const today = new Date().toISOString().split('T')[0];
      const { followUps, error } = await followUpService.getAll(userId);
      if (error) {
        showError(`Failed to fetch notifications: ${error}`);
        return;
      }

      const dueNotifications = followUps
        .filter(f => (f.status === 'pending' || f.status === 'overdue') && f.scheduledDate <= today)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

      setNotifications(dueNotifications);
      setUnreadCount(dueNotifications.filter(f => !f.isRead).length);
    } catch (error) {
      showError(`Unexpected error fetching notifications: ${(error as Error).message}`);
    }
  };

  useEffect(() => {
    if (!currentUser?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications(currentUser.uid);

    // Subscribe to real-time updates
    const unsubscribe = followUpService.onSnapshot(currentUser.uid, (followUps) => {
      const today = new Date().toISOString().split('T')[0];
      const dueNotifications = followUps
        .filter(f => (f.status === 'pending' || f.status === 'overdue') && f.scheduledDate <= today)
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

      setNotifications(dueNotifications);
      setUnreadCount(dueNotifications.filter(f => !f.isRead).length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (followUpId: string) => {
    try {
      const { error } = await followUpService.update(followUpId, { isRead: true }, currentUser?.uid || '');
      if (error) {
        showError(`Failed to mark notification as read: ${error}`);
        return;
      }
      setNotifications(prev =>
        prev.map(f => (f.id === followUpId ? { ...f, isRead: true } : f))
      );
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      showError(`Unexpected error marking notification as read: ${(error as Error).message}`);
    }
  };

  const refreshNotifications = () => {
    if (currentUser?.uid) {
      fetchNotifications(currentUser.uid);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};