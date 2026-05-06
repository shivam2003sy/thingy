import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import InAppBrowser from 'react-native-inappbrowser-reborn';
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
  isInitialized: boolean;
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


export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isInitialized: false,
      isOnboarded: false,

      // ── Initialize: subscribe to Supabase auth events ───────────────────────
      initialize: () => {
        supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('[Auth] onAuthStateChange:', event, !!session?.user);

          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
            if (get().user?.id === session.user.id) {
              set({ isLoading: false, isInitialized: true });
              setTimeout(() => get().refreshProfile(), 500);
              return;
            }
            // Don't await a DB call here — onAuthStateChange fires mid-setSession,
            // so the auth headers aren't committed yet and the query hangs.
            // Instead, set user immediately from JWT metadata and load real DB
            // values in the background once setSession fully resolves.
            const meta = session.user.user_metadata ?? {};
            set({
              user: {
                id: session.user.id,
                email: session.user.email,
                username: meta.full_name?.replace(/\s+/g, '_') ?? `Player_${Math.floor(Math.random() * 9999)}`,
                avatarUrl: meta.avatar_url,
                isGuest: false,
                tokens: SIGNUP_BONUS,
                coins: 100,
                level: 1,
                xp: 0,
                totalWins: 0,
                winStreak: 0,
                gamesPlayed: 0,
              },
              isLoading: false,
              isInitialized: true,
            });
            setTimeout(() => get().refreshProfile(), 1000);
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, isLoading: false, isInitialized: true });
          } else if (event === 'INITIAL_SESSION') {
            set({ isLoading: false, isInitialized: true });
          } else {
            set({ isLoading: false });
          }
        });
      },

      // ── Step 1: open Google OAuth in browser ────────────────────────────────
      signInWithGoogle: async () => {
        set({ isLoading: true });
        try {
          console.log('[Auth] Requesting OAuth with redirectTo:', OAUTH_REDIRECT);
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: OAUTH_REDIRECT,
              skipBrowserRedirect: true,
              // queryParams: { prompt: 'select_account' },
            },
          });
          if (error) throw error;
          if (!data?.url) throw new Error('No OAuth URL returned from Supabase');
          console.log('[Auth] OAuth URL:', data.url.substring(0, 150));
          
          // Use InAppBrowser for better deep link handling
          if (await InAppBrowser.isAvailable()) {
            const result = await InAppBrowser.openAuth(data.url, OAUTH_REDIRECT, {
              ephemeralWebSession: false,
              showTitle: false,
              enableUrlBarHiding: true,
              enableDefaultShare: false,
            });
            console.log('[Auth] InAppBrowser result:', result.type);
            
            // Don't call handleOAuthCallback here - the Linking.addEventListener will catch it
            if (result.type === 'cancel') {
              console.log('[Auth] User cancelled OAuth');
              set({ isLoading: false });
            } else if (result.type !== 'success') {
              console.log('[Auth] OAuth failed:', result.type);
              set({ isLoading: false });
            }
            // If success, the deep link listener in AppNavigator will handle it
          } else {
            // Fallback to regular browser
            await Linking.openURL(data.url);
          }
          // isLoading stays true — onAuthStateChange will clear it when SIGNED_IN fires
        } catch (err) {
          console.error('[Auth] signInWithGoogle error:', err);
          set({ isLoading: false });
          throw err;
        }
      },

      // ── Step 2: extract tokens from deep link and hand to Supabase ──────────
      // onAuthStateChange handles the rest — no user-building here to avoid race
      handleOAuthCallback: async (url: string) => {
        try {
          console.log('[Auth] ========== OAUTH CALLBACK START ==========');
          console.log('[Auth] Full URL:', url);
          console.log('[Auth] Current state - user:', get().user?.id, 'isLoading:', get().isLoading, 'isInitialized:', get().isInitialized);
          
          const fragment = url.split('#')[1] ?? url.split('?')[1] ?? '';
          console.log('[Auth] Fragment:', fragment.substring(0, 100));
          
          const params = new URLSearchParams(fragment);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token') ?? '';
          const error_param = params.get('error');
          const error_description = params.get('error_description');

          if (error_param) {
            console.error('[Auth] OAuth error in URL:', error_param, error_description);
            set({ isLoading: false });
            return;
          }

          if (!access_token) {
            console.warn('[Auth] No access_token in callback URL');
            console.warn('[Auth] Available params:', Array.from(params.keys()).join(', '));
            set({ isLoading: false });
            return;
          }

          console.log('[Auth] Tokens found - access_token length:', access_token.length, 'has refresh_token:', !!refresh_token);
          
          // setSession triggers onAuthStateChange(SIGNED_IN) which builds the user
          console.log('[Auth] Calling setSession...');
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
          
          if (error) {
            console.error('[Auth] setSession error:', error.message, error);
            set({ isLoading: false });
          } else {
            console.log('[Auth] setSession SUCCESS - session user:', data?.session?.user?.id);
            // onAuthStateChange fires during setSession (before it resolves), so the
            // profile fetch inside buildUserFromSupabase races against auth header
            // propagation and often times out. Refresh the real profile now that the
            // session is fully committed.
            setTimeout(() => get().refreshProfile(), 500);
          }
        } catch (err) {
          console.error('[Auth] OAuth callback error:', err);
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
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        if (data) {
          set({
            user: {
              ...user,
              username: data.username ?? user.username,
              tokens: data.tokens ?? SIGNUP_BONUS,
              coins: data.coins ?? 100,
              level: data.level ?? 1,
              xp: data.xp ?? 0,
              totalWins: data.total_wins ?? 0,
              winStreak: data.win_streak ?? 0,
              gamesPlayed: data.games_played ?? 0,
            },
          });
          return;
        }

        // No profile found → new user. Create one now (session is fully committed at this point).
        if (error?.code === 'PGRST116') {
          const username = user.username ?? `Player_${Math.floor(Math.random() * 9999)}`;
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            username,
            tokens: SIGNUP_BONUS,
          });
          if (!insertError) {
            try { await supabase.rpc('grant_signup_bonus', { p_user_id: user.id }); } catch (_) {}
            set({ user: { ...user, username, tokens: SIGNUP_BONUS, coins: 100 } });
          }
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
