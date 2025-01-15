import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

export function ServiceCards() {
  const handleNavigateToService = (service: 'pickup-drop' | 'courier') => {
    router.push({
      pathname: '/(tabs)/services/[type]',
      params: { type: service }
    } as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Services</Text>
      <View style={styles.cardsContainer}>
        {/* Pickup & Drop Card */}
        <TouchableOpacity 
          style={styles.cardWrapper}
          onPress={() => handleNavigateToService('pickup-drop')}
        >
          <LinearGradient
            colors={['#F8EBAB', '#FFE773']}
            style={styles.card}
          />
          <Image 
            source={require('../../../../assets/images/pick-up.png')}
            style={[styles.serviceImage, styles.pickupImage]}
            resizeMode="contain"
          />
          <Text style={styles.cardLabel}>Pickup & Drop</Text>
        </TouchableOpacity>

        {/* Courier Card */}
        <TouchableOpacity 
          style={styles.cardWrapper}
          onPress={() => handleNavigateToService('courier')}
        >
          <LinearGradient
            colors={['#F8EBAB', '#FFE773']}
            style={styles.card}
          />
          <Image 
            source={require('../../../../assets/images/courier.png')}
            style={[styles.serviceImage, styles.courierImage]}
            resizeMode="contain"
          />
          <Text style={styles.cardLabel}>Courier</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  cardWrapper: {
    flex: 1,
    position: 'relative',
    height: 150,
    alignItems: 'center',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    height: 100,
    marginTop: 40,
    width: '100%',
  },
  serviceImage: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    top: 0,
    left: '5%',
    zIndex: 1,
  },
  pickupImage: {
    width: '79%',
    height: '79%',
    left: '11%',
  },
  courierImage: {
    width: '65%',
    height: '65%',
    left: '15.5%',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
}); 