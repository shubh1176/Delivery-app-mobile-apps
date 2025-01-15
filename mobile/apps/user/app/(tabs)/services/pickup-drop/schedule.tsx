import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

export default function ScheduleScreen() {
  const [pickupDate, setPickupDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickupTime, setPickupTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickupContact, setPickupContact] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
  });
  const [dropContact, setDropContact] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
  });

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setPickupDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setPickupTime(selectedTime);
    }
  };

  const handleContinue = () => {
    if (!pickupContact.name || !pickupContact.phone || !dropContact.name || !dropContact.phone) {
      // Show error
      return;
    }
    router.push('/(tabs)/services/pickup-drop/payment' as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Schedule & Contact</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Schedule</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {pickupDate.toLocaleDateString()}
            </Text>
            <Ionicons name="calendar" size={24} color="#470A68" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {pickupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Ionicons name="time" size={24} color="#470A68" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={pickupDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={pickupTime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Contact</Text>
          <TextInput
            style={styles.input}
            placeholder="Contact Name"
            value={pickupContact.name}
            onChangeText={(name) => setPickupContact({ ...pickupContact, name })}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={pickupContact.phone}
            onChangeText={(phone) => setPickupContact({ ...pickupContact, phone })}
          />
          <TextInput
            style={styles.input}
            placeholder="Alternate Phone (Optional)"
            keyboardType="phone-pad"
            value={pickupContact.alternatePhone}
            onChangeText={(alternatePhone) =>
              setPickupContact({ ...pickupContact, alternatePhone })
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Drop Contact</Text>
          <TextInput
            style={styles.input}
            placeholder="Contact Name"
            value={dropContact.name}
            onChangeText={(name) => setDropContact({ ...dropContact, name })}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            value={dropContact.phone}
            onChangeText={(phone) => setDropContact({ ...dropContact, phone })}
          />
          <TextInput
            style={styles.input}
            placeholder="Alternate Phone (Optional)"
            keyboardType="phone-pad"
            value={dropContact.alternatePhone}
            onChangeText={(alternatePhone) =>
              setDropContact({ ...dropContact, alternatePhone })
            }
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.continueButton,
          (!pickupContact.name ||
            !pickupContact.phone ||
            !dropContact.name ||
            !dropContact.phone) &&
            styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={
          !pickupContact.name ||
          !pickupContact.phone ||
          !dropContact.name ||
          !dropContact.phone
        }
      >
        <Text style={styles.continueButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  input: {
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  continueButton: {
    backgroundColor: '#470A68',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 20,
    borderRadius: 12,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
}); 