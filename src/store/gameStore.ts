import { create } from 'zustand';
import {
  GameState,
  GameStatus,
  MatchScenario,
  Prediction,
  BallResult,
  RoundData,
} from '../types/game';

interface GameStore extends GameState {
  startMatchmaking: () => void;
  setMatchFound: (matchId: string, scenario: MatchScenario, opponentName: string) => void;
  setMyPrediction: (prediction: Prediction) => void;
  setOpponentPredictionId: (optionId: string) => void;
  setBallResult: (result: BallResult, myPoints: number, opponentPoints: number) => void;
  nextBall: () => void;
  setStatus: (status: GameStatus) => void;
  decrementTimer: () => void;
  finishGame: (winner: 'me' | 'opponent' | 'draw') => void;
  resetGame: () => void;
}

const INITIAL_STATE: GameState = {
  matchId: null,
  status: 'idle',
  scenario: null,
  currentBall: 1,
  totalBalls: 6,
  myPrediction: null,
  opponentPredictionId: null,
  timeLeft: 10,
  rounds: [],
  myTotalScore: 0,
  opponentTotalScore: 0,
  winner: null,
  opponentName: '',
  currentBallResult: null,
  runsScored: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,

  startMatchmaking: () => set({ ...INITIAL_STATE, status: 'matchmaking' }),

  setMatchFound: (matchId, scenario, opponentName) =>
    set({
      matchId,
      scenario,
      opponentName,
      status: 'predicting',
      currentBall: 1,
      timeLeft: 10,
    }),

  setMyPrediction: prediction =>
    set({ myPrediction: prediction, status: 'waiting_opponent' }),

  setOpponentPredictionId: optionId =>
    set({ opponentPredictionId: optionId, status: 'revealing' }),

  setBallResult: (result, myPoints, opponentPoints) => {
    const { rounds, myTotalScore, opponentTotalScore, myPrediction, opponentPredictionId, currentBall, runsScored } =
      get();
    const newRound: RoundData = {
      ball: currentBall,
      ballResult: result,
      myPredictionId: myPrediction?.optionId ?? '',
      opponentPredictionId: opponentPredictionId ?? '',
      myPoints,
      opponentPoints,
    };
    set({
      currentBallResult: result,
      rounds: [...rounds, newRound],
      myTotalScore: myTotalScore + myPoints,
      opponentTotalScore: opponentTotalScore + opponentPoints,
      runsScored: runsScored + result.runs,
    });
  },

  nextBall: () => {
    const { currentBall, totalBalls } = get();
    if (currentBall < totalBalls) {
      set({
        currentBall: currentBall + 1,
        myPrediction: null,
        opponentPredictionId: null,
        currentBallResult: null,
        timeLeft: 10,
        status: 'predicting',
      });
    }
  },

  setStatus: status => set({ status }),

  decrementTimer: () => {
    const { timeLeft } = get();
    if (timeLeft > 0) set({ timeLeft: timeLeft - 1 });
  },

  finishGame: winner => set({ winner, status: 'finished' }),

  resetGame: () => set({ ...INITIAL_STATE }),
}));
