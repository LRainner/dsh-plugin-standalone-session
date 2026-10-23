/**
 * The one view adapter this plugin needs: unlock the native composer for a
 * standalone session.
 *
 * DSH's native InputBar is intentionally inert when a Session belongs to no
 * Workspace (`disabled` comes from the Conversation's workspace gate). A
 * standalone Session is exactly that state. Rather than fabricating a Workspace
 * (which would surface a fake group in the user's sidebar), this adapter wraps
 * the existing composer entry and clears only that gate. The native InputBar
 * still owns the editor, model picker, attachments, slash commands and submit
 * path; this plugin never renders a chat UI.
 *
 * The adapter is intentionally defensive: if the slot entry or its shape is
 * absent, it does nothing and the plugin's panel remains usable. It restores
 * the original component on disposal.
 */
import { createElement, useCallback, useMemo, useSyncExternalStore, type ComponentType } from 'react'
import { shouldUnlockComposer } from '../shared/standalone.js'
import type { ClientContext, SlotEntry, Translate } from './dsh.js'

const COMPOSER_SLOT = 'conversation.composer.bar'
const RECONCILE_INTERVAL_MS = 750
const LOG_PREFIX = '[standalone-session]'

/** Per-session cwd subscription used by the wrapper. */
function useSessionCwd(ctx: ClientContext, sessionId: string | undefined): string | undefined {
  const source = ctx.sessions.list
  const subscribe = useMemo(() => (listener: () => void) => source.subscribe(listener), [source])
  const getSnapshot = useCallback(
    () => (sessionId === undefined ? undefined : source.getSnapshot().byId[sessionId]?.cwd),
    [sessionId, source],
  )
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined)
}

type AnyProps = Record<string, unknown>

/**
 * Install the composer adapter for as long as the composer slot declaration
 * lives.
 * @param ctx - client root context.
 * @param t - localized copy for the unlocked placeholder.
 * @returns a disposer restoring every wrapped entry.
 */
export function patchComposer(ctx: ClientContext, t: Translate): () => void {
  const restorers = new Map<SlotEntry, () => void>()
  let disposed = false

  const restoreAll = (): void => {
    for (const [entry, restore] of restorers) {
      try {
        restore()
      } catch (error) {
        console.warn(`${LOG_PREFIX} could not restore a composer entry`, error)
      }
      restorers.delete(entry)
    }
  }

  const reconcile = (): void => {
    if (disposed) return
    let entries: readonly SlotEntry[]
    try {
      entries = ctx.slots.entries(COMPOSER_SLOT)
    } catch (error) {
      console.warn(`${LOG_PREFIX} could not read the composer slot`, error)
      return
    }
    const live = new Set(entries)
    for (const [entry, restore] of [...restorers]) {
      if (live.has(entry)) continue
      try {
        restore()
      } catch {
        // The entry is already gone; restoring is best-effort.
      }
      restorers.delete(entry)
    }
    for (const entry of entries) {
      if (restorers.has(entry)) continue
      const priority = entry.options?.priority ?? 0
      if (priority !== 0) continue
      const original = entry.component
      if (original === undefined || original === null) continue
      if (typeof original !== 'function' && typeof original !== 'object') continue
      const Wrapped = (props: AnyProps) => {
        const sessionId = typeof props.sessionId === 'string' ? props.sessionId : undefined
        const cwd = useSessionCwd(ctx, sessionId)
        if (!shouldUnlockComposer(sessionId, cwd, props.disabled === true)) {
          return createElement(original as ComponentType<AnyProps>, props)
        }
        return createElement(original as ComponentType<AnyProps>, {
          ...props,
          disabled: false,
          workspacePickerOpen: false,
          onRequestWorkspace: undefined,
          placeholder: t('composer.placeholder'),
        })
      }
      Wrapped.displayName = `StandaloneComposer(${
        (original as { displayName?: string; name?: string }).displayName ??
        (original as { name?: string }).name ??
        'native'
      })`
      try {
        entry.component = Wrapped
        restorers.set(entry, () => {
          if (entry.component === Wrapped) entry.component = original
        })
        console.info(`${LOG_PREFIX} unlocked the native composer for standalone sessions`)
      } catch (error) {
        console.warn(`${LOG_PREFIX} could not wrap the native composer entry`, error)
      }
    }
  }

  reconcile()
  let unsubscribe: (() => void) | undefined
  try {
    unsubscribe = ctx.slots.subscribe?.(COMPOSER_SLOT, reconcile)
  } catch {
    unsubscribe = undefined
  }
  const timer = setInterval(reconcile, RECONCILE_INTERVAL_MS)

  return () => {
    disposed = true
    clearInterval(timer)
    try {
      unsubscribe?.()
    } catch {
      // A disposed slot ledger has nothing to unsubscribe.
    }
    restoreAll()
  }
}
