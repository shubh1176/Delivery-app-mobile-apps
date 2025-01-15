import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { PhoneInput } from '../../components/PhoneInput';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { sendOTP, clearError } from '../../store/slices/auth.slice';

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (error) {
      const logData = {
        type: 'AUTH_ERROR',
        timestamp: new Date().toISOString(),
        screen: 'login',
        error,
      };
      console.error(JSON.stringify(logData));
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validatePhone = (phone: string) => {
    // Remove all non-digit characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Check if it's a valid Indian phone number
    const phoneRegex = /^\+?91[6-9]\d{9}$/;
    const isValid = phoneRegex.test(cleanPhone);

    // Log validation result
    const logData = {
      type: 'PHONE_VALIDATION',
      timestamp: new Date().toISOString(),
      phone: cleanPhone,
      isValid,
    };
    console.log(JSON.stringify(logData));

    return isValid;
  };

  const handleSendOTP = async () => {
    const logData = {
      type: 'SEND_OTP_ATTEMPT',
      timestamp: new Date().toISOString(),
      screen: 'login',
    };
    console.log(JSON.stringify(logData));

    if (!phone) {
      const errorData = {
        type: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        screen: 'login',
        error: 'Phone number is required',
      };
      console.error(JSON.stringify(errorData));
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Format phone number (remove spaces and add +91 if not present)
    const formattedPhone = phone.replace(/\s/g, '').replace(/[^\d+]/g, '');
    const phoneWithCode = formattedPhone.startsWith('+91') 
      ? formattedPhone 
      : formattedPhone.startsWith('91') 
        ? `+${formattedPhone}`
        : `+91${formattedPhone.replace(/^0+/, '')}`;

    if (!validatePhone(phoneWithCode)) {
      const errorData = {
        type: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        screen: 'login',
        error: 'Invalid phone number format',
        phone: phoneWithCode,
      };
      console.error(JSON.stringify(errorData));
      Alert.alert('Error', 'Please enter a valid Indian phone number');
      return;
    }

    try {
      const requestData = {
        type: 'SEND_OTP_REQUEST',
        timestamp: new Date().toISOString(),
        phone: phoneWithCode,
      };
      console.log(JSON.stringify(requestData));

      const result = await dispatch(sendOTP(phoneWithCode)).unwrap();
      
      const successData = {
        type: 'SEND_OTP_SUCCESS',
        timestamp: new Date().toISOString(),
        phone: phoneWithCode,
      };
      console.log(JSON.stringify(successData));
      
      if (result) {
        router.push({
          pathname: '/(auth)/verify',
          params: { phone: phoneWithCode },
        });
      }
    } catch (error: any) {
      const errorData = {
        type: 'SEND_OTP_ERROR',
        timestamp: new Date().toISOString(),
        error: error.message,
        phone: phoneWithCode,
      };
      console.error(JSON.stringify(errorData));
      Alert.alert(
        'Error',
        error.message || 'Failed to send OTP. Please try again.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Login',
          headerShown: false,
        }}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Enter your phone number to continue</Text>
        
        <PhoneInput
          value={phone}
          onChangeText={(text) => {
            // Only allow numbers and + symbol
            const cleaned = text.replace(/[^\d\s+]/g, '');
            setPhone(cleaned);
          }}
          placeholder="Phone Number"
          style={styles.input}
          editable={!isLoading}
          keyboardType="phone-pad"
        />

        <TouchableOpacity 
          style={[styles.button, phone.length < 10 && styles.buttonDisabled]}
          onPress={handleSendOTP}
          disabled={phone.length < 10 || isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Sending...' : 'Send OTP'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => {
            const log = {
              type: 'REGISTER_BUTTON_PRESS',
              timestamp: new Date().toISOString(),
              screen: 'login'
            };
            console.log(JSON.stringify(log));
            router.push('/(auth)/register');
          }}
        >
          <Text style={styles.registerText}>
            New to OnePost? Register here
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Enter your 10-digit mobile number with country code (+91)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 30,
  },
  input: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    marginTop: 12,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 20,
    padding: 10,
  },
  registerText: {
    color: Colors.light.primary,
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
}); 