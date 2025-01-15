import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function StoreDetailsScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View>
      <Text>Store Details for {id}</Text>
    </View>
  );
} 