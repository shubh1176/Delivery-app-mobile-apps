import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAppSelector } from '../../store/hooks';
import { Order } from '../../store/slices/order.slice';

export default function OrdersScreen() {
  const { orders } = useAppSelector(state => state.order);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const activeOrders = orders.filter(order => 
    ['assigned', 'picked_up', 'in_transit'].includes(order.status)
  );
  const completedOrders = orders.filter(order => 
    ['delivered', 'completed'].includes(order.status)
  );

  const renderOrderCard = (order: Order) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.typeContainer}>
          <MaterialCommunityIcons
            name={order.type === 'courier' ? 'package' : 'map-marker-path'}
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.orderType}>
            {order.type === 'courier' ? 'Courier' : 'Pickup-Drop'}
          </Text>
        </View>
        <Text style={styles.orderAmount}>₹{order.pricing.total}</Text>
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

      <View style={styles.orderFooter}>
        <View style={styles.statusContainer}>
          <MaterialCommunityIcons
            name={
              order.status === 'completed'
                ? 'check-circle'
                : order.status === 'delivered'
                ? 'package-variant-closed'
                : 'truck-delivery'
            }
            size={20}
            color={
              order.status === 'completed' || order.status === 'delivered'
                ? Colors.success
                : Colors.primary
            }
          />
          <Text style={styles.statusText}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
          </Text>
        </View>
        <Text style={styles.timeText}>
          {new Date(order.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'active' ? (
          activeOrders.length > 0 ? (
            activeOrders.map(order => renderOrderCard(order))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="package" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No active orders</Text>
            </View>
          )
        ) : completedOrders.length > 0 ? (
          completedOrders.map(order => renderOrderCard(order))
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="package" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No completed orders</Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.text,
  },
  activeTabText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 10,
  },
  orderAmount: {
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
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: Colors.text,
    marginLeft: 5,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 10,
  },
}); 