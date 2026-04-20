/**
 * socketService — wraps socket.io-client.
 *
 * Set BACKEND_URL before calling connect() to use the real server.
 * Leave it unset to use the built-in mock (useful for local dev without a backend).
 */
import { getRandomScenario, getRandomOpponentName, getRandomCommentary, PREDICTION_OPTIONS } from '../utils/mockData';
import { BallOutcome } from '../types/game';
import { APP_CONFIG } from '../config/constants';

// ─── Config ───────────────────────────────────────────────────────────────────
// Point this at your running backend.  Change to your LAN IP when testing on device.
// e.g.  'http://192.168.1.10:3001'   or   'http://localhost:3001'
export const BACKEND_URL: string | null = null; // ← set this when backend is running

// ─── Types ────────────────────────────────────────────────────────────────────
type SocketEvent =
  | 'connect'
  | 'disconnect'
  | 'matchFound'
  | 'ballResult'
  | 'gameEnd'
  | 'opponentDisconnected'
  | 'error';

type Callback = (...args: any[]) => void;

// ─── Interface ────────────────────────────────────────────────────────────────
interface ISocketService {
  connect(): this;
  on(event: SocketEvent, cb: Callback): this;
  off(event: SocketEvent, cb?: Callback): this;
  findMatch(userId: string, username: string): void;
  submitPrediction(optionId: string): void;
  cleanup(): void;
}

// ─── Real Socket.IO implementation ───────────────────────────────────────────
class RealSocketService implements ISocketService {
  private socket: any = null; // io.Socket — typed as any to avoid bundling issues

  connect() {
    // Dynamically import socket.io-client so the mock path doesn't pull it in
    const { io } = require('socket.io-client') as typeof import('socket.io-client');
    this.socket = io(BACKEND_URL!, {
      transports: ['websocket'],
      reconnectionAttempts: 3,
    });
    return this;
  }

  on(event: SocketEvent, cb: Callback) {
    this.socket?.on(event, cb);
    return this;
  }

  off(event: SocketEvent, cb?: Callback) {
    if (cb) this.socket?.off(event, cb);
    else     this.socket?.off(event);
    return this;
  }

  findMatch(userId: string, username: string) {
    this.socket?.emit('findMatch', { userId, username });
  }

  submitPrediction(optionId: string) {
    this.socket?.emit('submitPrediction', { optionId });
  }

  cleanup() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

// ─── Mock implementation (no backend needed) ─────────────────────────────────
const RUNS_MAP: Record<BallOutcome, number> = {
  dot: 0, wide: 1, no_ball: 1, single: 1, double: 2, triple: 3, four: 4, six: 6, wicket: 0,
};

class MockSocketService implements ISocketService {
  private listeners = new Map<SocketEvent, Callback[]>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private currentBall = 0;
  private runsScored  = 0;
  private scenario: ReturnType<typeof getRandomScenario> | null = null;

  private fire(event: SocketEvent, data?: any) {
    (this.listeners.get(event) ?? []).forEach(cb => cb(data));
  }

  private schedule(fn: () => void, delay: number) {
    const t = setTimeout(fn, delay);
    this.timers.push(t);
  }

  connect() {
    this.schedule(() => this.fire('connect'), 80);
    return this;
  }

  on(event: SocketEvent, cb: Callback) {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), cb]);
    return this;
  }

  off(event: SocketEvent, cb?: Callback) {
    if (!cb) this.listeners.delete(event);
    else     this.listeners.set(event, (this.listeners.get(event) ?? []).filter(fn => fn !== cb));
    return this;
  }

  findMatch(_userId: string, _username: string) {
    const delay = APP_CONFIG.MATCHMAKING_MIN_DELAY +
      Math.random() * (APP_CONFIG.MATCHMAKING_MAX_DELAY - APP_CONFIG.MATCHMAKING_MIN_DELAY);

    this.scenario = getRandomScenario();
    this.currentBall = 1;
    this.runsScored  = 0;

    this.schedule(() => {
      this.fire('matchFound', {
        matchId: `mock_${Date.now()}`,
        scenario: this.scenario,
        opponentName: getRandomOpponentName(),
      });
    }, delay);
  }

  submitPrediction(myOptionId: string) {
    const ball = this.currentBall;
    const sc   = this.scenario!;

    // 1. Simulate opponent prediction after random delay
    const oppDelay = APP_CONFIG.OPPONENT_PREDICTION_DELAY_MIN +
      Math.random() * (APP_CONFIG.OPPONENT_PREDICTION_DELAY_MAX - APP_CONFIG.OPPONENT_PREDICTION_DELAY_MIN);

    this.schedule(() => {
      // 2. After getting "opponent prediction", simulate the ball
      const oppOption = PREDICTION_OPTIONS[Math.floor(Math.random() * PREDICTION_OPTIONS.length)];

      const runsLeft  = sc.runsNeeded - this.runsScored;
      const ballsLeft = sc.ballsRemaining - (ball - 1);

      const outcome  = this.randomOutcome(runsLeft, ballsLeft);
      const runs     = RUNS_MAP[outcome];
      const isWicket = outcome === 'wicket';

      const myPoints  = this.calcPoints(myOptionId, outcome);
      const oppPoints = this.calcPoints(oppOption.id, outcome);

      this.runsScored  += runs;
      this.currentBall += 1;

      this.fire('ballResult', {
        ball,
        outcome,
        runs,
        isWicket,
        commentary: getRandomCommentary(outcome),
        myPoints,
        opponentPoints: oppPoints,
        opponentPredictionId: oppOption.id,
        myScore: 0,        // updated in store
        opponentScore: 0,
      });
    }, oppDelay + APP_CONFIG.BALL_REVEAL_DELAY);
  }

  private calcPoints(predId: string, outcome: BallOutcome): number {
    const EXACT: Record<string, BallOutcome[]> = {
      dot: ['dot'], single: ['single','double','triple'], boundary: ['four'],
      six: ['six'], wicket: ['wicket'], extra: ['wide','no_ball'],
    };
    const NEAR: Record<string, BallOutcome[]> = {
      dot: ['single','wide','no_ball'], single: ['dot','double'],
      boundary: ['triple','double'], six: ['four'], wicket: [], extra: ['dot'],
    };
    if (EXACT[predId]?.includes(outcome)) return APP_CONFIG.POINTS_EXACT;
    if (NEAR[predId]?.includes(outcome))  return APP_CONFIG.POINTS_NEAR;
    return 0;
  }

  private randomOutcome(runsNeeded: number, ballsLeft: number): BallOutcome {
    const rrr = ballsLeft > 0 ? runsNeeded / ballsLeft : 0;
    let w: Record<string, number>;
    if      (rrr > 18) w = { dot:8,  wide:6,  single:10, double:4,  four:22, six:34, wicket:16 };
    else if (rrr > 12) w = { dot:12, wide:6,  single:16, double:6,  four:28, six:20, wicket:12 };
    else if (rrr > 8)  w = { dot:15, wide:7,  single:26, double:10, four:22, six:12, wicket:8  };
    else               w = { dot:22, wide:8,  single:32, double:14, four:14, six:5,  wicket:5  };

    const outcomes = Object.keys(w) as BallOutcome[];
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (const o of outcomes) { rand -= w[o]; if (rand <= 0) return o; }
    return 'dot';
  }

  cleanup() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.listeners.clear();
    this.scenario = null;
  }
}

// ─── Export the right implementation ─────────────────────────────────────────
export const socketService: ISocketService = BACKEND_URL
  ? new RealSocketService()
  : new MockSocketService();
