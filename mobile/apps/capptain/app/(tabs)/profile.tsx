import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/auth.slice';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { partner } = useAppSelector(state => state.auth);

  const sections = [
    {
      title: 'Personal Information',
      icon: 'account',
      items: [
        {
          label: 'Basic Details',
          icon: 'account-edit',
          onPress: () => router.push('/(profile)/basic-details'),
          info: partner?.name
        },
        {
          label: 'Bank Account',
          icon: 'bank',
          onPress: () => router.push('/(profile)/bank-details'),
          info: partner?.bankDetails?.verified ? 'Verified' : 'Unverified'
        }
      ]
    },
    {
      title: 'Vehicle Information',
      icon: 'bike',
      items: [
        {
          label: 'Vehicle Details',
          icon: 'car-info',
          onPress: () => router.push('/(profile)/vehicle-details'),
          info: partner?.vehicle?.type
        },
        {
          label: 'Documents',
          icon: 'file-document',
          onPress: () => router.push('/(profile)/documents'),
          info: 'View All'
        }
      ]
    },
    {
      title: 'Work',
      icon: 'briefcase',
      items: [
        {
          label: 'Service Area',
          icon: 'map-marker-radius',
          onPress: () => router.push('/(profile)/service-area'),
          info: partner?.serviceArea?.city
        },
        {
          label: 'Performance',
          icon: 'chart-line',
          onPress: () => router.push('/(profile)/performance'),
          info: `${partner?.metrics?.rating?.toFixed(1) || 0}★`
        }
      ]
    },
    {
      title: 'Support',
      icon: 'help-circle',
      items: [
        {
          label: 'Help Center',
          icon: 'help',
          onPress: () => router.push('/(profile)/help'),
        },
        {
          label: 'Terms & Conditions',
          icon: 'file-document-outline',
          onPress: () => router.push('/(profile)/terms'),
        }
      ]
    }
  ];

  const handleLogout = async () => {
    await dispatch(logout());
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerShown: true,
        }}
      />
      
      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileInitial}>
              {partner?.name?.[0]?.toUpperCase() || 'P'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{partner?.name}</Text>
            <Text style={styles.phone}>{partner?.phone}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: partner?.status === 'active' ? Colors.success : Colors.error }]} />
              <Text style={styles.status}>{partner?.status === 'active' ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
        </View>

        {/* Sections */}
        {sections.map((section, index) => (
          <View key={section.title} style={[styles.section, index > 0 && styles.sectionBorder]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name={section.icon as any} size={24} color={Colors.primary} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, itemIndex > 0 && styles.menuItemBorder]}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <MaterialCommunityIcons name={item.icon as any} size={24} color={Colors.text} />
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                <View style={styles.menuItemRight}>
                  {item.info && <Text style={styles.menuItemInfo}>{item.info}</Text>}
                  <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={24} color={Colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  profileInitial: {
    fontSize: 24,
    color: Colors.white,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  status: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    backgroundColor: Colors.white,
    paddingVertical: 15,
  },
  sectionBorder: {
    borderTopWidth: 8,
    borderTopColor: Colors.background,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 15,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemInfo: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.error,
    marginLeft: 10,
  },
}); 