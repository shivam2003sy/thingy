import React, { useEffect, useState } from 'react';
import { View, Text, Share, Platform } from 'react-native';
import { Button } from '../components/Button';
import { ConfettiAnimation } from '../components/ConfettiAnimation';
import { Badge } from '../components/Badge';
import { Product } from '../types';
import { useUserStore } from '../store/userStore';
import { BADGES } from '../utils/mockData';

interface RewardLoopScreenProps {
  product: Product;
  onComplete: () => void;
}

export const RewardLoopScreen: React.FC<RewardLoopScreenProps> = ({ product, onComplete }) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const addCoins = useUserStore((state) => state.addCoins);
  const addXP = useUserStore((state) => state.addXP);
  const unlockBadge = useUserStore((state) => state.unlockBadge);
  
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setShowConfetti(true);
      addCoins(100);
      addXP(25);
    }, 300);
    
    const timer2 = setTimeout(() => {
      unlockBadge('certified-weird');
      setShowBadge(true);
    }, 1500);
    
    const timer3 = setTimeout(() => {
      setShowConfetti(false);
    }, 3500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);
  
  const handleShare = async () => {
    try {
      const message = `Just copped "${product.name}" ${product.emoji} on Thingy! This app is unhinged 💀`;
      
      if (Platform.OS === 'web') {
        console.log('Share:', message);
      } else {
        await Share.share({
          message,
          title: 'Check out my chaos purchase!',
        });
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };
  
  const certifiedWeirdBadge = BADGES.find((b) => b.id === 'certified-weird');
  
  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      {showConfetti && <ConfettiAnimation count={80} duration={3000} />}
      
      <Text className="text-white font-bold text-3xl text-center mb-8">
        This is too good not to post 💀
      </Text>
      
      <View className="w-full bg-gray-900 rounded-3xl p-8 border-2 border-purple-500 items-center mb-6">
        <Text className="text-8xl mb-4">{product.emoji}</Text>
        
        <Text className="text-white font-bold text-2xl text-center mb-2">
          {product.name}
        </Text>
        
        <View className="bg-purple-500/20 border border-purple-500 rounded-full px-4 py-2 mt-3">
          <Text className="text-purple-400 font-bold">+100 COINS 💰</Text>
        </View>
        
        <View className="bg-pink-500/20 border border-pink-500 rounded-full px-4 py-2 mt-2">
          <Text className="text-pink-400 font-bold">+25 XP ⚡</Text>
        </View>
      </View>
      
      {showBadge && certifiedWeirdBadge && (
        <View className="w-full mb-6">
          <Text className="text-yellow-400 font-bold text-center mb-3">
            🎉 Badge Unlocked! 🎉
          </Text>
          <Badge badge={certifiedWeirdBadge} unlocked animate />
        </View>
      )}
      
      <View className="w-full gap-4 mt-4">
        <Button
          title="Share to Instagram 📸"
          onPress={handleShare}
          variant="primary"
        />
        
        <Button
          title="Share to Snapchat 👻"
          onPress={handleShare}
          variant="secondary"
        />
        
        <Button
          title="Nah, keep it secret 🤫"
          onPress={onComplete}
          variant="ghost"
        />
      </View>
    </View>
  );
};
