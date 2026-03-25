/**
 * API Service – centralized Axios instance for all backend calls
 */
import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token on every request
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Handle 401 responses (expired/invalid token)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const login   = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe   = () => API.get('/auth/me');

// ── Students (Teacher CRUD) ──────────────────────────────────────────────────
export const getStudents    = (params) => API.get('/students', { params });
export const getStudent     = (id) => API.get(`/students/${id}`);
export const createStudent  = (data) => API.post('/students', data);
export const updateStudent  = (id, data) => API.put(`/students/${id}`, data);
export const deleteStudent  = (id) => API.delete(`/students/${id}`);
export const uploadCSV      = (formData) => API.post('/students/upload-csv', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// ── Student Self-Service ────────────────────────────────────────────────────
export const submitStudentData  = (data) => API.post('/students/submit-data', data);
export const getMyData          = () => API.get('/students/my-data');
export const getMySubmissions   = (params) => API.get('/students/my-submissions', { params });

// ── Teacher Submission View ─────────────────────────────────────────────────
export const getAllSubmissions   = (params) => API.get('/students/all-submissions', { params });

// ── Predictions ─────────────────────────────────────────────────────────────
export const getPredictions         = (params) => API.get('/predictions', { params });
export const predictStudent         = (studentId) => API.post(`/predictions/predict/${studentId}`);
export const predictAll             = () => API.post('/predictions/predict-all');
export const getStudentPredictions  = (studentId) => API.get(`/predictions/student/${studentId}`);
export const getModelMetrics        = () => API.get('/predictions/metrics');
export const getFeatureImportance   = () => API.get('/predictions/feature-importance');
export const trainModels            = () => API.post('/predictions/train');

// ── Analytics ───────────────────────────────────────────────────────────────
export const getOverview                  = () => API.get('/analytics/overview');
export const getAttendanceVsMarks         = () => API.get('/analytics/attendance-vs-marks');
export const getStudyHoursVsPerformance   = () => API.get('/analytics/study-hours-vs-performance');
export const getPerformanceDistribution   = () => API.get('/analytics/performance-distribution');
export const getStudentPerformance        = (id) => API.get(`/analytics/student-performance/${id}`);
export const getTopWeakStudents           = () => API.get('/analytics/top-weak-students');
export const getStudentOverview           = () => API.get('/analytics/student-overview');

export default API;
