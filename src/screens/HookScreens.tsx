import React, { useState } from 'react';
import { View, Text, Dimensions, Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressDots } from '../components/ProgressDots';
import { Button } from '../components/Button';
import { HOOK_SCREENS } from '../utils/mockData';

const { width } = Dimensions.get('window');

interface HookScreensProps {
  onComplete: () => void;
}

export const HookScreens: React.FC<HookScreensProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);
  
  const goToNext = () => {
    if (currentIndex < HOOK_SCREENS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      translateX.value = withSpring(-(currentIndex + 1) * width);
    } else {
      onComplete();
    }
  };
  
  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = -(currentIndex * width) + event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -width / 3 && currentIndex < HOOK_SCREENS.length - 1) {
        runOnJS(goToNext)();
      } else if (event.translationX > width / 3 && currentIndex > 0) {
        runOnJS(setCurrentIndex)(currentIndex - 1);
        translateX.value = withSpring(-(currentIndex - 1) * width);
      } else {
        translateX.value = withSpring(-currentIndex * width);
      }
    });
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onComplete}
        style={styles.skipButton}
      >
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>
      
      <GestureDetector gesture={gesture}>
        <Animated.View style={[animatedStyle, { flexDirection: 'row' }]}>
          {HOOK_SCREENS.map((screen, index) => (
            <HookScreen key={screen.id} screen={screen} />
          ))}
        </Animated.View>
      </GestureDetector>
      
      <View style={styles.dotsContainer}>
        <ProgressDots total={HOOK_SCREENS.length} current={currentIndex} />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title={currentIndex === HOOK_SCREENS.length - 1 ? "Let's Go 🔥" : "Next"}
          onPress={goToNext}
          variant="primary"
        />
      </View>
    </View>
  );
};

const HookScreen: React.FC<{ screen: typeof HOOK_SCREENS[0] }> = ({ screen }) => {
  return (
    <View style={[styles.hookScreen, { width }]}>
      <Icon name={screen.icon} size={96} color="#ffffff" style={styles.hookIcon} />
      <Text style={styles.hookTitle}>
        {screen.title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 14,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 32,
    width: '100%',
    paddingHorizontal: 24,
  },
  hookScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  hookIcon: {
    marginBottom: 32,
  },
  hookTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 36,
    textAlign: 'center',
    lineHeight: 44,
  },
});
