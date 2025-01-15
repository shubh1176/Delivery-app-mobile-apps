import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { PhoneInput } from '../../components/PhoneInput';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { register } from '../../store/slices/auth.slice';
import * as Device from 'expo-device';

interface RegistrationForm {
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
}

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);
  const [form, setForm] = useState<RegistrationForm>({
    phone: '',
    email: '',
    password: '',
    name: '',
    vehicle: {
      type: 'bike',
      number: '',
      documents: {
        registration: '',
        insurance: '',
        permit: ''
      }
    },
    serviceArea: {
      city: '',
      boundaries: [],
      preferredLocations: []
    },
    deviceId: '',
    documents: {
      verification: {
        phone: false,
        email: false,
        identity: false,
        address: false,
        vehicle: false
      },
      identity: '',
      address: ''
    },
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
      bankName: ''
    }
  });

  // Get device ID on mount
  React.useEffect(() => {
    const getDeviceId = async () => {
      const deviceId = await Device.getDeviceTypeAsync();
      setForm(prev => ({
        ...prev,
        deviceId: String(deviceId)
      }));
    };
    getDeviceId();
  }, []);

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleRegister = async () => {
    // Format phone number
    const formattedPhone = form.phone.replace(/\s/g, '').replace(/[^\d+]/g, '');
    const phoneWithCode = formattedPhone.startsWith('+91') 
      ? formattedPhone 
      : formattedPhone.startsWith('91') 
        ? `+${formattedPhone}`
        : `+91${formattedPhone.replace(/^0+/, '')}`;

    if (!validatePhone(phoneWithCode)) {
      Alert.alert('Error', 'Please enter a valid Indian phone number');
      return;
    }

    if (!validateEmail(form.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!validatePassword(form.password)) {
      Alert.alert('Error', 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character');
      return;
    }

    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!form.vehicle.number.trim()) {
      Alert.alert('Error', 'Please enter your vehicle number');
      return;
    }

    if (!form.serviceArea.city.trim()) {
      Alert.alert('Error', 'Please enter your service city');
      return;
    }

    try {
      // Update form with formatted phone
      const updatedForm = {
        ...form,
        phone: phoneWithCode
      };
      
      // Log registration attempt
      const logData = {
        type: 'REGISTRATION_ATTEMPT',
        timestamp: new Date().toISOString(),
        phone: phoneWithCode,
      };
      console.log(JSON.stringify(logData));

      const result = await dispatch(register(updatedForm)).unwrap();
      
      // Log navigation attempt
      const navigationLog = {
        type: 'REGISTER_NAVIGATION',
        timestamp: new Date().toISOString(),
        result: result
      };
      console.log(JSON.stringify(navigationLog));

      // Check if registration was successful
      if (result?.accessToken) {
        router.replace('/(onboarding)/documents');
      } else {
        throw new Error('Registration successful but no access token received');
      }
    } catch (error: any) {
      console.error('Error registering:', error);
      Alert.alert('Error', error.message || 'Failed to register. Please try again.');
    }
  };

  const updateForm = (key: keyof RegistrationForm, value: any) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateVehicle = (key: keyof typeof form.vehicle, value: string) => {
    setForm(prev => ({
      ...prev,
      vehicle: {
        ...prev.vehicle,
        [key]: value,
      },
    }));
  };

  const isFormValid = () => {
    return (
      form.phone &&
      form.email &&
      form.password &&
      form.name &&
      form.vehicle.type &&
      form.vehicle.number &&
      form.serviceArea.city &&
      form.deviceId // Make sure we have the device ID
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Register',
          headerShown: true,
        }}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Fill in your details to get started</Text>

        <PhoneInput
          value={form.phone}
          onChangeText={(text) => {
            // Only allow numbers and + symbol
            const cleaned = text.replace(/[^\d\s+]/g, '');
            updateForm('phone', cleaned);
          }}
          placeholder="Phone Number"
          style={styles.input}
          editable={!isLoading}
          keyboardType="phone-pad"
        />

        <TextInput
          value={form.name}
          onChangeText={(text) => updateForm('name', text)}
          placeholder="Full Name"
          style={styles.textInput}
          editable={!isLoading}
        />

        <TextInput
          value={form.email}
          onChangeText={(text) => updateForm('email', text.toLowerCase())}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.textInput}
          editable={!isLoading}
        />

        <TextInput
          value={form.password}
          onChangeText={(text) => updateForm('password', text)}
          placeholder="Password (min 8 chars, with number & special char)"
          secureTextEntry
          style={styles.textInput}
          editable={!isLoading}
        />

        <View style={styles.vehicleContainer}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.vehicleTypeContainer}>
            {(['bike', 'scooter', 'cycle'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.vehicleTypeButton,
                  form.vehicle.type === type && styles.vehicleTypeSelected,
                ]}
                onPress={() => updateVehicle('type', type)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.vehicleTypeText,
                    form.vehicle.type === type && styles.vehicleTypeTextSelected,
                  ]}
                >
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            value={form.vehicle.number}
            onChangeText={(text) => updateVehicle('number', text.toUpperCase())}
            placeholder="Vehicle Number (e.g., DL 10 R 5299)"
            style={styles.textInput}
            autoCapitalize="characters"
            editable={!isLoading}
          />
        </View>

        <TextInput
          value={form.serviceArea.city}
          onChangeText={(text) => updateForm('serviceArea', { ...form.serviceArea, city: text })}
          placeholder="Service City"
          style={styles.textInput}
          editable={!isLoading}
        />

        <TouchableOpacity 
          style={[styles.button, (!isFormValid() || isLoading) && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={!isFormValid() || isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
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
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: Colors.inputBackground,
    marginBottom: 20,
  },
  vehicleContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 15,
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  vehicleTypeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  vehicleTypeSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  vehicleTypeText: {
    color: Colors.text,
    fontWeight: '600',
  },
  vehicleTypeTextSelected: {
    color: Colors.white,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
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
}); 