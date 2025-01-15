import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ServicesScreen() {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => router.push('/(tabs)/services/pickup-drop')}
      >
        <Ionicons name="bicycle" size={24} color="#470A68" />
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceTitle}>Pickup & Drop</Text>
          <Text style={styles.serviceDescription}>
            Quick delivery within the city
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#666666" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => router.push('/(tabs)/services/courier')}
      >
        <Ionicons name="cube" size={24} color="#470A68" />
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceTitle}>Courier</Text>
          <Text style={styles.serviceDescription}>
            Intercity package delivery
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#666666" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  serviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666666',
  },
}); 