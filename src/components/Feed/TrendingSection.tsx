import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Product } from '../../types';
import { RARITY_COLORS } from '../../constants';

interface TrendingSectionProps {
  items: Product[];
  onItemPress: (item: Product) => void;
  onSeeAllPress: () => void;
}

export const TrendingSection: React.FC<TrendingSectionProps> = ({
  items,
  onItemPress,
  onSeeAllPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔥 Trending Now</Text>
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemCard}
            onPress={() => onItemPress(item)}
          >
            <View style={[
              styles.itemContainer,
              { borderColor: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }
            ]}>
              <Text style={styles.itemIcon}>{item.icon}</Text>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.priceRow}>
                <Text style={[
                  styles.itemPrice,
                  { color: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }
                ]}>
                  {item.price}
                </Text>
                <Text style={styles.coinIcon}>🪙</Text>
              </View>
              <View style={[
                styles.rarityBadge,
                { backgroundColor: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] + '20' }
              ]}>
                <Text style={[
                  styles.rarityText,
                  { color: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }
                ]}>
                  {item.rarity.toUpperCase()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  seeAll: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingRight: 16,
  },
  itemCard: {
    marginRight: 12,
  },
  itemContainer: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#111827',
    width: 140,
    alignItems: 'center',
    position: 'relative',
  },
  itemIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  coinIcon: {
    fontSize: 12,
    marginLeft: 2,
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
