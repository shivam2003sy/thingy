import {
  calculatePoints,
  determineWinner,
  coinsForResult,
  xpForResult,
  resultEmoji,
  resultLabel,
} from '../src/services/gameService';
import { BallResult, BallOutcome } from '../src/types/game';
import { APP_CONFIG } from '../src/config/constants';

// ─── Helpers ───────────────────────────────────────────────────────────────

function ball(outcome: BallOutcome, runs: number, isWicket = false): BallResult {
  return { ball: 1, outcome, runs, isWicket, commentary: '' };
}

const EXACT = APP_CONFIG.POINTS_EXACT; // 100
const NEAR  = APP_CONFIG.POINTS_NEAR;  // 30

// ─── calculatePoints ───────────────────────────────────────────────────────

describe('calculatePoints — dot prediction', () => {
  it('exact: dot ball scores EXACT', () => {
    expect(calculatePoints('dot', ball('dot', 0))).toBe(EXACT);
  });
  it('near-miss: wide scores NEAR', () => {
    expect(calculatePoints('dot', ball('wide', 1))).toBe(NEAR);
  });
  it('near-miss: no_ball scores NEAR', () => {
    expect(calculatePoints('dot', ball('no_ball', 1))).toBe(NEAR);
  });
  it('near-miss: single scores NEAR', () => {
    expect(calculatePoints('dot', ball('single', 1))).toBe(NEAR);
  });
  it('miss: four scores 0', () => {
    expect(calculatePoints('dot', ball('four', 4))).toBe(0);
  });
  it('miss: six scores 0', () => {
    expect(calculatePoints('dot', ball('six', 6))).toBe(0);
  });
  it('miss: wicket scores 0', () => {
    expect(calculatePoints('dot', ball('wicket', 0, true))).toBe(0);
  });
});

describe('calculatePoints — single prediction', () => {
  it('exact: single scores EXACT', () => {
    expect(calculatePoints('single', ball('single', 1))).toBe(EXACT);
  });
  it('exact: double scores EXACT', () => {
    expect(calculatePoints('single', ball('double', 2))).toBe(EXACT);
  });
  it('exact: triple scores EXACT', () => {
    expect(calculatePoints('single', ball('triple', 3))).toBe(EXACT);
  });
  it('near-miss: dot scores NEAR', () => {
    expect(calculatePoints('single', ball('dot', 0))).toBe(NEAR);
  });
  it('miss: four scores 0', () => {
    expect(calculatePoints('single', ball('four', 4))).toBe(0);
  });
  it('miss: six scores 0', () => {
    expect(calculatePoints('single', ball('six', 6))).toBe(0);
  });
  it('miss: wicket scores 0', () => {
    expect(calculatePoints('single', ball('wicket', 0, true))).toBe(0);
  });
});

describe('calculatePoints — boundary prediction', () => {
  it('exact: four scores EXACT', () => {
    expect(calculatePoints('boundary', ball('four', 4))).toBe(EXACT);
  });
  it('near-miss: double scores NEAR', () => {
    expect(calculatePoints('boundary', ball('double', 2))).toBe(NEAR);
  });
  it('near-miss: triple scores NEAR', () => {
    expect(calculatePoints('boundary', ball('triple', 3))).toBe(NEAR);
  });
  it('miss: six scores 0', () => {
    expect(calculatePoints('boundary', ball('six', 6))).toBe(0);
  });
  it('miss: dot scores 0', () => {
    expect(calculatePoints('boundary', ball('dot', 0))).toBe(0);
  });
  it('miss: wicket scores 0', () => {
    expect(calculatePoints('boundary', ball('wicket', 0, true))).toBe(0);
  });
});

describe('calculatePoints — six prediction', () => {
  it('exact: six scores EXACT', () => {
    expect(calculatePoints('six', ball('six', 6))).toBe(EXACT);
  });
  it('near-miss: four scores NEAR', () => {
    expect(calculatePoints('six', ball('four', 4))).toBe(NEAR);
  });
  it('miss: dot scores 0', () => {
    expect(calculatePoints('six', ball('dot', 0))).toBe(0);
  });
  it('miss: wicket scores 0', () => {
    expect(calculatePoints('six', ball('wicket', 0, true))).toBe(0);
  });
  it('miss: single scores 0', () => {
    expect(calculatePoints('six', ball('single', 1))).toBe(0);
  });
});

describe('calculatePoints — wicket prediction', () => {
  it('exact: wicket scores EXACT', () => {
    expect(calculatePoints('wicket', ball('wicket', 0, true))).toBe(EXACT);
  });
  it('miss: dot scores 0 (no near-miss for wicket)', () => {
    expect(calculatePoints('wicket', ball('dot', 0))).toBe(0);
  });
  it('miss: six scores 0', () => {
    expect(calculatePoints('wicket', ball('six', 6))).toBe(0);
  });
  it('miss: wide scores 0', () => {
    expect(calculatePoints('wicket', ball('wide', 1))).toBe(0);
  });
});

describe('calculatePoints — extra prediction', () => {
  it('exact: wide scores EXACT', () => {
    expect(calculatePoints('extra', ball('wide', 1))).toBe(EXACT);
  });
  it('exact: no_ball scores EXACT', () => {
    expect(calculatePoints('extra', ball('no_ball', 1))).toBe(EXACT);
  });
  it('near-miss: dot scores NEAR', () => {
    expect(calculatePoints('extra', ball('dot', 0))).toBe(NEAR);
  });
  it('miss: single scores 0', () => {
    expect(calculatePoints('extra', ball('single', 1))).toBe(0);
  });
  it('miss: six scores 0', () => {
    expect(calculatePoints('extra', ball('six', 6))).toBe(0);
  });
});

describe('calculatePoints — unknown prediction', () => {
  it('unknown predictionId scores 0', () => {
    expect(calculatePoints('unknown_prediction', ball('dot', 0))).toBe(0);
  });
});

// ─── Full over simulation ──────────────────────────────────────────────────

describe('calculatePoints — full over (6 balls)', () => {
  const overBalls: BallOutcome[] = ['dot', 'single', 'four', 'six', 'wicket', 'wide'];

  it('dot predictor gets EXACT on ball 1 only', () => {
    const scores = overBalls.map(o => calculatePoints('dot', ball(o, 0)));
    expect(scores[0]).toBe(EXACT); // dot
    expect(scores[1]).toBe(NEAR);  // single → near miss for dot
    expect(scores[2]).toBe(0);     // four
    expect(scores[3]).toBe(0);     // six
    expect(scores[4]).toBe(0);     // wicket
    expect(scores[5]).toBe(NEAR);  // wide → near miss for dot
  });

  it('six predictor gets EXACT on ball 4 only', () => {
    const scores = overBalls.map(o => calculatePoints('six', ball(o, 0)));
    expect(scores[3]).toBe(EXACT); // six
    expect(scores[2]).toBe(NEAR);  // four → near miss for six
    expect(scores.filter(s => s === EXACT).length).toBe(1);
  });

  it('total score across 6-ball over with mixed predictions', () => {
    const predictions = ['dot', 'single', 'boundary', 'six', 'wicket', 'extra'];
    const total = overBalls.reduce((sum, o, i) =>
      sum + calculatePoints(predictions[i], ball(o, 0)), 0);
    // dot→dot=EXACT, single→single=EXACT, four→boundary=EXACT, six→six=EXACT, wicket→wicket=EXACT, wide→extra=EXACT
    expect(total).toBe(EXACT * 6);
  });
});

// ─── determineWinner ──────────────────────────────────────────────────────

describe('determineWinner', () => {
  it('higher score wins', () => expect(determineWinner(300, 200)).toBe('me'));
  it('lower score loses', () => expect(determineWinner(100, 500)).toBe('opponent'));
  it('equal score draws', () => expect(determineWinner(250, 250)).toBe('draw'));
  it('zero vs zero draws', () => expect(determineWinner(0, 0)).toBe('draw'));
  it('win by 1 point', () => expect(determineWinner(101, 100)).toBe('me'));
  it('lose by 1 point', () => expect(determineWinner(99, 100)).toBe('opponent'));
});

// ─── coinsForResult ───────────────────────────────────────────────────────

describe('coinsForResult', () => {
  it('win returns COINS_WIN', () => expect(coinsForResult('me')).toBe(APP_CONFIG.COINS_WIN));
  it('draw returns COINS_DRAW', () => expect(coinsForResult('draw')).toBe(APP_CONFIG.COINS_DRAW));
  it('loss returns COINS_LOSS', () => expect(coinsForResult('opponent')).toBe(APP_CONFIG.COINS_LOSS));
  it('win > draw > loss', () => {
    expect(APP_CONFIG.COINS_WIN).toBeGreaterThan(APP_CONFIG.COINS_DRAW);
    expect(APP_CONFIG.COINS_DRAW).toBeGreaterThan(APP_CONFIG.COINS_LOSS);
  });
});

// ─── xpForResult ──────────────────────────────────────────────────────────

describe('xpForResult', () => {
  it('win returns XP_WIN', () => expect(xpForResult('me')).toBe(APP_CONFIG.XP_WIN));
  it('draw returns XP_DRAW', () => expect(xpForResult('draw')).toBe(APP_CONFIG.XP_DRAW));
  it('loss returns XP_LOSS', () => expect(xpForResult('opponent')).toBe(APP_CONFIG.XP_LOSS));
  it('win > draw > loss', () => {
    expect(APP_CONFIG.XP_WIN).toBeGreaterThan(APP_CONFIG.XP_DRAW);
    expect(APP_CONFIG.XP_DRAW).toBeGreaterThan(APP_CONFIG.XP_LOSS);
  });
});

// ─── resultEmoji ──────────────────────────────────────────────────────────

describe('resultEmoji', () => {
  it('wicket → ❌', () => expect(resultEmoji('wicket')).toBe('❌'));
  it('six → 🔥', () => expect(resultEmoji('six')).toBe('🔥'));
  it('four → 🏏', () => expect(resultEmoji('four')).toBe('🏏'));
  it('dot → ⚫', () => expect(resultEmoji('dot')).toBe('⚫'));
  it('wide → ↗️', () => expect(resultEmoji('wide')).toBe('↗️'));
  it('no_ball → ↗️', () => expect(resultEmoji('no_ball')).toBe('↗️'));
  it('single → 🏃', () => expect(resultEmoji('single')).toBe('🏃'));
  it('double → 🏃', () => expect(resultEmoji('double')).toBe('🏃'));
  it('triple → 🏃', () => expect(resultEmoji('triple')).toBe('🏃'));
});

// ─── resultLabel ──────────────────────────────────────────────────────────

describe('resultLabel', () => {
  it('wicket → WICKET!', () => expect(resultLabel(ball('wicket', 0, true))).toBe('WICKET!'));
  it('six → SIX!!', () => expect(resultLabel(ball('six', 6))).toBe('SIX!!'));
  it('four → FOUR!', () => expect(resultLabel(ball('four', 4))).toBe('FOUR!'));
  it('dot → DOT BALL', () => expect(resultLabel(ball('dot', 0))).toBe('DOT BALL'));
  it('wide → WIDE', () => expect(resultLabel(ball('wide', 1))).toBe('WIDE'));
  it('no_ball → NO BALL', () => expect(resultLabel(ball('no_ball', 1))).toBe('NO BALL'));
  it('single → 1 RUN', () => expect(resultLabel(ball('single', 1))).toBe('1 RUN'));
  it('double → 2 RUNS', () => expect(resultLabel(ball('double', 2))).toBe('2 RUNS'));
  it('triple → 3 RUNS', () => expect(resultLabel(ball('triple', 3))).toBe('3 RUNS'));
});
