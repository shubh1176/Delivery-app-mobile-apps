import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';

interface PhoneInputProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function PhoneInput({ value, onChangeText, style, ...props }: PhoneInputProps) {
  const handleChangeText = (text: string) => {
    // Remove any non-numeric characters except +
    const cleaned = text.replace(/[^\d+]/g, '');
    onChangeText(cleaned);
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        value={value}
        onChangeText={handleChangeText}
        keyboardType="phone-pad"
        placeholder="+91 9999999999"
        placeholderTextColor={Colors.textSecondary}
        style={styles.input}
        maxLength={13} // +91 + 10 digits
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.inputBackground,
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
}); 