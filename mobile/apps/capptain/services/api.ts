import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import NetInfo from '@react-native-community/netinfo';

const BASE_URL = 'http://192.168.57.210:3000/api';

// Get app version and build number
const appVersion = Application.nativeApplicationVersion;
const buildNumber = Application.nativeBuildVersion;

// Log initial configuration
if (__DEV__) {
  const configLog = {
    type: 'API_CONFIG',
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    platform: Platform.OS,
    isDevice: Constants.isDevice,
    appVersion,
    buildNumber,
  };
  console.log(JSON.stringify(configLog));
}

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Version': appVersion,
    'X-Build-Number': buildNumber,
    'X-Platform': Platform.OS,
  },
  timeout: 15000,
});

// Check network connectivity before making requests
const checkConnectivity = async () => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    throw new Error('No internet connection. Please check your network settings.');
  }
  return netInfo;
};

// Request interceptor to add auth token and log requests in development
api.interceptors.request.use(
  async (config) => {
    try {
      // Check network connectivity
      const netInfo = await checkConnectivity();
      const networkLogData = {
        logType: 'NETWORK_STATUS',
        timestamp: new Date().toISOString(),
        networkInfo: netInfo,
      };
      console.log(JSON.stringify(networkLogData));

      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      
      // Log request in development using nobridge
      if (__DEV__) {
        const requestLogData = {
          type: 'API_REQUEST',
          timestamp: new Date().toISOString(),
          url: `${BASE_URL}${config.url}`,
          method: config.method?.toUpperCase(),
          headers: config.headers,
          data: config.data,
        };
        console.log(JSON.stringify(requestLogData));
      }
      
      return config;
    } catch (error: any) {
      const interceptorErrorData = {
        type: 'API_ERROR',
        timestamp: new Date().toISOString(),
        error: error.message || 'Request interceptor error',
        details: error,
      };
      console.error(JSON.stringify(interceptorErrorData));
      return Promise.reject(error);
    }
  },
  (error) => {
    const requestErrorData = {
      type: 'API_ERROR',
      timestamp: new Date().toISOString(),
      error: 'Request interceptor error',
      details: error,
    };
    console.error(JSON.stringify(requestErrorData));
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and log responses in development
api.interceptors.response.use(
  (response) => {
    // Log response in development using nobridge
    if (__DEV__) {
      const responseLogData = {
        type: 'API_RESPONSE',
        timestamp: new Date().toISOString(),
        url: `${BASE_URL}${response.config.url}`,
        status: response.status,
        data: response.data,
      };
      console.log(JSON.stringify(responseLogData));
    }
    return response;
  },
  async (error) => {
    // Log error in development using nobridge
    if (__DEV__) {
      const responseErrorData = {
        type: 'API_ERROR',
        timestamp: new Date().toISOString(),
        url: error.config ? `${BASE_URL}${error.config.url}` : undefined,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        name: error.name,
      };
      console.error(JSON.stringify(responseErrorData));
    }

    // Network error with more specific messages
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('Request timed out. Please try again.'));
      }
      if (error.message.includes('Network Error')) {
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) {
          return Promise.reject(new Error('No internet connection. Please check your network settings.'));
        }
        return Promise.reject(new Error('Cannot connect to server. Please check if the server is running.'));
      }
      return Promise.reject(new Error('Network error. Please try again.'));
    }

    const originalRequest = error.config;

    // Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${BASE_URL}/partner/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        await AsyncStorage.multiSet([
          ['accessToken', accessToken],
          ['refreshToken', newRefreshToken],
        ]);

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        router.replace('/(auth)/login');
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
    }

    // Handle specific error messages from the partner API
    if (error.response?.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }

    // Handle other status codes
    switch (error.response?.status) {
      case 400:
        return Promise.reject(new Error('Invalid request. Please check your input.'));
      case 403:
        return Promise.reject(new Error('Account is blocked or inactive.'));
      case 404:
        return Promise.reject(new Error('Service not available in your area.'));
      case 429:
        return Promise.reject(new Error('Too many attempts. Please try again later.'));
      case 500:
        return Promise.reject(new Error('Service temporarily unavailable. Please try again later.'));
      default:
        return Promise.reject(new Error('Something went wrong. Please try again.'));
    }
  }
); 