import axios from 'axios';
import Constants from 'expo-constants';

const instance = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
instance.interceptors.request.use(
  async (config) => {
    // Add auth token from secure storage if available
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401, refresh token, etc.
    return Promise.reject(error);
  }
);

export default instance; 