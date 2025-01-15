import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../contexts/auth';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { User } from '../../../types/user';
import type { SavedAddress } from '../../../types/user';

export function LocationHeader() {
  const { user } = useAuth();
  const [isAddressSheetVisible, setAddressSheetVisible] = useState(false);

  const defaultAddress = (user as unknown as User)?.addresses?.find((addr: SavedAddress) => addr.isDefault);
  const addressPreview = defaultAddress ? 
    `${defaultAddress.address.split(',')[0]}${defaultAddress.landmark ? `, ${defaultAddress.landmark}` : ''}` : 
    'Select Address';

  const handleAddNewAddress = () => {
    setAddressSheetVisible(false);
    router.push({
      pathname: '/(tabs)/profile/addresses/new'
    } as any);
  };

  const handleSelectAddress = (address: SavedAddress) => {
    // TODO: Implement API call to update default address
    setAddressSheetVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Location Text */}
      <View style={styles.locationTextContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.locationLabel}>Your Location</Text>
          <Ionicons name="chevron-down" size={12} style={styles.labelIcon} />
        </View>
        <TouchableOpacity 
          style={styles.addressButton}
          onPress={() => setAddressSheetVisible(true)}
        >
          <Text style={styles.addressText} numberOfLines={1}>
            {addressPreview}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notification Icon */}
      <TouchableOpacity style={styles.notificationButton}>
        <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Address Selection Sheet */}
      <Modal
        visible={isAddressSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddressSheetVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddressSheetVisible(false)}
        >
          <BlurView intensity={30} style={StyleSheet.absoluteFill} />
        </TouchableOpacity>

        <View style={styles.addressSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Address</Text>
            <TouchableOpacity 
              onPress={() => setAddressSheetVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Saved Addresses */}
        <View style={styles.addressList}>
            {(user as unknown as User)?.addresses?.map((address: SavedAddress) => (
              <TouchableOpacity 
                key={address._id}
                style={[
                  styles.addressItem,
                  address.isDefault && styles.addressItemSelected
                ]}
                onPress={() => handleSelectAddress(address)}
              >
                <Ionicons 
                  name={address.type === 'home' ? 'home-outline' : address.type === 'work' ? 'business-outline' : 'location-outline'} 
                  size={24} 
                  color="#470A68" 
                />
                <View style={styles.addressDetails}>
                  <Text style={styles.addressLabel}>{address.label || address.type}</Text>
                  <Text style={styles.addressFull} numberOfLines={2}>
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
            ))}
          </View>

          {/* Add New Address Button */}
          <TouchableOpacity 
            style={styles.addAddressButton}
            onPress={handleAddNewAddress}
          >
            <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
            <Text style={styles.addAddressText}>Add New Address</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  locationTextContainer: {
    flex: 1,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelIcon: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 4,
    marginBottom: 2,
  },
  locationLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
    flex: 1,
  },
  notificationButton: {
    marginLeft: 16,
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  addressSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
  },
  addressList: {
    marginBottom: 20,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 12,
  },
  addressItemSelected: {
    backgroundColor: '#470A6820',
  },
  addressDetails: {
    marginLeft: 12,
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  addressFull: {
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
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#470A68',
    borderRadius: 12,
    padding: 16,
  },
  addAddressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
}); 