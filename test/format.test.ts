import { describe, expect, it } from 'vitest'
import type { Translate } from '../src/client/dsh.js'
import { relativeTimeLabel } from '../src/client/format.js'

const t: Translate = (key, values) => {
  if (values === undefined) return key
  return `${key}:${String(values.n ?? '')}`
}
const now = 1_700_000_000_000

describe('relativeTimeLabel', () => {
  it('localizes the now and minute/hour/day units', () => {
    expect(relativeTimeLabel(t, now - 10_000, now)).toBe('time.now')
    expect(relativeTimeLabel(t, now - 5 * 60_000, now)).toBe('time.minutes:5')
    expect(relativeTimeLabel(t, now - 3 * 3_600_000, now)).toBe('time.hours:3')
    expect(relativeTimeLabel(t, now - 2 * 86_400_000, now)).toBe('time.days:2')
  })

  it('keeps an absolute date and an invalid stamp', () => {
    const stamp = Date.UTC(2020, 0, 2)
    expect(relativeTimeLabel(t, stamp, stamp + 60 * 86_400_000)).toBe('2020-01-02')
    expect(relativeTimeLabel(t, 0, now)).toBe('')
  })
})
