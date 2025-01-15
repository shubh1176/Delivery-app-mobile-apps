import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OrderAPI } from '../services/api';

type OrderDetails = Awaited<ReturnType<typeof OrderAPI.getOrderInvoiceDetails>>;

// Add type for dimensions
type Dimensions = {
  length: number;
  width: number;
  height: number;
};

// Update package type to include dimensions
type Package = {
  category: string;
  type: string;
  size: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  } | string;
  value: number;
  photos: string[];
  isFragile: boolean;
  requiresRefrigeration: boolean;
  description?: string;
};

type TrackingUpdate = {
  status: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  description?: string;
};

type Drop = {
  address: {
    full: string;
    landmark: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    pincode: string;
  };
  contact: {
    name: string;
    phone: string;
  };
  status: string;
  scheduledTime: string;
  sequence: number;
  proofOfDelivery?: {
    photos: string[];
  };
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        console.log('Fetching order details for ID:', id);
        const data = await OrderAPI.getOrderInvoiceDetails(id as string);
        console.log('Full order details response:', JSON.stringify(data, null, 2));
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#470A68" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error || 'Order not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Order Header */}
      <View style={styles.section}>
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
          <Text style={styles.orderId}>#{order.orderId}</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
      </View>

      {/* Tracking */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tracking</Text>
        {order.tracking.history.length > 0 ? (
          order.tracking.history.map((update: TrackingUpdate, index: number) => (
            <View key={index} style={styles.trackingUpdate}>
              <View style={styles.trackingDot} />
              <View style={styles.trackingInfo}>
                <Text style={styles.trackingStatus}>{update.status}</Text>
                <Text style={styles.trackingTime}>{formatDate(update.timestamp)}</Text>
                {update.description && (
                  <Text style={styles.trackingDescription}>{update.description}</Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noTrackingText}>No tracking updates available</Text>
        )}
      </View>

      {/* Locations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Locations</Text>
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View style={[styles.dot, { backgroundColor: '#34C759' }]} />
            <Text style={styles.locationTitle}>Pickup</Text>
          </View>
          <Text style={styles.address}>{order.pickup.address.full}</Text>
          {order.pickup.address.landmark && (
            <Text style={styles.landmark}>Landmark: {order.pickup.address.landmark}</Text>
          )}
          <Text style={styles.contactName}>{order.pickup.contact.name}</Text>
          <Text style={styles.contactPhone}>{order.pickup.contact.phone}</Text>
          <Text style={styles.scheduleTime}>
            Scheduled: {new Date(order.pickup.scheduledTime).toLocaleTimeString()}
          </Text>
        </View>
        {order.drops.map((drop: Drop, index: number) => (
          <View key={index} style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <View style={[styles.dot, { backgroundColor: '#FF3B30' }]} />
              <Text style={styles.locationTitle}>Drop {order.drops.length > 1 ? index + 1 : ''}</Text>
            </View>
            <Text style={styles.address}>{drop.address.full}</Text>
            {drop.address.landmark && (
              <Text style={styles.landmark}>Landmark: {drop.address.landmark}</Text>
            )}
            <Text style={styles.contactName}>{drop.contact.name}</Text>
            <Text style={styles.contactPhone}>{drop.contact.phone}</Text>
            <Text style={styles.scheduleTime}>
              Scheduled: {new Date(drop.scheduledTime).toLocaleTimeString()}
            </Text>
            {drop.proofOfDelivery && drop.proofOfDelivery.photos.length > 0 && (
              <View style={styles.proofOfDelivery}>
                <Text style={styles.proofTitle}>Proof of Delivery</Text>
                <Text style={styles.proofText}>Photos available</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Package Details */}
      {order.package && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{order.package.category}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{order.package.type}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>{order.package.size}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Weight</Text>
              <Text style={styles.detailValue}>{order.package.weight} kg</Text>
            </View>
            {order.package?.dimensions && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Dimensions</Text>
                <Text style={styles.detailValue}>
                  {typeof order.package.dimensions === 'string' 
                    ? order.package.dimensions 
                    : `${(order.package.dimensions as any).length}x${(order.package.dimensions as any).width}x${(order.package.dimensions as any).height} cm`
                  }
                </Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Value</Text>
              <Text style={styles.detailValue}>{order.pricing.currency} {order.package.value}</Text>
            </View>
            {order.package.description && (
              <View style={[styles.detailItem, { width: '100%' }]}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{order.package.description}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Payment Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <Text style={styles.paymentMethod}>
          {order.payment.status === 'completed' ? 'Paid' : 'Payment Pending'} via {order.payment.method}
        </Text>
        <View style={styles.paymentBreakdown}>
          {order.pricing.breakdown?.base !== undefined && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Base Fare</Text>
              <Text style={styles.paymentValue}>
                {order.pricing.currency} {order.pricing.breakdown.base.toFixed(2)}
              </Text>
            </View>
          )}
          {order.pricing.breakdown?.distance !== undefined && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Distance Charge</Text>
              <Text style={styles.paymentValue}>
                {order.pricing.currency} {order.pricing.breakdown.distance.toFixed(2)}
              </Text>
            </View>
          )}
          {order.pricing.breakdown?.tax !== undefined && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Tax</Text>
              <Text style={styles.paymentValue}>
                {order.pricing.currency} {order.pricing.breakdown.tax.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.paymentRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {order.pricing.currency} {order.pricing.total.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  orderId: {
    fontSize: 14,
    color: '#666666',
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  trackingUpdate: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  trackingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#470A68',
    marginRight: 12,
    marginTop: 4,
  },
  trackingInfo: {
    flex: 1,
  },
  trackingStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  trackingTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  trackingDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  locationCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  address: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
  },
  landmark: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  contactName: {
    fontSize: 14,
    color: '#666666',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 2,
  },
  proofOfDelivery: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  proofTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  proofText: {
    fontSize: 12,
    color: '#666666',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -8,
  },
  detailItem: {
    width: '50%',
    padding: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#000000',
  },
  paymentMethod: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  paymentBreakdown: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666666',
  },
  paymentValue: {
    fontSize: 14,
    color: '#000000',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#470A68',
  },
  noTrackingText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
}); 