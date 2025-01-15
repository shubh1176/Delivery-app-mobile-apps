import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../contexts/auth';
import { LocationInput } from '../components/LocationInput';
import { MapSelectionModal } from '../components/MapSelectionModal';
import type { Address, Contact, Drop } from '../../../../app/types/order';
import { useOrderCreation } from '../../../../contexts/OrderCreationContext';

interface LocationWithContact {
  address: Address;
  contact: Contact;
}

export default function LocationSelectionScreen() {
  const { user } = useAuth();
  const { state, setPickup, addDrop, removeDrop, setDrops } = useOrderCreation();
  const [showMap, setShowMap] = useState(false);
  const [activeLocationIndex, setActiveLocationIndex] = useState<number | null>(null);
  const [pickupContact, setPickupContact] = useState<Contact>({
    name: user?.name || 'Guest',
    phone: user?.phone || '',
    alternatePhone: '',
  });

  useEffect(() => {
    console.log('[LocationScreen] Initial State:', state);
    if (state.drops.length === 0) {
      console.log('[LocationScreen] Initializing with empty drop');
      const newDrop: Drop = {
        address: {
          full: '',
          coordinates: { latitude: 0, longitude: 0 },
          pincode: '',
        },
        contact: {
          name: 'Guest',
          phone: '',
          alternatePhone: '',
        },
        scheduledTime: new Date(),
        sequence: 1,
        status: 'pending',
      };
      addDrop(newDrop);
    }
  }, []);

  const handleLocationSelect = (address: Address) => {
    console.log('[LocationScreen] Location selected:', address);
    console.log('[LocationScreen] Active location index:', activeLocationIndex);
    
    if (activeLocationIndex === null) {
      console.log('[LocationScreen] Setting pickup location');
      setPickup({
        address,
        contact: pickupContact,
        scheduledTime: new Date(),
      });
    } else {
      console.log('[LocationScreen] Setting drop location at index:', activeLocationIndex);
      const newDrops = [...state.drops];
      const currentDrop = newDrops[activeLocationIndex];
      if (currentDrop) {
        newDrops[activeLocationIndex] = {
          ...currentDrop,
          address,
          sequence: activeLocationIndex + 1,
        };
        setDrops(newDrops);
      }
    }
    
    setShowMap(false);
    setActiveLocationIndex(null);
  };

  const handleContactChange = (index: number | null, field: keyof Contact, value: string) => {
    if (index === null) {
      const newContact = { ...pickupContact, [field]: value };
      setPickupContact(newContact);
      if (state.pickup) {
        setPickup({
          ...state.pickup,
          contact: newContact,
        });
      }
    } else {
      const newDrops = [...state.drops];
      const currentDrop = newDrops[index];
      if (currentDrop && currentDrop.contact) {
        const newContact = { ...currentDrop.contact, [field]: value };
        newDrops[index] = {
          ...currentDrop,
          contact: newContact,
        };
        setDrops(newDrops);
      }
    }
  };

  const canContinue = () => {
    if (!state.pickup?.address || !state.pickup.contact?.name || !state.pickup.contact?.phone) {
      return false;
    }
    
    return state.drops.every(drop => 
      drop.address && 
      drop.contact?.name && 
      drop.contact?.phone
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Locations</Text>
            <Text style={styles.subtitle}>Enter pickup and drop locations with contact details</Text>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={24} color="#470A68" />
              <Text style={styles.sectionTitle}>Pickup Details</Text>
            </View>
            <LocationInput
              placeholder="Enter pickup location"
              value={state.pickup?.address || null}
              onPress={() => {
                setActiveLocationIndex(null);
                setShowMap(true);
              }}
            />
            <View style={styles.contactInputs}>
              <TextInput
                style={styles.input}
                placeholder="Contact Name"
                value={pickupContact.name}
                onChangeText={(value) => handleContactChange(null, 'name', value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Contact Phone"
                value={pickupContact.phone}
                onChangeText={(value) => handleContactChange(null, 'phone', value)}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Alternate Phone (Optional)"
                value={pickupContact.alternatePhone}
                onChangeText={(value) => handleContactChange(null, 'alternatePhone', value)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={24} color="#470A68" />
              <Text style={styles.sectionTitle}>Drop Locations</Text>
            </View>
            {state.drops.map((drop, index) => (
              <View key={index} style={styles.stopContainer}>
                <View style={styles.stopNumber}>
                  <Text style={styles.stopNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stopContent}>
                  <LocationInput
                    placeholder={`Enter drop location ${index + 1}`}
                    value={drop.address || null}
                    onPress={() => {
                      setActiveLocationIndex(index);
                      setShowMap(true);
                    }}
                  />
                  <View style={styles.contactInputs}>
                    <TextInput
                      style={styles.input}
                      placeholder="Contact Name"
                      value={drop.contact?.name || ''}
                      onChangeText={(value) => handleContactChange(index, 'name', value)}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Contact Phone"
                      value={drop.contact?.phone || ''}
                      onChangeText={(value) => handleContactChange(index, 'phone', value)}
                      keyboardType="phone-pad"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Alternate Phone (Optional)"
                      value={drop.contact?.alternatePhone || ''}
                      onChangeText={(value) => handleContactChange(index, 'alternatePhone', value)}
                      keyboardType="phone-pad"
                    />
                  </View>
                  {index > 0 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeDrop(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            {state.drops.length < 3 && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  const newDrop: Drop = {
                    address: {
                      full: '',
                      coordinates: { latitude: 0, longitude: 0 },
                      pincode: '',
                    },
                    contact: {
                      name: 'Guest',
                      phone: '',
                      alternatePhone: '',
                    },
                    scheduledTime: new Date(),
                    sequence: state.drops.length + 1,
                    status: 'pending',
                  };
                  addDrop(newDrop);
                }}
              >
                <Ionicons name="add-circle-outline" size={24} color="#470A68" />
                <Text style={styles.addButtonText}>Add Another Stop</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, !canContinue() && styles.continueButtonDisabled]}
            onPress={() => {
              if (canContinue()) {
                router.push('/(tabs)/services/pickup-drop/package' as any);
              }
            }}
            disabled={!canContinue()}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <MapSelectionModal
          visible={showMap}
          onClose={() => {
            setShowMap(false);
            setActiveLocationIndex(null);
          }}
          onLocationSelect={handleLocationSelect}
        />
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
    paddingBottom: 100,
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
  stopContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stopNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#470A68',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 8,
  },
  stopNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  stopContent: {
    flex: 1,
  },
  contactInputs: {
    marginTop: 8,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#470A68',
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#470A68',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#470A68',
    padding: 16,
    borderRadius: 8,
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