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

import {
  filterSessionRows,
  formatEarlierDate,
  formatSessionTime,
  groupSessionRows,
  sessionDayKey,
  sessionTitle,
} from '../src/client/format.js'
import type { SessionRow } from '../src/client/dsh.js'

function row(id: string, updatedAt: number, overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id,
    displayTitle: id,
    cwd: `/home/u/.dsh/dsh-standalone-sessions/${id}`,
    running: false,
    blank: true,
    updatedAt,
    ...overrides,
  }
}

const localNow = new Date(2026, 0, 15, 12, 0, 0).getTime()
const day = (offset: number): number => new Date(2026, 0, 15 + offset, 9, 0, 0).getTime()

describe('local calendar grouping', () => {
  it('distinguishes today, yesterday, earlier and invalid timestamps', () => {
    expect(sessionDayKey(localNow, localNow)).toBe('today')
    expect(sessionDayKey(day(-1), localNow)).toBe('yesterday')
    expect(sessionDayKey(day(-10), localNow)).toBe('earlier')
    expect(sessionDayKey(0, localNow)).toBe('unknown')
    expect(sessionDayKey(Number.NaN, localNow)).toBe('unknown')
  })

  it('groups without reordering and omits empty groups', () => {
    const older = row('session-older', day(-10))
    const today = row('session-today', localNow)
    const yesterday = row('session-yesterday', day(-1))
    const groups = groupSessionRows([older, today, yesterday], localNow)
    expect(groups.map((group) => group.key)).toEqual(['today', 'yesterday', 'earlier'])
    expect(groups[2]?.rows).toEqual([older])
  })

  it('formats today relatively, yesterday by name, and earlier by date', () => {
    expect(formatSessionTime(t, now, now)).toBe('time.now')
    expect(formatSessionTime(t, day(-1), localNow)).toBe('time.yesterday')
    expect(formatEarlierDate(day(-10), localNow, 'en-US')).toBe('Jan 5')
    expect(formatEarlierDate(day(-10), localNow + 365 * 86_400_000, 'en-US')).toBe('Jan 5, 2026')
    expect(formatSessionTime(t, 0, localNow)).toBe('')
  })
})

describe('title search and fallback', () => {
  it('falls back from title to displayTitle to untitled', () => {
    expect(sessionTitle(row('a', now, { title: '  named  ' }), t)).toBe('named')
    expect(sessionTitle(row('a', now, { displayTitle: 'display' }), t)).toBe('display')
    expect(sessionTitle(row('a', now, { displayTitle: '' }), t)).toBe('panel.untitled')
    expect(
      sessionTitle(
        row('session-00000000-0000-4000-8000-000000000000', now, {
          displayTitle: 'session-00000000-0000-4000-8000-000000000000',
        }),
        t,
      ),
    ).toBe('panel.untitled')
  })

  it('filters case-insensitively and ignores surrounding query whitespace', () => {
    const rows = [
      row('a', now, { title: 'Release Notes' }),
      row('b', now, { title: '梳理产品需求' }),
      row('c', now, { title: 'Other' }),
    ]
    expect(filterSessionRows(rows, t, '  release ').map((item) => item.id)).toEqual(['a'])
    expect(filterSessionRows(rows, t, '需求').map((item) => item.id)).toEqual(['b'])
    expect(filterSessionRows(rows, t, '   ')).toHaveLength(3)
  })
})
