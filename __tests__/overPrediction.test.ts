/**
 * Tests for over-level prediction scoring (mirrors checkPrediction in thingy-web/app/admin/actions.ts).
 * Kept pure so no Supabase connection is needed.
 */

interface OverStats {
  runs: number;
  wickets: number;
  sixes: number;
  fours: number;
  dots: number;
  extras: number;
  firstBallDot: boolean;
  firstBallBoundary: boolean;
}

function checkPrediction(predictionId: string, stats: OverStats): boolean {
  const { runs, wickets, sixes, fours, dots, extras, firstBallDot, firstBallBoundary } = stats;
  switch (predictionId) {
    case 'sixes_0':        return sixes === 0;
    case 'sixes_1plus':    return sixes >= 1;
    case 'fours_0to2':     return fours <= 2;
    case 'fours_3plus':    return fours >= 3;
    case 'dots_4plus':     return dots >= 4;
    case 'wickets_0':      return wickets === 0;
    case 'wickets_1plus':  return wickets >= 1;
    case 'extras_0':       return extras === 0;
    case 'extras_1plus':   return extras >= 1;
    case 'runs_0to5':      return runs <= 5;
    case 'runs_6to10':     return runs >= 6 && runs <= 10;
    case 'runs_11to15':    return runs >= 11 && runs <= 15;
    case 'runs_16to20':    return runs >= 16 && runs <= 20;
    case 'runs_21plus':    return runs >= 21;
    case 'first_dot':      return firstBallDot;
    case 'first_boundary': return firstBallBoundary;
    case 'wicket_and_six': return wickets >= 1 && sixes >= 1;
    case 'maiden':         return runs === 0 && extras === 0;
    case 'clean':          return wickets === 0 && extras === 0;
    default:               return false;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function stats(overrides: Partial<OverStats> = {}): OverStats {
  return {
    runs: 0, wickets: 0, sixes: 0, fours: 0,
    dots: 0, extras: 0, firstBallDot: false, firstBallBoundary: false,
    ...overrides,
  };
}

// ─── Sixes ────────────────────────────────────────────────────────────────

describe('sixes_0 — no sixes in the over', () => {
  it('true when sixes=0', () => expect(checkPrediction('sixes_0', stats({ sixes: 0 }))).toBe(true));
  it('false when sixes=1', () => expect(checkPrediction('sixes_0', stats({ sixes: 1 }))).toBe(false));
  it('false when sixes=3', () => expect(checkPrediction('sixes_0', stats({ sixes: 3 }))).toBe(false));
});

describe('sixes_1plus — at least one six', () => {
  it('false when sixes=0', () => expect(checkPrediction('sixes_1plus', stats({ sixes: 0 }))).toBe(false));
  it('true when sixes=1', () => expect(checkPrediction('sixes_1plus', stats({ sixes: 1 }))).toBe(true));
  it('true when sixes=4', () => expect(checkPrediction('sixes_1plus', stats({ sixes: 4 }))).toBe(true));
});

// ─── Fours ────────────────────────────────────────────────────────────────

describe('fours_0to2 — 0-2 fours', () => {
  it('true when fours=0', () => expect(checkPrediction('fours_0to2', stats({ fours: 0 }))).toBe(true));
  it('true when fours=2', () => expect(checkPrediction('fours_0to2', stats({ fours: 2 }))).toBe(true));
  it('false when fours=3', () => expect(checkPrediction('fours_0to2', stats({ fours: 3 }))).toBe(false));
});

describe('fours_3plus — 3+ fours', () => {
  it('false when fours=2', () => expect(checkPrediction('fours_3plus', stats({ fours: 2 }))).toBe(false));
  it('true when fours=3', () => expect(checkPrediction('fours_3plus', stats({ fours: 3 }))).toBe(true));
  it('true when fours=6', () => expect(checkPrediction('fours_3plus', stats({ fours: 6 }))).toBe(true));
});

// ─── Dots ─────────────────────────────────────────────────────────────────

describe('dots_4plus — 4+ dot balls', () => {
  it('false when dots=3', () => expect(checkPrediction('dots_4plus', stats({ dots: 3 }))).toBe(false));
  it('true when dots=4', () => expect(checkPrediction('dots_4plus', stats({ dots: 4 }))).toBe(true));
  it('true when dots=6 (maiden-like)', () => expect(checkPrediction('dots_4plus', stats({ dots: 6 }))).toBe(true));
});

// ─── Wickets ──────────────────────────────────────────────────────────────

describe('wickets_0 — no wickets', () => {
  it('true when wickets=0', () => expect(checkPrediction('wickets_0', stats({ wickets: 0 }))).toBe(true));
  it('false when wickets=1', () => expect(checkPrediction('wickets_0', stats({ wickets: 1 }))).toBe(false));
});

describe('wickets_1plus — at least one wicket', () => {
  it('false when wickets=0', () => expect(checkPrediction('wickets_1plus', stats({ wickets: 0 }))).toBe(false));
  it('true when wickets=1', () => expect(checkPrediction('wickets_1plus', stats({ wickets: 1 }))).toBe(true));
  it('true when wickets=3', () => expect(checkPrediction('wickets_1plus', stats({ wickets: 3 }))).toBe(true));
});

// ─── Extras ───────────────────────────────────────────────────────────────

describe('extras_0 — no extras', () => {
  it('true when extras=0', () => expect(checkPrediction('extras_0', stats({ extras: 0 }))).toBe(true));
  it('false when extras=1', () => expect(checkPrediction('extras_0', stats({ extras: 1 }))).toBe(false));
});

describe('extras_1plus — at least one extra', () => {
  it('false when extras=0', () => expect(checkPrediction('extras_1plus', stats({ extras: 0 }))).toBe(false));
  it('true when extras=1 (wide)', () => expect(checkPrediction('extras_1plus', stats({ extras: 1 }))).toBe(true));
  it('true when extras=3', () => expect(checkPrediction('extras_1plus', stats({ extras: 3 }))).toBe(true));
});

// ─── Runs bands ───────────────────────────────────────────────────────────

describe('runs_0to5', () => {
  it('true at 0', () => expect(checkPrediction('runs_0to5', stats({ runs: 0 }))).toBe(true));
  it('true at 5', () => expect(checkPrediction('runs_0to5', stats({ runs: 5 }))).toBe(true));
  it('false at 6', () => expect(checkPrediction('runs_0to5', stats({ runs: 6 }))).toBe(false));
});

describe('runs_6to10', () => {
  it('false at 5', () => expect(checkPrediction('runs_6to10', stats({ runs: 5 }))).toBe(false));
  it('true at 6', () => expect(checkPrediction('runs_6to10', stats({ runs: 6 }))).toBe(true));
  it('true at 10', () => expect(checkPrediction('runs_6to10', stats({ runs: 10 }))).toBe(true));
  it('false at 11', () => expect(checkPrediction('runs_6to10', stats({ runs: 11 }))).toBe(false));
});

describe('runs_11to15', () => {
  it('false at 10', () => expect(checkPrediction('runs_11to15', stats({ runs: 10 }))).toBe(false));
  it('true at 11', () => expect(checkPrediction('runs_11to15', stats({ runs: 11 }))).toBe(true));
  it('true at 15', () => expect(checkPrediction('runs_11to15', stats({ runs: 15 }))).toBe(true));
  it('false at 16', () => expect(checkPrediction('runs_11to15', stats({ runs: 16 }))).toBe(false));
});

describe('runs_16to20', () => {
  it('false at 15', () => expect(checkPrediction('runs_16to20', stats({ runs: 15 }))).toBe(false));
  it('true at 16', () => expect(checkPrediction('runs_16to20', stats({ runs: 16 }))).toBe(true));
  it('true at 20', () => expect(checkPrediction('runs_16to20', stats({ runs: 20 }))).toBe(true));
  it('false at 21', () => expect(checkPrediction('runs_16to20', stats({ runs: 21 }))).toBe(false));
});

describe('runs_21plus', () => {
  it('false at 20', () => expect(checkPrediction('runs_21plus', stats({ runs: 20 }))).toBe(false));
  it('true at 21', () => expect(checkPrediction('runs_21plus', stats({ runs: 21 }))).toBe(true));
  it('true at 36 (all sixes)', () => expect(checkPrediction('runs_21plus', stats({ runs: 36 }))).toBe(true));
});

// ─── First ball ───────────────────────────────────────────────────────────

describe('first_dot — first legal ball is a dot', () => {
  it('true when firstBallDot=true', () => expect(checkPrediction('first_dot', stats({ firstBallDot: true }))).toBe(true));
  it('false when firstBallDot=false', () => expect(checkPrediction('first_dot', stats({ firstBallDot: false }))).toBe(false));
});

describe('first_boundary — first legal ball is a four or six', () => {
  it('true when firstBallBoundary=true', () => expect(checkPrediction('first_boundary', stats({ firstBallBoundary: true }))).toBe(true));
  it('false when firstBallBoundary=false', () => expect(checkPrediction('first_boundary', stats({ firstBallBoundary: false }))).toBe(false));
});

// ─── Combo predictions ────────────────────────────────────────────────────

describe('wicket_and_six — both a wicket and a six in the over', () => {
  it('true when wickets=1 sixes=1', () => expect(checkPrediction('wicket_and_six', stats({ wickets: 1, sixes: 1 }))).toBe(true));
  it('false when wickets=1 sixes=0', () => expect(checkPrediction('wicket_and_six', stats({ wickets: 1, sixes: 0 }))).toBe(false));
  it('false when wickets=0 sixes=1', () => expect(checkPrediction('wicket_and_six', stats({ wickets: 0, sixes: 1 }))).toBe(false));
  it('false when both 0', () => expect(checkPrediction('wicket_and_six', stats({ wickets: 0, sixes: 0 }))).toBe(false));
  it('true when wickets=2 sixes=3', () => expect(checkPrediction('wicket_and_six', stats({ wickets: 2, sixes: 3 }))).toBe(true));
});

describe('maiden — 0 runs and 0 extras', () => {
  it('true when runs=0 extras=0', () => expect(checkPrediction('maiden', stats({ runs: 0, extras: 0 }))).toBe(true));
  it('false when runs=1', () => expect(checkPrediction('maiden', stats({ runs: 1, extras: 0 }))).toBe(false));
  it('false when extras=1 (wide counts as a run)', () => expect(checkPrediction('maiden', stats({ runs: 0, extras: 1 }))).toBe(false));
  it('true: all 6 dot balls', () => expect(checkPrediction('maiden', stats({ runs: 0, extras: 0, dots: 6 }))).toBe(true));
});

describe('clean — no wickets and no extras', () => {
  it('true when wickets=0 extras=0', () => expect(checkPrediction('clean', stats({ wickets: 0, extras: 0 }))).toBe(true));
  it('false when wickets=1', () => expect(checkPrediction('clean', stats({ wickets: 1, extras: 0 }))).toBe(false));
  it('false when extras=1', () => expect(checkPrediction('clean', stats({ wickets: 0, extras: 1 }))).toBe(false));
  it('false when both present', () => expect(checkPrediction('clean', stats({ wickets: 1, extras: 1 }))).toBe(false));
});

// ─── Unknown prediction ────────────────────────────────────────────────────

describe('unknown prediction id', () => {
  it('returns false', () => expect(checkPrediction('invalid_id', stats())).toBe(false));
});

// ─── Real IPL over scenarios ───────────────────────────────────────────────

describe('Real over scenarios', () => {
  // Bumrah vs RCB powerplay: W, dot, dot, dot, dot, 1  = 1 run, 1 wicket, 5 dots
  const bumrahOver = stats({ runs: 1, wickets: 1, dots: 5, sixes: 0, fours: 0, extras: 0, firstBallDot: false });
  it('Bumrah maiden-ish: wickets_1plus ✓', () => expect(checkPrediction('wickets_1plus', bumrahOver)).toBe(true));
  it('Bumrah maiden-ish: dots_4plus ✓', () => expect(checkPrediction('dots_4plus', bumrahOver)).toBe(true));
  it('Bumrah maiden-ish: runs_0to5 ✓', () => expect(checkPrediction('runs_0to5', bumrahOver)).toBe(true));
  it('Bumrah maiden-ish: sixes_0 ✓', () => expect(checkPrediction('sixes_0', bumrahOver)).toBe(true));
  it('Bumrah maiden-ish: maiden ✗ (has 1 run)', () => expect(checkPrediction('maiden', bumrahOver)).toBe(false));

  // Death over carnage: 6, 6, 4, wide, 6, 4, 4  = 31 runs, 0 wickets, 3 extras(wide), 3 sixes, 3 fours
  const deathOver = stats({ runs: 31, wickets: 0, sixes: 3, fours: 3, extras: 1, dots: 0, firstBallBoundary: true });
  it('Death over: runs_21plus ✓', () => expect(checkPrediction('runs_21plus', deathOver)).toBe(true));
  it('Death over: sixes_1plus ✓', () => expect(checkPrediction('sixes_1plus', deathOver)).toBe(true));
  it('Death over: fours_3plus ✓', () => expect(checkPrediction('fours_3plus', deathOver)).toBe(true));
  it('Death over: wickets_0 ✓', () => expect(checkPrediction('wickets_0', deathOver)).toBe(true));
  it('Death over: extras_1plus ✓', () => expect(checkPrediction('extras_1plus', deathOver)).toBe(true));
  it('Death over: first_boundary ✓', () => expect(checkPrediction('first_boundary', deathOver)).toBe(true));
  it('Death over: maiden ✗', () => expect(checkPrediction('maiden', deathOver)).toBe(false));
  it('Death over: clean ✗ (has extra)', () => expect(checkPrediction('clean', deathOver)).toBe(false));

  // Tight chase over: 1, 2, 1, dot, 1, 2  = 7 runs, 0 wickets, 0 extras, 3 dots
  const chaseOver = stats({ runs: 7, wickets: 0, sixes: 0, fours: 0, extras: 0, dots: 2, firstBallDot: false });
  it('Chase over: runs_6to10 ✓', () => expect(checkPrediction('runs_6to10', chaseOver)).toBe(true));
  it('Chase over: sixes_0 ✓', () => expect(checkPrediction('sixes_0', chaseOver)).toBe(true));
  it('Chase over: clean ✓', () => expect(checkPrediction('clean', chaseOver)).toBe(true));
  it('Chase over: dots_4plus ✗', () => expect(checkPrediction('dots_4plus', chaseOver)).toBe(false));

  // Hat-trick over: W, W, W, 1, 4, dot  = 5 runs, 3 wickets, 0 extras, 1 four
  const hatTrick = stats({ runs: 5, wickets: 3, sixes: 0, fours: 1, extras: 0, dots: 1, firstBallDot: false });
  it('Hat-trick over: wickets_1plus ✓', () => expect(checkPrediction('wickets_1plus', hatTrick)).toBe(true));
  it('Hat-trick over: wicket_and_six ✗ (no six)', () => expect(checkPrediction('wicket_and_six', hatTrick)).toBe(false));
  it('Hat-trick over: runs_0to5 ✓', () => expect(checkPrediction('runs_0to5', hatTrick)).toBe(true));
  it('Hat-trick over: clean ✗ (has wickets)', () => expect(checkPrediction('clean', hatTrick)).toBe(false));

  // Boundary fest: 4, 6, 4, 6, 4, 6  = 30 runs, 0 wickets, 3 fours, 3 sixes
  const boundaryFest = stats({ runs: 30, wickets: 0, sixes: 3, fours: 3, extras: 0, dots: 0, firstBallBoundary: true });
  it('Boundary fest: wicket_and_six ✗ (no wicket)', () => expect(checkPrediction('wicket_and_six', boundaryFest)).toBe(false));
  it('Boundary fest: runs_21plus ✓', () => expect(checkPrediction('runs_21plus', boundaryFest)).toBe(true));
  it('Boundary fest: sixes_1plus ✓', () => expect(checkPrediction('sixes_1plus', boundaryFest)).toBe(true));
  it('Boundary fest: fours_3plus ✓', () => expect(checkPrediction('fours_3plus', boundaryFest)).toBe(true));
  it('Boundary fest: dots_4plus ✗', () => expect(checkPrediction('dots_4plus', boundaryFest)).toBe(false));
  it('Boundary fest: clean ✓', () => expect(checkPrediction('clean', boundaryFest)).toBe(true));
});
