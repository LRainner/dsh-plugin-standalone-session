/**
 * A tiny process-local notice store backing the `shell.overlay` toast. It is
 * deliberately session-free: creation errors can happen on the New Session
 * page, where no session exists to host a native notice.
 *
 * The store only holds the current notice. Auto-dismiss timing lives in the
 * toast component so it can pause while the pointer or focus is inside.
 */
export type NoticeKind = 'info' | 'error'

export interface Notice {
  readonly id: number
  readonly kind: NoticeKind
  readonly text: string
}

let current: Notice | null = null
let sequence = 0
const listeners = new Set<() => void>()

function publish(): void {
  for (const listener of listeners) listener()
}

/** Read the current notice (stable reference between changes). */
export function getNoticeSnapshot(): Notice | null {
  return current
}

/** Subscribe to notice changes. */
export function subscribeNotice(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Show or replace the toast.
 * @param kind - informational or failure styling.
 * @param text - already-localized copy.
 */
export function showNotice(kind: NoticeKind, text: string): void {
  sequence += 1
  current = { id: sequence, kind, text }
  publish()
}

/** Dismiss the toast immediately. */
export function dismissNotice(): void {
  if (current === null) return
  current = null
  publish()
}
