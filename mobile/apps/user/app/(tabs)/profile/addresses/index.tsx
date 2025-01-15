import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../../../contexts/auth';
import { deleteAddress, setDefaultAddress } from './api';
import { User } from '../../../types/user';
import type { SavedAddress } from '../../../types/user';

export default function AddressesScreen() {
  const { user } = useAuth();

  const handleAddNewAddress = () => {
    router.push({
      pathname: '/(tabs)/profile/addresses/new'
    } as any);
  };

  const handleEditAddress = (address: SavedAddress) => {
    router.push({
      pathname: '/(tabs)/profile/addresses/[id]',
      params: { id: address._id }
    } as any);
  };

  const handleDeleteAddress = async (address: SavedAddress) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(address._id);
              // TODO: Refresh user data
            } catch (error) {
              Alert.alert('Error', 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const handleSetDefaultAddress = async (address: SavedAddress) => {
    try {
      await setDefaultAddress(address._id);
      // TODO: Refresh user data
    } catch (error) {
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.addressList}>
        {(user as unknown as User)?.addresses?.map((address: SavedAddress) => (
          <View key={address._id} style={styles.addressCard}>
            <TouchableOpacity
              style={styles.addressContent}
              onPress={() => handleEditAddress(address)}
            >
              <Ionicons 
                name={address.type === 'home' ? 'home-outline' : address.type === 'work' ? 'business-outline' : 'location-outline'} 
                size={24} 
                color="#470A68" 
              />
              <View style={styles.addressDetails}>
                <Text style={styles.addressLabel}>{address.label || address.type}</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {address.address}
                  {address.landmark ? `\nLandmark: ${address.landmark}` : ''}
                </Text>
              </View>
              {address.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.addressActions}>
              {!address.isDefault && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetDefaultAddress(address)}
                >
                  <Ionicons name="star-outline" size={20} color="#470A68" />
                  <Text style={styles.actionText}>Set Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteAddress(address)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddNewAddress}
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
  addressList: {
    flex: 1,
    padding: 16,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  addressDetails: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666666',
  },
  defaultBadge: {
    backgroundColor: '#470A68',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  defaultText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  addressActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
  },
  actionText: {
    fontSize: 14,
    color: '#470A68',
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#470A68',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
}); 