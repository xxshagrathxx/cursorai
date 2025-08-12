import { Timestamp } from 'firebase/firestore';

// Represents a patient document in the Firestore 'patients' collection
export interface Patient {
  id: string; // Firestore document ID
  name: string; // Patient's full name
  phone?: string | null; // Contact phone number (optional)
  email?: string | null; // Contact email address (optional)
  dateOfBirth?: string | null; // ISO date string (e.g., '1990-01-01') (optional)
  lastVisit?: string | null; // ISO date string of last treatment or null if no treatments
  nextAppointment?: string | null; // ISO date string of next scheduled appointment (optional)
  userId: string; // ID of the user who owns this patient
  createdAt: Timestamp; // Firestore Timestamp for creation
  updatedAt: Timestamp; // Firestore Timestamp for last update
  gender?: string | null; // Patient's gender (e.g., 'female') (optional)
  address?: string | null; // Street address (optional)
  city?: string | null; // City (optional)
  zipCode?: string | null; // ZIP or postal code (optional)
  emergencyContact?: string | null; // Emergency contact info (optional)
  allergies?: string | null; // Known allergies (optional)
  medications?: string | null; // Current medications (optional)
  medicalHistory?: string | null; // Medical history notes (optional)
  insuranceProvider?: string | null; // Insurance provider name (optional)
  policyNumber?: string | null; // Insurance policy number (optional)
  notes?: string | null; // Additional patient notes (optional)
}

// Represents a follow-up document in the Firestore 'followups' collection
export interface FollowUp {
  id: string; // Firestore document ID
  patientId: string; // Reference to patient.id
  userId: string; // Reference to user ID
  type: string; // Type of follow-up (e.g., 'post-treatment')
  scheduledDate: string; // ISO date string (e.g., '2025-07-15')
  scheduledTime?: string; // Optional time of follow-up (e.g., 'morning')
  notes?: string; // Additional notes (optional)
  priority: 'normal' | 'high' | 'urgent'; // Priority level
  sendReminder: boolean; // Whether to send a reminder
  status: 'pending' | 'overdue' | 'completed'; // Follow-up status
  createdAt: Timestamp; // Firestore Timestamp for creation
  updatedAt: Timestamp; // Firestore Timestamp for last update
  completedAt?: string | null; // ISO date string when completed or null
  completionNotes?: string | null; // Notes on completion (optional)
}

// Represents a treatment document in the Firestore 'treatments' collection
export interface Treatment {
  id: string; // Firestore document ID
  patientId: string; // Reference to patient.id
  userId: string; // Reference to user ID
  treatment: string; // Treatment name or description (e.g., 'Cleaning')
  date: string; // ISO date string (e.g., '2025-07-15')
  cost?: number; // Treatment cost (optional)
  notes?: string; // Additional notes (optional)
  createdAt: Timestamp; // Firestore Timestamp for creation
  updatedAt: Timestamp; // Firestore Timestamp for last update
}