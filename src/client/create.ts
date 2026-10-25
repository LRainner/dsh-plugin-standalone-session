/**
 * The one browser-side creation path. Kept dependency-injected so the failure
 * branch is unit-tested without a DSH runtime.
 */
import { makeStandaloneCwd, mintSessionId, type UuidSource } from '../shared/standalone.js'

/** Injected collaborators for {@link createStandaloneSession}. */
export interface StandaloneCreateDeps {
  /** Host user home, from `ctx.remote.$host.home`. */
  readonly home: string | undefined
  /** Localized message used when the host home is unavailable. */
  readonly noHomeMessage: string
  /** Session Controller create. */
  create(options: { cwd: string; sessionId: string }): Promise<string>
  /** Optional navigation: show the created session's conversation. */
  open?(sessionId: string): void
  readonly randomUuid?: UuidSource
}

/** Absolute POSIX or Windows path check without importing `node:path`. */
export function isAbsoluteHostPath(path: string): boolean {
  return /^(?:[A-Za-z]:[\\/]|\\\\|\/)/.test(path)
}

/**
 * Create a standalone session with a durable marker cwd.
 *
 * Failure semantics: a throw from `create` propagates before `open`, so no
 * conversation is selected for a session that was never created. A throw from
 * `open` also propagates; the session itself remains valid and is listed by the
 * panel, which is better than deleting a session the Host already committed.
 * @param deps - injected host home, create, and optional navigation.
 * @returns the session identity returned by the Session Controller.
 */
export async function createStandaloneSession(deps: StandaloneCreateDeps): Promise<string> {
  if (typeof deps.home !== 'string' || deps.home.trim() === '') {
    throw new Error(deps.noHomeMessage)
  }
  const home = deps.home.trim()
  if (!isAbsoluteHostPath(home)) {
    throw new Error(`host home is not absolute: ${home}`)
  }
  const sessionId = mintSessionId(deps.randomUuid)
  const cwd = makeStandaloneCwd(home, sessionId)
  const created = await deps.create({ cwd, sessionId })
  deps.open?.(created)
  return created
}
