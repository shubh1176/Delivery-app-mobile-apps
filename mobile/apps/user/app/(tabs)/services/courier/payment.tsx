import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useCourierOrder } from './context/CourierOrderContext';
import { createCourierOrder } from './api';
import { CourierOrderRequest, CourierAddress, CourierContact } from '@/types/courier';
import ServiceHeader from '../components/ServiceHeader';

const paymentMethods = [
  {
    id: 'online',
    title: 'Online Payment',
    description: 'Pay securely with UPI or cards',
    icon: 'card'
  },
  {
    id: 'wallet',
    title: 'Wallet',
    description: 'Pay using wallet balance',
    icon: 'wallet',
    balance: 500
  },
  {
    id: 'cash',
    title: 'Cash',
    description: 'Pay cash at pickup',
    icon: 'cash'
  }
] as const;

export default function Payment() {
  const { state, dispatch } = useCourierOrder();
  const { payment, packageDetails, pickupDetails, dropDetails, insurance, loading } = state;

  const handleMethodSelect = (method: typeof paymentMethods[number]['id']) => {
    dispatch({ type: 'SET_PAYMENT_METHOD', payload: method });
  };

  const handleConfirm = async () => {
    if (!payment.method || !payment.estimation) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    // Validate required address fields
    if (!pickupDetails.address.full || !pickupDetails.address.pincode || !pickupDetails.contact.name || !pickupDetails.contact.phone ||
        !dropDetails.address.full || !dropDetails.address.pincode || !dropDetails.contact.name || !dropDetails.contact.phone) {
      Alert.alert('Error', 'Please fill in all address details');
      return;
    }

    // Validate package details
    if (!packageDetails.category || !packageDetails.size) {
      Alert.alert('Error', 'Please fill in all package details');
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const pickupAddress: CourierAddress = {
        full: pickupDetails.address.full,
        pincode: pickupDetails.address.pincode,
        landmark: pickupDetails.address.landmark,
        coordinates: pickupDetails.address.coordinates || {
          latitude: 0,
          longitude: 0
        }
      };

      const pickupContact: CourierContact = {
        name: pickupDetails.contact.name,
        phone: pickupDetails.contact.phone,
        alternatePhone: pickupDetails.contact.alternatePhone
      };

      const dropAddress: CourierAddress = {
        full: dropDetails.address.full,
        pincode: dropDetails.address.pincode,
        landmark: dropDetails.address.landmark,
        coordinates: dropDetails.address.coordinates || {
          latitude: 0,
          longitude: 0
        }
      };

      const dropContact: CourierContact = {
        name: dropDetails.contact.name,
        phone: dropDetails.contact.phone,
        alternatePhone: dropDetails.contact.alternatePhone
      };

      const orderData: CourierOrderRequest = {
        pickup: {
          address: pickupAddress,
          contact: pickupContact,
          scheduledTime: new Date().toISOString() // TODO: Add time selection
        },
        drops: [{
          address: dropAddress,
          contact: dropContact,
          scheduledTime: new Date().toISOString(), // TODO: Add time selection
          sequence: 1
        }],
        package: {
          category: packageDetails.category as 'documents' | 'electronics' | 'clothing' | 'food' | 'medicine' | 'other',
          type: packageDetails.category || 'other',
          size: packageDetails.size as 'small' | 'medium' | 'large',
          weight: packageDetails.weight || 0,
          dimensions: {
            length: 0,
            width: 0,
            height: 0
          },
          value: 0,
          photos: [],
          description: '',
          items: [],
          isFragile: insurance.handling.fragile,
          requiresRefrigeration: insurance.handling.refrigerated
        },
        payment: {
          method: payment.method as 'cash' | 'online' | 'wallet',
          // transactionId will be added after payment processing
        },
        insurance: {
          required: insurance.type !== 'basic'
        },
        vehicleType: 'bike', // TODO: Add vehicle selection based on package size
        requiresSignature: insurance.handling.signature,
        handlingInstructions: [
          ...(insurance.handling.fragile ? ['Handle with care - Fragile'] : []),
          ...(insurance.handling.refrigerated ? ['Temperature sensitive item'] : [])
        ]
      };

      const response = await createCourierOrder(orderData);
      
      // Reset order state
      dispatch({ type: 'RESET_ORDER' });
      
      // Navigate to orders screen
      router.push('/(tabs)/orders' as any);
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
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
        title="Review & Pay"
        subtitle="Review your order and complete payment"
      />

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Base Charge</Text>
            <Text style={styles.summaryValue}>₹{payment.estimation?.base || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Weight Charge</Text>
            <Text style={styles.summaryValue}>₹{payment.estimation?.weight || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Insurance Premium</Text>
            <Text style={styles.summaryValue}>₹{payment.estimation?.insurance || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxes</Text>
            <Text style={styles.summaryValue}>₹{payment.estimation?.tax || 0}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{payment.estimation?.total || 0}</Text>
          </View>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        
        {paymentMethods.map(method => (
          <Pressable
            key={method.id}
            style={[
              styles.methodCard,
              payment.method === method.id && styles.selectedCard
            ]}
            onPress={() => handleMethodSelect(method.id)}
          >
            <View style={styles.methodIcon}>
              <Ionicons 
                name={method.icon} 
                size={24} 
                color={payment.method === method.id ? '#470A68' : '#666666'} 
              />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>{method.title}</Text>
              <Text style={styles.methodDescription}>
                {method.description}
                {'balance' in method ? ` (Balance: ₹${method.balance})` : ''}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable 
          style={[
            styles.confirmButton,
            !payment.method && styles.confirmButtonDisabled
          ]}
          onPress={handleConfirm}
          disabled={!payment.method}
        >
          <Text style={styles.buttonText}>
            Pay ₹{payment.estimation?.total || 0}
          </Text>
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  totalRow: {
    marginTop: 5,
    borderBottomWidth: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#470A68',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  selectedCard: {
    borderColor: '#470A68',
    backgroundColor: '#F8F0FF',
  },
  methodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333333',
  },
  methodDescription: {
    fontSize: 14,
    color: '#666666',
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  confirmButton: {
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
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
}); 