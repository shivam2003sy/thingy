import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { QuizOption } from '../components/QuizOption';
import { Button } from '../components/Button';

interface QuizOptionType {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface QuizScreenProps {
  onComplete: (selectedId: string) => void;
}

const BUYER_TYPES: QuizOptionType[] = [
  {
    id: 'smart-questionable',
    icon: 'brain',
    title: 'Smart but questionable',
    description: 'You research everything... then buy it anyway',
  },
  {
    id: 'unhinged-spender',
    icon: 'cart',
    title: 'Unhinged spender',
    description: 'Cart first, think never',
  },
  {
    id: 'meme-lord',
    icon: 'emoticon-happy',
    title: 'Meme lord',
    description: "If it's not meme-worthy, it's not worth buying",
  },
  {
    id: 'collector-gremlin',
    icon: 'shopping',
    title: 'Collector gremlin',
    description: 'Must. Have. Everything.',
  },
];

export const QuizScreen: React.FC<QuizScreenProps> = ({ onComplete }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedId) {
      onComplete(selectedId);
    }
  };

  return (
    <LinearGradient
      colors={['#0f0f1e', '#1a1a2e', '#16213e']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            What kind of chaotic buyer are you?
          </Text>
          <Text style={styles.subtitle}>
            Choose your vibe (no judgment... maybe a little)
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {BUYER_TYPES.map((option) => (
            <QuizOption
              key={option.id}
              icon={option.icon}
              title={option.title}
              description={option.description}
              isSelected={selectedId === option.id}
              onPress={() => setSelectedId(option.id)}
            />
          ))}
        </View>

        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedId}
        />
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 24,
  },
});
