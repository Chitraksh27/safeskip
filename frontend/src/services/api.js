import axios from 'axios';

// 1. CHANGE THIS TO LOCALHOST (since you are running locally)
const API_URL = "http://127.0.0.1:8000/api/"; 
// const API_URL = "https://safeskip-backend.onrender.com/api/"; // Keep this commented out for later deployment

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add the JWT Token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 👇 2. ADD THIS MISSING OBJECT (Critical for Forecast/Import)
export const timetableApi = {
    // A. Upload CSV (ImportModal)
    uploadAttendance: async (formData) => {
        const response = await api.post('/import/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // B. Get Dropdown Options (ImportModal)
    getOptions: async () => {
        const response = await api.get('/subject-options/');
        return response.data;
    },

    // C. Get Weekly Schedule (ForecastPlanner)
    getSchedule: async () => {
        const response = await api.get('/timetable/');
        return response.data;
    },

    // D. Add a Class (ImportModal)
    createSlot: async (day, sessionTypeId) => {
        const response = await api.post('/timetable/', { 
            day: day, 
            session_type: sessionTypeId 
        });
        return response.data;
    },

    // E. Remove a Class (ImportModal/Planner)
    delete: async (id) => {
        const response = await api.delete(`/timetable/${id}/`);
        return response.data;
    }
};

export default api;