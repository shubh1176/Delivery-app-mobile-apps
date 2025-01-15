import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../../../contexts/auth';
import { User } from '@/app/types/user';

export default function AccountScreen() {
  const { user } = useAuth();

  const accountItems = [
    {
      title: 'Personal Information',
      icon: 'person-outline',
      route: '/(tabs)/profile/account/personal',
      description: 'Name, phone & email',
      value: user?.name
    },
    {
      title: 'Addresses',
      icon: 'location-outline',
      route: '/(tabs)/profile/account/addresses',
      description: 'Delivery & billing addresses',
      value: `${(user as unknown as User)?.addresses?.length || 0} saved`
    },
    {
      title: 'Security',
      icon: 'shield-outline',
      route: '/(tabs)/profile/account/security',
      description: 'Password & verification',
      value: user?.isPhoneVerified ? 'Verified' : 'Not verified'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.menuContainer}>
        {accountItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={24} color="#470A68" />
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                </View>
              </View>
              <View style={styles.menuItemRight}>
                <Text style={styles.menuItemValue}>{item.value}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666666" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  menuItem: {
    paddingHorizontal: 20,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#666666',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemValue: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
}); 