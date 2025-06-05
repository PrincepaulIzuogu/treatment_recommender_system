import axios from 'axios';

// Backend API base URL
const API_BASE_URL = 'http://127.0.0.1:8000';

// Create a new session (get session ID)
export const createSession = async () => {
  const response = await axios.get(`${API_BASE_URL}/session/new`);
  return response.data;
};

// Get a list of drugs with pagination and optional search query
export const getDrugs = async (
  sessionId: string,
  page: number = 1,
  pageSize: number = 20,
  searchQuery: string = ''
) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/drugs/list`, {
      params: {
        session_id: sessionId,
        page,
        page_size: pageSize,
        search: searchQuery
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching drugs:', error);
    throw error;
  }
};

// Log a drug click with session tracking
export const logClick = async (sessionId: string, drugId: number) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/clicks/${sessionId}/${drugId}`);
    return response.data;
  } catch (error) {
    console.error('Error logging click:', error);
    throw error;
  }
};

// Get detailed information and related drugs for a specific drug
export const getDrugDetails = async (drugId: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/drug_details/${drugId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching drug details:', error);
    throw error;
  }
};

// Get personalized drug recommendations for a patient
export const getRecommendations = async (personId: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/recommendations/${personId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
};

// Get drugs similar to a selected drug
export const getSimilarDrugs = async (drugConceptId: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/similar_drugs/${drugConceptId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching similar drugs:', error);
    throw error;
  }
};

// Optional: Get patient clusters (if using clustering)
export const getClusters = async (nClusters: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/clusters/${nClusters}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching clusters:', error);
    throw error;
  }
};

// 🔥 Updated: Get list of patients (updated to match backend's PatientOutput model)
export const getPatients = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/patients/list`);
    return response.data; // Expecting: [{ id, name, age, gender, condition }]
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
};

// 🔥 Updated: Create a new patient (matches PatientInput model)
export const createPatient = async (patientData: { name: string; age: number; gender: string; condition: string }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/patients/create`, patientData);
    return response.data;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
};

// 🔥 New: Delete a patient by ID
export const deletePatient = async (id: number) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/patients/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
};


// 🔥 New: Get patient-specific drug recommendations
export const getPatientRecommendations = async (patientId: number) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/recommendations/${patientId}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching patient recommendations:', err);
    throw err;
  }
};


export async function getCoUsageRecommendations(patientId: number) {
  const response = await fetch(`http://localhost:8000/co-usage/${patientId}`);
  if (!response.ok) throw new Error('Failed to fetch co-usage drugs');
  return await response.json();
}
