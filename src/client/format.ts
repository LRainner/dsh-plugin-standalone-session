/** Human-facing time labels derived from the shared, locale-neutral delta. */
import { relativeTime } from '../shared/standalone.js'
import type { SessionRow, Translate } from './dsh.js'

/**
 * Localize `relativeTime` output. The shared helper stays locale-neutral for
 * non-UI callers; this adapter maps its compact m/h/d units to copy.
 * @param t - localized copy.
 * @param timestamp - last update time.
 * @param now - injectable clock for tests.
 * @returns localized relative time, or an empty string for an invalid stamp.
 */
export function relativeTimeLabel(
  t: Translate,
  timestamp: number,
  now: number = Date.now(),
): string {
  const raw = relativeTime(timestamp, now)
  if (raw === '') return ''
  if (raw === 'now') return t('time.now')
  const match = /^(\d+)([mhd])$/.exec(raw)
  if (match === null) return raw
  const n = Number(match[1])
  if (match[2] === 'm') return t('time.minutes', { n })
  if (match[2] === 'h') return t('time.hours', { n })
  return t('time.days', { n })
}


/** Natural-day bucket used by the manager list. */
export type SessionDayKey = 'today' | 'yesterday' | 'earlier' | 'unknown'

/** One rendered date group; empty groups are omitted by the caller. */
export interface SessionDayGroup {
  readonly key: SessionDayKey
  readonly rows: readonly SessionRow[]
}

/** Start of the local calendar day containing `timestamp`. */
function localDayStart(timestamp: number): number {
  const date = new Date(timestamp)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/**
 * Classify a timestamp against the user's local calendar day. Fixed 24-hour
 * deltas are deliberately not used: "yesterday" is the previous local date,
 * including across DST changes.
 * @param timestamp - session update time.
 * @param now - injectable clock.
 * @returns the day bucket.
 */
export function sessionDayKey(timestamp: number, now: number = Date.now()): SessionDayKey {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return 'unknown'
  const day = localDayStart(timestamp)
  const today = localDayStart(now)
  if (day === today || day > today) return 'today'
  if (day === localDayStart(today - 86_400_000)) return 'yesterday'
  return 'earlier'
}

/** Browser/UI locale for absolute date labels. */
export function activeLocale(): string {
  if (typeof document !== 'undefined' && document.documentElement.lang !== '') {
    return document.documentElement.lang
  }
  if (typeof navigator !== 'undefined' && navigator.language !== '') return navigator.language
  return 'en'
}

/** Earlier-than-yesterday date label; includes the year when it differs. */
export function formatEarlierDate(
  timestamp: number,
  now: number = Date.now(),
  locale: string = activeLocale(),
): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return ''
  const date = new Date(timestamp)
  const current = new Date(now)
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() === current.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date)
}

/**
 * Human-facing timestamp for one row: relative today, "Yesterday", then an
 * absolute local date. Invalid values return an empty string.
 */
export function formatSessionTime(
  t: Translate,
  timestamp: number,
  now: number = Date.now(),
  locale: string = activeLocale(),
): string {
  switch (sessionDayKey(timestamp, now)) {
    case 'today':
      return relativeTimeLabel(t, timestamp, now)
    case 'yesterday':
      return t('time.yesterday')
    case 'earlier':
      return formatEarlierDate(timestamp, now, locale)
    default:
      return ''
  }
}

/** Title fallback: trimmed title, then displayTitle, then localized untitled. */
export function sessionTitle(row: SessionRow, t: Translate): string {
  const title = row.title?.trim()
  if (title) return title
  const display = row.displayTitle?.trim()
  // DSH uses the session id as the synthetic display title until a real title
  // lands; do not leak that implementation detail into the manager rows.
  if (display && display !== row.id && !/^session-[0-9a-f-]{36}$/i.test(display)) {
    return display
  }
  return t('panel.untitled')
}

/**
 * Case-insensitive substring filter over the visible session title only.
 * @param rows - current standalone rows.
 * @param t - localized copy.
 * @param query - user query; surrounding whitespace is ignored.
 * @returns rows in their incoming order.
 */
export function filterSessionRows(
  rows: readonly SessionRow[],
  t: Translate,
  query: string,
): SessionRow[] {
  const needle = query.trim().toLocaleLowerCase()
  if (needle === '') return [...rows]
  return rows.filter((row) => sessionTitle(row, t).toLocaleLowerCase().includes(needle))
}

/**
 * Group rows into Today, Yesterday, Earlier and Unknown without reordering.
 * @param rows - already sorted/filtered rows.
 * @param now - injectable clock.
 * @returns non-empty groups in display order.
 */
export function groupSessionRows(
  rows: readonly SessionRow[],
  now: number = Date.now(),
): SessionDayGroup[] {
  const buckets: Record<SessionDayKey, SessionRow[]> = {
    today: [],
    yesterday: [],
    earlier: [],
    unknown: [],
  }
  for (const row of rows) buckets[sessionDayKey(row.updatedAt, now)].push(row)
  const order: SessionDayKey[] = ['today', 'yesterday', 'earlier', 'unknown']
  return order
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({ key, rows: buckets[key] }))
}
