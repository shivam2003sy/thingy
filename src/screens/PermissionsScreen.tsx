import React from 'react';
import { View, Text, Platform, Alert } from 'react-native';
import { Button } from '../components/Button';
import { useUserStore } from '../store/userStore';

interface PermissionsScreenProps {
  onNext: () => void;
}

export const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onNext }) => {
  const setNotifications = useUserStore((state) => state.setNotifications);
  
  const handleEnableNotifications = async () => {
    try {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        setNotifications(true);
        Alert.alert(
          'Notifications Enabled! 🔔',
          "You'll get alerts when rare drops happen",
          [{ text: 'Nice!', onPress: onNext }]
        );
      } else {
        setNotifications(true);
        onNext();
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      onNext();
    }
  };
  
  const handleSkip = () => {
    setNotifications(false);
    onNext();
  };
  
  return (
    <View className="flex-1 bg-black items-center justify-center px-6">
      <Text className="text-8xl mb-8">🔔</Text>
      
      <Text className="text-white font-bold text-3xl text-center mb-4">
        We'll alert you when something insanely rare drops
      </Text>
      
      <Text className="text-gray-400 text-lg text-center mb-12">
        Don't miss out on legendary items 👀
      </Text>
      
      <View className="w-full gap-4">
        <Button
          title="Yes, I want the drops 🔥"
          onPress={handleEnableNotifications}
          variant="primary"
        />
        
        <Button
          title="Nah, I'll miss out"
          onPress={handleSkip}
          variant="ghost"
        />
      </View>
      
      <Text className="text-gray-600 text-xs text-center mt-8">
        You can change this later in settings
      </Text>
    </View>
  );
};
