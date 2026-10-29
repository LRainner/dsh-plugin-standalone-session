import { describe, expect, it } from 'vitest'
import type { SessionRow } from '../src/client/dsh.js'
import {
  batchSummary,
  pruneSelection,
  selectAllRows,
  selectedRows,
  selectionState,
  toggleSelection,
} from '../src/client/selection.js'

function row(id: string, overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id,
    displayTitle: id,
    running: false,
    blank: true,
    updatedAt: 0,
    ...overrides,
  }
}

describe('selection helpers', () => {
  it('toggles without mutating the source set', () => {
    const source = new Set(['a'])
    const added = toggleSelection(source, 'b')
    expect([...added]).toEqual(['a', 'b'])
    expect([...source]).toEqual(['a'])
    const removed = toggleSelection(added, 'a')
    expect([...removed]).toEqual(['b'])
  })

  it('selects all current rows and reports all/some states', () => {
    const rows = [row('a'), row('b')]
    const all = selectAllRows(rows)
    expect([...all]).toEqual(['a', 'b'])
    expect(selectionState(rows, all)).toEqual({ count: 2, all: true, some: false })
    expect(selectionState(rows, new Set(['a']))).toEqual({ count: 1, all: false, some: true })
    expect(selectionState(rows, new Set())).toEqual({ count: 0, all: false, some: false })
  })

  it('returns only rows still in the view', () => {
    const rows = [row('a'), row('b')]
    expect(selectedRows(rows, new Set(['b', 'gone'])).map((r) => r.id)).toEqual(['b'])
  })

  it('prunes disappeared ids and preserves identity when nothing changes', () => {
    const rows = [row('a')]
    const stable = new Set(['a'])
    const pruned = pruneSelection(rows, new Set(['a', 'gone']))
    expect([...pruned]).toEqual(['a'])
    expect(pruneSelection(rows, stable)).toBe(stable)
    expect(pruneSelection([], new Set())).toEqual(new Set())
  })

  it('counts running and blank rows for the confirmation summary', () => {
    const rows = [
      row('a', { blank: true }),
      row('b', { blank: false, running: true }),
      row('c', { blank: false }),
    ]
    expect(batchSummary(rows, new Set(['a', 'b', 'gone']))).toEqual({
      count: 2,
      running: 1,
      blank: 1,
    })
  })
})
