import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  HookScreens,
  IdentitySelectionScreen,
  InstantRewardScreen,
  SocialHookScreen,
  PermissionsScreen,
  SignUpScreen,
  FirstItemScreen,
  RewardLoopScreen,
} from '../screens';
import { useUserStore } from '../store/userStore';
import { Product } from '../types';

type OnboardingStep =
  | 'hooks'
  | 'identity'
  | 'reward'
  | 'social'
  | 'permissions'
  | 'signup'
  | 'firstItem'
  | 'rewardLoop';

export const OnboardingNavigator: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('hooks');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const navigation = useNavigation();
  
  const completeOnboarding = useUserStore((state) => state.completeOnboarding);
  const addProduct = useUserStore((state) => state.addProduct);
  const unlockBadge = useUserStore((state) => state.unlockBadge);
  
  const handleComplete = () => {
    completeOnboarding();
    unlockBadge('chaos-starter');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' as never }],
    });
  };
  
  const handleProductClaim = (product: Product) => {
    addProduct(product);
    setSelectedProduct(product);
    setCurrentStep('rewardLoop');
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 'hooks':
        return <HookScreens onComplete={() => setCurrentStep('identity')} />;
      
      case 'identity':
        return <IdentitySelectionScreen onNext={() => setCurrentStep('reward')} />;
      
      case 'reward':
        return <InstantRewardScreen onNext={() => setCurrentStep('social')} />;
      
      case 'social':
        return <SocialHookScreen onNext={() => setCurrentStep('permissions')} />;
      
      case 'permissions':
        return <PermissionsScreen onNext={() => setCurrentStep('signup')} />;
      
      case 'signup':
        return <SignUpScreen onNext={() => setCurrentStep('firstItem')} />;
      
      case 'firstItem':
        return (
          <FirstItemScreen
            onClaim={handleProductClaim}
            onSkip={handleComplete}
          />
        );
      
      case 'rewardLoop':
        return selectedProduct ? (
          <RewardLoopScreen
            product={selectedProduct}
            onComplete={handleComplete}
          />
        ) : null;
      
      default:
        return null;
    }
  };
  
  return <View style={styles.container}>{renderStep()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
