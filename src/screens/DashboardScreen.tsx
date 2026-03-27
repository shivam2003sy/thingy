import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUserStore } from '../store/userStore';
import { ProgressBar } from '../components/ProgressBar';


export const DashboardScreen: React.FC = () => {
  const user = useUserStore();
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          Welcome to Chaos
        </Text>
        
        <Text style={styles.subtitle}>
          {user.personality ? `${user.personality} mode activated` : 'Ready to shop?'}
        </Text>
        
        <View style={styles.card}>
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.label}>Level</Text>
              <Text style={styles.levelText}>{user.level}</Text>
            </View>
            
            <View style={styles.coinsContainer}>
              <Text style={styles.label}>Chaos Coins</Text>
              <View style={styles.coinsRow}>
                <Text style={styles.coinsText}>{user.coins}</Text>
                <Icon name="cash" size={24} color="#a855f7" />
              </View>
            </View>
          </View>
          
          <ProgressBar
            current={user.xp % 100}
            max={100}
            label="XP Progress"
            showPercentage
          />
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Collection</Text>
          
          {user.inventory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="shopping" size={48} color="#6b7280" />
              <Text style={styles.emptyText}>
                No items yet. Start shopping!
              </Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {user.inventory.map((item, index) => (
                <View key={index} style={styles.gridItem}>
                  <Icon name={item.icon} size={36} color="#ffffff" />
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Badges</Text>
          
          {user.badges.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="star-circle" size={48} color="#6b7280" />
              <Text style={styles.emptyText}>
                Complete actions to unlock badges!
              </Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {user.badges.map((badge, index) => (
                <View key={index} style={styles.badgeItem}>
                  <Icon name={badge.icon} size={32} color="#fbbf24" />
                  <Text style={styles.badgeName} numberOfLines={2}>
                    {badge.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.spacer} />
      </ScrollView>
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
    fontSize: 36,
    marginBottom: 8,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 18,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  levelText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 30,
  },
  coinsContainer: {
    alignItems: 'flex-end',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coinsText: {
    color: '#a855f7',
    fontWeight: 'bold',
    fontSize: 24,
  },
  cardTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '30%',
  },
  itemName: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  badgeItem: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  badgeName: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 8,
  },
  spacer: {
    height: 80,
  },
});
