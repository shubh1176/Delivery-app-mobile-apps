import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Switch } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrderCreation } from '../../../../contexts/OrderCreationContext';
import type { PackageCategory, PackageSize } from '../../../../app/types/order';

const PACKAGE_CATEGORIES: Array<{ id: PackageCategory; label: string; icon: string }> = [
  { id: 'documents', label: 'Documents', icon: 'document-text' },
  { id: 'electronics', label: 'Electronics', icon: 'phone-portrait' },
  { id: 'clothing', label: 'Clothing', icon: 'shirt' },
  { id: 'food', label: 'Food', icon: 'fast-food' },
  { id: 'medicine', label: 'Medicine', icon: 'medkit' },
  { id: 'other', label: 'Other', icon: 'cube' },
];

const PACKAGE_SIZES: Array<{ id: PackageSize; label: string }> = [
  { id: 'small', label: 'Small (< 5kg)' },
  { id: 'medium', label: 'Medium (5-10kg)' },
  { id: 'large', label: 'Large (> 10kg)' },
];

export default function PackageDetailsScreen() {
  const { state, setPackageDetails } = useOrderCreation();
  const [category, setCategory] = useState<PackageCategory>(state.packageDetails?.category || 'documents');
  const [type, setType] = useState(state.packageDetails?.type || '');
  const [size, setSize] = useState<PackageSize>(state.packageDetails?.size || 'small');
  const [weight, setWeight] = useState(state.packageDetails?.weight?.toString() || '');
  const [length, setLength] = useState(state.packageDetails?.dimensions?.length?.toString() || '');
  const [width, setWidth] = useState(state.packageDetails?.dimensions?.width?.toString() || '');
  const [height, setHeight] = useState(state.packageDetails?.dimensions?.height?.toString() || '');
  const [value, setValue] = useState(state.packageDetails?.value?.toString() || '');
  const [isFragile, setIsFragile] = useState(state.packageDetails?.isFragile || false);
  const [requiresRefrigeration, setRequiresRefrigeration] = useState(state.packageDetails?.requiresRefrigeration || false);
  const [description, setDescription] = useState(state.packageDetails?.description || '');
  const [specialInstructions, setSpecialInstructions] = useState(state.packageDetails?.specialInstructions || '');

  const handleContinue = () => {
    if (!category || !type || !size || !weight || !value || !description) {
      // Show error
      return;
    }

    setPackageDetails({
      category,
      type,
      size,
      weight: parseFloat(weight),
      dimensions: {
        length: parseFloat(length) || 0,
        width: parseFloat(width) || 0,
        height: parseFloat(height) || 0,
      },
      value: parseFloat(value),
      photos: [], // TODO: Add photo upload functionality
      isFragile,
      requiresRefrigeration,
      description,
      specialInstructions,
    });

    router.push('/(tabs)/services/pickup-drop/payment');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Package Details</Text>
            <Text style={styles.subtitle}>Tell us about your package</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Package Category</Text>
            <View style={styles.categoryGrid}>
              {PACKAGE_CATEGORIES.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.categoryItem, category === item.id && styles.categoryItemSelected]}
                  onPress={() => setCategory(item.id)}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={category === item.id ? '#FFFFFF' : '#470A68'}
                  />
                  <Text style={[styles.categoryText, category === item.id && styles.categoryTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Package Type</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Laptop, Documents, etc."
              value={type}
              onChangeText={setType}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Package Size</Text>
            <View style={styles.sizeButtons}>
              {PACKAGE_SIZES.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.sizeButton, size === item.id && styles.sizeButtonSelected]}
                  onPress={() => setSize(item.id)}
                >
                  <Text style={[styles.sizeButtonText, size === item.id && styles.sizeButtonTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Package Details</Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.0"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Value (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={value}
                  onChangeText={setValue}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dimensions (cm)</Text>
            <View style={styles.row}>
              <View style={styles.thirdInput}>
                <Text style={styles.label}>Length</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={length}
                  onChangeText={setLength}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.thirdInput}>
                <Text style={styles.label}>Width</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={width}
                  onChangeText={setWidth}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.thirdInput}>
                <Text style={styles.label}>Height</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Fragile Item</Text>
              <Switch
                value={isFragile}
                onValueChange={setIsFragile}
                trackColor={{ false: '#E0E0E0', true: '#470A68' }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Requires Refrigeration</Text>
              <Switch
                value={requiresRefrigeration}
                onValueChange={setRequiresRefrigeration}
                trackColor={{ false: '#E0E0E0', true: '#470A68' }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your package"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Special Instructions (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any special handling instructions"
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!category || !type || !size || !weight || !value || !description) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!category || !type || !size || !weight || !value || !description}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 24,
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
  thirdInput: {
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333333',
  },
  footer: {
    padding: 16,
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
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
}); 