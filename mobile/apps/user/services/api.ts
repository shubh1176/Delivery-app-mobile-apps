import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import type { User } from '../app/types/user';

// At the top, add enum for device types
enum DeviceType {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB'
}

// Add these interfaces after the DeviceType enum
interface DeviceInfo {
  type: 'mobile' | 'web';
  platform: string;
  appVersion: string;
  deviceModel: string;
  osVersion: string;
  name: string;
}

// Update interfaces to match server response
interface APIResponse<T> {
  status: 'success' | 'error';
  data: T;
}

interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  sessionId: string;
}

interface OTPResponse {
  requestId: string;
  expiresIn: number;
  phone: string;
}

interface LogoutRequest {
  refreshToken: string;
}

const BASE_URL = 'http://192.168.57.210:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Logging utility
const logAPI = (type: string, message: string, data?: any) => {
  console.log(`[API ${type}]`, message, data ? JSON.stringify(data, null, 2) : '');
};

// Device info for authentication
export const getDeviceInfo = async () => {
  const deviceInfo: DeviceInfo = {
    type: Platform.OS === 'web' ? 'web' : 'mobile',
    platform: Platform.OS,
    appVersion: '1.0.0',
    deviceModel: Device.modelName || 'Unknown Device',
    osVersion: Device.osVersion || '1.0.0',
    name: Device.deviceName || `${Platform.OS} Device`
  };
  logAPI('Device', 'Device Info:', deviceInfo);
  return deviceInfo;
};

// Token management
export const TokenManager = {
  async setTokens(accessToken: string, refreshToken: string) {
    await Promise.all([
      SecureStore.setItemAsync('accessToken', accessToken),
      SecureStore.setItemAsync('refreshToken', refreshToken)
    ]);
  },

  async getAccessToken() {
    return SecureStore.getItemAsync('accessToken');
  },

  async getRefreshToken() {
    return SecureStore.getItemAsync('refreshToken');
  },

  async clearTokens() {
    await Promise.all([
      SecureStore.deleteItemAsync('accessToken'),
      SecureStore.deleteItemAsync('refreshToken')
    ]);
  }
};

// Auth API endpoints
export const AuthAPI = {
  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    const deviceInfo = await getDeviceInfo();
    const response = await api.post<APIResponse<AuthResponse>>('/auth/login', {
      email,
      password,
      deviceInfo
    });
    return response.data.data;
  },

  async loginWithPhone(phone: string, password: string): Promise<AuthResponse> {
    const deviceInfo = await getDeviceInfo();
    const response = await api.post<APIResponse<AuthResponse>>('/auth/login', {
      phone,
      password,
      deviceInfo
    });
    return response.data.data;
  },

  async register(data: { name: string; phone: string; password: string; }): Promise<AuthResponse> {
    const deviceInfo = await getDeviceInfo();
    const response = await api.post<APIResponse<AuthResponse>>('/auth/register', {
      ...data,
      deviceInfo
    });
    return response.data.data;
  },

  async sendOTP(phone: string): Promise<{ requestId: string }> {
    const response = await api.post<APIResponse<{ requestId: string }>>('/auth/otp/send', { phone });
    return response.data.data;
  },

  async verifyOTP(requestId: string, otp: string): Promise<void> {
    await api.post<APIResponse<void>>('/auth/otp/verify', { requestId, otp });
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const deviceInfo = await getDeviceInfo();
    const response = await api.post<APIResponse<AuthResponse>>('/auth/refresh-token', {
      refreshToken,
      deviceInfo
    });
    return response.data.data;
  },

  async logout(): Promise<void> {
    const refreshToken = await TokenManager.getRefreshToken();
    if (refreshToken) {
      await api.post<APIResponse<void>>('/auth/logout', { refreshToken });
    }
    await TokenManager.clearTokens();
  }
};

// Add auth interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await TokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logAPI('Request', `${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data
      });
    }
    return config;
  },
  (error) => {
    logAPI('Error', 'Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    logAPI('Response', `${response.status} ${response.config.url}`, {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    logAPI('Error', 'Response error', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.message
    });

    if (error.response?.status === 401 && !originalRequest._retry) {
      logAPI('Auth', 'Token expired, attempting refresh');
      originalRequest._retry = true;

      try {
        const refreshToken = await TokenManager.getRefreshToken();
        if (!refreshToken) {
          logAPI('Error', 'No refresh token available');
          throw new Error('No refresh token');
        }

        const response = await AuthAPI.refreshToken(refreshToken);
        await TokenManager.setTokens(response.tokens.accessToken, response.tokens.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${response.tokens.accessToken}`;
        logAPI('Auth', 'Token refreshed, retrying original request');
        return api(originalRequest);
      } catch (refreshError) {
        logAPI('Error', 'Token refresh failed, clearing tokens', refreshError);
        await TokenManager.clearTokens();
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

export default api; 