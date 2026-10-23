/**
 * React bindings over the DSH observables this plugin reads. The raw snapshot
 * is returned; callers derive filtered arrays with `useMemo` so
 * `useSyncExternalStore` never sees a fresh object each render.
 */
import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { isStandaloneCwd } from '../shared/standalone.js'
import type {
  ClientContext,
  ObservableSnapshot,
  SessionListState,
  SessionRow,
  WorkspaceSnapshot,
} from './dsh.js'

/** Subscribe one component to an observable snapshot. */
export function useSnapshot<T>(source: ObservableSnapshot<T>): T {
  const subscribe = useMemo(() => (listener: () => void) => source.subscribe(listener), [source])
  const getSnapshot = useMemo(() => () => source.getSnapshot(), [source])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** The complete Session catalog. */
export function useSessionList(ctx: ClientContext): SessionListState {
  return useSnapshot(ctx.sessions.list)
}

/** The complete Workspace snapshot (used for the archive set). */
export function useWorkspaceSnapshot(ctx: ClientContext): WorkspaceSnapshot {
  return useSnapshot(ctx.workspaces.list)
}

/**
 * One session's durable cwd. A missing row or id yields undefined, which is
 * also the "not standalone" answer.
 * @param ctx - client root context.
 * @param sessionId - rendered session, if any.
 * @returns the session cwd, or undefined.
 */
export function useSessionCwd(ctx: ClientContext, sessionId: string | undefined): string | undefined {
  const source = ctx.sessions.list
  const subscribe = useMemo(() => (listener: () => void) => source.subscribe(listener), [source])
  const getSnapshot = useCallback(
    () => (sessionId === undefined ? undefined : source.getSnapshot().byId[sessionId]?.cwd),
    [sessionId, source],
  )
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined)
}

/**
 * Standalone rows in display order: blank sessions first, then newest activity.
 * Archived rows are excluded; the native archived view remains the restore
 * surface.
 * @param sessions - catalog snapshot.
 * @param archivedSessionIds - Host archive set.
 * @returns the standalone rows.
 */
export function standaloneRows(
  sessions: SessionListState,
  archivedSessionIds: readonly string[],
): SessionRow[] {
  const archived = new Set(archivedSessionIds)
  const rows: SessionRow[] = []
  for (const id of sessions.ids) {
    const row = sessions.byId[id]
    if (row === undefined) continue
    if (row.origin === 'subagent') continue
    if (!isStandaloneCwd(row.cwd)) continue
    if (archived.has(row.id)) continue
    rows.push(row)
  }
  rows.sort((left, right) => {
    if (left.blank !== right.blank) return left.blank ? -1 : 1
    if (right.updatedAt !== left.updatedAt) return right.updatedAt - left.updatedAt
    return left.id.localeCompare(right.id)
  })
  return rows
}

/**
 * Count standalone rows without constructing the full display list.
 * @param sessions - catalog snapshot.
 * @param archivedSessionIds - Host archive set.
 * @returns the number of live standalone sessions.
 */
export function countStandalone(
  sessions: SessionListState,
  archivedSessionIds: readonly string[],
): number {
  const archived = new Set(archivedSessionIds)
  let count = 0
  for (const id of sessions.ids) {
    const row = sessions.byId[id]
    if (row === undefined || row.origin === 'subagent') continue
    if (!isStandaloneCwd(row.cwd)) continue
    if (archived.has(row.id)) continue
    count += 1
  }
  return count
}
