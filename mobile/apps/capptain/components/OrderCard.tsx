import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Order } from '../store/slices/order.slice';
import { useAppDispatch } from '../store/hooks';
import { acceptOrder, rejectOrder } from '../store/slices/order.slice';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const dispatch = useAppDispatch();

  const handleAccept = () => {
    dispatch(acceptOrder(order.id));
  };

  const handleReject = () => {
    dispatch(rejectOrder(order.id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <MaterialCommunityIcons
            name={order.type === 'courier' ? 'package' : 'map-marker-path'}
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.type}>{order.type === 'courier' ? 'Courier' : 'Pickup-Drop'}</Text>
        </View>
        <Text style={styles.price}>₹{order.pricing.total}</Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationItem}>
          <MaterialCommunityIcons name="circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.address} numberOfLines={2}>
            {order.pickup.address}
          </Text>
        </View>
        {order.drops.map((drop, index) => (
          <View key={index} style={styles.locationItem}>
            <MaterialCommunityIcons name="map-marker" size={20} color={Colors.primary} />
            <Text style={styles.address} numberOfLines={2}>
              {drop.address}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={handleReject}>
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={handleAccept}>
          <Text style={[styles.buttonText, styles.acceptButtonText]}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  type: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.success,
  },
  locationContainer: {
    marginBottom: 15,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    marginLeft: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: Colors.background,
    marginRight: 10,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  acceptButtonText: {
    color: Colors.white,
  },
}); 