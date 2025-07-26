import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Collections
const PATIENTS_COLLECTION = 'patients';
const FOLLOWUPS_COLLECTION = 'followups';
const TREATMENTS_COLLECTION = 'treatments';

// Patient CRUD Operations
export const patientService = {
  // Create a new patient
  async create(patientData, userId) {
    try {
      const docRef = await addDoc(collection(db, PATIENTS_COLLECTION), {
        ...patientData,
        userId, // Associate with the authenticated user
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, error: null };
    } catch (error) {
      console.error('Error creating patient:', error);
      return { id: null, error: error.message };
    }
  },

  // Get all patients for a user
  async getAll(userId) {
    try {
      const q = query(
        collection(db, PATIENTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const patients = [];
      querySnapshot.forEach((doc) => {
        patients.push({ id: doc.id, ...doc.data() });
      });
      return { patients, error: null };
    } catch (error) {
      console.error('Error getting patients:', error);
      return { patients: [], error: error.message };
    }
  },

  // Get a single patient
  async getById(patientId) {
    try {
      const docRef = doc(db, PATIENTS_COLLECTION, patientId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { patient: { id: docSnap.id, ...docSnap.data() }, error: null };
      } else {
        return { patient: null, error: 'Patient not found' };
      }
    } catch (error) {
      console.error('Error getting patient:', error);
      return { patient: null, error: error.message };
    }
  },

  // Update a patient
  async update(patientId, updates) {
    try {
      const docRef = doc(db, PATIENTS_COLLECTION, patientId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { error: null };
    } catch (error) {
      console.error('Error updating patient:', error);
      return { error: error.message };
    }
  },

  // Delete a patient
  async delete(patientId) {
    try {
      await deleteDoc(doc(db, PATIENTS_COLLECTION, patientId));
      return { error: null };
    } catch (error) {
      console.error('Error deleting patient:', error);
      return { error: error.message };
    }
  },

  // Search patients
  async search(userId, searchTerm) {
    try {
      const q = query(
        collection(db, PATIENTS_COLLECTION),
        where('userId', '==', userId),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      const patients = [];
      querySnapshot.forEach((doc) => {
        const patient = { id: doc.id, ...doc.data() };
        // Client-side filtering for search
        if (
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone.includes(searchTerm)
        ) {
          patients.push(patient);
        }
      });
      return { patients, error: null };
    } catch (error) {
      console.error('Error searching patients:', error);
      return { patients: [], error: error.message };
    }
  },

  // Listen to patient changes (real-time)
  onSnapshot(userId, callback) {
    const q = query(
      collection(db, PATIENTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const patients = [];
      querySnapshot.forEach((doc) => {
        patients.push({ id: doc.id, ...doc.data() });
      });
      callback(patients);
    });
  }
};

// Follow-up CRUD Operations
export const followUpService = {
  // Create a new follow-up
  async create(followUpData, userId) {
    try {
      const docRef = await addDoc(collection(db, FOLLOWUPS_COLLECTION), {
        ...followUpData,
        userId,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, error: null };
    } catch (error) {
      console.error('Error creating follow-up:', error);
      return { id: null, error: error.message };
    }
  },

  // Get all follow-ups for a user
  async getAll(userId) {
    try {
      const q = query(
        collection(db, FOLLOWUPS_COLLECTION),
        where('userId', '==', userId),
        orderBy('scheduledDate', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const followUps = [];
      querySnapshot.forEach((doc) => {
        followUps.push({ id: doc.id, ...doc.data() });
      });
      return { followUps, error: null };
    } catch (error) {
      console.error('Error getting follow-ups:', error);
      return { followUps: [], error: error.message };
    }
  },

  // Get follow-ups for a specific patient
  async getByPatient(patientId, userId) {
    try {
      const q = query(
        collection(db, FOLLOWUPS_COLLECTION),
        where('patientId', '==', patientId),
        where('userId', '==', userId),
        orderBy('scheduledDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const followUps = [];
      querySnapshot.forEach((doc) => {
        followUps.push({ id: doc.id, ...doc.data() });
      });
      return { followUps, error: null };
    } catch (error) {
      console.error('Error getting patient follow-ups:', error);
      return { followUps: [], error: error.message };
    }
  },

  // Update follow-up status
  async updateStatus(followUpId, status, notes = '') {
    try {
      const docRef = doc(db, FOLLOWUPS_COLLECTION, followUpId);
      await updateDoc(docRef, {
        status,
        completedAt: status === 'completed' ? serverTimestamp() : null,
        completionNotes: notes,
        updatedAt: serverTimestamp()
      });
      return { error: null };
    } catch (error) {
      console.error('Error updating follow-up status:', error);
      return { error: error.message };
    }
  },

  // Update a follow-up
  async update(followUpId, updates) {
    try {
      const docRef = doc(db, FOLLOWUPS_COLLECTION, followUpId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { error: null };
    } catch (error) {
      console.error('Error updating follow-up:', error);
      return { error: error.message };
    }
  },

  // Delete a follow-up
  async delete(followUpId) {
    try {
      await deleteDoc(doc(db, FOLLOWUPS_COLLECTION, followUpId));
      return { error: null };
    } catch (error) {
      console.error('Error deleting follow-up:', error);
      return { error: error.message };
    }
  },

  // Get overdue follow-ups
  async getOverdue(userId) {
    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      const q = query(
        collection(db, FOLLOWUPS_COLLECTION),
        where('userId', '==', userId),
        where('status', '==', 'pending'),
        where('scheduledDate', '<', today)
      );
      const querySnapshot = await getDocs(q);
      const followUps = [];
      querySnapshot.forEach((doc) => {
        followUps.push({ id: doc.id, ...doc.data() });
      });
      return { followUps, error: null };
    } catch (error) {
      console.error('Error getting overdue follow-ups:', error);
      return { followUps: [], error: error.message };
    }
  },

  // Listen to follow-up changes (real-time)
  onSnapshot(userId, callback) {
    const q = query(
      collection(db, FOLLOWUPS_COLLECTION),
      where('userId', '==', userId),
      orderBy('scheduledDate', 'asc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const followUps = [];
      querySnapshot.forEach((doc) => {
        followUps.push({ id: doc.id, ...doc.data() });
      });
      callback(followUps);
    });
  }
};

// Treatment CRUD Operations
export const treatmentService = {
  // Create a new treatment
  async create(treatmentData, userId) {
    try {
      const docRef = await addDoc(collection(db, TREATMENTS_COLLECTION), {
        ...treatmentData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { id: docRef.id, error: null };
    } catch (error) {
      console.error('Error creating treatment:', error);
      return { id: null, error: error.message };
    }
  },

  // Get treatments for a patient
  async getByPatient(patientId, userId) {
    try {
      const q = query(
        collection(db, TREATMENTS_COLLECTION),
        where('patientId', '==', patientId),
        where('userId', '==', userId),
        orderBy('treatmentDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const treatments = [];
      querySnapshot.forEach((doc) => {
        treatments.push({ id: doc.id, ...doc.data() });
      });
      return { treatments, error: null };
    } catch (error) {
      console.error('Error getting treatments:', error);
      return { treatments: [], error: error.message };
    }
  },

  // Update a treatment
  async update(treatmentId, updates) {
    try {
      const docRef = doc(db, TREATMENTS_COLLECTION, treatmentId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return { error: null };
    } catch (error) {
      console.error('Error updating treatment:', error);
      return { error: error.message };
    }
  },

  // Delete a treatment
  async delete(treatmentId) {
    try {
      await deleteDoc(doc(db, TREATMENTS_COLLECTION, treatmentId));
      return { error: null };
    } catch (error) {
      console.error('Error deleting treatment:', error);
      return { error: error.message };
    }
  }
};

// Analytics and Statistics
export const analyticsService = {
  // Get dashboard statistics
  async getDashboardStats(userId) {
    try {
      const [patientsResult, followUpsResult] = await Promise.all([
        patientService.getAll(userId),
        followUpService.getAll(userId)
      ]);

      if (patientsResult.error || followUpsResult.error) {
        throw new Error(patientsResult.error || followUpsResult.error);
      }

      const patients = patientsResult.patients;
      const followUps = followUpsResult.followUps;

      const stats = {
        totalPatients: patients.length,
        pendingFollowUps: followUps.filter(f => f.status === 'pending').length,
        overdueFollowUps: followUps.filter(f => {
          const today = new Date();
          const scheduledDate = f.scheduledDate?.toDate?.() || new Date(f.scheduledDate);
          return f.status === 'pending' && scheduledDate < today;
        }).length,
        completedToday: followUps.filter(f => {
          const today = new Date();
          const completedDate = f.completedAt?.toDate?.() || new Date(f.completedAt);
          return f.status === 'completed' && 
                 completedDate.toDateString() === today.toDateString();
        }).length
      };

      return { stats, error: null };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return { stats: null, error: error.message };
    }
  }
};

export default {
  patientService,
  followUpService,
  treatmentService,
  analyticsService
};