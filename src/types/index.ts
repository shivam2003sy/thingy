export type PersonalityType = 'smart' | 'unhinged' | 'meme' | 'collector';

export interface Personality {
  id: PersonalityType;
  icon: string;
  title: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  icon: string;
  description: string;
  price: number;
  rarity: 'common' | 'rare' | 'legendary';
  imageUrl?: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: Date;
}

export interface LeaderboardUser {
  username: string;
  action: string;
  item: string;
  icon: string;
}

export interface UserState {
  id: string;
  hasCompletedOnboarding: boolean;
  personality?: PersonalityType;
  coins: number;
  level: number;
  xp: number;
  badges: Badge[];
  inventory: Product[];
  notificationsEnabled: boolean;
  isGuest: boolean;
  createdAt: Date;
}

export interface OnboardingState {
  currentStep: number;
  selectedPersonality?: PersonalityType;
  hasSeenHooks: boolean;
  permissionsGranted: boolean;
}

export interface HookScreen {
  id: number;
  title: string;
  icon: string;
  gradient: string[];
}
