import { format, formatDistanceToNow, isAfter, isBefore, addDays, parseISO } from 'date-fns';

// Type for dates (string, Date, or null/undefined)
type DateInput = string | Date | null | undefined;

// Type for followUpType in getNextFollowUpDate
interface FollowUpType {
  defaultDays?: number;
}

export const formatDate = (date: DateInput, formatString: string = 'MMM d, yyyy'): string => {
  if (!date) {
    return 'N/A';
  }
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', { date, formatString, error });
    return 'N/A';
  }
};

export const formatDateTime = (date: DateInput): string => {
  if (!date) {
    return 'N/A';
  }
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting datetime:', { date, error });
    return 'N/A';
  }
};

export const getTimeAgo = (date: DateInput): string => {
  if (!date) {
    return 'N/A';
  }
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Error calculating time ago:', { date, error });
    return 'N/A';
  }
};

export const isOverdue = (date: DateInput): boolean => {
  if (!date) {
    return false;
  }
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isBefore(dateObj, new Date());
  } catch (error) {
    console.error('Error checking overdue status:', { date, error });
    return false;
  }
};

export const isUpcoming = (date: DateInput, days: number = 7): boolean => {
  if (!date) {
    return false;
  }
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const futureDate = addDays(new Date(), days);
    return isAfter(dateObj, new Date()) && isBefore(dateObj, futureDate);
  } catch (error) {
    console.error('Error checking upcoming status:', { date, days, error });
    return false;
  }
};

export const calculateAge = (dateOfBirth: DateInput): string => {
  if (!dateOfBirth) {
    return 'N/A';
  }
  try {
    const birthDate = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age.toString();
  } catch (error) {
    console.error('Error calculating age:', { dateOfBirth, error });
    return 'N/A';
  }
};

export const getNextFollowUpDate = (lastTreatmentDate: DateInput, followUpType?: FollowUpType): Date | null => {
  if (!lastTreatmentDate) {
    return null;
  }
  try {
    const baseDate = typeof lastTreatmentDate === 'string' ? parseISO(lastTreatmentDate) : lastTreatmentDate;
    const days = followUpType?.defaultDays ?? 7; // Default to 7 if undefined
    return addDays(baseDate, days);
  } catch (error) {
    console.error('Error calculating next follow-up date:', { lastTreatmentDate, followUpType, error });
    return null;
  }
};