import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { getRandomProduct } from '../utils/mockData';
import { Product } from '../types';

interface FirstItemScreenProps {
  onClaim: (product: Product) => void;
  onSkip: () => void;
}

export const FirstItemScreen: React.FC<FirstItemScreenProps> = ({ onClaim, onSkip }) => {
  const [product, setProduct] = useState<Product | null>(null);
  
  useEffect(() => {
    setProduct(getRandomProduct());
  }, []);
  
  if (!product) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      <Text className="text-white font-bold text-3xl text-center mb-2">
        Your first weird item is FREE 👇
      </Text>
      
      <Text className="text-gray-400 text-base text-center mb-8">
        Everyone gets one. It's the law.
      </Text>
      
      <View className="w-full mb-8">
        <View className="bg-gray-900 rounded-3xl p-8 border-2 border-purple-500 items-center">
          <Text className="text-8xl mb-4">{product.emoji}</Text>
          
          <Text className="text-white font-bold text-2xl text-center mb-2">
            {product.name}
          </Text>
          
          <Text className="text-gray-400 text-base text-center mb-4">
            {product.description}
          </Text>
          
          <View className="flex-row items-center gap-2">
            <Text className="text-purple-400 font-bold text-lg">
              {product.rarity.toUpperCase()}
            </Text>
            <Text className="text-gray-600">•</Text>
            <Text className="text-gray-400 line-through">
              {product.price} coins
            </Text>
          </View>
          
          <View className="bg-green-500/20 border border-green-500 rounded-full px-4 py-2 mt-3">
            <Text className="text-green-400 font-bold">FREE 🎁</Text>
          </View>
        </View>
      </View>
      
      <View className="w-full gap-4">
        <Button
          title="Cop it 🔥"
          onPress={() => onClaim(product)}
          variant="primary"
        />
        
        <Button
          title="Skip (boring)"
          onPress={onSkip}
          variant="ghost"
        />
      </View>
    </View>
  );
};
