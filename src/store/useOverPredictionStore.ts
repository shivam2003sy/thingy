import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { replayBalls, dbRowToEngineBall } from '../services/cricketEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PredictionOption {
  id: string;
  label: string;
  description: string;
  difficulty: 'runs' | 'action' | 'combo' | 'easy' | 'medium' | 'hard' | 'expert';
  multiplier: number;
  category: string;
  is_active: boolean;
  sort_order: number;
}

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
  innings: number;
  over_number: number;
  countdown_seconds: number;
  ends_at: string;
  match_name: string;
  team1: any;
  team2: any;
  batting_team: 'team1' | 'team2';
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
  legal_balls: number;
}

interface OverResult {
  match_id: string;
  over_number: number;
  balls: string[];
  stats: LiveStats;
}

export interface UserPredictionResult {
  predictionId: string;
  won: boolean;
  tokensWon: number;
  mult: number;
}

export type HotPicks = Map<string, number>; // predictionId → pick count

export interface OverHistoryEntry {
  over_number: number;
  balls: string[];
  stats: LiveStats;
  userResults: UserPredictionResult[];
  totalWon: number;
}

interface OverPredictionStore {
  predictionOptions: PredictionOption[];
  optionsLoading: boolean;
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
  channel: RealtimeChannel | null;
  hotPicks: HotPicks;
  hotPicksTotal: number;
  pendingWindow: PredictionWindow | null;
  overHistory: OverHistoryEntry[];

  fetchPredictionOptions: () => Promise<void>;
  fetchLiveMatches: () => Promise<void>;
  subscribeToMatch: (matchId: string) => void;
  unsubscribe: () => void;
  selectPrediction: (predictionId: string) => void;
  deselectPrediction: (predictionId: string) => void;
  setTokensBet: (amount: number) => void;
  submitPredictions: (userId: string, username: string) => Promise<void>;
  fetchUserResults: (matchId: string, overNumber: number, innings: number, userId: string) => Promise<void>;
  fetchHotPicks: (matchId: string, overNumber: number) => Promise<void>;
  clearResults: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useOverPredictionStore = create<OverPredictionStore>((set, get) => ({
  predictionOptions: [],
  optionsLoading: false,
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
  tokensBet: 25,
  channel: null,
  hotPicks: new Map(),
  hotPicksTotal: 0,
  pendingWindow: null,
  overHistory: [],

  // Fetch active prediction options from DB — this is the single source of truth
  // for labels, descriptions, multipliers, and difficulty. No rebuild needed to update.
  fetchPredictionOptions: async () => {
    set({ optionsLoading: true });
    const { data, error } = await supabase
      .from('prediction_options')
      .select('id, label, description, difficulty, multiplier, category, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order');

    if (!error && data) {
      set({
        predictionOptions: data.map((r: any) => ({
          ...r,
          multiplier: parseFloat(r.multiplier),
        })),
      });
    }
    set({ optionsLoading: false });
  },

  fetchLiveMatches: async () => {
    const { data, error } = await supabase.from('ipl_matches').select('*').eq('is_live', true);
    if (!error && data) set({ liveMatches: data });
  },

  subscribeToMatch: (matchId: string) => {
    const { channel: existing } = get();
    if (existing) existing.unsubscribe();

    // Fetch options fresh every time we join a match — admin may have changed them
    get().fetchPredictionOptions();

    const channel = supabase.channel('over-predictions');

    channel
      .on('broadcast', { event: 'prediction_window_open' }, ({ payload }) => {
        if (payload.match_id !== matchId) return;
        const { overResult, predictionWindow } = get();
        const sameInnings = predictionWindow ? predictionWindow.innings === payload.innings : true;
        if (overResult && sameInnings) {
          // Result modal still showing for same innings — park until user dismisses
          set({ pendingWindow: payload });
        } else {
          // Different innings or no result showing — apply immediately, clear any stale result
          set({
            predictionWindow: payload,
            isWindowOpen: true,
            isLocked: false,
            selectedPredictions: new Set(),
            liveStats: null,
            overResult: null,
            userResults: [],
            totalWon: 0,
            hotPicks: new Map(),
            hotPicksTotal: 0,
            pendingWindow: null,
          });
        }
      })
      .on('broadcast', { event: 'prediction_window_locked' }, ({ payload }) => {
        if (payload.match_id !== matchId) return;
        set({ isLocked: true, isWindowOpen: false });
      })
      .on('broadcast', { event: 'ball_update' }, ({ payload }) => {
        if (payload.match_id !== matchId) return;
        const s = payload.live_stats ?? {};
        const liveStats: LiveStats = {
          balls: s.balls ?? [],
          runs: s.runs ?? 0,
          wickets: s.wickets ?? 0,
          fours: s.fours ?? 0,
          sixes: s.sixes ?? 0,
          extras: s.extras ?? 0,
          dots: s.dots ?? 0,
          legal_balls: s.legal_balls ?? 0,
        };
        set({
          liveStats,
          currentMatch: get().currentMatch
            ? { ...get().currentMatch!, ...scoreFromPayload(payload.match_score, get().currentMatch!) }
            : null,
        });
      })
      .on('broadcast', { event: 'over_complete' }, ({ payload }) => {
        if (payload.match_id !== matchId) return;
        set({ overResult: payload, isLocked: false, isWindowOpen: false, liveStats: null });
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user?.id) get().fetchUserResults(matchId, payload.over_number, payload.innings ?? 1, data.user.id);
        });
      })
      .subscribe();

    set({ channel });

    supabase.from('ipl_matches').select('*').eq('id', matchId).single()
      .then(({ data }) => { if (data) set({ currentMatch: data }); });

    // Reconnect: restore state for any in-progress session
    supabase
      .from('over_sessions').select('*').eq('match_id', matchId)
      .in('status', ['countdown', 'locked', 'in_progress'])
      .order('created_at', { ascending: false }).limit(1).single()
      .then(({ data }) => {
        if (!data) return;
        if (data.status === 'countdown') {
          set({
            isWindowOpen: true,
            isLocked: false,
            predictionWindow: {
              match_id: matchId,
              innings: data.innings ?? 1,
              over_number: data.over_number,
              countdown_seconds: Math.max(0, Math.ceil((new Date(data.countdown_ends_at).getTime() - Date.now()) / 1000)),
              ends_at: data.countdown_ends_at,
              match_name: get().currentMatch?.match_name || '',
              team1: {}, team2: {}, batting_team: 'team1', striker: '', bowler: '',
            },
          });
        } else {
          set({ isLocked: true, isWindowOpen: false });
          supabase.from('over_balls').select('*')
            .eq('match_id', matchId).eq('over_number', data.over_number)
            .order('ball_number')
            .then(({ data: balls }) => {
              if (!balls) return;
              const engineState = replayBalls(balls.map((b: any) => dbRowToEngineBall(b)));
              const ls = engineState.live_stats;
              set({
                liveStats: {
                  balls: balls.map((b: any) => b.outcome_type),
                  runs: ls.runs, wickets: ls.wickets, fours: ls.fours,
                  sixes: ls.sixes, extras: ls.extras, dots: ls.dots,
                  legal_balls: engineState.match_score.legal_balls,
                },
              });
            });
        }
      });
  },

  unsubscribe: () => {
    const { channel } = get();
    if (channel) { channel.unsubscribe(); set({ channel: null, overHistory: [], pendingWindow: null }); }
  },

  selectPrediction: (predictionId: string) => {
    const { selectedPredictions } = get();
    if (selectedPredictions.size < 5) {
      set({ selectedPredictions: new Set([...selectedPredictions, predictionId]) });
    }
  },

  deselectPrediction: (predictionId: string) => {
    const next = new Set(get().selectedPredictions);
    next.delete(predictionId);
    set({ selectedPredictions: next });
  },

  setTokensBet: (amount: number) => set({ tokensBet: amount }),

  submitPredictions: async (userId: string, _username: string) => {
    const { selectedPredictions, tokensBet, predictionWindow, predictionOptions } = get();
    if (!predictionWindow || selectedPredictions.size === 0) return;

    const predictions = Array.from(selectedPredictions).map(predictionId => {
      const opt = predictionOptions.find(o => o.id === predictionId);
      return {
        match_id: predictionWindow.match_id,
        innings: predictionWindow.innings ?? 1,
        over_number: predictionWindow.over_number,
        user_id: userId,
        prediction_id: predictionId,
        difficulty: opt?.difficulty ?? 'easy',
        tokens_bet: tokensBet,
      };
    });

    const { error } = await supabase.rpc('submit_over_predictions', { p_predictions: predictions });
    if (error) {
      const { error: insertError } = await supabase.from('over_predictions').insert(predictions);
      if (insertError) {
        if (__DEV__) console.error('[OverPrediction] Submit failed:', insertError);
        return;
      }
    }
    set({ isLocked: true, isWindowOpen: false });
    // Fetch hot picks after locking in so user can see what others picked
    get().fetchHotPicks(predictionWindow.match_id, predictionWindow.over_number);
  },

  fetchUserResults: async (matchId: string, overNumber: number, innings: number, userId: string) => {
    await new Promise<void>(resolve => setTimeout(resolve, 3000));

    const { data: rows } = await supabase
      .from('over_predictions')
      .select('prediction_id, won, tokens_won, tokens_bet')
      .eq('match_id', matchId).eq('over_number', overNumber).eq('innings', innings).eq('user_id', userId);

    if (!rows) return;

    const { predictionOptions } = get();
    const multMap = new Map(predictionOptions.map(o => [o.id, o.multiplier]));

    const seen = new Map<string, any>();
    for (const r of rows) {
      const existing = seen.get(r.prediction_id);
      if (!existing || (r.won !== null && existing.won === null)) seen.set(r.prediction_id, r);
    }

    // Only show graded predictions (won != null) — ungraded means over result hasn't run yet
    const userResults: UserPredictionResult[] = Array.from(seen.values())
      .filter((r: any) => r.won !== null)
      .map((r: any) => ({
        predictionId: r.prediction_id,
        won: r.won,
        tokensWon: r.tokens_won ?? 0,
        mult: multMap.get(r.prediction_id) ?? 2,
      }));

    const totalWon = userResults.reduce((sum, r) => sum + (r.won ? r.tokensWon : 0), 0);
    set({ userResults, totalWon });

    const { useAuthStore } = await import('./authStore');
    useAuthStore.getState().refreshProfile();
  },

  fetchHotPicks: async (matchId: string, overNumber: number) => {
    const { data } = await supabase
      .from('over_predictions')
      .select('prediction_id')
      .eq('match_id', matchId)
      .eq('over_number', overNumber);

    if (!data) return;
    const counts = new Map<string, number>();
    for (const row of data) {
      counts.set(row.prediction_id, (counts.get(row.prediction_id) ?? 0) + 1);
    }
    set({ hotPicks: counts, hotPicksTotal: data.length });
  },

  clearResults: () => {
    const { overResult, userResults, totalWon, overHistory, pendingWindow } = get();

    // Archive this over into history before clearing
    const newHistory: OverHistoryEntry[] = overResult
      ? [{ over_number: overResult.over_number, balls: overResult.balls ?? [], stats: overResult.stats, userResults, totalWon }, ...overHistory]
      : overHistory;

    if (pendingWindow) {
      // Next over was already announced while result was showing — apply it now
      set({
        overResult: null, userResults: [], totalWon: 0,
        hotPicks: new Map(), hotPicksTotal: 0,
        overHistory: newHistory,
        predictionWindow: pendingWindow,
        isWindowOpen: true,
        isLocked: false,
        selectedPredictions: new Set(),
        liveStats: null,
        pendingWindow: null,
      });
    } else {
      set({
        overResult: null, userResults: [], totalWon: 0,
        hotPicks: new Map(), hotPicksTotal: 0,
        overHistory: newHistory,
        pendingWindow: null,
      });
    }
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreFromPayload(matchScore: any, current: Match) {
  if (!matchScore) return {};
  return {
    team1_score: matchScore.score ?? current.team1_score,
    team1_wickets: matchScore.wickets ?? current.team1_wickets,
    team1_overs: matchScore.overs ?? current.team1_overs,
  };
}
