/**
 * cricketService — thin REST wrapper over the thingy backend's CricAPI routes.
 * All calls go to the backend (never directly to CricAPI), so the API key
 * stays on the server and caching is centralised.
 */
import axios from 'axios';
import { BACKEND_URL } from '../socket/socketService';

const BASE = BACKEND_URL ?? 'http://localhost:3001';

const api = axios.create({ baseURL: BASE, timeout: 10_000 });

// ─── Types (mirror thingy-backend CricAPI types) ──────────────────────────────

export interface CricMatchSummary {
  id: string;
  name: string;
  matchType: string;
  status: string;
  ms: 'live' | 'fixture' | 'result';
  date?: string;
  dateTimeGMT?: string;
  series?: string;
  teams?: string[];
  teamInfo?: { name: string; shortname: string; img: string }[];
  score?: { r: number; w: number; o: number; inning: string }[];
  t1?: string;
  t2?: string;
  t1s?: string;
  t2s?: string;
  t1img?: string;
  t2img?: string;
}

export interface CricSeries {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  odi: number;
  t20: number;
  test: number;
  squads: number;
  matches: number;
}

export interface CricSeriesMatch {
  id: string;
  name: string;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  dateTimeGMT: string;
  teams: string[];
  matchStarted: boolean;
  matchEnded: boolean;
}

export interface CricSeriesInfo {
  info: CricSeries;
  matchList: CricSeriesMatch[];
}

export interface CricPlayer {
  id: string;
  name: string;
  country: string;
}

export interface CricPlayerStat {
  fn: string;
  matchtype: string;
  stat: string;
  value: string;
}

export interface CricPlayerDetail {
  id: string;
  name: string;
  role?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  placeOfBirth?: string;
  country: string;
  playerImg?: string;
  stats: CricPlayerStat[];
}

// ─── Service functions ─────────────────────────────────────────────────────────

export async function fetchLiveMatches(): Promise<CricMatchSummary[]> {
  const { data } = await api.get<CricMatchSummary[]>('/matches');
  return data.filter(m => m.ms === 'live');
}

export async function fetchFixtures(): Promise<CricMatchSummary[]> {
  const { data } = await api.get<CricMatchSummary[]>('/fixtures');
  return data;
}

export async function fetchSeriesList(): Promise<CricSeries[]> {
  const { data } = await api.get<CricSeries[]>('/series');
  return data;
}

export async function fetchSeriesInfo(id: string): Promise<CricSeriesInfo> {
  const { data } = await api.get<CricSeriesInfo>(`/series/${id}`);
  return data;
}

export async function searchPlayers(query: string): Promise<CricPlayer[]> {
  if (!query.trim()) return [];
  const { data } = await api.get<CricPlayer[]>('/players', { params: { search: query } });
  return data;
}

export async function fetchPlayerInfo(id: string): Promise<CricPlayerDetail> {
  const { data } = await api.get<CricPlayerDetail>(`/players/${id}`);
  return data;
}
