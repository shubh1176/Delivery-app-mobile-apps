import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LocationAPI } from '../app/(tabs)/services/api';
import type { Address } from '../app/types/order';
import type { Place } from '../app/(tabs)/services/api';

interface MapSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (address: Address) => void;
}

export function MapSelectionModal({ visible, onClose, onLocationSelect }: MapSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedLocation(null);
    }
  }, [visible]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      console.log('[MapModal] Searching for location:', query);
      setIsSearching(true);
      const results = await LocationAPI.searchPlaces(query);
      console.log('[MapModal] Search results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('[MapModal] Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    console.log('[MapModal] Map pressed:', { latitude, longitude });
    setSelectedLocation({ latitude, longitude });

    try {
      console.log('[MapModal] Reverse geocoding coordinates');
      setIsReverseGeocoding(true);
      const address = await LocationAPI.reverseGeocode({ latitude, longitude });
      console.log('[MapModal] Reverse geocoding result:', address);
      setSearchQuery(address.full);
      setSearchResults([]);
    } catch (error) {
      console.error('[MapModal] Reverse geocoding error:', error);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation && searchQuery) {
      console.log('[MapModal] Confirming location:', {
        coordinates: selectedLocation,
        address: searchQuery,
      });
      onLocationSelect({
        full: searchQuery,
        coordinates: selectedLocation,
        pincode: '', // This should be extracted from the reverse geocoding result
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333333" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search location"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {isSearching && (
              <ActivityIndicator style={styles.searchingIndicator} color="#470A68" />
            )}
          </View>
        </View>

        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={styles.searchResultItem}
                onPress={() => {
                  setSelectedLocation(result.coordinates);
                  setSearchQuery(result.address);
                  setSearchResults([]);
                }}
              >
                <Ionicons name="location" size={20} color="#666666" />
                <View style={styles.searchResultText}>
                  <Text style={styles.searchResultName}>{result.name}</Text>
                  <Text style={styles.searchResultAddress}>{result.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <MapView
          style={styles.map}
          onPress={handleMapPress}
          region={
            selectedLocation
              ? {
                  ...selectedLocation,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
              : {
                  latitude: 28.6139,
                  longitude: 77.209,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }
          }
        >
          {selectedLocation && (
            <Marker coordinate={selectedLocation} />
          )}
        </MapView>

        {isReverseGeocoding && (
          <View style={styles.reverseGeocodingIndicator}>
            <ActivityIndicator color="#470A68" />
            <Text style={styles.reverseGeocodingText}>Getting address...</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedLocation || !searchQuery) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedLocation || !searchQuery}
        >
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flex: 1,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  searchingIndicator: {
    marginLeft: 8,
  },
  searchResults: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    zIndex: 1,
    maxHeight: '50%',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchResultText: {
    marginLeft: 8,
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
  },
  searchResultAddress: {
    fontSize: 14,
    color: '#666666',
  },
  map: {
    flex: 1,
  },
  reverseGeocodingIndicator: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  reverseGeocodingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333333',
  },
  confirmButton: {
    margin: 16,
    backgroundColor: '#470A68',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 