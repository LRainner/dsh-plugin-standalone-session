/**
 * Browser-side actions shared by the sidebar entry, the command and the panel.
 * Every action reuses the native Session/Workspace controllers; none
 * re-implements chat, model selection or attachments.
 */
import { createStandaloneSession } from './create.js'
import type { ClientContext, Translate } from './dsh.js'
import { PANEL_ID } from './panels.js'
import { showNotice } from './notice.js'

/** Host home, or undefined while the connection has not delivered it. */
export function hostHome(ctx: ClientContext): string | undefined {
  try {
    return ctx.remote?.$host?.home
  } catch {
    return undefined
  }
}

/**
 * Create a standalone session without navigating. The launcher owns navigation
 * so it can decline to steal focus after the user has already moved on.
 * @param ctx - client root context.
 * @param t - localized copy.
 * @returns the created session id.
 */
export async function createStandaloneSessionId(
  ctx: ClientContext,
  t: Translate,
): Promise<string> {
  return createStandaloneSession({
    home: hostHome(ctx),
    noHomeMessage: t('error.noHome'),
    create: (options) => ctx.sessions.create(options),
  })
}

/**
 * Create a standalone session and open its native conversation.
 * @param ctx - client root context.
 * @param t - localized copy.
 * @returns the created session id.
 */
export async function startStandalone(ctx: ClientContext, t: Translate): Promise<string> {
  const sessionId = await createStandaloneSessionId(ctx, t)
  ctx.uiWorkspace.openSession(sessionId)
  return sessionId
}

/**
 * Open the existing management panel through the public layout service.
 * @param ctx - client root context.
 * @param t - localized copy.
 */
export function openManagementPanel(ctx: ClientContext, t: Translate): void {
  try {
    ctx.layout.selectPanel(PANEL_ID)
  } catch (error) {
    showNotice('error', t('toast.manageFailed', { message: messageOf(error) }))
  }
}

/**
 * Rename through the native Session face, which updates the title projection.
 * @param ctx - client root context.
 * @param sessionId - target session.
 * @param title - user-entered title.
 */
export async function renameStandalone(
  ctx: ClientContext,
  sessionId: string,
  title: string,
): Promise<void> {
  const trimmed = title.trim()
  if (trimmed === '') throw new Error('empty title')
  const result = await ctx.sessions.using(
    sessionId,
    { source: 'standaloneSessionOperation' },
    (reference) => reference.binding.session.rename(trimmed),
  )
  if (!result.ok) throw new Error(result.error.message)
}

/**
 * Delete through DSH's native archive. The host half observes the archive set
 * and performs the directory cleanup; DSH exposes no physical session delete.
 * @param ctx - client root context.
 * @param sessionId - target session.
 */
export async function archiveStandalone(ctx: ClientContext, sessionId: string): Promise<void> {
  await ctx.workspaces.archiveSession(sessionId, { stopActivity: true })
}

/** One failed session in a batch archive operation. */
export interface BatchArchiveFailure {
  readonly sessionId: string
  readonly message: string
}

/** Result of archiving a snapshot of selected sessions. */
export interface BatchArchiveResult {
  readonly archived: readonly string[]
  readonly failed: readonly BatchArchiveFailure[]
}

/**
 * Archive sessions one at a time. A failure is recorded and the remaining
 * sessions continue, so one stale row cannot strand the rest of the batch.
 * @param ctx - client root context.
 * @param sessionIds - frozen snapshot of the selected session ids.
 * @param onProgress - called after every attempt with 1-based progress.
 * @returns successfully archived ids and per-session failures.
 */
export async function archiveStandalones(
  ctx: ClientContext,
  sessionIds: readonly string[],
  onProgress?: (done: number, total: number) => void,
): Promise<BatchArchiveResult> {
  const archived: string[] = []
  const failed: BatchArchiveFailure[] = []
  for (const [index, sessionId] of sessionIds.entries()) {
    try {
      await archiveStandalone(ctx, sessionId)
      archived.push(sessionId)
    } catch (reason) {
      failed.push({ sessionId, message: messageOf(reason) })
    }
    onProgress?.(index + 1, sessionIds.length)
  }
  return { archived, failed }
}

/** Human-readable error text. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
