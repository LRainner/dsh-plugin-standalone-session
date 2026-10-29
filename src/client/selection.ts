/**
 * Pure selection helpers for the standalone-session manager. Keeping these out
 * of the panel makes bulk-selection edge cases (pruning, select-all, partial
 * state) directly unit-testable.
 */
import type { SessionRow } from './dsh.js'

/** Toggle one session id without mutating the caller's set. */
export function toggleSelection(
  selected: ReadonlySet<string>,
  sessionId: string,
): ReadonlySet<string> {
  const next = new Set(selected)
  if (next.has(sessionId)) next.delete(sessionId)
  else next.add(sessionId)
  return next
}

/** Select every row in the current view. */
export function selectAllRows(rows: readonly SessionRow[]): ReadonlySet<string> {
  return new Set(rows.map((row) => row.id))
}

/** Rows that are still present in the current view and selected. */
export function selectedRows(
  rows: readonly SessionRow[],
  selected: ReadonlySet<string>,
): SessionRow[] {
  return rows.filter((row) => selected.has(row.id))
}

/**
 * Drop ids that disappeared from the view. Returns the original set when
 * nothing changed so callers can avoid a redundant state update.
 */
export function pruneSelection(
  rows: readonly SessionRow[],
  selected: ReadonlySet<string>,
): ReadonlySet<string> {
  if (selected.size === 0) return selected
  const live = new Set(rows.map((row) => row.id))
  let changed = false
  const next = new Set<string>()
  for (const id of selected) {
    if (live.has(id)) next.add(id)
    else changed = true
  }
  return changed ? next : selected
}

/** Select-all checkbox state for the current view. */
export function selectionState(
  rows: readonly SessionRow[],
  selected: ReadonlySet<string>,
): { readonly count: number; readonly all: boolean; readonly some: boolean } {
  const count = selectedRows(rows, selected).length
  return {
    count,
    all: rows.length > 0 && count === rows.length,
    some: count > 0 && count < rows.length,
  }
}

/** Counts used by the batch confirmation copy. */
export function batchSummary(
  rows: readonly SessionRow[],
  selected: ReadonlySet<string>,
): { readonly count: number; readonly running: number; readonly blank: number } {
  const chosen = selectedRows(rows, selected)
  return {
    count: chosen.length,
    running: chosen.filter((row) => row.running).length,
    blank: chosen.filter((row) => row.blank).length,
  }
}
