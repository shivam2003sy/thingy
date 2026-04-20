import { MatchScenario, BallResult, BallOutcome } from '../types/game';
import { getRandomScenario, getRandomOpponentName, getRandomCommentary, PREDICTION_OPTIONS } from '../utils/mockData';
import { APP_CONFIG } from '../config/constants';

type SocketEvent = 'connect' | 'disconnect' | 'matchFound' | 'opponentPrediction' | 'ballResult';

type Callback = (...args: any[]) => void;

const RUNS_MAP: Record<BallOutcome, number> = {
  dot: 0,
  wide: 1,
  no_ball: 1,
  single: 1,
  double: 2,
  triple: 3,
  four: 4,
  six: 6,
  wicket: 0,
};

class MockSocketService {
  private listeners = new Map<SocketEvent, Callback[]>();
  private timers: ReturnType<typeof setTimeout>[] = [];

  on(event: SocketEvent, cb: Callback): this {
    const prev = this.listeners.get(event) ?? [];
    this.listeners.set(event, [...prev, cb]);
    return this;
  }

  off(event: SocketEvent, cb?: Callback): this {
    if (!cb) {
      this.listeners.delete(event);
    } else {
      const prev = this.listeners.get(event) ?? [];
      this.listeners.set(event, prev.filter(fn => fn !== cb));
    }
    return this;
  }

  private fire(event: SocketEvent, data?: any) {
    const cbs = this.listeners.get(event) ?? [];
    cbs.forEach(cb => cb(data));
  }

  private schedule(fn: () => void, delay: number) {
    const t = setTimeout(fn, delay);
    this.timers.push(t);
    return t;
  }

  connect() {
    this.schedule(() => this.fire('connect'), 100);
    return this;
  }

  findMatch() {
    const delay =
      APP_CONFIG.MATCHMAKING_MIN_DELAY +
      Math.random() * (APP_CONFIG.MATCHMAKING_MAX_DELAY - APP_CONFIG.MATCHMAKING_MIN_DELAY);
    this.schedule(() => {
      const scenario = getRandomScenario();
      const opponentName = getRandomOpponentName();
      this.fire('matchFound', {
        matchId: `match_${Date.now()}`,
        scenario,
        opponentName,
      });
    }, delay);
  }

  submitPrediction(_optionId: string) {
    const delay =
      APP_CONFIG.OPPONENT_PREDICTION_DELAY_MIN +
      Math.random() *
        (APP_CONFIG.OPPONENT_PREDICTION_DELAY_MAX - APP_CONFIG.OPPONENT_PREDICTION_DELAY_MIN);
    this.schedule(() => {
      const random = PREDICTION_OPTIONS[Math.floor(Math.random() * PREDICTION_OPTIONS.length)];
      this.fire('opponentPrediction', { optionId: random.id });
    }, delay);
  }

  revealBall(ballNumber: number, runsNeeded: number, ballsLeft: number) {
    this.schedule(() => {
      const result = this.simulateBall(ballNumber, runsNeeded, ballsLeft);
      this.fire('ballResult', result);
    }, APP_CONFIG.BALL_REVEAL_DELAY);
  }

  private simulateBall(ballNumber: number, runsNeeded: number, ballsLeft: number): BallResult {
    const rrr = ballsLeft > 0 ? runsNeeded / ballsLeft : 0;

    let weights: Record<string, number>;
    if (rrr > 18) {
      weights = { dot: 8, wide: 7, single: 12, double: 5, four: 22, six: 32, wicket: 14 };
    } else if (rrr > 12) {
      weights = { dot: 12, wide: 7, single: 18, double: 8, four: 26, six: 18, wicket: 11 };
    } else if (rrr > 8) {
      weights = { dot: 15, wide: 7, single: 26, double: 10, four: 22, six: 12, wicket: 8 };
    } else {
      weights = { dot: 20, wide: 8, single: 32, double: 15, four: 14, six: 6, wicket: 5 };
    }

    const outcomes = Object.keys(weights) as BallOutcome[];
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    let outcome: BallOutcome = 'dot';

    for (const o of outcomes) {
      rand -= weights[o];
      if (rand <= 0) {
        outcome = o;
        break;
      }
    }

    return {
      ball: ballNumber,
      outcome,
      runs: RUNS_MAP[outcome],
      isWicket: outcome === 'wicket',
      commentary: getRandomCommentary(outcome),
    };
  }

  cleanup() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.listeners.clear();
  }
}

export const socketService = new MockSocketService();
