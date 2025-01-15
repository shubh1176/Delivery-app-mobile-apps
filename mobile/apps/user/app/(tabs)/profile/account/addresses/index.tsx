import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../../../../contexts/auth';
import { ProfileAPI } from '../../../../../services/profile';
import type { SavedAddress, User } from '../../../../types/user';

export default function AddressesScreen() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await ProfileAPI.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const renderAddressCard = (address: SavedAddress) => (
    <TouchableOpacity
      key={address._id}
      style={styles.addressCard}
      onPress={() => router.push({
        pathname: '/(tabs)/profile/account/addresses',
        params: { id: address._id }
      })}
    >
      <View style={styles.addressHeader}>
        <View style={styles.addressType}>
          <Ionicons
            name={address.type === 'home' ? 'home-outline' : address.type === 'work' ? 'business-outline' : 'location-outline'}
            size={20}
            color="#470A68"
          />
          <Text style={styles.addressTypeText}>{address.type.toUpperCase()}</Text>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <Ionicons name="create-outline" size={20} color="#666666" />
      </View>

      <Text style={styles.addressName}>{address.name}</Text>
      <Text style={styles.addressPhone}>{address.phone}</Text>
      <Text style={styles.addressText}>
        {address.address}
        {address.landmark ? `, ${address.landmark}` : ''}
      </Text>
      <Text style={styles.addressText}>
        {address.city}, {address.state} - {address.pincode}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {(user as unknown as User)?.addresses?.map(renderAddressCard)}
      </ScrollView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push({
          pathname: '/(tabs)/profile/account/addresses'
        })}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add New Address</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#470A68',
    marginLeft: 4,
  },
  defaultBadge: {
    backgroundColor: '#E8E0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  defaultText: {
    fontSize: 10,
    color: '#470A68',
    fontWeight: '500',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#470A68',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 