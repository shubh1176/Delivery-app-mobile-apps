import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useCourierOrder } from './context/CourierOrderContext';
import ServiceHeader from '../components/ServiceHeader';

const PACKAGE_CATEGORIES = [
  { id: 'documents', label: 'Documents', icon: 'document-text' },
  { id: 'electronics', label: 'Electronics', icon: 'phone-portrait' },
  { id: 'clothing', label: 'Clothing', icon: 'shirt' },
  { id: 'food', label: 'Food', icon: 'fast-food' },
  { id: 'medicine', label: 'Medicine', icon: 'medkit' },
  { id: 'other', label: 'Other', icon: 'cube' },
] as const;

const PACKAGE_SIZES = [
  { id: 'small', label: 'Small (< 5kg)' },
  { id: 'medium', label: 'Medium (5-10kg)' },
  { id: 'large', label: 'Large (> 10kg)' },
] as const;

export default function PackageDetails() {
  const { state, dispatch } = useCourierOrder();
  const { packageDetails } = state;

  const handleContinue = () => {
    if (!packageDetails.category || !packageDetails.size || !packageDetails.weight) {
      return;
    }
    router.push('/(tabs)/services/courier/delivery-details' as any);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ServiceHeader 
        title="Package Details"
        subtitle="Tell us about your package"
      />

      {/* Package Category */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Package Category</Text>
        <View style={styles.categoryGrid}>
          {PACKAGE_CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.categoryItem,
                packageDetails.category === category.id && styles.categoryItemSelected
              ]}
              onPress={() => dispatch({ type: 'SET_PACKAGE_DETAILS', payload: { category: category.id } })}
            >
              <Ionicons
                name={category.icon as any}
                size={24}
                color={packageDetails.category === category.id ? '#FFFFFF' : '#470A68'}
              />
              <Text style={[
                styles.categoryText,
                packageDetails.category === category.id && styles.categoryTextSelected
              ]}>
                {category.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Package Size */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Package Size</Text>
        <View style={styles.sizeButtons}>
          {PACKAGE_SIZES.map((size) => (
            <Pressable
              key={size.id}
              style={[
                styles.sizeButton,
                packageDetails.size === size.id && styles.sizeButtonSelected
              ]}
              onPress={() => dispatch({ type: 'SET_PACKAGE_DETAILS', payload: { size: size.id } })}
            >
              <Text style={[
                styles.sizeButtonText,
                packageDetails.size === size.id && styles.sizeButtonTextSelected
              ]}>
                {size.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Package Weight */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Package Weight</Text>
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              value={packageDetails.weight?.toString()}
              onChangeText={(text) => dispatch({ type: 'SET_PACKAGE_DETAILS', payload: { weight: parseFloat(text) || 0 } })}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Value (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={packageDetails.value?.toString()}
              onChangeText={(text) => dispatch({ type: 'SET_PACKAGE_DETAILS', payload: { value: parseFloat(text) || 0 } })}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable 
          style={[
            styles.continueButton,
            (!packageDetails.category || !packageDetails.size || !packageDetails.weight) && 
            styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!packageDetails.category || !packageDetails.size || !packageDetails.weight}
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  categoryItem: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.66%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#470A68',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  categoryItemSelected: {
    backgroundColor: '#470A68',
  },
  categoryText: {
    fontSize: 12,
    color: '#470A68',
    marginTop: 8,
    textAlign: 'center',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  sizeButtons: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  sizeButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#470A68',
    alignItems: 'center',
  },
  sizeButtonSelected: {
    backgroundColor: '#470A68',
  },
  sizeButtonText: {
    fontSize: 14,
    color: '#470A68',
  },
  sizeButtonTextSelected: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 8,
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