import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Address } from '../app/types/order';

interface LocationInputProps {
  placeholder: string;
  value?: Address;
  onPress: () => void;
}

export function LocationInput({ placeholder, value, onPress }: LocationInputProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        {value?.full ? (
          <>
            <Text style={styles.address} numberOfLines={1}>{value.full}</Text>
            {value.landmark && (
              <Text style={styles.landmark} numberOfLines={1}>Near {value.landmark}</Text>
            )}
            <Text style={styles.pincode}>{value.pincode}</Text>
          </>
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#666666" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  address: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
  },
  landmark: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  pincode: {
    fontSize: 14,
    color: '#666666',
  },
  placeholder: {
    fontSize: 16,
    color: '#999999',
  },
}); 