import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ViralContent, User, Product } from '../../types';
import { RARITY_COLORS, REACTIONS } from '../../constants';

interface FeedCardProps {
  content: ViralContent;
  user: User;
  item: Product;
  onReaction: (emoji: string) => void;
  onShare: () => void;
  onComment: () => void;
  onUserPress: () => void;
}

export const FeedCard: React.FC<FeedCardProps> = ({
  content,
  user,
  item,
  onReaction,
  onShare,
  onComment,
  onUserPress,
}) => {
  const totalReactions = Object.values(content.reactions).reduce((sum, count) => sum + count, 0);
  const topReactions = Object.entries(content.reactions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <View style={styles.card}>
      {/* User Header */}
      <TouchableOpacity style={styles.userHeader} onPress={onUserPress}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{user.avatar}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{user.displayName}</Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(content.timestamp)}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="dots-horizontal" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.caption}>{content.caption}</Text>
        
        {/* Item Display */}
        <View style={[styles.itemContainer, { borderColor: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }]}>
          <View style={styles.itemDisplay}>
            <Text style={styles.itemIcon}>{item.icon}</Text>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={[styles.itemPrice, { color: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }]}>
              {item.price} 🪙
            </Text>
          </View>
        </View>
      </View>

      {/* Reaction Bar */}
      <View style={styles.reactionBar}>
        <View style={styles.reactionButtons}>
          {REACTIONS.slice(0, 4).map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionButton}
              onPress={() => onReaction(emoji)}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
              {content.reactions[emoji] > 0 && (
                <Text style={styles.reactionCount}>
                  {formatCount(content.reactions[emoji])}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <Icon name="comment-outline" size={20} color="#9CA3AF" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Icon name="share-outline" size={20} color="#9CA3AF" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Reactions */}
      {topReactions.length > 0 && (
        <View style={styles.topReactions}>
          <Text style={styles.reactionsLabel}>Reactions</Text>
          <View style={styles.reactionList}>
            {topReactions.map(([emoji, count]) => (
              <View key={emoji} style={styles.reactionItem}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>{formatCount(count)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatar: {
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  timestamp: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  caption: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  itemContainer: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#111827',
  },
  itemDisplay: {
    alignItems: 'center',
  },
  itemIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  itemName: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
  reactionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  reactionButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  reactionCount: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 6,
  },
  topReactions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  reactionsLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  reactionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
});
