import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { TextInput } from '../../components/TextInput';
import { api } from '../../services/api';

interface BankDetails {
  accountNumber: string;
  confirmAccountNumber: string;
  ifsc: string;
  holderName: string;
}

export default function BankDetailsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
    holderName: '',
  });

  const validateIFSC = (ifsc: string) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc);
  };

  const validateAccountNumber = (accountNumber: string) => {
    const accountRegex = /^\d{9,18}$/;
    return accountRegex.test(accountNumber);
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!bankDetails.accountNumber || !bankDetails.confirmAccountNumber || !bankDetails.ifsc || !bankDetails.holderName) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (bankDetails.accountNumber !== bankDetails.confirmAccountNumber) {
      Alert.alert('Error', 'Account numbers do not match');
      return;
    }

    if (!validateAccountNumber(bankDetails.accountNumber)) {
      Alert.alert('Error', 'Invalid account number format');
      return;
    }

    if (!validateIFSC(bankDetails.ifsc)) {
      Alert.alert('Error', 'Invalid IFSC code format');
      return;
    }

    setLoading(true);
    try {
      await api.post('/partner/bank-details', {
        accountNumber: bankDetails.accountNumber,
        ifsc: bankDetails.ifsc,
        holderName: bankDetails.holderName,
      });

      router.push('/training');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof BankDetails, value: string) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Bank Details',
          headerShown: true,
        }}
      />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="bank" size={40} color={Colors.primary} />
          <Text style={styles.title}>Bank Account Details</Text>
          <Text style={styles.subtitle}>
            Add your bank account details for receiving payments
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Account Number"
            value={bankDetails.accountNumber}
            onChangeText={(value: string) => handleChange('accountNumber', value)}
            placeholder="Enter account number"
            keyboardType="numeric"
            maxLength={18}
            secureTextEntry
          />

          <TextInput
            label="Confirm Account Number"
            value={bankDetails.confirmAccountNumber}
            onChangeText={(value: string) => handleChange('confirmAccountNumber', value)}
            placeholder="Re-enter account number"
            keyboardType="numeric"
            maxLength={18}
          />

          <TextInput
            label="IFSC Code"
            value={bankDetails.ifsc}
            onChangeText={(value: string) => handleChange('ifsc', value.toUpperCase())}
            placeholder="Enter IFSC code"
            autoCapitalize="characters"
            maxLength={11}
          />

          <TextInput
            label="Account Holder Name"
            value={bankDetails.holderName}
            onChangeText={(value: string) => handleChange('holderName', value)}
            placeholder="Enter account holder name"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.info}>
          <MaterialCommunityIcons name="information" size={20} color={Colors.warning} />
          <Text style={styles.infoText}>
            Please ensure all details are correct. Incorrect details may lead to payment failures.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 15,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    backgroundColor: Colors.white,
    padding: 20,
    marginTop: 20,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warningBackground,
    padding: 15,
    margin: 20,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: Colors.warning,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 