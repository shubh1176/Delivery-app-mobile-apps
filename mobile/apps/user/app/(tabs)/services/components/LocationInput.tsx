import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Address } from '../../../../app/types/order';

interface LocationInputProps {
  placeholder: string;
  value: Address | null;
  onPress: () => void;
}

export function LocationInput({ placeholder, value, onPress }: LocationInputProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        {value ? (
          <>
            <Text style={styles.address} numberOfLines={1}>
              {value.full}
            </Text>
            {value.landmark && (
              <Text style={styles.landmark} numberOfLines={1}>
                {value.landmark}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
      </View>
      <Ionicons name="location" size={24} color="#470A68" />
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
    borderColor: '#E0E0E0',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  address: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  landmark: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  details: {
    fontSize: 14,
    color: '#666666',
  },
  placeholder: {
    fontSize: 16,
    color: '#999999',
  },
}); 