import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { verifyOTP, sendOTP, clearError } from '../../store/slices/auth.slice';

const OTP_LENGTH = 6;

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerifyOTP = async () => {
    const validationLog = {
      type: 'OTP_VERIFICATION_START',
      timestamp: new Date().toISOString(),
      otp,
      otpLength: otp.length,
      expectedLength: OTP_LENGTH,
      phone,
      isValid: otp.length === OTP_LENGTH
    };
    console.log(JSON.stringify(validationLog));

    if (otp.length !== OTP_LENGTH) {
      const validationError = {
        type: 'VERIFY_OTP_VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        screen: 'verify',
        phone,
        otpLength: otp.length,
        expectedLength: OTP_LENGTH,
        error: 'Invalid OTP length',
        currentOtp: otp
      };
      console.error(JSON.stringify(validationError));
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    const logData = {
      type: 'VERIFY_OTP_ATTEMPT',
      timestamp: new Date().toISOString(),
      screen: 'verify',
      phone,
      otpLength: otp.length,
      otp: otp,
      isLoading,
      hasError: !!error
    };
    console.log(JSON.stringify(logData));

    try {
      const requestLog = {
        type: 'VERIFY_OTP_REQUEST_START',
        timestamp: new Date().toISOString(),
        phone,
        otp,
        url: '/partner/auth/verify-otp'
      };
      console.log(JSON.stringify(requestLog));

      const result = await dispatch(verifyOTP({ phone, otp })).unwrap();
      
      const successData = {
        type: 'VERIFY_OTP_SUCCESS',
        timestamp: new Date().toISOString(),
        phone,
        requiresRegistration: result.requiresRegistration,
        hasAccessToken: !!result.accessToken,
        hasPartner: !!result.partner,
        nextScreen: result.requiresRegistration ? '/(auth)/register' : '/(tabs)/'
      };
      console.log(JSON.stringify(successData));

      if (result.requiresRegistration) {
        router.push({
          pathname: '/(auth)/register',
          params: { phone },
        });
      } else if (result.accessToken) {
        router.push('/(tabs)/');
      } else {
        const unexpectedError = {
          type: 'VERIFY_OTP_UNEXPECTED',
          timestamp: new Date().toISOString(),
          result
        };
        console.error(JSON.stringify(unexpectedError));
        Alert.alert(
          'Error',
          'Unexpected response from server. Please try again.'
        );
      }
    } catch (error: any) {
      const errorData = {
        type: 'VERIFY_OTP_ERROR',
        timestamp: new Date().toISOString(),
        error: error.message,
        phone,
        otp,
        errorCode: error.code,
        errorName: error.name,
        errorStack: error.stack,
        errorResponse: error.response?.data,
        errorStatus: error.response?.status
      };
      console.error(JSON.stringify(errorData));

      Alert.alert(
        'Verification Failed',
        error.message || 'Failed to verify OTP. Please try again.'
      );
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) {
      const timerError = {
        type: 'RESEND_OTP_TIMER_ERROR',
        timestamp: new Date().toISOString(),
        screen: 'verify',
        phone,
        remainingTime: timer,
        error: 'Timer still active'
      };
      console.error(JSON.stringify(timerError));
      return;
    }

    const logData = {
      type: 'RESEND_OTP_ATTEMPT',
      timestamp: new Date().toISOString(),
      screen: 'verify',
      phone,
      previousOtp: otp
    };
    console.log(JSON.stringify(logData));

    try {
      await dispatch(sendOTP(phone)).unwrap();
      setTimer(30);
      setOtp(''); // Clear previous OTP
      
      const successData = {
        type: 'RESEND_OTP_SUCCESS',
        timestamp: new Date().toISOString(),
        phone,
        newTimer: 30
      };
      console.log(JSON.stringify(successData));
      
      Alert.alert('Success', 'New OTP has been sent to your phone.');
    } catch (error: any) {
      const errorData = {
        type: 'RESEND_OTP_ERROR',
        timestamp: new Date().toISOString(),
        error: error.message,
        phone,
        errorCode: error.code,
        errorName: error.name,
        errorStack: error.stack,
        errorResponse: error.response?.data
      };
      console.error(JSON.stringify(errorData));
      Alert.alert(
        'Failed to Resend',
        error.message || 'Failed to send new OTP. Please try again.'
      );
    }
  };

  const handleChangeText = (text: string) => {
    const inputLog = {
      type: 'OTP_INPUT_CHANGE',
      timestamp: new Date().toISOString(),
      rawInput: text,
      currentOtp: otp,
      phone,
      inputLength: text.length
    };
    console.log(JSON.stringify(inputLog));

    // Clean the input
    const cleaned = text.replace(/[^0-9]/g, '');
    
    const cleanLog = {
      type: 'OTP_INPUT_CLEANED',
      timestamp: new Date().toISOString(),
      rawInput: text,
      cleanedInput: cleaned,
      currentOtp: otp,
      cleanedLength: cleaned.length,
      maxLength: OTP_LENGTH
    };
    console.log(JSON.stringify(cleanLog));

    if (cleaned.length <= OTP_LENGTH) {
      setOtp(cleaned);
      
      const updateLog = {
        type: 'OTP_STATE_UPDATE',
        timestamp: new Date().toISOString(),
        newOtp: cleaned,
        newLength: cleaned.length,
        isComplete: cleaned.length === OTP_LENGTH
      };
      console.log(JSON.stringify(updateLog));
    } else {
      const overflowLog = {
        type: 'OTP_LENGTH_OVERFLOW',
        timestamp: new Date().toISOString(),
        attemptedInput: cleaned,
        attemptedLength: cleaned.length,
        maxLength: OTP_LENGTH
      };
      console.warn(JSON.stringify(overflowLog));
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Verify OTP',
          headerShown: true,
        }}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We've sent a verification code to {phone}
        </Text>

        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={handleChangeText}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          style={styles.hiddenInput}
          autoFocus
          editable={!isLoading}
          onEndEditing={() => {
            const endLog = {
              type: 'OTP_INPUT_END_EDITING',
              timestamp: new Date().toISOString(),
              finalOtp: otp,
              length: otp.length,
              isComplete: otp.length === OTP_LENGTH
            };
            console.log(JSON.stringify(endLog));
          }}
        />

        <View style={styles.otpContainer}>
          {Array(OTP_LENGTH).fill(0).map((_, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.otpBox,
                otp[index] ? styles.otpBoxFilled : styles.otpBoxEmpty
              ]}
              onPress={() => {
                inputRef.current?.focus();
                const focusLog = {
                  type: 'OTP_BOX_FOCUS',
                  timestamp: new Date().toISOString(),
                  boxIndex: index,
                  currentOtp: otp,
                  length: otp.length
                };
                console.log(JSON.stringify(focusLog));
              }}
            >
              <Text style={styles.otpText}>
                {otp[index] || ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[
            styles.button, 
            otp.length !== OTP_LENGTH && styles.buttonDisabled
          ]}
          onPress={() => {
            const pressLog = {
              type: 'VERIFY_BUTTON_PRESS',
              timestamp: new Date().toISOString(),
              otp,
              length: otp.length,
              isComplete: otp.length === OTP_LENGTH
            };
            console.log(JSON.stringify(pressLog));
            handleVerifyOTP();
          }}
          disabled={otp.length !== OTP_LENGTH || isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Verifying...' : 'Verify'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resendButton}
          onPress={handleResendOTP}
          disabled={timer > 0 || isLoading}
        >
          <Text style={[styles.resendText, (timer > 0 || isLoading) && styles.resendDisabled]}>
            {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: 60
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  otpBox: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
  },
  otpText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    width: '100%',
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
  resendButton: {
    marginTop: 20,
    padding: 10,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 16,
  },
  resendDisabled: {
    color: Colors.textSecondary,
  },
  otpBoxFilled: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.inputBackground
  },
  otpBoxEmpty: {
    borderColor: Colors.light.border
  },
}); 