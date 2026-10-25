/**
 * Pure coordination for the sidebar launcher. The launcher is a navigation
 * target whose main panel immediately creates a session; this module owns the
 * two pieces of state that must survive that panel's mounts:
 *
 * - the arm flag, set by a real click on the sidebar row and consumed by the
 *   launcher so a layout/history restore cannot silently create a session;
 * - the last bridged session id, reused while it is still blank so a misclick
 *   or a double-click does not fill the list with empty sessions.
 *
 * It deliberately has no React or DSH imports beyond the structural snapshot
 * types, which keeps the policy unit-testable.
 */
import { isStandaloneCwd } from '../shared/standalone.js'
import type { SessionListState, SessionRow } from './dsh.js'

/** How long a row click remains a valid launcher gesture. */
export const LAUNCHER_ARM_WINDOW_MS = 3_000

let armedAt = 0

/** Record a real click on the launcher row. */
export function armStandaloneLauncher(now: number = Date.now()): void {
  armedAt = now
}

/** Whether a recent real click armed the launcher, without consuming it. */
export function isStandaloneLauncherArmed(now: number = Date.now()): boolean {
  if (armedAt === 0) return false
  if (now - armedAt > LAUNCHER_ARM_WINDOW_MS) {
    armedAt = 0
    return false
  }
  return true
}

/** Consume the arm flag. */
export function clearStandaloneLauncherArm(): void {
  armedAt = 0
}

/** Result of one launcher invocation. */
export interface StandaloneLaunchResult {
  readonly sessionId: string
  readonly reused: boolean
}

/** Injected facts and effects for {@link StandaloneLaunchCoordinator}. */
export interface StandaloneLaunchDeps {
  readonly sessions: () => SessionListState
  readonly archivedSessionIds: () => readonly string[]
  readonly create: () => Promise<string>
}

/**
 * Serialize launcher creates and reuse the last blank session it created.
 * The class never opens a session; the caller owns navigation and its own
 * mounted guard.
 */
export class StandaloneLaunchCoordinator {
  private lastLauncherSessionId: string | undefined
  private inFlight: Promise<StandaloneLaunchResult> | undefined

  public constructor(private readonly deps: StandaloneLaunchDeps) {}

  /**
   * Launch one conversation: reuse the last blank bridged session when it is
   * still live, otherwise create a new one.
   * @returns the session to open and whether it was reused.
   */
  public launch(): Promise<StandaloneLaunchResult> {
    if (this.inFlight !== undefined) return this.inFlight
    const task = this.run()
    this.inFlight = task
    void task
      .finally(() => {
        if (this.inFlight === task) this.inFlight = undefined
      })
      .catch(() => {
        // The caller owns the rejection; this chain only releases the lock.
      })
    return task
  }

  private async run(): Promise<StandaloneLaunchResult> {
    const reusable = this.reusableSession()
    if (reusable !== undefined) {
      return { sessionId: reusable.id, reused: true }
    }
    const sessionId = await this.deps.create()
    this.lastLauncherSessionId = sessionId
    return { sessionId, reused: false }
  }

  private reusableSession(): SessionRow | undefined {
    const sessionId = this.lastLauncherSessionId
    if (sessionId === undefined) return undefined
    const row = this.deps.sessions().byId[sessionId]
    if (
      row === undefined ||
      row.origin === 'subagent' ||
      !isStandaloneCwd(row.cwd) ||
      !row.blank ||
      this.deps.archivedSessionIds().includes(row.id)
    ) {
      this.lastLauncherSessionId = undefined
      return undefined
    }
    return row
  }
}
