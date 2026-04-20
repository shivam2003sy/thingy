import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';

interface UserState {
  id: string;
  username: string;
  coins: number;
  level: number;
  xp: number;
  totalWins: number;
  totalLosses: number;
  winStreak: number;
  gamesPlayed: number;
}

interface UserStore extends UserState {
  addCoins: (amount: number) => void;
  addXP: (amount: number) => void;
  recordWin: () => void;
  recordLoss: () => void;
  recordDraw: () => void;
  setUsername: (name: string) => void;
}

const INITIAL: UserState = {
  id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  username: `Player_${Math.floor(Math.random() * 9999)}`,
  coins: 100,
  level: 1,
  xp: 0,
  totalWins: 0,
  totalLosses: 0,
  winStreak: 0,
  gamesPlayed: 0,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      addCoins: amount => set({ coins: get().coins + amount }),

      addXP: amount => {
        const newXP = get().xp + amount;
        set({ xp: newXP, level: Math.floor(newXP / 500) + 1 });
      },

      recordWin: () =>
        set({
          totalWins: get().totalWins + 1,
          winStreak: get().winStreak + 1,
          gamesPlayed: get().gamesPlayed + 1,
        }),

      recordLoss: () =>
        set({
          totalLosses: get().totalLosses + 1,
          winStreak: 0,
          gamesPlayed: get().gamesPlayed + 1,
        }),

      recordDraw: () => set({ gamesPlayed: get().gamesPlayed + 1 }),

      setUsername: username => set({ username }),
    }),
    {
      name: STORAGE_KEYS.USER_STATE,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
