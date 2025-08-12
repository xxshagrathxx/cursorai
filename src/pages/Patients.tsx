import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Edit } from 'lucide-react';
import { patientService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import LoadingScreen from '../components/LoadingScreen';
import { Patient } from '../types';
import { formatDate } from '../utils/dateUtils';

const Patients = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showError } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!currentUser) {
      console.log('No current user, skipping patient fetch');
      setLoading(false);
      return;
    }

    const fetchPatients = async () => {
      try {
        console.log('Fetching patients for userId:', currentUser.uid);
        const { patients, error } = await patientService.getAll(currentUser.uid);
        if (error) {
          console.error('Patient fetch error:', error);
          showError(error);
        } else {
          setPatients(patients);
        }
      } catch (error) {
        console.error('Unexpected error fetching patients:', error);
        showError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [currentUser, showError]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page on search

    if (!currentUser) return;

    try {
      const { patients, error } = term.trim() === ''
        ? await patientService.getAll(currentUser.uid)
        : await patientService.search(currentUser.uid, term);

      if (error) {
        showError(error);
      } else {
        setPatients(patients);
      }
    } catch (error) {
      showError((error as Error).message);
    }
  };

  if (loading) return <LoadingScreen />;

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPatients = patients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(patients.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
        <button
          onClick={() => navigate('/add-patient')}
          className="btn-primary text-sm py-2 px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </button>
      </div>

      <input
        type="text"
        placeholder="Search patients..."
        value={searchTerm}
        onChange={handleSearch}
        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {currentPatients.length > 0 ? (
        <>
          <div className="space-y-3">
            {currentPatients.map((patient) => (
              <div
                key={patient.id}
                className="card flex items-center space-x-4 cursor-pointer"
                onClick={() => navigate(`/patients/${patient.id}`)}
              >
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-600">{patient.phone}</p>
                  <p className="text-sm text-gray-600">
                    Last Visit: {patient.lastVisit ? formatDate(patient.lastVisit) : 'N/A'}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/patients/${patient.id}/edit`);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Edit className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center mt-4 space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, idx) => (
              <button
                key={idx + 1}
                onClick={() => setCurrentPage(idx + 1)}
                className={`px-3 py-1 border rounded ${
                  currentPage === idx + 1 ? 'bg-primary text-white' : ''
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p>No patients found</p>
          <button
            onClick={() => navigate('/add-patient')}
            className="btn-primary mt-4"
          >
            Add Your First Patient
          </button>
        </div>
      )}
    </div>
  );
};

export default Patients;
