import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
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
  isOnboarded: boolean;
  initialize: () => void;
  signInWithGoogle: () => Promise<void>;
  handleOAuthCallback: (url: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateTokens: (delta: number) => void;
  updateStats: (delta: Partial<Pick<AuthUser, 'totalWins' | 'winStreak' | 'gamesPlayed' | 'xp' | 'coins'>>) => void;
  setOnboarded: () => void;
  refreshProfile: () => Promise<void>;
}

const SIGNUP_BONUS = 1000;
// Deep link scheme — must match AndroidManifest.xml and Info.plist
export const OAUTH_REDIRECT = 'thingy://auth/callback';

async function buildUserFromSupabase(supabaseUser: any): Promise<AuthUser> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', supabaseUser.id)
    .single();

  const isNew = !profile;

  if (isNew) {
    const username =
      supabaseUser.user_metadata?.full_name?.replace(/\s+/g, '_') ??
      `Player_${Math.floor(Math.random() * 9999)}`;
    await supabase.from('profiles').insert({
      id: supabaseUser.id,
      username,
      tokens: SIGNUP_BONUS,
    });
    try { await supabase.rpc('grant_signup_bonus', { p_user_id: supabaseUser.id }); } catch { /* ok */ }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      username,
      avatarUrl: supabaseUser.user_metadata?.avatar_url,
      isGuest: false,
      tokens: SIGNUP_BONUS,
      coins: 100,
      level: 1,
      xp: 0,
      totalWins: 0,
      winStreak: 0,
      gamesPlayed: 0,
    };
  }

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    username: profile.username,
    avatarUrl: supabaseUser.user_metadata?.avatar_url,
    isGuest: false,
    tokens: profile.tokens ?? SIGNUP_BONUS,
    coins: profile.coins ?? 100,
    level: profile.level ?? 1,
    xp: profile.xp ?? 0,
    totalWins: profile.total_wins ?? 0,
    winStreak: profile.win_streak ?? 0,
    gamesPlayed: profile.games_played ?? 0,
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isOnboarded: false,

      // ── Initialize: subscribe to Supabase auth events ───────────────────────
      // This is the single source of truth — fires on deep link, session restore,
      // or any other auth state change. Call once on app startup.
      initialize: () => {
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            // Guard: don't rebuild if we already have this user
            if (get().user?.id === session.user.id) {
              set({ isLoading: false });
              return;
            }
            try {
              const authUser = await buildUserFromSupabase(session.user);
              set({ user: authUser, isLoading: false });
            } catch {
              set({ isLoading: false });
            }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, isLoading: false });
          } else if (event === 'TOKEN_REFRESHED' && session?.user && get().user) {
            // Keep tokens fresh silently
          } else {
            set({ isLoading: false });
          }
        });
      },

      // ── Step 1: open Google OAuth in browser ────────────────────────────────
      signInWithGoogle: async () => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: OAUTH_REDIRECT,
              skipBrowserRedirect: true, // we open manually via Linking
            },
          });
          if (error) throw error;
          if (!data?.url) throw new Error('No OAuth URL returned from Supabase');

          // Opens Google sign-in page in the device browser
          await Linking.openURL(data.url);
          // Loading stays true until handleOAuthCallback is called
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      // ── Step 2: called when browser redirects back to thingy://auth/callback ─
      handleOAuthCallback: async (url: string) => {
        try {
          // URL looks like: thingy://auth/callback#access_token=...&refresh_token=...
          const fragment = url.split('#')[1] ?? url.split('?')[1] ?? '';
          const params = new URLSearchParams(fragment);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token') ?? '';

          if (!access_token) {
            console.warn('[Auth] No access_token in callback URL');
            set({ isLoading: false });
            return;
          }

          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
          if (!data.user) throw new Error('No user in session');

          const authUser = await buildUserFromSupabase(data.user);
          set({ user: authUser, isOnboarded: false, isLoading: false });
        } catch (err) {
          console.error('[Auth] OAuth callback error:', err);
          set({ isLoading: false });
          throw err;
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
      partialize: (state) => ({ user: state.user, isOnboarded: state.isOnboarded }),
    },
  ),
);
