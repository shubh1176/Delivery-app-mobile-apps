import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

interface Partner {
  id: string;
  phone: string;
  email: string;
  name: string;
  status: 'active' | 'offline' | 'blocked' | 'deleted';
  vehicle: {
    type: 'bike' | 'scooter' | 'cycle';
    number: string;
    documents: {
      rc?: string;
      insurance?: string;
      permit?: string;
    };
  };
  currentLocation?: {
    coordinates: [number, number];
    accuracy?: number;
    heading?: number;
    speed?: number;
    lastUpdated: Date;
  };
}

interface AuthState {
  partner: Partner | null;
  accessToken: string | null;
  refreshToken: string | null;
  deviceToken: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  partner: null,
  accessToken: null,
  refreshToken: null,
  deviceToken: null,
  isLoading: false,
  error: null,
};

async function getDeviceToken() {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export const updateDeviceToken = createAsyncThunk(
  'auth/updateDeviceToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const deviceToken = await getDeviceToken();
      if (!deviceToken) return;

      const state = getState() as { auth: AuthState };
      if (state.auth.deviceToken === deviceToken) return;

      await api.post('/partner/auth/update-device-token', { deviceToken });
      return deviceToken;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update device token');
    }
  }
);

export const sendOTP = createAsyncThunk(
  'auth/sendOTP',
  async (phone: string, { rejectWithValue }) => {
    try {
      // Log the request
      const requestLog = {
        type: 'SEND_OTP_REQUEST',
        timestamp: new Date().toISOString(),
        phone,
        endpoint: '/partner/auth/send-otp'
      };
      console.log(JSON.stringify(requestLog));

      const response = await api.post('/partner/auth/send-otp', { phone });

      // Log the success response
      const responseLog = {
        type: 'SEND_OTP_SUCCESS',
        timestamp: new Date().toISOString(),
        status: response.status,
        data: response.data
      };
      console.log(JSON.stringify(responseLog));

      return response.data;
    } catch (error: any) {
      // Log the error
      const errorLog = {
        type: 'SEND_OTP_ERROR',
        timestamp: new Date().toISOString(),
        phone,
        errorStatus: error.response?.status,
        errorData: error.response?.data,
        errorMessage: error.message
      };
      console.error(JSON.stringify(errorLog));

      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to send OTP'
      );
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ phone, otp }: { phone: string; otp: string }, { rejectWithValue }) => {
    try {
      const requestLog = {
        type: 'VERIFY_OTP_REQUEST',
        timestamp: new Date().toISOString(),
        phone,
        otpLength: otp.length,
        endpoint: '/partner/auth/verify-otp'
      };
      console.log(JSON.stringify(requestLog));

      const response = await api.post('/partner/auth/verify-otp', { 
        phone, 
        otp
      });

      const responseLog = {
        type: 'VERIFY_OTP_RESPONSE',
        timestamp: new Date().toISOString(),
        status: response.status,
        data: response.data
      };
      console.log(JSON.stringify(responseLog));

      const { accessToken, refreshToken, partner, requiresRegistration } = response.data.data;
      
      if (accessToken && refreshToken) {
        const tokenLog = {
          type: 'VERIFY_OTP_TOKENS',
          timestamp: new Date().toISOString(),
          hasAccessToken: true,
          hasRefreshToken: true
        };
        console.log(JSON.stringify(tokenLog));

        await AsyncStorage.multiSet([
          ['accessToken', accessToken],
          ['refreshToken', refreshToken],
        ]);
      }
      
      return response.data.data;
    } catch (error: any) {
      const errorLog = {
        type: 'VERIFY_OTP_API_ERROR',
        timestamp: new Date().toISOString(),
        phone,
        otpLength: otp.length,
        errorStatus: error.response?.status,
        errorData: error.response?.data,
        errorMessage: error.message,
        errorCode: error.code,
        errorName: error.name
      };
      console.error(JSON.stringify(errorLog));

      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to verify OTP'
      );
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: {
    phone: string;
    email: string;
    password: string;
    name: string;
    vehicle: {
      type: 'bike' | 'scooter' | 'cycle';
      number: string;
      documents: {
        registration: string;
        insurance: string;
        permit: string;
      };
    };
    serviceArea: {
      city: string;
      boundaries: any[];
      preferredLocations: any[];
    };
    deviceId: string;
    documents: {
      verification: {
        phone: boolean;
        email: boolean;
        identity: boolean;
        address: boolean;
        vehicle: boolean;
      };
      identity: string;
      address: string;
    };
    bankDetails: {
      accountNumber: string;
      ifscCode: string;
      accountHolderName: string;
      bankName: string;
    };
  }, { rejectWithValue }) => {
    try {
      // Log registration attempt
      const requestLog = {
        type: 'REGISTER_REQUEST',
        timestamp: new Date().toISOString(),
        phone: data.phone,
        email: data.email,
        name: data.name,
        endpoint: '/partner/auth/register'
      };
      console.log(JSON.stringify(requestLog));

      // Format phone number if needed
      const formattedPhone = data.phone.startsWith('+91') 
        ? data.phone 
        : data.phone.startsWith('91')
          ? `+${data.phone}`
          : `+91${data.phone.replace(/^0+/, '')}`;

      // Prepare registration data
      const registrationData = {
        ...data,
        phone: formattedPhone,
        deviceId: data.deviceId || await Device.getDeviceTypeAsync(),
        documents: {
          ...data.documents,
          verification: {
            ...data.documents.verification,
            phone: true // Phone is verified through OTP
          }
        }
      };

      // Log formatted request data
      const formattedRequestLog = {
        type: 'REGISTER_FORMATTED_REQUEST',
        timestamp: new Date().toISOString(),
        data: registrationData
      };
      console.log(JSON.stringify(formattedRequestLog));

      const response = await api.post('/partner/auth/register', registrationData);

      // Log successful registration response
      const responseLog = {
        type: 'REGISTER_SUCCESS',
        timestamp: new Date().toISOString(),
        status: response.status,
        data: response.data
      };
      console.log(JSON.stringify(responseLog));

      const { accessToken, refreshToken, partner } = response.data.data;
      
      if (accessToken && refreshToken) {
        const tokenLog = {
          type: 'REGISTER_TOKENS',
          timestamp: new Date().toISOString(),
          hasAccessToken: true,
          hasRefreshToken: true
        };
        console.log(JSON.stringify(tokenLog));

        await AsyncStorage.multiSet([
          ['accessToken', accessToken],
          ['refreshToken', refreshToken],
        ]);
      }
      
      return response.data.data;
    } catch (error: any) {
      // Log registration error with full details
      const errorLog = {
        type: 'REGISTER_ERROR',
        timestamp: new Date().toISOString(),
        errorStatus: error.response?.status,
        errorData: error.response?.data,
        errorMessage: error.message,
        errorStack: error.stack
      };
      console.error(JSON.stringify(errorLog));

      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to register. Please try again.'
      );
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ phone, password }: { phone: string; password: string }, { rejectWithValue }) => {
    try {
      const deviceToken = await getDeviceToken();
      const response = await api.post('/partner/auth/login', { phone, password, deviceToken });
      const { accessToken, refreshToken, partner } = response.data.data;
      
      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['refreshToken', refreshToken],
      ]);
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to login');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const logoutLog = {
        type: 'LOGOUT_START',
        timestamp: new Date().toISOString()
      };
      console.log(JSON.stringify(logoutLog));

      // Clear local storage
      await AsyncStorage.multiRemove([
        'accessToken', 
        'refreshToken',
        'deviceToken',
        'partner'
      ]);

      const successLog = {
        type: 'LOGOUT_SUCCESS',
        timestamp: new Date().toISOString()
      };
      console.log(JSON.stringify(successLog));

      return { success: true };
    } catch (error: any) {
      const errorLog = {
        type: 'LOGOUT_ERROR',
        timestamp: new Date().toISOString(),
        error: error.message
      };
      console.error(JSON.stringify(errorLog));
      return rejectWithValue('Failed to logout');
    }
  }
);

export const updateStatus = createAsyncThunk(
  'auth/updateStatus',
  async (status: 'active' | 'offline', { rejectWithValue }) => {
    try {
      const response = await api.put('/partner/status', { status });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

export const updateLocation = createAsyncThunk(
  'auth/updateLocation',
  async (location: {
    coordinates: [number, number];
    accuracy?: number;
    heading?: number;
    speed?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/partner/location', {
        ...location,
        lastUpdated: new Date(),
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update location');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setDeviceToken: (state, action) => {
      state.deviceToken = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateDeviceToken.fulfilled, (state, action) => {
        if (action.payload) {
          state.deviceToken = action.payload;
        }
      })
      .addCase(sendOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        // Log success state update
        const stateLog = {
          type: 'SEND_OTP_STATE_UPDATE',
          timestamp: new Date().toISOString(),
          success: true
        };
        console.log(JSON.stringify(stateLog));
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Log error state update
        const stateLog = {
          type: 'SEND_OTP_STATE_UPDATE',
          timestamp: new Date().toISOString(),
          success: false,
          error: action.payload
        };
        console.error(JSON.stringify(stateLog));
      })
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.accessToken) {
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.partner = action.payload.partner;
          state.deviceToken = action.payload.deviceToken;
        }
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.partner = action.payload.partner;
        state.deviceToken = action.payload.deviceToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.accessToken) {
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.partner = action.payload.partner;
          state.deviceToken = action.payload.deviceToken;
        }
        // Log state update
        const stateLog = {
          type: 'REGISTER_STATE_UPDATE',
          timestamp: new Date().toISOString(),
          success: true,
          hasToken: !!action.payload.accessToken
        };
        console.log(JSON.stringify(stateLog));
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // Log error state
        const stateLog = {
          type: 'REGISTER_STATE_UPDATE',
          timestamp: new Date().toISOString(),
          success: false,
          error: action.payload
        };
        console.error(JSON.stringify(stateLog));
      })
      .addCase(logout.fulfilled, (state) => {
        state.partner = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.deviceToken = null;
      })
      .addCase(updateStatus.fulfilled, (state, action) => {
        if (state.partner) {
          state.partner.status = action.payload.status;
        }
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        if (state.partner) {
          state.partner.currentLocation = action.payload.currentLocation;
        }
      });
  },
});

export const { clearError, setDeviceToken } = authSlice.actions;

export default authSlice.reducer; 