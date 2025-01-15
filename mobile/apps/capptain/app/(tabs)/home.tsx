import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateStatus } from '../../store/slices/auth.slice';
import { getOrders } from '../../store/slices/order.slice';
import { useLocationPermission, useLocation } from '../../hooks/useLocation';
import { OrderCard } from '../../components/OrderCard';

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const { partner } = useAppSelector(state => state.auth);
  const { orders } = useAppSelector(state => state.order);
  const [isActive, setIsActive] = useState(partner?.status === 'active');
  const { location } = useLocation();
  const { hasPermission, requestPermission } = useLocationPermission();

  useEffect(() => {
    if (hasPermission && isActive) {
      dispatch(getOrders());
    }
  }, [hasPermission, isActive]);

  const handleStatusToggle = async () => {
    const newStatus = !isActive;
    setIsActive(newStatus);
    if (newStatus && !hasPermission) {
      await requestPermission();
    }
    await dispatch(updateStatus(newStatus ? 'active' : 'offline'));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Home</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {isActive ? 'You are Online' : 'You are Offline'}
          </Text>
          <Switch
            value={isActive}
            onValueChange={handleStatusToggle}
            trackColor={{ false: Colors.error, true: Colors.success }}
            thumbColor={Colors.white}
          />
        </View>
      </View>

      {isActive && !hasPermission && (
        <View style={styles.permissionWarning}>
          <MaterialCommunityIcons name="alert" size={24} color={Colors.warning} />
          <Text style={styles.warningText}>
            Location permission is required to receive orders
          </Text>
          <TouchableOpacity onPress={requestPermission}>
            <Text style={styles.grantButton}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      )}

      {isActive && hasPermission && location && (
        <View style={styles.locationInfo}>
          <MaterialCommunityIcons name="map-marker" size={24} color={Colors.primary} />
          <Text style={styles.locationText}>
            Current Location: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      <ScrollView style={styles.content}>
        {isActive ? (
          orders.length > 0 ? (
            orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="package" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No orders available</Text>
              <Text style={styles.emptySubtext}>New orders will appear here</Text>
            </View>
          )
        ) : (
          <View style={styles.offlineState}>
            <MaterialCommunityIcons name="power" size={48} color={Colors.textSecondary} />
            <Text style={styles.offlineText}>You are currently offline</Text>
            <Text style={styles.offlineSubtext}>Go online to start receiving orders</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningBackground,
    padding: 15,
    margin: 20,
    borderRadius: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: Colors.warning,
    marginHorizontal: 10,
  },
  grantButton: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 15,
    margin: 20,
    borderRadius: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 5,
  },
  offlineState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  offlineText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
  },
  offlineSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 5,
  },
}); 