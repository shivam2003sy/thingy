export type BallOutcome =
  | 'dot'
  | 'wide'
  | 'no_ball'
  | 'single'
  | 'double'
  | 'triple'
  | 'four'
  | 'six'
  | 'wicket'

export type ScenarioCategory =
  | 'last_over'
  | 'powerplay'
  | 'chase_control'
  | 'super_over'
  | 'new_batsman'

export interface PredictionOption {
  id: string
  label: string
  icon: string
  value: number | string
}

export interface MatchScenario {
  id: string
  category: ScenarioCategory
  title: string
  context: string
  battingTeam: string
  bowlingTeam: string
  battingTeamColor: string
  bowlingTeamColor: string
  runsNeeded: number
  ballsRemaining: number
  wicketsLeft: number
  strikerName: string
  bowlerName: string
  overNumber: number
}

export interface Prediction {
  optionId: string
  label: string
  icon: string
  lockedAt: number
}

export interface BallResult {
  ball: number
  outcome: BallOutcome
  runs: number
  isWicket: boolean
  commentary: string
}

export interface RoundData {
  ball: number
  ballResult: BallResult
  myPredictionId: string
  opponentPredictionId: string
  myPoints: number
  opponentPoints: number
}

export type GameStatus =
  | 'idle'
  | 'matchmaking'
  | 'predicting'
  | 'waiting_opponent'
  | 'revealing'
  | 'finished'

export interface GameState {
  matchId: string | null
  status: GameStatus
  scenario: MatchScenario | null
  currentBall: number
  totalBalls: number
  myPrediction: Prediction | null
  opponentPredictionId: string | null
  timeLeft: number
  rounds: RoundData[]
  myTotalScore: number
  opponentTotalScore: number
  winner: 'me' | 'opponent' | 'draw' | null
  opponentName: string
  currentBallResult: BallResult | null
  runsScored: number
}
