export type ExtraType = 'wide' | 'no_ball' | 'bye' | 'leg_bye' | null

export type WicketType = 'bowled' | 'caught' | 'lbw' | 'stumped' | 'run_out' | null

export interface Ball {
  is_legal: boolean
  bat_runs: number
  extra_runs: number
  extra_type: ExtraType
  is_wicket: boolean
  wicket_type: WicketType
  is_free_hit: boolean
}

export interface BallDisplay {
  label: string
  color: BallColor
  is_legal: boolean
  ball_number: number | null // null for illegals
}

export type BallColor =
  | 'dot'
  | 'runs'
  | 'four'
  | 'six'
  | 'wicket'
  | 'extra'
  | 'no_ball'

export interface LiveStats {
  balls: Ball[]
  runs: number
  fours: number
  sixes: number
  wickets: number
  extras: number
  dots: number
  first_ball_dot: boolean | null
  first_ball_boundary: boolean | null
}

export interface MatchScore {
  score: number
  wickets: number
  overs: string // formatted e.g. "3.4"
  legal_balls: number
}

export interface EngineState {
  live_stats: LiveStats
  match_score: MatchScore
  next_is_free_hit: boolean
  legal_ball_count: number
  current_over: number
}

export interface ValidationError {
  valid: false
  reason: string
}

export interface ValidationOk {
  valid: true
}

export type ValidationResult = ValidationOk | ValidationError

export interface BallDisplayEntry {
  label: string
  color: BallColor
  is_legal: boolean
  legal_index: number | null
}
