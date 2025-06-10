import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Note: Authentication removed - no token headers or 401 handling needed

export default api;

// Helper function for backwards compatibility
export const getApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
}; 