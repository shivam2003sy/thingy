import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PERSONALITIES } from '../utils/mockData';
import { PersonalityType } from '../types';
import { useUserStore } from '../store/userStore';

interface IdentitySelectionScreenProps {
  onNext: () => void;
}

export const IdentitySelectionScreen: React.FC<IdentitySelectionScreenProps> = ({ onNext }) => {
  const [selected, setSelected] = useState<PersonalityType | null>(null);
  const setPersonality = useUserStore((state) => state.setPersonality);
  
  const handleContinue = () => {
    if (selected) {
      setPersonality(selected);
      onNext();
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          What kind of chaotic buyer are you?
        </Text>
        <Text style={styles.subtitle}>
          Choose your vibe (no wrong answers)
        </Text>
        
        <View style={styles.cardsContainer}>
          {PERSONALITIES.map((personality) => (
            <Card
              key={personality.id}
              title={personality.title}
              emoji={personality.emoji}
              description={personality.description}
              selected={selected === personality.id}
              onPress={() => setSelected(personality.id)}
            />
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selected}
          variant="primary"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 64,
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 30,
    marginBottom: 8,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 16,
    marginBottom: 32,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 96,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
});
