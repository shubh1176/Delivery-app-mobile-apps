import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Switch, ActivityIndicator } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useCourierOrder } from './context/CourierOrderContext';
import { estimateCourierOrder } from './api';
import ServiceHeader from '../components/ServiceHeader';

const insuranceOptions = [
  {
    id: 'basic',
    title: 'Basic Coverage',
    description: 'Free basic protection up to ₹1,000',
    premium: 0,
    icon: 'shield-outline'
  },
  {
    id: 'standard',
    title: 'Standard Coverage',
    description: 'Enhanced protection up to ₹10,000',
    premium: 49,
    icon: 'shield-half'
  },
  {
    id: 'premium',
    title: 'Premium Coverage',
    description: 'Full protection up to ₹50,000',
    premium: 149,
    icon: 'shield-checkmark'
  }
] as const;

const handlingOptions = [
  {
    id: 'fragile',
    label: 'Fragile Items',
    description: 'Extra care for delicate items'
  },
  {
    id: 'signature',
    label: 'Signature Required',
    description: 'Recipient signature mandatory'
  },
  {
    id: 'refrigerated',
    label: 'Temperature Sensitive',
    description: 'Special handling for temperature control'
  }
] as const;

export default function Insurance() {
  const { state, dispatch } = useCourierOrder();
  const { insurance, packageDetails, pickupDetails, dropDetails, loading } = state;

  // Update price estimation when insurance changes
  useEffect(() => {
    const updateEstimate = async () => {
      if (pickupDetails.address.full && dropDetails.address.full) {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          const estimateData = await estimateCourierOrder({
            pickup: {
              address: pickupDetails.address as any
            },
            drops: [{
              address: dropDetails.address as any,
              sequence: 1
            }],
            package: {
              ...packageDetails,
              isFragile: insurance.handling.fragile,
              requiresRefrigeration: insurance.handling.refrigerated
            } as any
          });

          // Add insurance premium to estimation
          const insurancePremium = 
            insurance.type === 'basic' ? 0 :
            insurance.type === 'standard' ? 49 : 149;

          dispatch({ type: 'SET_PRICE_ESTIMATION', payload: {
            base: estimateData.estimation.base,
            weight: estimateData.estimation.weight,
            insurance: insurancePremium,
            tax: estimateData.estimation.tax,
            total: estimateData.estimation.total + insurancePremium
          }});
        } catch (error) {
          console.error('Error updating estimate:', error);
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    updateEstimate();
  }, [insurance.type, insurance.handling]);

  const handleContinue = () => {
    router.push('/(tabs)/services/courier/payment' as any);
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
        title="Insurance & Handling"
        subtitle="Choose protection and handling options"
      />

      {/* Insurance Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insurance Coverage</Text>
        <Text style={styles.sectionDescription}>
          Protect your package with our insurance options
        </Text>

        {insuranceOptions.map(option => (
          <Pressable
            key={option.id}
            style={[
              styles.insuranceCard,
              insurance.type === option.id && styles.selectedCard
            ]}
            onPress={() => dispatch({ type: 'SET_INSURANCE', payload: { type: option.id } })}
          >
            <View style={styles.insuranceHeader}>
              <View style={styles.insuranceIcon}>
                <Ionicons 
                  name={option.icon} 
                  size={24} 
                  color={insurance.type === option.id ? '#470A68' : '#666666'} 
                />
              </View>
              <View style={styles.insuranceInfo}>
                <Text style={styles.insuranceTitle}>{option.title}</Text>
                <Text style={styles.insuranceDescription}>{option.description}</Text>
              </View>
            </View>
            <Text style={styles.premium}>
              {option.premium === 0 ? 'FREE' : `₹${option.premium}`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Handling Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Handling</Text>
        <Text style={styles.sectionDescription}>
          Select additional handling requirements
        </Text>

        {handlingOptions.map(option => (
          <View key={option.id} style={styles.handlingOption}>
            <View style={styles.handlingInfo}>
              <Text style={styles.handlingLabel}>{option.label}</Text>
              <Text style={styles.handlingDescription}>{option.description}</Text>
            </View>
            <Switch
              value={insurance.handling[option.id]}
              onValueChange={(value) => 
                dispatch({ 
                  type: 'SET_HANDLING', 
                  payload: { 
                    key: option.id, 
                    value 
                  } 
                })
              }
              trackColor={{ false: '#CCCCCC', true: '#470A68' }}
              thumbColor={insurance.handling[option.id] ? '#FFFFFF' : '#F5F5F5'}
            />
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable 
          style={styles.continueButton}
          onPress={handleContinue}
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  insuranceCard: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
  },
  selectedCard: {
    borderColor: '#470A68',
    backgroundColor: '#F8F0FF',
  },
  insuranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insuranceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  insuranceInfo: {
    flex: 1,
  },
  insuranceTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333333',
  },
  insuranceDescription: {
    fontSize: 14,
    color: '#666666',
  },
  premium: {
    fontSize: 20,
    fontWeight: '700',
    color: '#470A68',
    marginTop: 10,
    textAlign: 'right',
  },
  handlingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  handlingInfo: {
    flex: 1,
    marginRight: 15,
  },
  handlingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333333',
  },
  handlingDescription: {
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
}); 