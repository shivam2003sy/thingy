import {
  ball,
  createInitialState,
  formatOverDisplay,
  processBall,
  validateBall,
} from './cricketEngine'
import type { Ball, EngineState } from '../types/cricket'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function feed(balls: Ball[], state = createInitialState()): EngineState {
  return balls.reduce((s, b) => {
    const result = processBall(b, s)
    if (result.error) throw new Error(`Engine error: ${result.error}`)
    return result.state
  }, state)
}

// ─── Over counting ────────────────────────────────────────────────────────────

describe('Over counting', () => {
  test('6 legal balls = 1 over', () => {
    const s = feed([ball.dot(), ball.single(), ball.four(), ball.six(), ball.dot(), ball.wicket()])
    expect(s.match_score.overs).toBe('1.0')
    expect(s.legal_ball_count).toBe(6)
  })

  test('Wide does not count toward over', () => {
    const s = feed([ball.wide(), ball.dot()])
    expect(s.match_score.overs).toBe('0.1')
  })

  test('No-ball does not count toward over', () => {
    const s = feed([ball.noBall(), ball.dot()])
    expect(s.match_score.overs).toBe('0.1')
  })

  test('Bye counts as legal ball', () => {
    const s = feed([ball.bye(4)])
    expect(s.match_score.overs).toBe('0.1')
  })

  test('Leg-bye counts as legal ball', () => {
    const s = feed([ball.legBye(2)])
    expect(s.match_score.overs).toBe('0.1')
  })

  test('Sequence: Wd,1,NB+4,2,Wd,dot,6 → 0.4 overs (NB+4 is one illegal delivery)', () => {
    // "NB, 4" in the spec is one no-ball delivery with 4 bat runs, not two balls
    const balls: Ball[] = [
      ball.wide(), ball.single(), ball.noBall(4),
      ball.double(), ball.wide(), ball.dot(), ball.six(),
    ]
    const s = feed(balls)
    expect(s.match_score.overs).toBe('0.4')
    expect(s.legal_ball_count).toBe(4)
  })
})

// ─── Score calculation ────────────────────────────────────────────────────────

describe('Score calculation', () => {
  test('runs accumulate bat + extras', () => {
    const s = feed([ball.single(), ball.four(), ball.wide(1)])
    expect(s.match_score.score).toBe(6)
    expect(s.live_stats.extras).toBe(1)
  })

  test('no-ball + 4 bat = 5 total', () => {
    const s = feed([ball.noBall(4)])
    expect(s.match_score.score).toBe(5)
    expect(s.live_stats.extras).toBe(1)
  })

  test('wide boundary = 5 total', () => {
    const s = feed([ball.wideBoundary()])
    expect(s.match_score.score).toBe(5)
    expect(s.live_stats.extras).toBe(5)
  })

  test('bye does not add bat runs', () => {
    const s = feed([ball.bye(4)])
    expect(s.match_score.score).toBe(4)
    expect(s.live_stats.extras).toBe(4)
  })
})

// ─── Stats ────────────────────────────────────────────────────────────────────

describe('Stats', () => {
  test('fours only on bat_runs === 4', () => {
    const s = feed([ball.four(), ball.wideBoundary()])
    expect(s.live_stats.fours).toBe(1) // wide boundary NOT a four
  })

  test('sixes', () => {
    const s = feed([ball.six()])
    expect(s.live_stats.sixes).toBe(1)
  })

  test('wicket increments wickets', () => {
    const s = feed([ball.wicket()])
    expect(s.live_stats.wickets).toBe(1)
  })

  test('dot: 0 bat, 0 extra, no wicket on legal ball', () => {
    const s = feed([ball.dot()])
    expect(s.live_stats.dots).toBe(1)
  })

  test('wicket ball is NOT a dot', () => {
    const s = feed([ball.wicket()])
    expect(s.live_stats.dots).toBe(0)
  })

  test('bye is NOT a dot (has extra runs)', () => {
    const s = feed([ball.bye(1)])
    expect(s.live_stats.dots).toBe(0)
  })

  test('wide is NOT a dot (illegal)', () => {
    const s = feed([ball.wide()])
    expect(s.live_stats.dots).toBe(0)
  })
})

// ─── First ball logic ─────────────────────────────────────────────────────────

describe('First ball logic', () => {
  test('wide before first legal ball does not set firstBallDot', () => {
    const s = feed([ball.wide(), ball.dot()])
    expect(s.live_stats.first_ball_dot).toBe(true)
  })

  test('first legal ball dot', () => {
    const s = feed([ball.dot()])
    expect(s.live_stats.first_ball_dot).toBe(true)
    expect(s.live_stats.first_ball_boundary).toBe(false)
  })

  test('first legal ball boundary four', () => {
    const s = feed([ball.four()])
    expect(s.live_stats.first_ball_boundary).toBe(true)
    expect(s.live_stats.first_ball_dot).toBe(false)
  })

  test('first_ball values not overwritten after second legal ball', () => {
    const s = feed([ball.dot(), ball.six()])
    expect(s.live_stats.first_ball_dot).toBe(true)
    expect(s.live_stats.first_ball_boundary).toBe(false)
  })
})

// ─── No-ball & free hit ───────────────────────────────────────────────────────

describe('No-ball and free hit', () => {
  test('no-ball sets next_is_free_hit', () => {
    const s = feed([ball.noBall()])
    expect(s.next_is_free_hit).toBe(true)
  })

  test('free hit resets after legal delivery', () => {
    const s = feed([ball.noBall(), ball.dot()])
    expect(s.next_is_free_hit).toBe(false)
  })

  test('no-ball after no-ball keeps free hit active', () => {
    const s = feed([ball.noBall(), ball.noBall()])
    expect(s.next_is_free_hit).toBe(true)
  })

  test('wicket rejected on free hit', () => {
    const s1 = feed([ball.noBall()])
    const result = processBall(ball.wicket('bowled'), s1)
    expect(result.error).toMatch(/free hit/)
  })

  test('run_out allowed on free hit', () => {
    const s1 = feed([ball.noBall()])
    const result = processBall(ball.runOut(0), s1)
    expect(result.error).toBeUndefined()
    expect(result.state.live_stats.wickets).toBe(1)
  })
})

// ─── Wide rules ───────────────────────────────────────────────────────────────

describe('Wide rules', () => {
  test('wide + running = extra_runs tracks correctly', () => {
    const b: Ball = { is_legal: false, bat_runs: 0, extra_runs: 3, extra_type: 'wide', is_wicket: false, wicket_type: null, is_free_hit: false }
    const s = feed([b])
    expect(s.match_score.score).toBe(3)
  })

  test('wide with bat_runs rejected', () => {
    const b: Ball = { is_legal: false, bat_runs: 2, extra_runs: 1, extra_type: 'wide', is_wicket: false, wicket_type: null, is_free_hit: false }
    const r = processBall(b, createInitialState())
    expect(r.error).toMatch(/bat runs/)
  })

  test('wide run_out allowed', () => {
    const s = feed([ball.wideRunOut(1)])
    expect(s.live_stats.wickets).toBe(1)
    expect(s.match_score.score).toBe(1)
  })

  test('wide caught rejected', () => {
    const b: Ball = { is_legal: false, bat_runs: 0, extra_runs: 1, extra_type: 'wide', is_wicket: true, wicket_type: 'caught', is_free_hit: false }
    const r = processBall(b, createInitialState())
    expect(r.error).toMatch(/run_out/)
  })
})

// ─── No-ball wicket rules ─────────────────────────────────────────────────────

describe('No-ball wicket rules', () => {
  test('bowled on no-ball rejected', () => {
    const b: Ball = { is_legal: false, bat_runs: 0, extra_runs: 1, extra_type: 'no_ball', is_wicket: true, wicket_type: 'bowled', is_free_hit: false }
    const r = processBall(b, createInitialState())
    expect(r.error).toMatch(/run_out/)
  })

  test('run_out on no-ball allowed', () => {
    const s = feed([ball.noBallRunOut(2)])
    expect(s.live_stats.wickets).toBe(1)
    expect(s.match_score.score).toBe(3) // 2 bat + 1 extra
  })
})

// ─── Bye / leg-bye ────────────────────────────────────────────────────────────

describe('Bye and leg-bye', () => {
  test('bye with bat_runs rejected', () => {
    const b: Ball = { is_legal: true, bat_runs: 2, extra_runs: 1, extra_type: 'bye', is_wicket: false, wicket_type: null, is_free_hit: false }
    const r = processBall(b, createInitialState())
    expect(r.error).toMatch(/bat runs/)
  })

  test('leg-bye 4 = 4 extras, 0 bat', () => {
    const s = feed([ball.legBye(4)])
    expect(s.live_stats.extras).toBe(4)
    expect(s.match_score.score).toBe(4)
  })
})

// ─── Display ──────────────────────────────────────────────────────────────────

describe('formatOverDisplay', () => {
  test('labels are correct', () => {
    const balls: Ball[] = [
      ball.wide(), ball.single(), ball.dot(), ball.four(), ball.six(), ball.wicket(),
    ]
    const display = formatOverDisplay(balls)
    expect(display[0].label).toBe('Wd')
    expect(display[0].is_legal).toBe(false)
    expect(display[0].legal_index).toBeNull()
    expect(display[1].label).toBe('1')
    expect(display[1].legal_index).toBe(1)
    expect(display[2].label).toBe('•')
    expect(display[3].label).toBe('4')
    expect(display[4].label).toBe('6')
    expect(display[5].label).toBe('W')
    expect(display[5].legal_index).toBe(5)
  })

  test('colors are correct', () => {
    const balls: Ball[] = [
      ball.dot(), ball.single(), ball.four(), ball.six(), ball.wicket(), ball.wide(), ball.noBall(),
    ]
    const display = formatOverDisplay(balls)
    expect(display[0].color).toBe('dot')
    expect(display[1].color).toBe('runs')
    expect(display[2].color).toBe('four')
    expect(display[3].color).toBe('six')
    expect(display[4].color).toBe('wicket')
    expect(display[5].color).toBe('extra')
    expect(display[6].color).toBe('no_ball')
  })

  test('wide boundary label', () => {
    const display = formatOverDisplay([ball.wideBoundary()])
    expect(display[0].label).toBe('Wd+4')
  })

  test('no-ball + bat runs label', () => {
    const display = formatOverDisplay([ball.noBall(4)])
    expect(display[0].label).toBe('NB+4')
  })
})

// ─── Validation edge cases ────────────────────────────────────────────────────

describe('validateBall', () => {
  test('wide marked as legal is rejected', () => {
    const b: Ball = { ...ball.wide(), is_legal: true }
    const r = validateBall(b, createInitialState())
    expect(r.valid).toBe(false)
  })

  test('bye marked as illegal is rejected', () => {
    const b: Ball = { ...ball.bye(), is_legal: false }
    const r = validateBall(b, createInitialState())
    expect(r.valid).toBe(false)
  })

  test('no-ball with extra_runs < 1 is rejected', () => {
    const b: Ball = { is_legal: false, bat_runs: 4, extra_runs: 0, extra_type: 'no_ball', is_wicket: false, wicket_type: null, is_free_hit: false }
    const r = validateBall(b, createInitialState())
    expect(r.valid).toBe(false)
  })

  test('negative runs rejected', () => {
    const b: Ball = { ...ball.dot(), bat_runs: -1 }
    const r = validateBall(b, createInitialState())
    expect(r.valid).toBe(false)
  })
})
