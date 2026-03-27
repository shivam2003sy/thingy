import { create } from 'zustand';
import { OnboardingState, PersonalityType } from '../types';

interface OnboardingStore extends OnboardingState {
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  setPersonality: (personality: PersonalityType) => void;
  setHasSeenHooks: (seen: boolean) => void;
  setPermissionsGranted: (granted: boolean) => void;
  resetOnboarding: () => void;
}

const initialState: OnboardingState = {
  currentStep: 0,
  hasSeenHooks: false,
  permissionsGranted: false,
};

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...initialState,
  
  setCurrentStep: (step) => {
    set({ currentStep: step });
  },
  
  nextStep: () => {
    set((state) => ({ currentStep: state.currentStep + 1 }));
  },
  
  previousStep: () => {
    set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) }));
  },
  
  setPersonality: (personality) => {
    set({ selectedPersonality: personality });
  },
  
  setHasSeenHooks: (seen) => {
    set({ hasSeenHooks: seen });
  },
  
  setPermissionsGranted: (granted) => {
    set({ permissionsGranted: granted });
  },
  
  resetOnboarding: () => {
    set(initialState);
  },
}));
