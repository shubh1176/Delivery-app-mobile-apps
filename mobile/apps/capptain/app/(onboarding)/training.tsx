import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Colors } from '../../constants/Colors';
import { api } from '../../services/api';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  completed: boolean;
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

export default function TrainingScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentModule, setCurrentModule] = useState<number>(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [modules] = useState<TrainingModule[]>([
    {
      id: '1',
      title: 'Welcome to OnePost',
      description: 'Introduction to our platform',
      videoUrl: 'https://storage.onepost.com/training/welcome.mp4',
      duration: 180,
      completed: false,
      quiz: [
        {
          question: 'What is the main goal of OnePost?',
          options: [
            'To provide fast food delivery',
            'To connect local businesses with customers',
            'To provide reliable and efficient delivery services',
            'To sell groceries online',
          ],
          correctAnswer: 2,
        },
      ],
    },
    {
      id: '2',
      title: 'Safety Guidelines',
      description: 'Important safety rules and guidelines for delivery',
      videoUrl: 'https://storage.onepost.com/training/safety.mp4',
      duration: 240,
      completed: false,
      quiz: [
        {
          question: 'What should you do before starting your delivery?',
          options: [
            'Check vehicle condition',
            'Check weather forecast',
            'Plan your route',
            'All of the above',
          ],
          correctAnswer: 3,
        },
      ],
    },
    {
      id: '3',
      title: 'Using the App',
      description: 'Learn how to use the partner app effectively',
      videoUrl: 'https://storage.onepost.com/training/app-usage.mp4',
      duration: 300,
      completed: false,
      quiz: [
        {
          question: 'How do you mark an order as delivered?',
          options: [
            'By calling the customer',
            'By taking a photo of the delivery',
            'By clicking the delivered button',
            'By sending an SMS',
          ],
          correctAnswer: 1,
        },
      ],
    },
  ]);

  const handleVideoEnd = () => {
    if (modules[currentModule].quiz) {
      setShowQuiz(true);
    } else {
      markModuleComplete();
    }
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[questionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleQuizSubmit = () => {
    const currentQuiz = modules[currentModule].quiz;
    if (!currentQuiz) return;

    const allCorrect = currentQuiz.every((q, index) => 
      selectedAnswers[index] === q.correctAnswer
    );

    if (allCorrect) {
      markModuleComplete();
    } else {
      Alert.alert(
        'Incorrect Answers',
        'Please review the content and try again.',
        [
          {
            text: 'Retry',
            onPress: () => {
              setShowQuiz(false);
              setSelectedAnswers([]);
            },
          },
        ]
      );
    }
  };

  const markModuleComplete = async () => {
    try {
      await api.post('/partner/training/complete', {
        moduleId: modules[currentModule].id,
      });

      const updatedModules = [...modules];
      updatedModules[currentModule].completed = true;
      
      if (currentModule < modules.length - 1) {
        setCurrentModule(currentModule + 1);
        setShowQuiz(false);
        setSelectedAnswers([]);
      } else {
        // All modules completed
        router.push('/');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark module as complete');
    }
  };

  const currentModuleData = modules[currentModule];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Training',
          headerShown: true,
        }}
      />

      <View style={styles.header}>
        <Text style={styles.progress}>
          Module {currentModule + 1} of {modules.length}
        </Text>
        <Text style={styles.title}>{currentModuleData.title}</Text>
        <Text style={styles.description}>{currentModuleData.description}</Text>
      </View>

      {!showQuiz ? (
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: currentModuleData.videoUrl }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
              if (status.isLoaded && status.didJustFinish) {
                handleVideoEnd();
              }
            }}
          />
        </View>
      ) : (
        <ScrollView style={styles.quizContainer}>
          <Text style={styles.quizTitle}>Quick Quiz</Text>
          {currentModuleData.quiz?.map((quiz, questionIndex) => (
            <View key={questionIndex} style={styles.questionContainer}>
              <Text style={styles.question}>{quiz.question}</Text>
              {quiz.options.map((option, optionIndex) => (
                <TouchableOpacity
                  key={optionIndex}
                  style={[
                    styles.option,
                    selectedAnswers[questionIndex] === optionIndex && styles.selectedOption,
                  ]}
                  onPress={() => handleAnswerSelect(questionIndex, optionIndex)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedAnswers[questionIndex] === optionIndex && styles.selectedOptionText,
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <TouchableOpacity
            style={[
              styles.submitButton,
              selectedAnswers.length !== currentModuleData.quiz?.length && styles.buttonDisabled,
            ]}
            onPress={handleQuizSubmit}
            disabled={selectedAnswers.length !== currentModuleData.quiz?.length}
          >
            <Text style={styles.submitButtonText}>Submit Answers</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <View style={styles.moduleList}>
        <Text style={styles.moduleListTitle}>All Modules</Text>
        {modules.map((module, index) => (
          <View key={module.id} style={styles.moduleItem}>
            <View style={styles.moduleInfo}>
              <MaterialCommunityIcons
                name={module.completed ? 'check-circle' : 'circle-outline'}
                size={24}
                color={module.completed ? Colors.success : Colors.textSecondary}
              />
              <View style={styles.moduleText}>
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.moduleDuration}>
                  {Math.floor(module.duration / 60)} mins
                </Text>
              </View>
            </View>
            {index === currentModule && (
              <Text style={styles.currentModule}>Current</Text>
            )}
          </View>
        ))}
      </View>
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
    backgroundColor: Colors.white,
  },
  progress: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: Colors.text,
  },
  video: {
    flex: 1,
  },
  quizContainer: {
    flex: 1,
    padding: 20,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
  },
  questionContainer: {
    marginBottom: 30,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 15,
  },
  option: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: Colors.white,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedOption: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: Colors.text,
  },
  selectedOptionText: {
    color: Colors.white,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  moduleList: {
    padding: 20,
    backgroundColor: Colors.white,
  },
  moduleListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  moduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moduleText: {
    marginLeft: 12,
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  moduleDuration: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  currentModule: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
}); 