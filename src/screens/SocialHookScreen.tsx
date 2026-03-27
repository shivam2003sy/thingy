import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Button } from '../components/Button';
import { MOCK_LEADERBOARD } from '../utils/mockData';

interface SocialHookScreenProps {
  onNext: () => void;
}

export const SocialHookScreen: React.FC<SocialHookScreenProps> = ({ onNext }) => {
  return (
    <View className="flex-1 bg-black">
      <ScrollView className="flex-1 px-6 pt-16" showsVerticalScrollIndicator={false}>
        <Text className="text-white font-bold text-3xl mb-2">
          People are already flexing 👇
        </Text>
        <Text className="text-gray-400 text-base mb-8">
          Live activity from the chaos zone
        </Text>
        
        <View className="gap-3 mb-24">
          {MOCK_LEADERBOARD.map((user, index) => (
            <View
              key={index}
              className="bg-gray-900 rounded-2xl p-4 border-2 border-gray-800 flex-row items-center"
            >
              <Text className="text-4xl mr-4">{user.emoji}</Text>
              <View className="flex-1">
                <Text className="text-white font-semibold text-base">
                  {user.username}
                </Text>
                <Text className="text-gray-400 text-sm">
                  {user.action} "{user.item}"
                </Text>
              </View>
              <Text className="text-purple-400 font-bold text-xs">LIVE</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      
      <View className="px-6 pb-8">
        <Text className="text-center text-gray-400 text-lg mb-4">
          Wanna beat them?
        </Text>
        <Button
          title="Hell Yeah 💪"
          onPress={onNext}
          variant="primary"
        />
      </View>
    </View>
  );
};
