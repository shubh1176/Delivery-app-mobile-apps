import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI, TokenManager } from '../services/api';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import type { User } from '../app/types/user';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  currentSession: {
    deviceType: 'mobile' | 'web';
    lastActivity: Date;
  } | null;
}

interface AuthContextType extends AuthState {
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string, password: string) => Promise<void>;
  register: (data: { name: string; phone: string; password: string; }) => Promise<void>;
  sendOTP: (phone: string) => Promise<{ requestId: string }>;
  verifyOTP: (requestId: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    currentSession: null,
  });

  // Check for existing session on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[Auth] Checking authentication status...');
      const [token, sessionData] = await Promise.all([
        TokenManager.getAccessToken(),
        SecureStore.getItemAsync('sessionData')
      ]);

      console.log('[Auth] Auth check results:', {
        hasToken: !!token,
        hasSessionData: !!sessionData
      });

      if (token && sessionData) {
        const session = JSON.parse(sessionData);
        console.log('[Auth] Valid session found:', session);
        
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          currentSession: session,
          isLoading: false
        }));
        
        console.log('[Auth] Navigating to home tab...');
        router.replace({
          pathname: '/(tabs)/home'
        } as any);
      } else {
        console.log('[Auth] No valid session found, redirecting to auth...');
        setState(prev => ({ ...prev, isLoading: false }));
        router.replace({
          pathname: '/(auth)'
        } as any);
      }
    } catch (error) {
      console.error('[Auth] Auth check error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      router.replace({
        pathname: '/(auth)'
      } as any);
    }
  };

  const updateSessionData = async (user: User) => {
    try {
      console.log('[Auth] Creating session data...');
      const sessionData = {
        deviceType: 'mobile' as const,
        lastActivity: new Date(),
        userId: user._id
      };
      
      console.log('[Auth] Storing session data...');
      await SecureStore.setItemAsync('sessionData', JSON.stringify(sessionData));
      
      console.log('[Auth] Updating session state...');
      setState(prev => ({
        ...prev,
        currentSession: sessionData,
        user: user
      }));
    } catch (error) {
      console.error('[Auth] Session update error:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      console.log('[Auth] Starting email login process...', { email });
      setState(prev => ({ ...prev, isLoading: true }));
      
      console.log('[Auth] Calling loginWithEmail API...');
      const response = await AuthAPI.loginWithEmail(email, password);
      console.log('[Auth] Login API response received:', { 
        userId: response.user._id,
        hasTokens: !!response.tokens
      });

      console.log('[Auth] Setting tokens...');
      await TokenManager.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
      
      console.log('[Auth] Updating session data...');
      await updateSessionData(response.user as User);
      
      console.log('[Auth] Updating auth state...');
      setState(prev => ({
        ...prev,
        user: response.user as User,
        isAuthenticated: true,
        isLoading: false,
      }));

      console.log('[Auth] Navigating to home tab...');
      router.replace({
        pathname: '/(tabs)/home'
      } as any);
    } catch (error: any) {
      console.error('[Auth] Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const loginWithPhone = async (phone: string, password: string) => {
    try {
      console.log('[Auth] Starting phone login process...', { phone });
      setState(prev => ({ ...prev, isLoading: true }));
      
      console.log('[Auth] Calling loginWithPhone API...');
      const response = await AuthAPI.loginWithPhone(phone, password);
      
      console.log('[Auth] Setting tokens...');
      await TokenManager.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
      
      console.log('[Auth] Updating session data...');
      await updateSessionData(response.user);
      
      console.log('[Auth] Updating auth state...');
      setState(prev => ({
        ...prev,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      }));

      console.log('[Auth] Navigating to home tab...');
      router.replace({
        pathname: '/(tabs)/home'
      } as any);
    } catch (error: any) {
      console.error('[Auth] Phone login error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const register = async (data: { name: string; phone: string; password: string; }) => {
    try {
      console.log('[Auth] Starting registration process...', { phone: data.phone });
      setState(prev => ({ ...prev, isLoading: true }));
      
      console.log('[Auth] Calling register API...');
      const response = await AuthAPI.register(data);
      
      console.log('[Auth] Setting tokens...');
      await TokenManager.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken
      );
      
      console.log('[Auth] Updating session data...');
      await updateSessionData(response.user);
      
      console.log('[Auth] Updating auth state...');
      setState(prev => ({
        ...prev,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      }));

      console.log('[Auth] Navigating to verify screen...');
      router.push({
        pathname: '/(auth)/verify'
      } as any);
    } catch (error: any) {
      console.error('[Auth] Registration error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const sendOTP = async (phone: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const response = await AuthAPI.sendOTP(phone);
      setState(prev => ({ ...prev, isLoading: false }));
      return response;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const verifyOTP = async (requestId: string, otp: string) => {
    try {
      console.log('[Auth] Starting OTP verification...', { requestId });
      setState(prev => ({ ...prev, isLoading: true }));
      
      console.log('[Auth] Calling verifyOTP API...');
      await AuthAPI.verifyOTP(requestId, otp);
      
      console.log('[Auth] Updating user verification status...');
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, isPhoneVerified: true } : null,
        isLoading: false,
      }));

      console.log('[Auth] Navigating to home tab...');
      router.replace({
        pathname: '/(tabs)/home'
      } as any);
    } catch (error: any) {
      console.error('[Auth] OTP verification error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('[Auth] Starting logout process...');
      setState(prev => ({ ...prev, isLoading: true }));
      
      console.log('[Auth] Calling logout API...');
      await AuthAPI.logout();
      
      console.log('[Auth] Clearing local tokens and session...');
      await Promise.all([
        TokenManager.clearTokens(),
        SecureStore.deleteItemAsync('sessionData')
      ]);
      
      console.log('[Auth] Resetting auth state...');
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        currentSession: null,
      });

      console.log('[Auth] Navigating to auth screen...');
      router.replace({
        pathname: '/(auth)'
      } as any);
    } catch (error: any) {
      console.error('[Auth] Logout error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        loginWithEmail,
        loginWithPhone,
        register,
        sendOTP,
        verifyOTP,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 