import { create } from 'zustand';
import {
  fetchLiveMatches,
  fetchFixtures,
  fetchSeriesList,
  fetchSeriesInfo,
  searchPlayers,
  fetchPlayerInfo,
  CricMatchSummary,
  CricSeries,
  CricSeriesInfo,
  CricPlayer,
  CricPlayerDetail,
} from '../services/cricketService';

interface CricketStore {
  // state
  liveMatches:    CricMatchSummary[];
  fixtures:       CricMatchSummary[];
  series:         CricSeries[];
  searchResults:  CricPlayer[];
  selectedSeries: CricSeriesInfo | null;
  selectedPlayer: CricPlayerDetail | null;

  loadingMatches:  boolean;
  loadingFixtures: boolean;
  loadingSeries:   boolean;
  loadingSearch:   boolean;
  loadingDetail:   boolean;

  errorMatches:  string | null;
  errorFixtures: string | null;
  errorSeries:   string | null;
  errorSearch:   string | null;
  errorDetail:   string | null;

  // actions
  loadLiveMatches:  () => Promise<void>;
  loadFixtures:     () => Promise<void>;
  loadSeriesList:   () => Promise<void>;
  loadSeriesInfo:   (id: string) => Promise<void>;
  doSearchPlayers:  (query: string) => Promise<void>;
  loadPlayerInfo:   (id: string) => Promise<void>;
  clearSelectedSeries: () => void;
  clearSelectedPlayer: () => void;
  clearSearchResults:  () => void;
}

export const useCricketStore = create<CricketStore>((set) => ({
  liveMatches:    [],
  fixtures:       [],
  series:         [],
  searchResults:  [],
  selectedSeries: null,
  selectedPlayer: null,

  loadingMatches:  false,
  loadingFixtures: false,
  loadingSeries:   false,
  loadingSearch:   false,
  loadingDetail:   false,

  errorMatches:  null,
  errorFixtures: null,
  errorSeries:   null,
  errorSearch:   null,
  errorDetail:   null,

  loadLiveMatches: async () => {
    set({ loadingMatches: true, errorMatches: null });
    try {
      const data = await fetchLiveMatches();
      set({ liveMatches: data });
    } catch (e: any) {
      set({ errorMatches: e.message });
    } finally {
      set({ loadingMatches: false });
    }
  },

  loadFixtures: async () => {
    set({ loadingFixtures: true, errorFixtures: null });
    try {
      const data = await fetchFixtures();
      set({ fixtures: data });
    } catch (e: any) {
      set({ errorFixtures: e.message });
    } finally {
      set({ loadingFixtures: false });
    }
  },

  loadSeriesList: async () => {
    set({ loadingSeries: true, errorSeries: null });
    try {
      const data = await fetchSeriesList();
      set({ series: data });
    } catch (e: any) {
      set({ errorSeries: e.message });
    } finally {
      set({ loadingSeries: false });
    }
  },

  loadSeriesInfo: async (id: string) => {
    set({ loadingDetail: true, errorDetail: null, selectedSeries: null });
    try {
      const data = await fetchSeriesInfo(id);
      set({ selectedSeries: data });
    } catch (e: any) {
      set({ errorDetail: e.message });
    } finally {
      set({ loadingDetail: false });
    }
  },

  doSearchPlayers: async (query: string) => {
    if (!query.trim()) { set({ searchResults: [] }); return; }
    set({ loadingSearch: true, errorSearch: null });
    try {
      const data = await searchPlayers(query);
      set({ searchResults: data });
    } catch (e: any) {
      set({ errorSearch: e.message });
    } finally {
      set({ loadingSearch: false });
    }
  },

  loadPlayerInfo: async (id: string) => {
    set({ loadingDetail: true, errorDetail: null, selectedPlayer: null });
    try {
      const data = await fetchPlayerInfo(id);
      set({ selectedPlayer: data });
    } catch (e: any) {
      set({ errorDetail: e.message });
    } finally {
      set({ loadingDetail: false });
    }
  },

  clearSelectedSeries: () => set({ selectedSeries: null }),
  clearSelectedPlayer: () => set({ selectedPlayer: null }),
  clearSearchResults:  () => set({ searchResults: [] }),
}));
