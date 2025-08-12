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
  onSnapshot,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Patient, FollowUp, Treatment } from '../types';

// Collections
const PATIENTS_COLLECTION = 'patients';
const FOLLOWUPS_COLLECTION = 'followups';
const TREATMENTS_COLLECTION = 'treatments';

// Helper function to calculate lastVisit from treatments
async function calculateLastVisit(patientId: string, userId: string): Promise<string | null> {
  try {
    const q = query(
      collection(db, TREATMENTS_COLLECTION),
      where('patientId', '==', patientId),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const latestTreatment = querySnapshot.docs[0].data() as Treatment;
      return latestTreatment.date;
    }
    return null;
  } catch (_error) {
    return null;
  }
}

// Patient CRUD Operations
export const patientService = {
  async create(
    patientData: Omit<Patient, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastVisit'>,
    userId: string
  ): Promise<{ id: string | null; error: string | null }> {
    try {
      const completePatientData = {
        name: patientData.name || '',
        email: patientData.email || null,
        phone: patientData.phone || null,
        dateOfBirth: patientData.dateOfBirth || null,
        gender: patientData.gender || null,
        address: patientData.address || null,
        city: patientData.city || null,
        zipCode: patientData.zipCode || null,
        emergencyContact: patientData.emergencyContact || null,
        allergies: patientData.allergies || null,
        medications: patientData.medications || null,
        medicalHistory: patientData.medicalHistory || null,
        insuranceProvider: patientData.insuranceProvider || null,
        policyNumber: patientData.policyNumber || null,
        notes: patientData.notes || null,
        nextAppointment: patientData.nextAppointment || null,
        userId,
        lastVisit: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, PATIENTS_COLLECTION), completePatientData);
      return { id: docRef.id, error: null };
    } catch (error) {
      return { id: null, error: (error as Error).message || 'Failed to create patient' };
    }
  },

  async getById(patientId: string): Promise<{ patient: Patient | null; error: string | null }> {
    try {
      const docRef = doc(db, PATIENTS_COLLECTION, patientId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<Patient, 'id'>;
        const patient: Patient = {
          id: docSnap.id,
          ...data,
        };
        return { patient, error: null };
      }
      return { patient: null, error: 'Patient not found' };
    } catch (error) {
      return { patient: null, error: (error as Error).message || 'Failed to fetch patient' };
    }
  },

  async getAll(userId: string): Promise<{ patients: Patient[]; error: string | null }> {
    try {
      const q = query(
        collection(db, PATIENTS_COLLECTION),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const patients: Patient[] = querySnapshot.docs.map((d) => {
        const data = d.data() as Omit<Patient, 'id'>;
        return {
          id: d.id,
          ...data,
        };
      });
      return { patients, error: null };
    } catch (error) {
      return { patients: [], error: (error as Error).message || 'Failed to fetch patients' };
    }
  },

  async update(
    patientId: string,
    patientData: Partial<Patient>,
    userId: string
  ): Promise<{ error: string | null }> {
    try {
      const docRef = doc(db, PATIENTS_COLLECTION, patientId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return { error: 'Patient not found' };
      }
      const existingData = docSnap.data();
      if (existingData.userId !== userId) {
        return { error: 'Unauthorized: userId does not match' };
      }
      // Merge with existing data to preserve required fields
      const updatedData = {
        ...existingData,
        ...patientData,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(docRef, updatedData);
      return { error: null };
    } catch (error) {
      return { error: (error as Error).message || 'Failed to update patient' };
    }
  },

  async delete(patientId: string, userId: string): Promise<{ error: string | null }> {
    try {
      const docRef = doc(db, PATIENTS_COLLECTION, patientId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return { error: null }; // treat missing as success
      }
      const existingData = docSnap.data();
      if (existingData.userId !== userId) {
        return { error: 'Unauthorized: userId does not match' };
      }
      await deleteDoc(docRef);
      return { error: null };
    } catch (error) {
      return { error: (error as Error).message || 'Failed to delete patient' };
    }
  },

  onSnapshot(userId: string, callback: (patients: Patient[]) => void): () => void {
    const q = query(
      collection(db, PATIENTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      q,
      (querySnapshot) => {
        const patients: Patient[] = querySnapshot.docs.map((d) => {
          const data = d.data() as Omit<Patient, 'id'>;
          return {
            id: d.id,
            ...data,
          };
        });
        callback(patients);
      },
      (_error) => {
        // swallow snapshot errors here (component-level can show UI warnings if needed)
      }
    );
  },

  async search(userId: string, searchTerm: string): Promise<{ patients: Patient[]; error: string | null }> {
    try {
      const q = query(
        collection(db, PATIENTS_COLLECTION),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const patients: Patient[] = querySnapshot.docs.map((d) => {
        const data = d.data() as Omit<Patient, 'id'>;
        return {
          id: d.id,
          ...data,
        };
      });
      const filtered = patients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (patient.phone && patient.phone.includes(searchTerm))
      );
      return { patients: filtered, error: null };
    } catch (error) {
      return { patients: [], error: (error as Error).message || 'Failed to search patients' };
    }
  },
};

// Follow-up CRUD Operations
export const followUpService = {
  async create(data: Partial<FollowUp>, userId: string, patientId: string): Promise<{ id: string | null; error: string | null }> {
    try {
      const followUpData = {
        ...data,
        userId,
        patientId,
        status: data.status || 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        completedAt: null,
        completionNotes: null,
      };
      const docRef = await addDoc(collection(db, FOLLOWUPS_COLLECTION), followUpData);
      return { id: docRef.id, error: null };
    } catch (error) {
      return { id: null, error: (error as Error).message || 'Failed to create follow-up' };
    }
  },

  async getAll(userId: string): Promise<{ followUps: FollowUp[]; error: string | null }> {
    try {
      const q = query(collection(db, FOLLOWUPS_COLLECTION), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const followUps: FollowUp[] = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FollowUp, 'id'>),
      }));
      return { followUps, error: null };
    } catch (error) {
      return { followUps: [], error: (error as Error).message || 'Failed to fetch follow-ups' };
    }
  },

  async getByPatient(patientId: string, userId: string): Promise<{ followUps: FollowUp[]; error: string | null }> {
    try {
      const q = query(
        collection(db, FOLLOWUPS_COLLECTION),
        where('userId', '==', userId),
        where('patientId', '==', patientId),
        orderBy('scheduledDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const followUps: FollowUp[] = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FollowUp, 'id'>),
      }));
      return { followUps, error: null };
    } catch (error) {
      return { followUps: [], error: (error as Error).message || 'Failed to fetch follow-ups by patient' };
    }
  },

  async getOverdue(userId: string): Promise<{ followUps: FollowUp[]; error: string | null }> {
    try {
      const q = query(
        collection(db, FOLLOWUPS_COLLECTION),
        where('userId', '==', userId),
        where('status', '==', 'overdue'),
        orderBy('scheduledDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const followUps: FollowUp[] = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<FollowUp, 'id'>),
      }));
      return { followUps, error: null };
    } catch (error) {
      return { followUps: [], error: (error as Error).message || 'Failed to fetch overdue follow-ups' };
    }
  },

  async updateStatus(
    followUpId: string,
    status: 'pending' | 'completed' | 'overdue',
    completionNotes?: string
  ): Promise<{ error: string | null }> {
    try {
      const docRef = doc(db, FOLLOWUPS_COLLECTION, followUpId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return { error: 'Follow-up not found' };
      }
      await updateDoc(docRef, {
        status,
        completionNotes,
        updatedAt: serverTimestamp(),
        completedAt: status === 'completed' ? serverTimestamp() : null,
      });
      return { error: null };
    } catch (error) {
      return { error: (error as Error).message || 'Failed to update follow-up status' };
    }
  },

  async update(followUpId: string, data: Partial<FollowUp>, userId: string): Promise<{ error: string | null }> {
    try {
      const docRef = doc(db, FOLLOWUPS_COLLECTION, followUpId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return { error: 'Follow-up not found' };
      }
      const existingData = docSnap.data();
      if (existingData.userId !== userId) {
        return { error: 'Unauthorized: userId does not match' };
      }
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return { error: null };
    } catch (error) {
      return { error: (error as Error).message || 'Failed to update follow-up' };
    }
  },

  async delete(followUpId: string, userId: string): Promise<{ error: string | null }> {
    try {
      const docRef = doc(db, FOLLOWUPS_COLLECTION, followUpId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return { error: null }; // treat missing as success
      }
      const existingData = docSnap.data();
      if (existingData.userId !== userId) {
        return { error: 'Unauthorized: userId does not match' };
      }
      await deleteDoc(docRef);
      return { error: null };
    } catch (error) {
      return { error: (error as Error).message || 'Failed to delete follow-up' };
    }
  },

  async deleteByPatientId(patientId: string, userId: string): Promise<{ error: string | null }> {
    try {
      const q = query(
        collection(db, FOLLOWUPS_COLLECTION),
        where('patientId', '==', patientId),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { error: null }; // nothing to delete
      }

      const batch = writeBatch(db);
      querySnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      return { error: null };
    } catch (error) {
      return { error: (error as Error).message || 'Failed to delete follow-ups for patient' };
    }
  },

  onSnapshot(userId: string, callback: (followUps: FollowUp[]) => void): () => void {
    const q = query(
      collection(db, FOLLOWUPS_COLLECTION),
      where('userId', '==', userId),
      orderBy('scheduledDate', 'desc')
    );
    return onSnapshot(
      q,
      (querySnapshot) => {
        const followUps: FollowUp[] = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FollowUp, 'id'>),
        }));
        callback(followUps);
      },
      (_error) => {
        // swallow snapshot errors
      }
    );
  },
};

// Treatment CRUD Operations
export const treatmentService = {
  async create(
    treatmentData: Omit<Treatment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<{ id: string | null; error: string | null }> {
    let docRef;
    try {
      docRef = await addDoc(collection(db, TREATMENTS_COLLECTION), {
        ...treatmentData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      return { id: null, error: (error as Error).message || 'Failed to create treatment' };
    }

    // Update patient's lastVisit (best-effort)
    try {
      const patientRef = doc(db, PATIENTS_COLLECTION, treatmentData.patientId);
      const patientSnap = await getDoc(patientRef);
      if (patientSnap.exists()) {
        const patientData = patientSnap.data() as Omit<Patient, 'id'>;
        if (patientData.userId === userId) {
          const currentLastVisit = patientData.lastVisit ? new Date(patientData.lastVisit) : null;
          const newTreatmentDate = new Date(treatmentData.date);
          if (!currentLastVisit || newTreatmentDate > currentLastVisit) {
            await updateDoc(patientRef, {
              lastVisit: treatmentData.date,
              updatedAt: serverTimestamp(),
            });
          }
        }
      }
    } catch (_err) {
      // ignore errors updating lastVisit
    }

    return { id: docRef.id, error: null };
  },

  async getByPatient(patientId: string, userId: string): Promise<{ treatments: Treatment[]; error: string | null }> {
    try {
      const q = query(
        collection(db, TREATMENTS_COLLECTION),
        where('userId', '==', userId),
        where('patientId', '==', patientId),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const treatments: Treatment[] = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Treatment, 'id'>),
      }));
      return { treatments, error: null };
    } catch (error) {
      return { treatments: [], error: (error as Error).message || 'Failed to fetch treatments' };
    }
  },

  async update(
    treatmentId: string,
    treatmentData: Partial<Treatment>,
    userId: string
  ): Promise<{ error: string | null }> {
    try {
      const docRef = doc(db, TREATMENTS_COLLECTION, treatmentId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return { error: 'Treatment not found' };
      }
      const existingData = docSnap.data();
      if (existingData.userId !== userId) {
        return { error: 'Unauthorized: userId does not match' };
      }

      await updateDoc(docRef, {
        ...treatmentData,
        updatedAt: serverTimestamp(),
      });

      if (treatmentData.date && treatmentData.patientId) {
        try {
          const patientRef = doc(db, PATIENTS_COLLECTION, treatmentData.patientId);
          const patientSnap = await getDoc(patientRef);
          if (patientSnap.exists() && patientSnap.data().userId === userId) {
            const calculatedLastVisit = await calculateLastVisit(treatmentData.patientId, userId);
            await updateDoc(patientRef, {
              lastVisit: calculatedLastVisit,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (_err) {
          // ignore patient lastVisit update errors
        }
      }

      return { error: null };
    } catch (error) {
      return { error: (error as Error).message || 'Failed to update treatment' };
    }
  },

  async delete(treatmentId: string, userId: string): Promise<{ error: string | null }> {
    try {
      const docRef = doc(db, TREATMENTS_COLLECTION, treatmentId);
      const treatmentSnap = await getDoc(docRef);
      if (!treatmentSnap.exists()) {
        return { error: null }; // treat missing as success
      }
      const treatmentData = treatmentSnap.data() as Treatment;
      if (treatmentData.userId !== userId) {
        return { error: 'Unauthorized: userId does not match' };
      }

      await deleteDoc(docRef);

      // Update patient's lastVisit (best-effort)
      try {
        const patientRef = doc(db, PATIENTS_COLLECTION, treatmentData.patientId);
        const patientSnap = await getDoc(patientRef);
        if (patientSnap.exists() && patientSnap.data().userId === userId) {
          const calculatedLastVisit = await calculateLastVisit(treatmentData.patientId, userId);
          await updateDoc(patientRef, {
            lastVisit: calculatedLastVisit,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (_err) {
        // ignore lastVisit update errors
      }

      return { error: null };
    } catch (error) {
      return { error: (error as Error).message || 'Failed to delete treatment' };
    }
  },

  async deleteByPatientId(patientId: string, userId: string): Promise<{ error: string | null }> {
    try {
      const q = query(
        collection(db, TREATMENTS_COLLECTION),
        where('patientId', '==', patientId),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { error: null }; // nothing to delete
      }

      const batch = writeBatch(db);
      querySnapshot.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();

      // Reset patient's lastVisit to null (best-effort)
      try {
        const patientRef = doc(db, PATIENTS_COLLECTION, patientId);
        const patientSnap = await getDoc(patientRef);
        if (patientSnap.exists() && patientSnap.data().userId === userId) {
          await updateDoc(patientRef, {
            lastVisit: null,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (_err) {
        // ignore
      }

      return { error: null };
    } catch (error) {
      return { error: (error as Error).message || 'Failed to delete treatments for patient' };
    }
  },
};

// Analytics Service
export const analyticsService = {
  async getDashboardStats(userId: string): Promise<{
    totalPatients: number;
    pendingFollowUps: number;
    overdueFollowUps: number;
    followUpsCompletedToday: number;
    error: string | null;
  }> {
    try {
      const patientsQuery = query(
        collection(db, PATIENTS_COLLECTION),
        where('userId', '==', userId)
      );
      const patientsSnapshot = await getDocs(patientsQuery);
      const totalPatients = patientsSnapshot.size;

      const pendingQuery = query(
        collection(db, FOLLOWUPS_COLLECTION),
        where('userId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('scheduledDate', 'desc')
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingFollowUps = pendingSnapshot.size;

      const overdueQuery = query(
        collection(db, FOLLOWUPS_COLLECTION),
        where('userId', '==', userId),
        where('status', '==', 'overdue'),
        orderBy('scheduledDate', 'desc')
      );
      const overdueSnapshot = await getDocs(overdueQuery);
      const overdueFollowUps = overdueSnapshot.size;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const completedTodayQuery = query(
        collection(db, FOLLOWUPS_COLLECTION),
        where('userId', '==', userId),
        where('status', '==', 'completed'),
        where('completedAt', '>=', Timestamp.fromDate(startOfDay)),
        where('completedAt', '<=', Timestamp.fromDate(endOfDay))
      );
      const completedTodaySnapshot = await getDocs(completedTodayQuery);
      const followUpsCompletedToday = completedTodaySnapshot.size;

      return {
        totalPatients,
        pendingFollowUps,
        overdueFollowUps,
        followUpsCompletedToday,
        error: null,
      };
    } catch (error) {
      return {
        totalPatients: 0,
        pendingFollowUps: 0,
        overdueFollowUps: 0,
        followUpsCompletedToday: 0,
        error: (error as Error).message || 'Failed to fetch analytics',
      };
    }
  },
};