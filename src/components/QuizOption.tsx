import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface QuizOptionProps {
  icon: string;
  title: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

export const QuizOption: React.FC<QuizOptionProps> = ({
  icon,
  title,
  description,
  isSelected,
  onPress,
}) => {
  const scale = useSharedValue(1);
  const borderWidth = useSharedValue(isSelected ? 3 : 2);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderWidth: borderWidth.value,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.2)' : 'rgba(31, 41, 55, 0.5)',
    borderColor: isSelected ? '#a855f7' : '#374151',
  }));

  React.useEffect(() => {
    borderWidth.value = withTiming(isSelected ? 3 : 2, { duration: 200 });
  }, [isSelected]);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={animatedStyle}>
        <View style={styles.row}>
          <Icon name={icon} size={36} color="#ffffff" />
          <View style={styles.flex}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View
            style={[
              styles.radio,
              isSelected ? styles.radioSelected : styles.radioUnselected,
            ]}
          >
            {isSelected && (
              <Icon name="check" size={14} color="#ffffff" />
            )}
          </View>
        </View>
        <Text style={styles.description}>{description}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: '#a855f7',
    borderColor: '#a855f7',
  },
  radioUnselected: {
    backgroundColor: 'transparent',
    borderColor: '#4b5563',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  description: {
    color: '#9ca3af',
    fontSize: 16,
    lineHeight: 24,
    marginLeft: 56,
  },
});
