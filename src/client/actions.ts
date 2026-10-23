/**
 * Browser-side actions shared by the sidebar entry, the command and the panel.
 * Every action reuses the native Session/Workspace controllers; none
 * re-implements chat, model selection or attachments.
 */
import { createStandaloneSession } from './create.js'
import type { ClientContext, Translate } from './dsh.js'

/** Host home, or undefined while the connection has not delivered it. */
export function hostHome(ctx: ClientContext): string | undefined {
  try {
    return ctx.remote?.$host?.home
  } catch {
    return undefined
  }
}

/**
 * Create a standalone session and open its native conversation.
 * @param ctx - client root context.
 * @param t - localized copy.
 * @returns the created session id.
 */
export async function startStandalone(ctx: ClientContext, t: Translate): Promise<string> {
  return createStandaloneSession({
    home: hostHome(ctx),
    noHomeMessage: t('error.noHome'),
    create: (options) => ctx.sessions.create(options),
    open: (sessionId) => ctx.uiWorkspace.openSession(sessionId),
  })
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

/** Human-readable error text. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
