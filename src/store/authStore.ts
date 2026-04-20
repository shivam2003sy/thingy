import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

export interface AuthUser {
  id: string;
  email?: string;
  username: string;
  avatarUrl?: string;
  isGuest: boolean;
  tokens: number;
  coins: number;
  level: number;
  xp: number;
  totalWins: number;
  winStreak: number;
  gamesPlayed: number;
}

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  isOnboarded: boolean;           // shown welcome + token gift screen?
  signInWithGoogle: (idToken: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  updateTokens: (delta: number) => void;
  updateStats: (delta: Partial<Pick<AuthUser, 'totalWins' | 'winStreak' | 'gamesPlayed' | 'xp' | 'coins'>>) => void;
  setOnboarded: () => void;
  refreshProfile: () => Promise<void>;
}

const SIGNUP_BONUS = 1000; // free tokens for new users

function guestUser(): AuthUser {
  return {
    id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    username: `Player_${Math.floor(Math.random() * 9999)}`,
    isGuest: true,
    tokens: SIGNUP_BONUS,
    coins: 100,
    level: 1,
    xp: 0,
    totalWins: 0,
    winStreak: 0,
    gamesPlayed: 0,
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isOnboarded: false,

      signInWithGoogle: async (idToken: string) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });
          if (error) throw error;

          const su = data.user;
          if (!su) throw new Error('No user returned');

          // Fetch or create profile in DB
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', su.id)
            .single();

          const isNew = !profile;
          if (isNew) {
            const username = su.user_metadata?.full_name?.replace(/\s+/g, '_') ??
              `Player_${Math.floor(Math.random() * 9999)}`;
            await supabase.from('profiles').insert({
              id: su.id,
              username,
              tokens: SIGNUP_BONUS,
            });
            try { await supabase.rpc('grant_signup_bonus', { p_user_id: su.id }); } catch { /* ignore */ }
          }

          const p = profile ?? { username: su.user_metadata?.full_name ?? 'Player', tokens: SIGNUP_BONUS };
          set({
            user: {
              id: su.id,
              email: su.email,
              username: p.username,
              avatarUrl: su.user_metadata?.avatar_url,
              isGuest: false,
              tokens: p.tokens ?? SIGNUP_BONUS,
              coins: p.coins ?? 100,
              level: p.level ?? 1,
              xp: p.xp ?? 0,
              totalWins: p.total_wins ?? 0,
              winStreak: p.win_streak ?? 0,
              gamesPlayed: p.games_played ?? 0,
            },
            isOnboarded: !isNew,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      continueAsGuest: async () => {
        set({ isLoading: true });
        try {
          const guest = guestUser();
          set({ user: guest, isOnboarded: false });
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        await supabase.auth.signOut().catch(() => {});
        set({ user: null, isOnboarded: false });
      },

      updateTokens: (delta) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, tokens: Math.max(0, user.tokens + delta) } });
      },

      updateStats: (delta) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, ...delta } });
      },

      setOnboarded: () => set({ isOnboarded: true }),

      refreshProfile: async () => {
        const { user } = get();
        if (!user || user.isGuest) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          set({
            user: {
              ...user,
              tokens: data.tokens,
              coins: data.coins,
              level: data.level,
              xp: data.xp,
              totalWins: data.total_wins,
              winStreak: data.win_streak,
              gamesPlayed: data.games_played,
            },
          });
        }
      },
    }),
    {
      name: '@thingy_auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
