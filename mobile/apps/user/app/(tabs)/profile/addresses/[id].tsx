import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../../contexts/auth';
import { updateAddress } from './api';
import { User } from '../../../types/user';
import type { SavedAddress } from '../../../types/user';

type AddressType = 'home' | 'work' | 'other';

export default function EditAddressScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [type, setType] = useState<AddressType>('home');
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    const currentAddress = (user as unknown as User)?.addresses?.find((addr: SavedAddress) => addr._id === id);
    if (currentAddress) {
      setType(currentAddress.type as AddressType);
      setLabel(currentAddress.label || '');
      setAddress(currentAddress.address);
      setLandmark(currentAddress.landmark || '');
      setPincode(currentAddress.pincode);
      setIsDefault(currentAddress.isDefault || false);
    }
  }, [id, user]);

  const handleSubmit = async () => {
    try {
      if (!address || !pincode) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // TODO: Get coordinates from address using geocoding service
      const updatedAddress: Partial<SavedAddress> = {
        type,
        label: label || type,
        address,
        landmark,
        location: {
          latitude: 0,
          longitude: 0,
        },
        pincode,
        isDefault,
      };

      await updateAddress(id as string, updatedAddress);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update address');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address Type</Text>
        <View style={styles.typeButtons}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'home' && styles.typeButtonSelected]}
            onPress={() => setType('home')}
          >
            <Ionicons name="home-outline" size={24} color={type === 'home' ? '#FFFFFF' : '#470A68'} />
            <Text style={[styles.typeText, type === 'home' && styles.typeTextSelected]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'work' && styles.typeButtonSelected]}
            onPress={() => setType('work')}
          >
            <Ionicons name="business-outline" size={24} color={type === 'work' ? '#FFFFFF' : '#470A68'} />
            <Text style={[styles.typeText, type === 'work' && styles.typeTextSelected]}>Work</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'other' && styles.typeButtonSelected]}
            onPress={() => setType('other')}
          >
            <Ionicons name="location-outline" size={24} color={type === 'other' ? '#FFFFFF' : '#470A68'} />
            <Text style={[styles.typeText, type === 'other' && styles.typeTextSelected]}>Other</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address Details</Text>
        {type === 'other' && (
          <TextInput
            style={styles.input}
            placeholder="Label (e.g. Mom's House)"
            value={label}
            onChangeText={setLabel}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Full Address *"
          value={address}
          onChangeText={setAddress}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Landmark (Optional)"
          value={landmark}
          onChangeText={setLandmark}
        />
        <TextInput
          style={styles.input}
          placeholder="Pincode *"
          value={pincode}
          onChangeText={setPincode}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.defaultToggle}
          onPress={() => setIsDefault(!isDefault)}
        >
          <Ionicons 
            name={isDefault ? 'checkbox' : 'square-outline'} 
            size={24} 
            color="#470A68" 
          />
          <Text style={styles.defaultText}>Set as default address</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>Update Address</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#470A68',
    marginHorizontal: 4,
  },
  typeButtonSelected: {
    backgroundColor: '#470A68',
  },
  typeText: {
    fontSize: 14,
    color: '#470A68',
    marginTop: 4,
  },
  typeTextSelected: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#470A68',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 