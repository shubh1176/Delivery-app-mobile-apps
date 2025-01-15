import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { OrderAPI } from '../api';
import { useOrderCreation } from '../../../../contexts/OrderCreationContext';
import { useAuth } from '../../../../contexts/auth';
import type { EstimatePickupDropRequest, EstimatePickupDropResponse, CreatePickupDropRequest } from '../../../../app/types/api';
import { PackageDetails } from '@/app/types/order';

export default function PaymentScreen() {
  const { state } = useOrderCreation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [estimate, setEstimate] = useState<EstimatePickupDropResponse['data'] | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'online' | 'wallet'>('online');
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  const [showDropDatePicker, setShowDropDatePicker] = useState(false);
  const [activeDropIndex, setActiveDropIndex] = useState<number>(0);
  const [pickupTime, setPickupTime] = useState(new Date());
  const [dropTimes, setDropTimes] = useState<Date[]>(state.drops.map(() => new Date()));

  useEffect(() => {
    loadEstimate();
  }, []);

  const loadEstimate = async () => {
    try {
      if (!state.pickup?.address || !state.packageDetails?.category || !state.packageDetails?.type ||
          !state.packageDetails?.size || !state.packageDetails?.weight || !state.packageDetails?.dimensions ||
          !state.packageDetails?.value || typeof state.packageDetails?.isFragile !== 'boolean' ||
          typeof state.packageDetails?.requiresRefrigeration !== 'boolean' || !state.packageDetails?.description) {
        throw new Error('Complete pickup location and package details are required');
      }

      const request: EstimatePickupDropRequest = {
        pickup: {
          address: state.pickup.address,
          package: {
            category: state.packageDetails.category,
            type: state.packageDetails.type,
            size: state.packageDetails.size,
            weight: state.packageDetails.weight,
            dimensions: state.packageDetails.dimensions,
            value: state.packageDetails.value,
            isFragile: state.packageDetails.isFragile,
            requiresRefrigeration: state.packageDetails.requiresRefrigeration,
            description: state.packageDetails.description,
          },
        },
        drops: state.drops.map((drop, index) => {
          if (!drop.address) {
            throw new Error('Invalid drop location data');
          }
          return {
            address: drop.address,
            sequence: index + 1,
          };
        }),
      };

      const response = await OrderAPI.estimatePickupDrop(request);
      setEstimate(response.data);
    } catch (error) {
      console.error('Error loading estimate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickupTimeChange = (event: any, selectedDate?: Date) => {
    setShowPickupDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setPickupTime(selectedDate);
    }
  };

  const handleDropTimeChange = (event: any, selectedDate?: Date) => {
    setShowDropDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const newDropTimes = [...dropTimes];
      newDropTimes[activeDropIndex] = selectedDate;
      setDropTimes(newDropTimes);
    }
  };

  const handleConfirmOrder = async () => {
    if (!estimate || !state.pickup?.address || !state.pickup?.contact || !state.packageDetails || !user) {
      console.error('Missing required order details');
      return;
    }

    try {
      setIsLoading(true);
      const { packageDetails } = state;

      // Validate package details
      if (!packageDetails.category || !packageDetails.type || !packageDetails.size || 
          !packageDetails.weight || !packageDetails.dimensions || !packageDetails.value) {
        console.error('Incomplete package details');
        return;
      }

      // Create complete package details with required fields
      const completePackage = {
        category: packageDetails.category,
        type: packageDetails.type,
        size: packageDetails.size,
        weight: packageDetails.weight,
        dimensions: packageDetails.dimensions,
        value: packageDetails.value,
        photos: ["base64-encoded-image"],
        isFragile: packageDetails.isFragile || false,
        requiresRefrigeration: packageDetails.requiresRefrigeration || false,
        description: packageDetails.description || ''
      };

      console.log('[PaymentScreen] Package details:', completePackage);

      const validDrops = state.drops.every(drop => drop.address && drop.contact);
      if (!validDrops) {
        console.error('Invalid drop locations');
        return;
      }

      const orderRequest: CreatePickupDropRequest = {
        type: 'pickup-drop',
        userId: user._id,
        status: 'pending',
        pickup: {
          address: {
            full: state.pickup.address.full,
            landmark: state.pickup.address.landmark || '',
            coordinates: {
              latitude: state.pickup.address.coordinates.latitude,
              longitude: state.pickup.address.coordinates.longitude
            },
            pincode: state.pickup.address.pincode
          },
          contact: {
            name: state.pickup.contact.name,
            phone: state.pickup.contact.phone,
            alternatePhone: state.pickup.contact.alternatePhone || ''
          },
          scheduledTime: new Date(pickupTime),
          package: completePackage
        },
        drops: state.drops.map((drop, index) => ({
          address: {
            full: drop.address!.full,
            landmark: drop.address!.landmark || '',
            coordinates: {
              latitude: drop.address!.coordinates.latitude,
              longitude: drop.address!.coordinates.longitude
            },
            pincode: drop.address!.pincode
          },
          contact: {
            name: drop.contact!.name,
            phone: drop.contact!.phone
          },
          status: 'pending',
          scheduledTime: new Date(dropTimes[index]),
          sequence: index + 1,
          proofOfDelivery: {
            photos: []
          }
        })),
        pricing: {
          base: estimate.estimation.base,
          distance: estimate.estimation.distance,
          tax: estimate.estimation.tax,
          total: estimate.estimation.total,
          currency: estimate.estimation.currency,
          discounts: [],
          breakdown: {
            base: estimate.estimation.base,
            distance: estimate.estimation.distance,
            tax: estimate.estimation.tax
          }
        },
        payment: {
          method: selectedPaymentMethod,
          status: 'pending',
          attempts: []
        },
        vehicleType: estimate.vehicleType,
        maxDrops: 3,
        routeOptimized: true,
        estimatedDuration: estimate.estimatedDuration,
        tracking: {
          liveTracking: {
            isEnabled: true,
            route: {
              plannedPath: [],
              actualPath: [],
              distance: {
                planned: estimate.estimation.distance
              }
            }
          },
          history: []
        },
        issues: []
      };

      console.log('[PaymentScreen] Creating order with:', orderRequest);
      const order = await OrderAPI.createPickupDrop(orderRequest);
      console.log('[PaymentScreen] Order created:', order);
      router.replace('/(tabs)/orders');
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSchedulingSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Schedule Pickup & Delivery</Text>
      
      <View style={styles.scheduleItem}>
        <Text style={styles.scheduleLabel}>Pickup Time</Text>
        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={() => setShowPickupDatePicker(true)}
        >
          <Text style={styles.scheduleButtonText}>
            {pickupTime.toLocaleString()}
          </Text>
          <Ionicons name="calendar" size={24} color="#470A68" />
        </TouchableOpacity>
      </View>

      {state.drops.map((_, index) => (
        <View key={index} style={styles.scheduleItem}>
          <Text style={styles.scheduleLabel}>Drop {index + 1} Time</Text>
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => {
              setActiveDropIndex(index);
              setShowDropDatePicker(true);
            }}
          >
            <Text style={styles.scheduleButtonText}>
              {dropTimes[index].toLocaleString()}
            </Text>
            <Ionicons name="calendar" size={24} color="#470A68" />
          </TouchableOpacity>
        </View>
      ))}

      {(Platform.OS === 'ios' ? showPickupDatePicker : true) && (
        <Modal
          visible={showPickupDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={pickupTime}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handlePickupTimeChange}
                minimumDate={new Date()}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowPickupDatePicker(false)}
                >
                  <Text style={styles.modalButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}

      {(Platform.OS === 'ios' ? showDropDatePicker : true) && (
        <Modal
          visible={showDropDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={dropTimes[activeDropIndex]}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDropTimeChange}
                minimumDate={pickupTime}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowDropDatePicker(false)}
                >
                  <Text style={styles.modalButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#470A68" />
      </View>
    );
  }

  if (!estimate) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load estimate. Please try again.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEstimate}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.estimateCard}>
          <Text style={styles.cardTitle}>Delivery Estimate</Text>
          <View style={styles.estimateRow}>
            <Text style={styles.estimateLabel}>Base Fare</Text>
            <Text style={styles.estimateValue}>₹{estimate.estimation.base}</Text>
          </View>
          <View style={styles.estimateRow}>
            <Text style={styles.estimateLabel}>Distance Charge</Text>
            <Text style={styles.estimateValue}>₹{estimate.estimation.distance}</Text>
          </View>
          <View style={styles.estimateRow}>
            <Text style={styles.estimateLabel}>Tax</Text>
            <Text style={styles.estimateValue}>₹{estimate.estimation.tax}</Text>
          </View>
          <View style={[styles.estimateRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{estimate.estimation.total}</Text>
          </View>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'online' && styles.selectedPayment,
              ]}
              onPress={() => setSelectedPaymentMethod('online')}
            >
              <Ionicons
                name="card"
                size={24}
                color={selectedPaymentMethod === 'online' ? '#470A68' : '#666666'}
              />
              <Text
                style={[
                  styles.paymentText,
                  selectedPaymentMethod === 'online' && styles.selectedPaymentText,
                ]}
              >
                Online
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'cash' && styles.selectedPayment,
              ]}
              onPress={() => setSelectedPaymentMethod('cash')}
            >
              <Ionicons
                name="cash"
                size={24}
                color={selectedPaymentMethod === 'cash' ? '#470A68' : '#666666'}
              />
              <Text
                style={[
                  styles.paymentText,
                  selectedPaymentMethod === 'cash' && styles.selectedPaymentText,
                ]}
              >
                Cash
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPaymentMethod === 'wallet' && styles.selectedPayment,
              ]}
              onPress={() => setSelectedPaymentMethod('wallet')}
            >
              <Ionicons
                name="wallet"
                size={24}
                color={selectedPaymentMethod === 'wallet' ? '#470A68' : '#666666'}
              />
              <Text
                style={[
                  styles.paymentText,
                  selectedPaymentMethod === 'wallet' && styles.selectedPaymentText,
                ]}
              >
                Wallet
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {renderSchedulingSection()}

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmOrder}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#470A68',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  estimateCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  estimateLabel: {
    fontSize: 16,
    color: '#666666',
  },
  estimateValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#470A68',
  },
  paymentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  selectedPayment: {
    borderColor: '#470A68',
    backgroundColor: '#F8F0FF',
  },
  paymentText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },
  selectedPaymentText: {
    color: '#470A68',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#470A68',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleLabel: {
    fontSize: 16,
    color: '#666666',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  scheduleButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
  },
  modalButton: {
    backgroundColor: '#470A68',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 