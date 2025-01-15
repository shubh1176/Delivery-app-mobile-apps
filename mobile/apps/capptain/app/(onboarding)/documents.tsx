import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { api } from '../../services/api';

interface Document {
  type: 'idProof' | 'addressProof' | 'drivingLicense' | 'rc' | 'insurance' | 'permit';
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  required: boolean;
  image?: string;
  uploaded: boolean;
}

export default function DocumentsScreen() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([
    {
      type: 'idProof',
      label: 'ID Proof',
      icon: 'card-account-details',
      required: true,
      uploaded: false,
    },
    {
      type: 'addressProof',
      label: 'Address Proof',
      icon: 'home',
      required: true,
      uploaded: false,
    },
    {
      type: 'drivingLicense',
      label: 'Driving License',
      icon: 'card-account-details-star',
      required: true,
      uploaded: false,
    },
    {
      type: 'rc',
      label: 'Vehicle RC',
      icon: 'file-document',
      required: true,
      uploaded: false,
    },
    {
      type: 'insurance',
      label: 'Vehicle Insurance',
      icon: 'shield-check',
      required: true,
      uploaded: false,
    },
    {
      type: 'permit',
      label: 'Vehicle Permit',
      icon: 'license',
      required: false,
      uploaded: false,
    },
  ]);

  const pickImage = async (type: Document['type']) => {
    try {
      // Show action sheet to choose between camera and gallery
      Alert.alert(
        'Upload Document',
        'Choose a method to upload your document',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              // Request camera permissions every time
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  'Camera Permission Required',
                  'Please allow access to your camera in your phone settings to take photos of documents.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Open Settings',
                      onPress: () => Linking.openSettings()
                    }
                  ]
                );
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                uploadDocument(type, result.assets[0].uri);
              }
            }
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              // Request gallery permissions every time
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  'Gallery Permission Required',
                  'Please allow access to your photo library in your phone settings to upload documents.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Open Settings',
                      onPress: () => Linking.openSettings()
                    }
                  ]
                );
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                uploadDocument(type, result.assets[0].uri);
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to access camera or gallery. Please try again.');
    }
  };

  const uploadDocument = async (type: Document['type'], uri: string) => {
    try {
      const formData = new FormData();
      formData.append('document', {
        uri,
        type: 'image/jpeg',
        name: `${type}.jpg`,
      } as any);
      formData.append('type', type);

      const response = await api.post('/partner/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setDocuments(prev => prev.map(doc => 
        doc.type === type 
          ? { ...doc, image: uri, uploaded: true }
          : doc
      ));

      Alert.alert('Success', 'Document uploaded successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload document');
    }
  };

  const handleNext = () => {
    const requiredDocs = documents.filter(doc => doc.required);
    const allUploaded = requiredDocs.every(doc => doc.uploaded);

    if (!allUploaded) {
      Alert.alert('Required Documents', 'Please upload all required documents before proceeding.');
      return;
    }

    router.push('/bank-details');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Upload Documents',
          headerShown: true,
        }}
      />
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Required Documents</Text>
        <Text style={styles.subtitle}>Please upload clear photos of the following documents</Text>

        {documents.map((doc) => (
          <TouchableOpacity
            key={doc.type}
            style={styles.documentItem}
            onPress={() => pickImage(doc.type)}
          >
            <View style={styles.documentInfo}>
              <MaterialCommunityIcons
                name={doc.icon}
                size={24}
                color={doc.uploaded ? Colors.success : Colors.primary}
              />
              <View style={styles.documentText}>
                <Text style={styles.documentLabel}>{doc.label}</Text>
                <Text style={styles.documentStatus}>
                  {doc.uploaded ? 'Uploaded' : doc.required ? 'Required' : 'Optional'}
                </Text>
              </View>
            </View>
            {doc.image ? (
              <Image source={{ uri: doc.image }} style={styles.documentImage} />
            ) : (
              <MaterialCommunityIcons
                name="upload"
                size={24}
                color={Colors.primary}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            !documents.filter(doc => doc.required).every(doc => doc.uploaded) && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={!documents.filter(doc => doc.required).every(doc => doc.uploaded)}
        >
          <Text style={styles.buttonText}>Next</Text>
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
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 30,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentText: {
    marginLeft: 15,
    flex: 1,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  documentStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  documentImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
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