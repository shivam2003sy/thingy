import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserState, PersonalityType, Product, Badge } from '../types';
import { BADGES } from '../utils/mockData';

interface UserStore extends UserState {
  setPersonality: (personality: PersonalityType) => void;
  addCoins: (amount: number) => void;
  addXP: (amount: number) => void;
  addProduct: (product: Product) => void;
  unlockBadge: (badgeId: string) => void;
  completeOnboarding: () => void;
  setNotifications: (enabled: boolean) => void;
  resetUser: () => void;
}

const initialState: UserState = {
  id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  hasCompletedOnboarding: false,
  coins: 0,
  level: 1,
  xp: 0,
  badges: [],
  inventory: [],
  notificationsEnabled: false,
  isGuest: true,
  createdAt: new Date(),
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setPersonality: (personality) => {
        set({ personality });
      },
      
      addCoins: (amount) => {
        set((state) => ({ coins: state.coins + amount }));
      },
      
      addXP: (amount) => {
        set((state) => {
          const newXP = state.xp + amount;
          const newLevel = Math.floor(newXP / 100) + 1;
          return { xp: newXP, level: newLevel };
        });
      },
      
      addProduct: (product) => {
        set((state) => ({
          inventory: [...state.inventory, product],
        }));
      },
      
      unlockBadge: (badgeId) => {
        const badge = BADGES.find((b) => b.id === badgeId);
        if (badge && !get().badges.find((b) => b.id === badgeId)) {
          set((state) => ({
            badges: [...state.badges, { ...badge, unlockedAt: new Date() }],
          }));
        }
      },
      
      completeOnboarding: () => {
        set({ hasCompletedOnboarding: true });
      },
      
      setNotifications: (enabled) => {
        set({ notificationsEnabled: enabled });
      },
      
      resetUser: () => {
        set({
          ...initialState,
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        });
      },
    }),
    {
      name: '@thingy_user_state',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
