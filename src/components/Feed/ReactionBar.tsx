import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { REACTIONS } from '../../constants';

interface ReactionBarProps {
  reactions: Record<string, number>;
  onReaction: (emoji: string) => void;
  disabled?: boolean;
}

export const ReactionBar: React.FC<ReactionBarProps> = ({
  reactions,
  onReaction,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.reactionsContainer}>
        {REACTIONS.map((emoji) => {
          const count = reactions[emoji] || 0;
          const hasReaction = count > 0;
          
          return (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.reactionButton,
                hasReaction && styles.activeReaction,
                disabled && styles.disabledReaction,
              ]}
              onPress={() => onReaction(emoji)}
              disabled={disabled}
            >
              <Text style={styles.emoji}>{emoji}</Text>
              {hasReaction && (
                <Text style={styles.count}>{formatCount(count)}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 40,
  },
  activeReaction: {
    backgroundColor: '#9333EA',
  },
  disabledReaction: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 16,
    marginRight: 4,
  },
  count: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
