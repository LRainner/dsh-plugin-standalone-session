/**
 * A tiny process-local notice store backing one `shell.overlay` toast. It is
 * deliberately session-free: creation errors can happen on the New Session
 * page, where no session exists to host a native notice.
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
 * @param kind - success/informational or failure styling.
 * @param text - already-localized copy.
 */
export function showNotice(kind: NoticeKind, text: string): void {
  sequence += 1
  const notice: Notice = { id: sequence, kind, text }
  current = notice
  for (const listener of listeners) listener()
  const timer = setTimeout(() => {
    if (current?.id !== notice.id) return
    current = null
    for (const listener of listeners) listener()
  }, 6000)
  // A browser page should not be kept alive by a toast timer.
  if (typeof timer === 'object' && timer !== null && 'unref' in timer) {
    const unref = (timer as { unref?: () => void }).unref
    if (typeof unref === 'function') unref.call(timer)
  }
}

/** Dismiss the toast immediately. */
export function dismissNotice(): void {
  if (current === null) return
  current = null
  for (const listener of listeners) listener()
}
