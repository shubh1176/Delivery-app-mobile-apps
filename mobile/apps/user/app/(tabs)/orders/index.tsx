import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { OrderAPI } from '../services/api';
import { styles } from './styles';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Array<{
    id: string;
    type: string;
    status: string;
    createdAt: string;
    pickup: {
      address: string;
      contact: {
        name: string;
        phone: string;
      };
    };
    drop?: {
      address: string;
      contact: {
        name: string;
        phone: string;
      };
    };
    amount: number;
    currency: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await OrderAPI.getUserOrders();
      setOrders(response.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOrderPress = (orderId: string) => {
    router.push({
      pathname: '/(tabs)/orders/[id]',
      params: { id: orderId }
    } as any);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'cancelled':
        return '#FF3B30';
      case 'in-progress':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#470A68" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#470A68']}
        />
      }
    >
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={48} color="#8E8E93" />
          <Text style={styles.emptyText}>No orders yet</Text>
        </View>
      ) : (
        orders.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.orderCard}
            onPress={() => handleOrderPress(order.id)}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderType}>
                <Ionicons 
                  name={order.type === 'pickup-drop' ? 'bicycle-outline' : 'airplane-outline'} 
                  size={24} 
                  color="#470A68" 
                />
                <Text style={styles.orderTypeText}>
                  {order.type === 'pickup-drop' ? 'Pickup & Drop' : 'Courier'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.orderDetails}>
              <View style={styles.addressSection}>
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" size={16} color="#8E8E93" />
                  <Text style={styles.addressText} numberOfLines={1}>
                    {order.pickup.address}
                  </Text>
                </View>
                {order.drop && (
                  <View style={styles.addressRow}>
                    <Ionicons name="location" size={16} color="#8E8E93" />
                    <Text style={styles.addressText} numberOfLines={1}>
                      {order.drop.address}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.orderFooter}>
                <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
                <Text style={styles.amountText}>
                  {order.currency} {order.amount.toFixed(2)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
} 