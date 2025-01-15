import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { CourierAddress, CourierContact, estimateCourierOrder } from './api';
import { useCourierOrder } from './context/CourierOrderContext';
import ServiceHeader from '../components/ServiceHeader';

interface LocationFormProps {
  title: string;
  address: Partial<CourierAddress>;
  contact: Partial<CourierContact>;
  onAddressChange: (address: Partial<CourierAddress>) => void;
  onContactChange: (contact: Partial<CourierContact>) => void;
}

const LocationForm = ({ title, address, contact, onAddressChange, onContactChange }: LocationFormProps) => (
  <View style={styles.formSection}>
    <View style={styles.sectionHeader}>
      <Ionicons name="location" size={24} color="#470A68" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    
    {/* Address Fields */}
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Full Address</Text>
      <TextInput
        style={styles.input}
        value={address.full}
        onChangeText={(text) => onAddressChange({ ...address, full: text })}
        placeholder="Enter complete address"
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Landmark (Optional)</Text>
      <TextInput
        style={styles.input}
        value={address.landmark}
        onChangeText={(text) => onAddressChange({ ...address, landmark: text })}
        placeholder="Nearby landmark"
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Pincode</Text>
      <TextInput
        style={styles.input}
        value={address.pincode}
        onChangeText={(text) => onAddressChange({ ...address, pincode: text })}
        placeholder="Enter pincode"
        keyboardType="number-pad"
        maxLength={6}
      />
    </View>

    {/* Contact Fields */}
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Contact Name</Text>
      <TextInput
        style={styles.input}
        value={contact.name}
        onChangeText={(text) => onContactChange({ ...contact, name: text })}
        placeholder="Enter contact name"
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={contact.phone}
        onChangeText={(text) => onContactChange({ ...contact, phone: text })}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Alternate Phone (Optional)</Text>
      <TextInput
        style={styles.input}
        value={contact.alternatePhone}
        onChangeText={(text) => onContactChange({ ...contact, alternatePhone: text })}
        placeholder="Enter alternate phone"
        keyboardType="phone-pad"
      />
    </View>
  </View>
);

export default function DeliveryDetails() {
  const { state, dispatch } = useCourierOrder();
  const { pickupDetails, dropDetails, packageDetails, loading } = state;

  // Get price estimation when both addresses are filled
  useEffect(() => {
    const getEstimate = async () => {
      if (pickupDetails.address.full && dropDetails.address.full && packageDetails.category) {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          const estimateData = await estimateCourierOrder({
            pickup: {
              address: pickupDetails.address as CourierAddress
            },
            drops: [{
              address: dropDetails.address as CourierAddress,
              sequence: 1
            }],
            package: packageDetails as any
          });
          dispatch({ type: 'SET_PRICE_ESTIMATION', payload: {
            base: estimateData.estimation.base,
            weight: estimateData.estimation.weight,
            insurance: 0,
            tax: estimateData.estimation.tax,
            total: estimateData.estimation.total
          }});
        } catch (error) {
          console.error('Error getting estimate:', error);
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    getEstimate();
  }, [pickupDetails.address.full, dropDetails.address.full]);

  const handleContinue = () => {
    if (!pickupDetails.address.full || !pickupDetails.contact.name || !pickupDetails.contact.phone ||
        !dropDetails.address.full || !dropDetails.contact.name || !dropDetails.contact.phone) {
      // Show error
      return;
    }
    router.push('/(tabs)/services/courier/insurance' as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#470A68" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ServiceHeader 
        title="Delivery Details"
        subtitle="Enter pickup and delivery information"
      />

      <LocationForm
        title="Pickup Details"
        address={pickupDetails.address}
        contact={pickupDetails.contact}
        onAddressChange={(address) => dispatch({ type: 'SET_PICKUP_ADDRESS', payload: address })}
        onContactChange={(contact) => dispatch({ type: 'SET_PICKUP_CONTACT', payload: contact })}
      />

      <LocationForm
        title="Delivery Details"
        address={dropDetails.address}
        contact={dropDetails.contact}
        onAddressChange={(address) => dispatch({ type: 'SET_DROP_ADDRESS', payload: address })}
        onContactChange={(contact) => dispatch({ type: 'SET_DROP_CONTACT', payload: contact })}
      />

      <View style={styles.footer}>
        <Pressable 
          style={[
            styles.continueButton,
            (!pickupDetails.address.full || !pickupDetails.contact.name || !pickupDetails.contact.phone ||
             !dropDetails.address.full || !dropDetails.contact.name || !dropDetails.contact.phone) && 
            styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!pickupDetails.address.full || !pickupDetails.contact.name || !pickupDetails.contact.phone ||
                   !dropDetails.address.full || !dropDetails.contact.name || !dropDetails.contact.phone}
        >
          <Text style={styles.buttonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 24,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  formSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  continueButton: {
    backgroundColor: '#470A68',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
}); 