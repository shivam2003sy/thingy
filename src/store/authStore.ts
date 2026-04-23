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

async function buildUserFromSupabase(supabaseUser: any): Promise<AuthUser> {
  console.log('[Auth] buildUserFromSupabase - user ID:', supabaseUser.id);
  
  try {
    // Add timeout to prevent infinite hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
    );
    
    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
    
    console.log('[Auth] Fetching profile from database...');
    const { data: profile, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]) as any;
    console.log('[Auth] Profile fetch complete - found:', !!profile, 'error:', fetchError?.code);

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[Auth] Error fetching profile:', fetchError);
    }

    const isNew = !profile;
    console.log('[Auth] Is new user:', isNew);

  if (isNew) {
    const username =
      supabaseUser.user_metadata?.full_name?.replace(/\s+/g, '_') ??
      `Player_${Math.floor(Math.random() * 9999)}`;
    
    console.log('[Auth] Creating new profile with username:', username);
    const { error: insertError } = await supabase.from('profiles').insert({
      id: supabaseUser.id,
      username,
      tokens: SIGNUP_BONUS,
    });
    
    if (insertError) {
      console.error('[Auth] Error creating profile:', insertError);
      throw insertError;
    }
    
    console.log('[Auth] Profile created successfully');
    try { await supabase.rpc('grant_signup_bonus', { p_user_id: supabaseUser.id }); } catch (e) { 
      console.log('[Auth] grant_signup_bonus RPC failed (ok):', e); 
    }

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

    console.log('[Auth] Returning existing profile for user:', profile.username);
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
  } catch (error) {
    console.error('[Auth] buildUserFromSupabase failed:', error);
    // Return a minimal user object to prevent app from hanging
    console.log('[Auth] Creating fallback user object');
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      username: supabaseUser.user_metadata?.full_name?.replace(/\s+/g, '_') ?? `Player_${Math.floor(Math.random() * 9999)}`,
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
}

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

          // Handle both SIGNED_IN and INITIAL_SESSION (session restored on app open)
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
            // Skip if we already have this exact user loaded
            if (get().user?.id === session.user.id) {
              set({ isLoading: false, isInitialized: true });
              return;
            }
            try {
              const authUser = await buildUserFromSupabase(session.user);
              set({ user: authUser, isLoading: false, isInitialized: true });
            } catch (err) {
              console.error('[Auth] buildUser failed:', err);
              set({ isLoading: false, isInitialized: true });
            }
          } else if (event === 'SIGNED_OUT') {
            set({ user: null, isLoading: false, isInitialized: true });
          } else if (event === 'INITIAL_SESSION') {
            // INITIAL_SESSION with no session
            set({ isLoading: false, isInitialized: true });
          } else {
            // TOKEN_REFRESHED, etc.
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
            console.log('[Auth] Waiting for onAuthStateChange to fire...');
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
