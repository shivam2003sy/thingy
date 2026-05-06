import type {
  Ball,
  BallColor,
  BallDisplayEntry,
  EngineState,
  LiveStats,
  MatchScore,
  ValidationResult,
} from '../types/cricket'

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateBall(ball: Ball, state: EngineState): ValidationResult {
  const { extra_type, wicket_type, is_wicket, is_legal, bat_runs, extra_runs } = ball

  // Wide must be illegal
  if (extra_type === 'wide' && is_legal) {
    return { valid: false, reason: 'Wide must be an illegal delivery' }
  }

  // No-ball must be illegal
  if (extra_type === 'no_ball' && is_legal) {
    return { valid: false, reason: 'No-ball must be an illegal delivery' }
  }

  // Bye / leg-bye must be legal
  if ((extra_type === 'bye' || extra_type === 'leg_bye') && !is_legal) {
    return { valid: false, reason: 'Bye / leg-bye must be a legal delivery' }
  }

  // Wide cannot have bat_runs
  if (extra_type === 'wide' && bat_runs > 0) {
    return { valid: false, reason: 'Wide cannot have bat runs' }
  }

  // Wide boundary = 5 total (1 wide + 4 extra)
  if (extra_type === 'wide' && extra_runs > 5) {
    return { valid: false, reason: 'Wide extras cannot exceed 5 (boundary wide)' }
  }

  // No-ball base extra must be 1
  if (extra_type === 'no_ball' && extra_runs < 1) {
    return { valid: false, reason: 'No-ball must have at least 1 extra run' }
  }

  // Wicket on wide: only run_out allowed
  if (extra_type === 'wide' && is_wicket && wicket_type !== 'run_out') {
    return { valid: false, reason: 'Only run_out is possible on a wide' }
  }

  // Wicket on no-ball: only run_out allowed
  if (extra_type === 'no_ball' && is_wicket && wicket_type !== 'run_out') {
    return { valid: false, reason: 'Only run_out is possible on a no-ball' }
  }

  // Wicket on free hit: only run_out allowed
  if (state.next_is_free_hit && is_wicket && wicket_type !== 'run_out') {
    return { valid: false, reason: 'Only run_out is possible on a free hit' }
  }

  // Stumping only on legal balls (not wide in this engine — covered above, but be explicit)
  if (wicket_type === 'stumped' && extra_type === 'wide') {
    return { valid: false, reason: 'Stumping cannot occur on a wide (use run_out)' }
  }

  // Negative runs are nonsensical
  if (bat_runs < 0 || extra_runs < 0) {
    return { valid: false, reason: 'Runs cannot be negative' }
  }

  // Bye / leg-bye cannot have bat_runs
  if ((extra_type === 'bye' || extra_type === 'leg_bye') && bat_runs > 0) {
    return { valid: false, reason: 'Bye / leg-bye cannot have bat runs' }
  }

  return { valid: true }
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export function createInitialState(): EngineState {
  const live_stats: LiveStats = {
    balls: [],
    runs: 0,
    fours: 0,
    sixes: 0,
    wickets: 0,
    extras: 0,
    dots: 0,
    first_ball_dot: null,
    first_ball_boundary: null,
  }

  const match_score: MatchScore = {
    score: 0,
    wickets: 0,
    overs: '0.0',
    legal_balls: 0,
  }

  return {
    live_stats,
    match_score,
    next_is_free_hit: false,
    legal_ball_count: 0,
    current_over: 0,
  }
}

function formatOvers(legal_balls: number): string {
  const overs = Math.floor(legal_balls / 6)
  const balls = legal_balls % 6
  return `${overs}.${balls}`
}

export function processBall(
  ball: Ball,
  state: EngineState,
): { state: EngineState; error?: string } {
  const validation = validateBall(ball, state)
  if (!validation.valid) {
    return { state, error: validation.reason }
  }

  // Stamp free hit from engine state (ball.is_free_hit is informational;
  // engine is the authoritative source)
  const resolvedBall: Ball = { ...ball, is_free_hit: state.next_is_free_hit }

  const { bat_runs, extra_runs, extra_type, is_wicket, is_legal } = resolvedBall

  const total_ball_runs = bat_runs + extra_runs

  // Clone stats
  const stats = { ...state.live_stats, balls: [...state.live_stats.balls, resolvedBall] }
  let legal_ball_count = state.legal_ball_count

  // Score
  stats.runs += total_ball_runs
  if (extra_runs > 0) stats.extras += extra_runs
  if (is_wicket) stats.wickets += 1

  // Boundaries (only bat runs count)
  if (bat_runs === 4) stats.fours += 1
  if (bat_runs === 6) stats.sixes += 1

  // Dot: legal ball, 0 bat runs, 0 extra runs, no wicket
  if (is_legal && bat_runs === 0 && extra_runs === 0 && !is_wicket) {
    stats.dots += 1
  }

  // First legal ball tracking
  if (is_legal && stats.first_ball_dot === null) {
    stats.first_ball_dot = bat_runs === 0 && !is_wicket
    stats.first_ball_boundary = bat_runs === 4 || bat_runs === 6
  }

  // Legal ball counter
  if (is_legal) {
    legal_ball_count += 1
  }

  // Free hit: set next ball as free hit only after a no-ball
  // Reset after any legal delivery (including the free hit itself)
  const next_is_free_hit = extra_type === 'no_ball'
  // If current ball was legal and WAS a free hit → it resets (next_is_free_hit already false)

  const match_score: MatchScore = {
    score: stats.runs,
    wickets: stats.wickets,
    overs: formatOvers(legal_ball_count),
    legal_balls: legal_ball_count,
  }

  return {
    state: {
      live_stats: stats,
      match_score,
      next_is_free_hit,
      legal_ball_count,
      current_over: Math.floor(legal_ball_count / 6),
    },
  }
}

// ─── Display ─────────────────────────────────────────────────────────────────

function ballLabel(ball: Ball): string {
  const { bat_runs, extra_runs, extra_type, is_wicket, is_free_hit } = ball

  if (extra_type === 'wide') {
    const total = extra_runs
    return total > 1 ? `Wd+${total - 1}` : 'Wd'
  }

  if (extra_type === 'no_ball') {
    const prefix = is_free_hit ? 'FH' : 'NB'
    return bat_runs > 0 ? `${prefix}+${bat_runs}` : prefix
  }

  if (extra_type === 'bye') return extra_runs > 1 ? `B${extra_runs}` : 'B'
  if (extra_type === 'leg_bye') return extra_runs > 1 ? `LB${extra_runs}` : 'LB'

  if (is_wicket) return 'W'
  if (bat_runs === 0) return '•'
  if (bat_runs === 4) return '4'
  if (bat_runs === 6) return '6'
  return String(bat_runs)
}

function ballColor(ball: Ball): BallColor {
  const { bat_runs, extra_type, is_wicket } = ball

  if (extra_type === 'no_ball') return 'no_ball'
  if (extra_type === 'wide' || extra_type === 'bye' || extra_type === 'leg_bye') return 'extra'
  if (is_wicket) return 'wicket'
  if (bat_runs === 4) return 'four'
  if (bat_runs === 6) return 'six'
  if (bat_runs === 0) return 'dot'
  return 'runs'
}

export function formatOverDisplay(balls: Ball[]): BallDisplayEntry[] {
  let legal_index = 0
  return balls.map((ball) => {
    const entry: BallDisplayEntry = {
      label: ballLabel(ball),
      color: ballColor(ball),
      is_legal: ball.is_legal,
      legal_index: ball.is_legal ? ++legal_index : null,
    }
    return entry
  })
}

// ─── Colour map (for UI consumption) ─────────────────────────────────────────

export const BALL_COLORS: Record<BallColor, string> = {
  dot: '#9CA3AF',    // grey
  runs: '#3B82F6',   // blue
  four: '#F97316',   // orange
  six: '#EF4444',    // red
  wicket: '#8B5CF6', // purple
  extra: '#22C55E',  // green
  no_ball: '#F97316', // orange
}

// ─── Convenience builders ─────────────────────────────────────────────────────

export const ball = {
  dot: (): Ball => ({
    is_legal: true, bat_runs: 0, extra_runs: 0,
    extra_type: null, is_wicket: false, wicket_type: null, is_free_hit: false,
  }),
  single: (): Ball => ({
    is_legal: true, bat_runs: 1, extra_runs: 0,
    extra_type: null, is_wicket: false, wicket_type: null, is_free_hit: false,
  }),
  double: (): Ball => ({
    is_legal: true, bat_runs: 2, extra_runs: 0,
    extra_type: null, is_wicket: false, wicket_type: null, is_free_hit: false,
  }),
  triple: (): Ball => ({
    is_legal: true, bat_runs: 3, extra_runs: 0,
    extra_type: null, is_wicket: false, wicket_type: null, is_free_hit: false,
  }),
  four: (): Ball => ({
    is_legal: true, bat_runs: 4, extra_runs: 0,
    extra_type: null, is_wicket: false, wicket_type: null, is_free_hit: false,
  }),
  six: (): Ball => ({
    is_legal: true, bat_runs: 6, extra_runs: 0,
    extra_type: null, is_wicket: false, wicket_type: null, is_free_hit: false,
  }),
  wicket: (type: 'bowled' | 'caught' | 'lbw' | 'stumped' = 'bowled'): Ball => ({
    is_legal: true, bat_runs: 0, extra_runs: 0,
    extra_type: null, is_wicket: true, wicket_type: type, is_free_hit: false,
  }),
  wide: (extra_runs = 1): Ball => ({
    is_legal: false, bat_runs: 0, extra_runs,
    extra_type: 'wide', is_wicket: false, wicket_type: null, is_free_hit: false,
  }),
  wideBoundary: (): Ball => ({
    is_legal: false, bat_runs: 0, extra_runs: 5,
    extra_type: 'wide', is_wicket: false, wicket_type: null, is_free_hit: false,
  }),
  wideRunOut: (extra_runs = 1): Ball => ({
    is_legal: false, bat_runs: 0, extra_runs,
    extra_type: 'wide', is_wicket: true, wicket_type: 'run_out', is_free_hit: false,
  }),
  noBall: (bat_runs = 0): Ball => ({
    is_legal: false, bat_runs, extra_runs: 1,
    extra_type: 'no_ball', is_wicket: false, wicket_type: null, is_free_hit: false,
  }),
  noBallRunOut: (bat_runs = 0): Ball => ({
    is_legal: false, bat_runs, extra_runs: 1,
    extra_type: 'no_ball', is_wicket: true, wicket_type: 'run_out', is_free_hit: false,
  }),
  bye: (extra_runs = 1): Ball => ({
    is_legal: true, bat_runs: 0, extra_runs,
    extra_type: 'bye', is_wicket: false, wicket_type: null, is_free_hit: false,
  }),
  legBye: (extra_runs = 1): Ball => ({
    is_legal: true, bat_runs: 0, extra_runs,
    extra_type: 'leg_bye', is_wicket: false, wicket_type: null, is_free_hit: false,
  }),
  runOut: (bat_runs = 0): Ball => ({
    is_legal: true, bat_runs, extra_runs: 0,
    extra_type: null, is_wicket: true, wicket_type: 'run_out', is_free_hit: false,
  }),
}

// ─── DB helpers (shared with store for reconnect) ─────────────────────────────

export function replayBalls(balls: Ball[]): EngineState {
  return balls.reduce((s, b) => {
    const { state } = processBall(b, s)
    return state
  }, createInitialState())
}

export function dbRowToEngineBall(row: {
  runs: number
  is_wicket: boolean
  wicket_type: string | null
  is_extra: boolean
  extra_type: string | null
}): Ball {
  const et = row.extra_type as ExtraType
  const isLegal = !row.is_extra || et === 'bye' || et === 'leg_bye'

  let bat_runs = 0
  let extra_runs = 0

  if (et === 'wide') {
    extra_runs = row.runs
  } else if (et === 'no_ball') {
    extra_runs = 1
    bat_runs = Math.max(0, row.runs - 1)
  } else if (et === 'bye' || et === 'leg_bye') {
    extra_runs = row.runs
  } else {
    bat_runs = row.runs
  }

  return {
    is_legal: isLegal,
    bat_runs,
    extra_runs,
    extra_type: et ?? null,
    is_wicket: row.is_wicket,
    wicket_type: row.wicket_type as WicketType,
    is_free_hit: false,
  }
}
