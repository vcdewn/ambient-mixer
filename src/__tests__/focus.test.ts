import { describe, expect, it } from 'vitest'
import { DEFAULT_FOCUS } from '../state/reducer'
import { advance, initFocus, pause, remaining, skip, start, tick } from '../timers/focus'
import { extendSleep, startSleep, tickSleep } from '../timers/sleep'
import { formatClock } from '../timers/format'

const S = DEFAULT_FOCUS
const MIN = 60_000

describe('focus timer', () => {
  it('starts idle on a full work phase', () => {
    const run = initFocus(S)
    expect(run.status).toBe('idle')
    expect(remaining(run, 0)).toBe(25 * MIN)
  })

  it('counts down from endTime and pauses with the remainder', () => {
    const running = start(initFocus(S), 1000)
    expect(remaining(running, 1000 + 10 * MIN)).toBe(15 * MIN)
    const paused = pause(running, 1000 + 10 * MIN)
    expect(paused.status).toBe('paused')
    expect(remaining(paused, 99999999)).toBe(15 * MIN)
  })

  it('goes work → break when time is up (auto-advance)', () => {
    const running = start(initFocus(S), 0)
    expect(tick(running, S, 25 * MIN - 1).finished).toBeNull()
    const res = tick(running, S, 25 * MIN)
    expect(res.finished).toBe('work')
    expect(res.run.phase).toBe('break')
    expect(res.run.status).toBe('running')
    expect(res.run.cycle).toBe(1)
  })

  it('waits for the user when auto-advance is off', () => {
    const res = tick(start(initFocus(S), 0), { ...S, autoAdvance: false }, 25 * MIN)
    expect(res.run.status).toBe('idle')
    expect(res.run.phase).toBe('break')
  })

  it('takes a long break after the configured number of cycles, then resets the counter', () => {
    let run = initFocus(S)
    for (let i = 0; i < 3; i++) {
      run = advance(run, S, 0, true, false) // work done → break
      run = advance(run, S, 0, true, false) // break done → work
    }
    run = advance(run, S, 0, true, false) // 4th work done
    expect(run.phase).toBe('longBreak')
    expect(run.cycle).toBe(4)
    run = advance(run, S, 0, true, false)
    expect(run.phase).toBe('work')
    expect(run.cycle).toBe(0)
  })

  it('skipping work goes to a break without counting a pomodoro', () => {
    const run = skip(start(initFocus(S), 0), S, 5000)
    expect(run.phase).toBe('break')
    expect(run.cycle).toBe(0)
    expect(run.status).toBe('running')
  })
})

describe('sleep timer', () => {
  it('fires once at the end', () => {
    const run = startSleep(120, 0)
    expect(tickSleep(run, 119 * MIN).due).toBe(false)
    const res = tickSleep(run, 120 * MIN)
    expect(res.due).toBe(true)
    expect(res.run.status).toBe('fading')
    expect(tickSleep(res.run, 121 * MIN).due).toBe(false)
  })

  it('extends by 15 minutes', () => {
    expect(extendSleep(startSleep(30, 0), 0).endTime).toBe(45 * MIN)
  })
})

describe('formatClock', () => {
  it('formats mm:ss and h:mm:ss', () => {
    expect(formatClock(25 * MIN)).toBe('25:00')
    expect(formatClock(1)).toBe('00:01')
    expect(formatClock(2 * 60 * MIN)).toBe('2:00:00')
  })
})
