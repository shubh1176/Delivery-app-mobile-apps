import React from 'react';
import { ScrollView, StyleSheet, View, TextInput, Text, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LocationHeader } from './components/LocationHeader';
import { ServiceCards } from './components/ServiceCards';
import { TopStores } from './components/TopStores';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRADIENT_HEIGHT = SCREEN_HEIGHT * 0.6;

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8D14CE', '#470A68']}
        style={styles.gradientContainer}
      >
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Location Header in Gradient */}
            <LocationHeader />

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#FFFFFF" style={styles.searchIcon} />
              <TextInput
                placeholder="Search stores and products"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                style={styles.searchInput}
              />
            </View>

            {/* Logo and Text */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../assets/images/onepost-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>We're here to deliver.</Text>
            </View>

            <View style={styles.divider} />

            {/* Service Cards */}
            <ServiceCards />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Content below gradient */}
      <View style={styles.bottomContent}>
        <TopStores />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  gradientContainer: {
    height: GRADIENT_HEIGHT,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    height: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  logo: {
    width: 110,
    height: 32,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '300',
  },
  bottomContent: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: GRADIENT_HEIGHT - 50,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
    marginTop: 20,
  },
}); 
