import { format, formatDistanceToNow, isAfter, isBefore, addDays, parseISO } from 'date-fns';

export const formatDate = (date, formatString = 'MMM dd, yyyy') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy h:mm a');
};

export const getTimeAgo = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
};

export const isOverdue = (date) => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(dateObj, new Date());
};

export const isUpcoming = (date, days = 7) => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const futureDate = addDays(new Date(), days);
  return isAfter(dateObj, new Date()) && isBefore(dateObj, futureDate);
};

export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return '';
  const birthDate = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const getNextFollowUpDate = (lastTreatmentDate, followUpType) => {
  if (!lastTreatmentDate) return null;
  const baseDate = typeof lastTreatmentDate === 'string' ? parseISO(lastTreatmentDate) : lastTreatmentDate;
  const days = followUpType?.defaultDays || 7;
  return addDays(baseDate, days);
};