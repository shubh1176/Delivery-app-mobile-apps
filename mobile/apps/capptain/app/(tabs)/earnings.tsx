import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getEarningsSummary, getTransactionHistory, getIncentives } from '../../store/slices/earnings.slice';

export default function EarningsScreen() {
  const dispatch = useAppDispatch();
  const { summary, transactions, incentives, isLoading } = useAppSelector(state => state.earnings);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const loadData = async () => {
    const today = new Date();
    let startDate = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    await Promise.all([
      dispatch(getEarningsSummary({ startDate: startDate.toISOString(), endDate: today.toISOString() })),
      dispatch(getTransactionHistory({ page: 1, limit: 10 })),
      dispatch(getIncentives())
    ]);
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const formatAmount = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Earnings',
          headerShown: true,
        }}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} />
        }
      >
        {/* Period Selection */}
        <View style={styles.periodContainer}>
          {(['today', 'week', 'month'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <MaterialCommunityIcons name="wallet" size={24} color={Colors.primary} />
            <Text style={styles.summaryTitle}>Earnings Summary</Text>
          </View>

          <View style={styles.summaryContent}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
              <Text style={styles.summaryValue}>{formatAmount(summary?.totalEarnings || 0)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Incentives</Text>
              <Text style={styles.summaryValue}>{formatAmount(summary?.totalIncentives || 0)}</Text>
            </View>
            <View style={[styles.summaryItem, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Grand Total</Text>
              <Text style={styles.summaryTotalValue}>{formatAmount(summary?.grandTotal || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Active Incentives */}
        {incentives?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="gift" size={24} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Active Incentives</Text>
            </View>
            {incentives.map((incentive, index) => (
              <View key={index} style={styles.incentiveItem}>
                <View style={styles.incentiveInfo}>
                  <Text style={styles.incentiveTitle}>{incentive.description}</Text>
                  <Text style={styles.incentiveDate}>Valid till {formatDate(incentive.timestamp)}</Text>
                </View>
                <Text style={styles.incentiveAmount}>{formatAmount(incentive.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Transaction History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="history" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Transaction History</Text>
          </View>
          {transactions?.map((transaction, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>{formatDate(transaction.timestamp)}</Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'credit' ? Colors.success : Colors.error }
                ]}
              >
                {transaction.type === 'credit' ? '+' : '-'}{formatAmount(Math.abs(transaction.amount))}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
  periodContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: Colors.white,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: Colors.background,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  periodTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: Colors.white,
    marginTop: 15,
    padding: 15,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 10,
  },
  summaryContent: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 15,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    marginTop: 5,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  section: {
    backgroundColor: Colors.white,
    marginTop: 15,
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 10,
  },
  incentiveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  incentiveInfo: {
    flex: 1,
  },
  incentiveTitle: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  incentiveDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  incentiveAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 