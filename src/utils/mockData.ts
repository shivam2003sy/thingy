import { MatchScenario, PredictionOption, BallOutcome } from '../types/game';

export const PREDICTION_OPTIONS: PredictionOption[] = [
  { id: 'dot', label: 'Dot Ball', icon: '⚫', value: 0 },
  { id: 'single', label: '1-2 Runs', icon: '🏃', value: 1 },
  { id: 'boundary', label: 'FOUR!', icon: '🏏', value: 4 },
  { id: 'six', label: 'SIX!', icon: '🔥', value: 6 },
  { id: 'wicket', label: 'WICKET!', icon: '❌', value: 'W' },
  { id: 'extra', label: 'Extra', icon: '↗️', value: 'E' },
];

export const MATCH_SCENARIOS: Omit<MatchScenario, 'id'>[] = [
  {
    category: 'last_over',
    title: '🔥 Last Over Thriller',
    context: 'CSK needs 14 off last over',
    battingTeam: 'CSK',
    bowlingTeam: 'MI',
    battingTeamColor: '#FFDD00',
    bowlingTeamColor: '#005DA0',
    runsNeeded: 14,
    ballsRemaining: 6,
    wicketsLeft: 3,
    strikerName: 'MS Dhoni',
    bowlerName: 'J Bumrah',
    overNumber: 20,
  },
  {
    category: 'chase_control',
    title: '🏏 Chase Control',
    context: 'RCB needs 28 off 12',
    battingTeam: 'RCB',
    bowlingTeam: 'KKR',
    battingTeamColor: '#D00027',
    bowlingTeamColor: '#6B46C1',
    runsNeeded: 28,
    ballsRemaining: 12,
    wicketsLeft: 5,
    strikerName: 'V Kohli',
    bowlerName: 'S Narine',
    overNumber: 19,
  },
  {
    category: 'super_over',
    title: '⚡ SUPER OVER!',
    context: 'Super Over — anything can happen',
    battingTeam: 'SRH',
    bowlingTeam: 'DC',
    battingTeamColor: '#F97316',
    bowlingTeamColor: '#0033CC',
    runsNeeded: 13,
    ballsRemaining: 6,
    wicketsLeft: 2,
    strikerName: 'H Pandya',
    bowlerName: 'A Nortje',
    overNumber: 21,
  },
  {
    category: 'powerplay',
    title: '💨 Powerplay Special',
    context: 'MI smashing it in powerplay',
    battingTeam: 'MI',
    bowlingTeam: 'CSK',
    battingTeamColor: '#005DA0',
    bowlingTeamColor: '#FFDD00',
    runsNeeded: 0,
    ballsRemaining: 6,
    wicketsLeft: 10,
    strikerName: 'R Sharma',
    bowlerName: 'D Chahar',
    overNumber: 3,
  },
  {
    category: 'new_batsman',
    title: '🆕 New Man In',
    context: 'Wicket on last ball — new batsman',
    battingTeam: 'KKR',
    bowlingTeam: 'RCB',
    battingTeamColor: '#6B46C1',
    bowlingTeamColor: '#D00027',
    runsNeeded: 22,
    ballsRemaining: 9,
    wicketsLeft: 4,
    strikerName: 'S Iyer',
    bowlerName: 'M Siraj',
    overNumber: 18,
  },
];

export const OPPONENT_NAMES = [
  'CricketGod_99',
  'IPLFanatic',
  'SixMachine',
  'DotBallKing',
  'ThalaFan7',
  'Hitman_Lover',
  'Kohli12th',
  'BumrahBros',
  'WicketHunter',
  'PowerplayPro',
  'SuperOverAce',
  'LastOverLegend',
];

export const BALL_COMMENTARIES: Record<string, string[]> = {
  dot: [
    'Defended back to the bowler!',
    'Good length, played out.',
    'Dot ball! Pressure builds.',
    'Tight line, no room to score.',
  ],
  single: [
    'Worked away for a single.',
    'Quick single taken!',
    'Pushed into the gap, one run.',
    'Rotates the strike.',
  ],
  double: [
    'Running between the wickets!',
    'Two good ones taken!',
    'Pushes into the outfield, 2 runs.',
  ],
  triple: ['Three! Great running between the wickets!'],
  four: [
    'FOUR! Cracking shot!',
    'Races away to the boundary!',
    'Through the covers for FOUR!',
    'Clipped fine for FOUR!',
  ],
  six: [
    'SIX!! MASSIVE HIT!',
    'Into the stands! SIX!',
    "That's gone MILES! SIX!",
    'Maximum! Clean hit over long-on!',
  ],
  wicket: [
    'WICKET! Big breakthrough!',
    'OUT! The crowd goes wild!',
    'CAUGHT! Drama in the middle!',
    'BOWLED HIM! What a delivery!',
  ],
  wide: ['Wide down the leg side.', 'Gone down the leg, wide called.', 'Too wide outside off.'],
  no_ball: ['No ball! Free hit coming!', 'Overstepped! No ball called!'],
};

export function getRandomScenario(): MatchScenario {
  const base = MATCH_SCENARIOS[Math.floor(Math.random() * MATCH_SCENARIOS.length)];
  return { ...base, id: `scenario_${Date.now()}` };
}

export function getRandomOpponentName(): string {
  return OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];
}

export function getRandomCommentary(outcome: BallOutcome): string {
  const list = BALL_COMMENTARIES[outcome] ?? ['Ball played.'];
  return list[Math.floor(Math.random() * list.length)];
}
