/** Human-facing time labels derived from the shared, locale-neutral delta. */
import { relativeTime } from '../shared/standalone.js'
import type { Translate } from './dsh.js'

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
