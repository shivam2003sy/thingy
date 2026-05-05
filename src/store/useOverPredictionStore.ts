import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Match {
  id: string;
  match_name: string;
  team1_name: string;
  team1_short: string;
  team1_score: number;
  team1_wickets: number;
  team1_overs: number;
  team2_name: string;
  team2_short: string;
  team2_score: number;
  team2_wickets: number;
  team2_overs: number;
  striker: string;
  bowler: string;
  is_live: boolean;
}

interface PredictionWindow {
  match_id: string;
  over_number: number;
  countdown_seconds: number;
  ends_at: string;
  match_name: string;
  team1: any;
  team2: any;
  striker: string;
  bowler: string;
}

interface LiveStats {
  balls: string[];
  runs: number;
  wickets: number;
  fours: number;
  sixes: number;
  extras: number;
  dots: number;
}

interface OverResult {
  match_id: string;
  over_number: number;
  balls: string[];
  stats: LiveStats;
}

interface UserPredictionResult {
  predictionId: string;
  won: boolean;
  tokensWon: number;
  mult: number;
}

interface OverPredictionStore {
  // State
  liveMatches: Match[];
  currentMatch: Match | null;
  predictionWindow: PredictionWindow | null;
  liveStats: LiveStats | null;
  overResult: OverResult | null;
  userResults: UserPredictionResult[];
  totalWon: number;
  isWindowOpen: boolean;
  isLocked: boolean;
  selectedPredictions: Set<string>;
  tokensBet: number;

  // Realtime
  channel: RealtimeChannel | null;

  // Actions
  fetchLiveMatches: () => Promise<void>;
  subscribeToMatch: (matchId: string) => void;
  unsubscribe: () => void;
  selectPrediction: (predictionId: string) => void;
  deselectPrediction: (predictionId: string) => void;
  setTokensBet: (amount: number) => void;
  submitPredictions: (userId: string, username: string) => Promise<void>;
  fetchUserResults: (matchId: string, overNumber: number, userId: string) => Promise<void>;
  clearResults: () => void;
}

export const useOverPredictionStore = create<OverPredictionStore>((set, get) => ({
  // Initial state
  liveMatches: [],
  currentMatch: null,
  predictionWindow: null,
  liveStats: null,
  overResult: null,
  userResults: [],
  totalWon: 0,
  isWindowOpen: false,
  isLocked: false,
  selectedPredictions: new Set(),
  tokensBet: 20,
  channel: null,

  // Fetch live matches
  fetchLiveMatches: async () => {
    const { data, error } = await supabase
      .from('ipl_matches')
      .select('*')
      .eq('is_live', true);

    if (!error && data) {
      set({ liveMatches: data });
    }
  },

  // Subscribe to match broadcasts
  subscribeToMatch: (matchId: string) => {
    const { channel: existingChannel } = get();
    
    // Unsubscribe from existing channel
    if (existingChannel) {
      existingChannel.unsubscribe();
    }

    // Create new channel
    const channel = supabase.channel('over-predictions');

    // Listen to broadcast events
    channel
      .on('broadcast', { event: 'prediction_window_open' }, ({ payload }) => {
        if (__DEV__) console.log('[OverPrediction] Window opened:', payload);
        if (payload.match_id === matchId) {
          set({
            predictionWindow: payload,
            isWindowOpen: true,
            isLocked: false,
            selectedPredictions: new Set(),
            liveStats: null,
            overResult: null,
          });
        }
      })
      .on('broadcast', { event: 'prediction_window_locked' }, ({ payload }) => {
        if (__DEV__) console.log('[OverPrediction] Window locked:', payload);
        if (payload.match_id === matchId) {
          set({ isLocked: true, isWindowOpen: false });
        }
      })
      .on('broadcast', { event: 'ball_update' }, ({ payload }) => {
        if (__DEV__) console.log('[OverPrediction] Ball update:', payload);
        if (payload.match_id === matchId) {
          set({
            liveStats: payload.live_stats,
            currentMatch: get().currentMatch ? {
              ...get().currentMatch!,
              team1_score: payload.match_score?.score || get().currentMatch!.team1_score,
              team1_wickets: payload.match_score?.wickets || get().currentMatch!.team1_wickets,
              team1_overs: payload.match_score?.overs || get().currentMatch!.team1_overs,
            } : null,
          });
        }
      })
      .on('broadcast', { event: 'over_complete' }, ({ payload }) => {
        if (__DEV__) console.log('[OverPrediction] Over complete:', payload);
        if (payload.match_id === matchId) {
          set({
            overResult: payload,
            isLocked: false,
            isWindowOpen: false,
            liveStats: null,
          });
          // Fetch this user's payout results
          const { fetchUserResults } = get();
          supabase.auth.getUser().then(({ data }) => {
            if (data?.user?.id) {
              fetchUserResults(matchId, payload.over_number, data.user.id);
            }
          });
        }
      })
      .subscribe((status) => {
        if (__DEV__) console.log('[OverPrediction] Channel status:', status);
      });

    set({ channel });

    // Fetch current match data
    supabase
      .from('ipl_matches')
      .select('*')
      .eq('id', matchId)
      .single()
      .then(({ data }) => {
        if (data) {
          set({ currentMatch: data });
        }
      });

    // Check for existing active session
    supabase
      .from('over_sessions')
      .select('*')
      .eq('match_id', matchId)
      .in('status', ['countdown', 'locked', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          if (data.status === 'countdown') {
            set({
              isWindowOpen: true,
              isLocked: false,
              predictionWindow: {
                match_id: matchId,
                over_number: data.over_number,
                countdown_seconds: Math.max(0, Math.ceil((new Date(data.countdown_ends_at).getTime() - Date.now()) / 1000)),
                ends_at: data.countdown_ends_at,
                match_name: get().currentMatch?.match_name || '',
                team1: {},
                team2: {},
                striker: '',
                bowler: '',
              },
            });
          } else if (data.status === 'locked' || data.status === 'in_progress') {
            set({ isLocked: true, isWindowOpen: false });
            
            // Fetch balls for this over
            supabase
              .from('over_balls')
              .select('*')
              .eq('match_id', matchId)
              .eq('over_number', data.over_number)
              .order('ball_number')
              .then(({ data: balls }) => {
                if (balls) {
                  const legalBalls = balls.filter((b: any) => !b.is_extra);
                  const stats = {
                    balls: legalBalls.map((b: any) => b.outcome_type),
                    runs: balls.reduce((sum: number, b: any) => sum + b.runs, 0),
                    wickets: balls.filter((b: any) => b.is_wicket).length,
                    fours: balls.filter((b: any) => b.outcome_type === 'four').length,
                    sixes: balls.filter((b: any) => b.outcome_type === 'six').length,
                    extras: balls.filter((b: any) => b.is_extra).length,
                    dots: balls.filter((b: any) => b.outcome_type === 'dot').length,
                  };
                  set({ liveStats: stats });
                }
              });
          }
        }
      });
  },

  // Unsubscribe from channel
  unsubscribe: () => {
    const { channel } = get();
    if (channel) {
      channel.unsubscribe();
      set({ channel: null });
    }
  },

  // Select prediction
  selectPrediction: (predictionId: string) => {
    const { selectedPredictions } = get();
    if (selectedPredictions.size < 5) {
      const newSet = new Set(selectedPredictions);
      newSet.add(predictionId);
      set({ selectedPredictions: newSet });
    }
  },

  // Deselect prediction
  deselectPrediction: (predictionId: string) => {
    const { selectedPredictions } = get();
    const newSet = new Set(selectedPredictions);
    newSet.delete(predictionId);
    set({ selectedPredictions: newSet });
  },

  // Set tokens bet
  setTokensBet: (amount: number) => {
    set({ tokensBet: amount });
  },

  // Submit predictions
  submitPredictions: async (userId: string, _username: string) => {
    const { selectedPredictions, tokensBet, predictionWindow } = get();

    if (!predictionWindow || selectedPredictions.size === 0) return;

    try {
      // Build predictions array with explicit UUID casting
      const predictions = Array.from(selectedPredictions).map(predictionId => ({
        match_id: predictionWindow.match_id,
        over_number: predictionWindow.over_number,
        user_id: userId,
        prediction_id: predictionId,
        tokens_bet: tokensBet,
      }));

      if (__DEV__) console.log('[OverPrediction] Submitting predictions:', {
        count: predictions.length,
        match_id: predictionWindow.match_id,
        user_id: userId,
        over_number: predictionWindow.over_number,
      });

      // Try using raw SQL with explicit UUID casting
      const { error } = await supabase.rpc('submit_over_predictions', {
        p_predictions: predictions,
      });

      if (error) {
        // Fallback to direct insert if RPC doesn't exist
        if (__DEV__) console.log('[OverPrediction] RPC failed, trying direct insert:', error.message);
        
        const { error: insertError } = await supabase
          .from('over_predictions')
          .insert(predictions);

        if (insertError) {
          if (__DEV__) console.error('[OverPrediction] Error submitting predictions:', insertError);
          return;
        }
      }

      if (__DEV__) console.log('[OverPrediction] Predictions submitted successfully');
      set({ isLocked: true, isWindowOpen: false });
    } catch (err) {
      if (__DEV__) console.error('[OverPrediction] Exception submitting predictions:', err);
    }
  },

  // Fetch user's prediction results for a completed over
  fetchUserResults: async (matchId: string, overNumber: number, userId: string) => {
    // Wait briefly for calculateOverResults to finish settling payouts
    await new Promise<void>(resolve => setTimeout(resolve, 2000));

    const { data: rows } = await supabase
      .from('over_predictions')
      .select('prediction_id, won, tokens_won, tokens_bet, difficulty')
      .eq('match_id', matchId)
      .eq('over_number', overNumber)
      .eq('user_id', userId);

    if (!rows) return;

    const MULT: Record<string, number> = {
      easy: 2, medium: 5, hard: 10, expert: 20,
    };

    const userResults: UserPredictionResult[] = rows.map((r: any) => ({
      predictionId: r.prediction_id,
      won: r.won,
      tokensWon: r.tokens_won ?? 0,
      mult: MULT[r.difficulty] ?? 2,
    }));

    const totalWon = userResults.reduce((sum, r) => sum + (r.won ? r.tokensWon : 0), 0);
    set({ userResults, totalWon });

    // Refresh auth profile so token balance in header updates immediately
    const { useAuthStore } = await import('./authStore');
    useAuthStore.getState().refreshProfile();
  },

  // Clear results
  clearResults: () => {
    set({ overResult: null, userResults: [], totalWon: 0 });
  },
}));
