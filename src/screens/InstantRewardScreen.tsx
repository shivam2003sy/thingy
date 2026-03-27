import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Button } from '../components/Button';
import { ProgressBar } from '../components/ProgressBar';
import { CoinAnimation } from '../components/CoinAnimation';
import { ConfettiAnimation } from '../components/ConfettiAnimation';
import { useUserStore } from '../store/userStore';

interface InstantRewardScreenProps {
  onNext: () => void;
}

export const InstantRewardScreen: React.FC<InstantRewardScreenProps> = ({ onNext }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const coins = useUserStore((state) => state.coins);
  const level = useUserStore((state) => state.level);
  const xp = useUserStore((state) => state.xp);
  const addCoins = useUserStore((state) => state.addCoins);
  const addXP = useUserStore((state) => state.addXP);
  
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setShowAnimation(true);
      addCoins(500);
      addXP(50);
    }, 500);
    
    const timer2 = setTimeout(() => {
      setShowConfetti(true);
    }, 1000);
    
    const timer3 = setTimeout(() => {
      setShowAnimation(false);
      setShowConfetti(false);
    }, 3500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);
  
  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      {showAnimation && <CoinAnimation count={30} duration={2500} />}
      {showConfetti && <ConfettiAnimation count={60} duration={3000} />}
      
      <Text className="text-8xl mb-8">💰</Text>
      
      <Text className="text-white font-bold text-4xl text-center mb-4">
        You got 500 chaos coins
      </Text>
      
      <Text className="text-gray-400 text-xl text-center mb-12">
        ...just for existing 💀
      </Text>
      
      <View className="w-full bg-gray-900 rounded-3xl p-6 mb-8">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white font-bold text-lg">Level {level}</Text>
          <Text className="text-purple-400 font-semibold">
            {coins} coins
          </Text>
        </View>
        
        <ProgressBar
          current={xp % 100}
          max={100}
          label="XP Progress"
          showPercentage
        />
        
        <Text className="text-gray-500 text-sm text-center mt-3">
          {100 - (xp % 100)} XP to Level {level + 1}
        </Text>
      </View>
      
      <Button
        title="Let's Go! 🔥"
        onPress={onNext}
        variant="primary"
        className="w-full"
      />
    </View>
  );
};
