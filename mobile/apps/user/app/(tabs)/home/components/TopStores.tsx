import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export function TopStores() {
  // Mock data for stores
  const stores = [
    {
      id: '1',
      name: 'Apple Store',
      image: 'https://via.placeholder.com/100',
      type: 'Electronics',
    },
    {
      id: '2',
      name: 'Zara',
      image: 'https://via.placeholder.com/100',
      type: 'Fashion',
    },
    {
      id: '3',
      name: 'Walmart',
      image: 'https://via.placeholder.com/100',
      type: 'Supermarket',
    },
    {
      id: '4',
      name: 'Nike',
      image: 'https://via.placeholder.com/100',
      type: 'Sports',
    },
    {
      id: '5',
      name: 'Starbucks',
      image: 'https://via.placeholder.com/100',
      type: 'Cafe',
    },
    {
      id: '6',
      name: 'Target',
      image: 'https://via.placeholder.com/100',
      type: 'Retail',
    },
  ];

  const handleNavigateToStores = () => {
    router.push({
      pathname: '/(tabs)/stores',
    } as any);
  };

  const handleNavigateToStore = (storeId: string) => {
    router.push({
      pathname: '/(tabs)/stores/[id]',
      params: { id: storeId }
    } as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Popular Stores</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={handleNavigateToStores}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="arrow-forward" size={16} color="#470A68" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storesContainer}
      >
        {stores.map((store) => (
          <TouchableOpacity
            key={store.id}
            style={styles.storeItem}
            onPress={() => handleNavigateToStore(store.id)}
          >
            <View style={styles.storeIconContainer}>
              <Image
                source={{ uri: store.image }}
                style={styles.storeIcon}
              />
            </View>
            <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
            <Text style={styles.storeType}>{store.type}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 100,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#470A68',
    marginRight: 4,
  },
  storesContainer: {
    paddingHorizontal: 20,
  },
  storeItem: {
    alignItems: 'center',
    marginRight: 24,
    width: 80,
  },
  storeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  storeIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 2,
  },
  storeType: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
}); 