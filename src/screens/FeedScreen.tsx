import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FeedCard, TrendingSection } from '../components/Feed';
import { MOCK_USERS, MOCK_ITEMS, TRENDING_ITEMS, VIRAL_CONTENT } from '../data/mockData';
import { Product, User, ViralContent } from '../types';

export const FeedScreen: React.FC = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [viralPosts, setViralPosts] = useState(VIRAL_CONTENT);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleReaction = useCallback((contentId: string, emoji: string) => {
    setViralPosts(prev => prev.map(post => {
      if (post.id === contentId) {
        const currentReactions = post.reactions[emoji] || 0;
        return {
          ...post,
          reactions: {
            ...post.reactions,
            [emoji]: currentReactions + 1,
          },
        };
      }
      return post;
    }));
    
    // Show feedback
    Alert.alert('Reaction Added', `You reacted with ${emoji}`);
  }, []);

  const handleShare = useCallback((contentId: string) => {
    // Simulate share functionality
    Alert.alert('Share', 'Sharing to social media...');
  }, []);

  const handleComment = useCallback((contentId: string) => {
    // Navigate to comments screen
    Alert.alert('Comments', 'Opening comments...');
  }, []);

  const handleUserPress = useCallback((userId: string) => {
    // Navigate to user profile
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      Alert.alert('User Profile', `Viewing ${user.displayName}'s profile`);
    }
  }, []);

  const handleItemPress = useCallback((item: Product) => {
    // Navigate to item detail
    Alert.alert('Item Details', `Viewing ${item.name} details`);
  }, []);

  const handleSeeAllTrending = useCallback(() => {
    // Navigate to marketplace
    Alert.alert('Marketplace', 'Opening full marketplace...');
  }, []);

  const getUserById = (userId: string): User | undefined => {
    return MOCK_USERS.find(u => u.id === userId);
  };

  const getItemById = (itemId: string): Product | undefined => {
    return MOCK_ITEMS.find(i => i.id === itemId);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thingy</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="magnify" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="bell-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Trending Section */}
        <TrendingSection
          items={TRENDING_ITEMS}
          onItemPress={handleItemPress}
          onSeeAllPress={handleSeeAllTrending}
        />

        {/* Viral Feed */}
        <View style={styles.feedSection}>
          <Text style={styles.sectionTitle}>🌟 Viral Chaos</Text>
          
          {viralPosts.map((content) => {
            const user = getUserById(content.userId);
            const item = getItemById(content.itemId);
            
            if (!user || !item) return null;
            
            return (
              <FeedCard
                key={content.id}
                content={content}
                user={user}
                item={item}
                onReaction={(emoji: string) => handleReaction(content.id, emoji)}
                onShare={() => handleShare(content.id)}
                onComment={() => handleComment(content.id)}
                onUserPress={() => handleUserPress(content.userId)}
              />
            );
          })}
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('Marketplace' as never)}
      >
        <Icon name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  feedSection: {
    marginTop: 8,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  spacer: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9333EA',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
