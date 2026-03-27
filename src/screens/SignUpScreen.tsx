import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '../components/Button';

interface SignUpScreenProps {
  onNext: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNext }) => {
  const handleGuestContinue = () => {
    onNext();
  };
  
  const handleGoogleLogin = () => {
    console.log('Google login - to be implemented');
    onNext();
  };
  
  const handleAppleLogin = () => {
    console.log('Apple login - to be implemented');
    onNext();
  };
  
  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      <Text className="text-8xl mb-8">🎭</Text>
      
      <Text className="text-white font-bold text-3xl text-center mb-4">
        Claim your chaos account
      </Text>
      
      <Text className="text-gray-400 text-lg text-center mb-12">
        Save your progress & flex on the leaderboard
      </Text>
      
      <View className="w-full gap-4">
        <Button
          title="Continue as Guest ✨"
          onPress={handleGuestContinue}
          variant="primary"
        />
        
        <Button
          title="Sign in with Google"
          onPress={handleGoogleLogin}
          variant="secondary"
        />
        
        <Button
          title="Sign in with Apple"
          onPress={handleAppleLogin}
          variant="secondary"
        />
      </View>
      
      <Text className="text-gray-600 text-xs text-center mt-8">
        Guest mode: Your data stays on this device
      </Text>
    </View>
  );
};
