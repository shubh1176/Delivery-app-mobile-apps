import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileAPI } from '../../../../services/profile';
import type { SavedCard } from '../../../types/user';

export default function CardsScreen() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<SavedCard[]>([]);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const data = await ProfileAPI.getCards();
      setCards(data);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ProfileAPI.deleteCard(cardId);
              await loadCards();
            } catch (error) {
              console.error('Error deleting card:', error);
              Alert.alert('Error', 'Failed to delete card. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getCardIcon = (cardType: string): keyof typeof Ionicons.glyphMap => {
    switch (cardType.toLowerCase()) {
      case 'visa':
        return 'card-outline';
      case 'mastercard':
        return 'card-outline';
      case 'amex':
        return 'card-outline';
      default:
        return 'card-outline';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#470A68" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.cardsList}>
        {cards.map((card, index) => (
          <View key={index} style={styles.cardItem}>
            <View style={styles.cardLeft}>
              <View style={styles.cardIcon}>
                <Ionicons name={getCardIcon(card.cardType)} size={24} color="#470A68" />
              </View>
              <View>
                <Text style={styles.cardType}>{card.cardType.toUpperCase()}</Text>
                <Text style={styles.cardNumber}>•••• {card.last4}</Text>
                <Text style={styles.cardExpiry}>Expires {card.expiryMonth}/{card.expiryYear}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              {card.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => handleDeleteCard(card._id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add New Card</Text>
      </TouchableOpacity>
    </View>
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
  cardsList: {
    flex: 1,
    padding: 16,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 4,
  },
  cardExpiry: {
    fontSize: 12,
    color: '#666666',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultBadge: {
    backgroundColor: '#E8E0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  defaultText: {
    fontSize: 12,
    color: '#470A68',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#470A68',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 