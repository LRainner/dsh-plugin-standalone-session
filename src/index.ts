/**
 * Host half of `dsh-plugin-standalone-session`.
 *
 * It owns two things, neither of which changes a Session's data model:
 *
 * 1. A durable registry of standalone sessions, keyed by the marker already
 *    present in their `cwd` (`<DSH_HOME>/dsh-standalone-sessions/<id>`).
 * 2. Best-effort cleanup of that directory once the session is archived
 *    (the native delete gesture). A session that ever carried a user message
 *    keeps its directory so an unarchive can resume; an unused one is removed.
 *
 * No workspace is created, attached or detached. The browser half unlocks the
 * native composer for these sessions, so the host never needs a synthetic
 * workspace and the user's workspace list stays untouched.
 */
import { mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  STANDALONE_DIR_NAME,
  assertSessionId,
  isStandaloneCwd,
} from './shared/standalone.js'
import {
  DurableStandaloneRegistry,
  ensureStandaloneKeepFile,
  prefixedLogger,
  type RegistryLogger,
} from './host/registry.js'

/** Cordis function-plugin name. */
export const name = 'standalone-session'

/** The tidy shape of the events this plugin listens to. */
interface SessionAddedSummary {
  readonly sessionId?: string
  readonly cwd?: string
  readonly blank?: boolean
}

/** The narrow Host context surface this plugin uses. */
export interface StandaloneHostContext {
  on(event: 'api-session/added', listener: (summary: SessionAddedSummary) => void): unknown
  on(event: 'api-session/activity', listener: (sessionId: string) => void): unknown
  effect(execute: () => (() => void) | void, label?: string): unknown
  get(name: string): unknown
  root?: { get?: (name: string) => unknown }
  logger?: Partial<RegistryLogger>
}

/** Interval between archive/cleanup observations. */
const SWEEP_INTERVAL_MS = 2_000

/** Delay before the first sweep, letting restore announce its sessions. */
const FIRST_SWEEP_DELAY_MS = 1_500

/** Read one property without letting a hostile getter break the plugin. */
function readProperty(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null) return undefined
  try {
    return (value as Record<string, unknown>)[key]
  } catch {
    return undefined
  }
}

/**
 * Resolve the standalone root from the OS home.
 *
 * The browser half only receives `$host.home`, so both halves must agree on
 * this path. DSH's default home is `~/.dsh`; a custom `DSH_HOME` moves DSH's
 * own profile data but not this plugin's dedicated directory. Keeping the two
 * halves in agreement is more important than following a custom harness home.
 * @param home - OS home, injectable for tests.
 * @returns `<home>/.dsh/dsh-standalone-sessions`.
 */
export function resolveStandaloneRoot(home: string = homedir()): string {
  return join(home, '.dsh', STANDALONE_DIR_NAME)
}

/**
 * Find the Host workspace registry without requiring it at load time. The
 * registry may be mounted after this plugin, and a desktop composition can
 * expose it only on the root context.
 * @param ctx - Host plugin context.
 * @returns the registry, or undefined when this composition has none.
 */
function resolveWorkspaceRegistry(ctx: StandaloneHostContext): unknown {
  const candidates = [ctx.root?.get?.('workspaceRegistry'), ctx.get('workspaceRegistry')]
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null) return candidate
  }
  return undefined
}

/**
 * Collect the identities the Host session store currently holds. Used only to
 * avoid reclaiming a directory a live session still owns.
 * @param ctx - Host plugin context.
 * @returns the live identity set.
 */
function collectLiveSessionIds(ctx: StandaloneHostContext): Set<string> {
  const ids = new Set<string>()
  const store = ctx.get('sessions')
  const list = readProperty(store, 'list')
  if (typeof list !== 'function') return ids
  let sessions: unknown
  try {
    sessions = (list as () => unknown).call(store)
  } catch {
    return ids
  }
  if (!Array.isArray(sessions)) return ids
  for (const session of sessions) {
    const id = readProperty(session, 'id') ?? readProperty(readProperty(session, 'header'), 'id')
    if (typeof id === 'string') ids.add(id)
  }
  return ids
}

/**
 * Read the Host archive set from the workspace registry.
 * @param registry - Host workspace registry.
 * @returns the complete archived identity set.
 */
function readArchivedIds(registry: unknown): Set<string> {
  let value: unknown
  try {
    value = readProperty(registry, 'archivedSessionIds')
  } catch {
    return new Set()
  }
  if (!Array.isArray(value)) return new Set()
  return new Set(value.filter((id): id is string => typeof id === 'string'))
}

/**
 * Register the host half.
 * @param ctx - Cordis Host context.
 */
export function apply(ctx: StandaloneHostContext): void {
  const baseLogger = prefixedLogger()
  const logger: RegistryLogger = {
    info: (message: string) => {
      const write = ctx.logger?.info
      if (write === undefined) baseLogger.info(message)
      else write.call(ctx.logger, message)
    },
    warn: (message: string) => {
      const write = ctx.logger?.warn
      if (write === undefined) baseLogger.warn(message)
      else write.call(ctx.logger, message)
    },
  }
  const root = resolveStandaloneRoot()
  const registry = new DurableStandaloneRegistry(root, logger)
  logger.info(`standalone session root: ${root}`)

  let disposed = false
  let sweeping = false

  const sweep = async (): Promise<void> => {
    if (disposed || sweeping) return
    sweeping = true
    try {
      const liveSessionIds = collectLiveSessionIds(ctx)
      const workspaceRegistry = resolveWorkspaceRegistry(ctx)
      if (workspaceRegistry !== undefined) {
        const outcomes = await registry.reconcileArchived(
          readArchivedIds(workspaceRegistry),
          (sessionId) => readArchivedIds(workspaceRegistry).has(sessionId),
          liveSessionIds,
        )
        for (const [sessionId, outcome] of outcomes) {
          if (outcome.kind === 'failed') {
            logger.warn(`cleanup for ${sessionId} will be retried: ${outcome.error}`)
          }
        }
      } else {
        logger.warn('workspace registry is unavailable; archive cleanup is deferred')
      }
      await registry.ensureDirectories(liveSessionIds)
      await registry.sweepOrphanDirectories(liveSessionIds)
    } catch (error) {
      logger.warn(`cleanup sweep failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      sweeping = false
    }
  }

  const ready = registry.load().catch((error: unknown) => {
    logger.warn(`registry load failed: ${error instanceof Error ? error.message : String(error)}`)
  })

  ctx.on('api-session/added', (summary) => {
    const sessionId = summary?.sessionId
    const cwd = summary?.cwd
    if (typeof sessionId !== 'string' || typeof cwd !== 'string') return
    if (!isStandaloneCwd(cwd)) return
    let ownedId: string
    try {
      ownedId = assertSessionId(sessionId)
    } catch {
      return
    }
    if (resolve(cwd) !== resolve(join(root, ownedId))) {
      logger.warn(`ignored standalone cwd outside the plugin root: ${cwd}`)
      return
    }
    logger.info(`observed standalone session ${sessionId}`)
    void ready
      .then(async () => {
        try {
          await mkdir(cwd, { recursive: true })
          await ensureStandaloneKeepFile(cwd)
        } catch (error) {
          logger.warn(
            `could not create ${cwd}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
        await registry.announce({ sessionId, cwd, blank: summary.blank })
      })
      .catch((error: unknown) => {
        logger.warn(
          `could not record ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
        )
      })
  })

  ctx.on('api-session/activity', (sessionId) => {
    if (typeof sessionId !== 'string') return
    void ready.then(() => registry.markActivity(sessionId)).catch((error: unknown) => {
      logger.warn(
        `could not mark activity: ${error instanceof Error ? error.message : String(error)}`,
      )
    })
  })

  ctx.effect(() => {
    disposed = false
    const first = setTimeout(() => {
      void ready.then(sweep)
    }, FIRST_SWEEP_DELAY_MS)
    const timer = setInterval(() => {
      void ready.then(sweep)
    }, SWEEP_INTERVAL_MS)
    return () => {
      disposed = true
      clearTimeout(first)
      clearInterval(timer)
    }
  }, 'standalone-session: archive cleanup')
}
