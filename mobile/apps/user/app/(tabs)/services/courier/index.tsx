import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { ThemedText as Text } from '@/components/ThemedText';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const features = [
  {
    icon: 'box',
    title: 'Multiple Package Types',
    description: 'From documents to electronics'
  },
  {
    icon: 'shield-alt',
    title: 'Insurance Coverage',
    description: 'Protect your valuable items'
  },
  {
    icon: 'truck',
    title: 'Fast Delivery',
    description: 'Quick and reliable service'
  },
  {
    icon: 'temperature-low',
    title: 'Special Handling',
    description: 'For fragile and temperature-sensitive items'
  }
];

export default function CourierService() {
  const handleStartBooking = () => {
    router.push('/(tabs)/services/courier/package-details' as any);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <FontAwesome5 name="shipping-fast" size={40} color={Colors.light.primary} />
        <Text style={styles.title}>Courier Service</Text>
        <Text style={styles.subtitle}>
          Safe and secure delivery for all your packages
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <FontAwesome5 name={feature.icon} size={24} color={Colors.light.primary} />
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Service Hours</Text>
        <Text style={styles.infoText}>Monday - Saturday: 9:00 AM - 9:00 PM</Text>
        <Text style={styles.infoText}>Sunday: 10:00 AM - 6:00 PM</Text>
      </View>

      <View style={styles.priceSection}>
        <Text style={styles.sectionTitle}>Starting From</Text>
        <Text style={styles.price}>₹49</Text>
        <Text style={styles.priceNote}>Final price based on package details</Text>
      </View>

      <Pressable 
        style={styles.startButton}
        onPress={handleStartBooking}
      >
        <Text style={styles.buttonText}>Start Booking</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textDim,
    textAlign: 'center',
    marginTop: 5,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  featureCard: {
    width: '48%',
    backgroundColor: Colors.light.background,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.light.textDim,
    textAlign: 'center',
  },
  infoSection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 15,
    color: Colors.light.textDim,
    marginBottom: 5,
  },
  priceSection: {
    marginTop: 25,
    alignItems: 'center',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  priceNote: {
    fontSize: 14,
    color: Colors.light.textDim,
    marginTop: 5,
  },
  startButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 30,
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
}); 