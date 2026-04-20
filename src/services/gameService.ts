import { BallOutcome, BallResult } from '../types/game';
import { APP_CONFIG } from '../config/constants';

// Map prediction option IDs to the ball outcomes they match exactly
const EXACT_MATCH: Record<string, BallOutcome[]> = {
  dot: ['dot'],
  single: ['single', 'double', 'triple'],
  boundary: ['four'],
  six: ['six'],
  wicket: ['wicket'],
  extra: ['wide', 'no_ball'],
};

// Near-miss outcomes for partial credit
const NEAR_MISS: Record<string, BallOutcome[]> = {
  dot: ['single', 'wide', 'no_ball'],
  single: ['dot', 'double'],
  boundary: ['triple', 'double'],
  six: ['four'],
  wicket: [],
  extra: ['dot'],
};

export function calculatePoints(predictionId: string, result: BallResult): number {
  if (EXACT_MATCH[predictionId]?.includes(result.outcome)) {
    return APP_CONFIG.POINTS_EXACT;
  }
  if (NEAR_MISS[predictionId]?.includes(result.outcome)) {
    return APP_CONFIG.POINTS_NEAR;
  }
  return 0;
}

export function determineWinner(
  myScore: number,
  opponentScore: number,
): 'me' | 'opponent' | 'draw' {
  if (myScore > opponentScore) return 'me';
  if (opponentScore > myScore) return 'opponent';
  return 'draw';
}

export function coinsForResult(winner: 'me' | 'opponent' | 'draw'): number {
  if (winner === 'me') return APP_CONFIG.COINS_WIN;
  if (winner === 'draw') return APP_CONFIG.COINS_DRAW;
  return APP_CONFIG.COINS_LOSS;
}

export function xpForResult(winner: 'me' | 'opponent' | 'draw'): number {
  if (winner === 'me') return APP_CONFIG.XP_WIN;
  if (winner === 'draw') return APP_CONFIG.XP_DRAW;
  return APP_CONFIG.XP_LOSS;
}

export function resultEmoji(outcome: BallOutcome): string {
  if (outcome === 'wicket') return '❌';
  if (outcome === 'six') return '🔥';
  if (outcome === 'four') return '🏏';
  if (outcome === 'dot') return '⚫';
  if (outcome === 'wide' || outcome === 'no_ball') return '↗️';
  return '🏃';
}

export function resultLabel(result: BallResult): string {
  if (result.isWicket) return 'WICKET!';
  if (result.runs === 6) return 'SIX!!';
  if (result.runs === 4) return 'FOUR!';
  if (result.runs === 0 && result.outcome === 'dot') return 'DOT BALL';
  if (result.outcome === 'wide') return 'WIDE';
  if (result.outcome === 'no_ball') return 'NO BALL';
  return `${result.runs} RUN${result.runs !== 1 ? 'S' : ''}`;
}
