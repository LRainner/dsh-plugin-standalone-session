/**
 * Host-owned durable registry and directory cleanup for standalone sessions.
 *
 * The registry is a convenience, never the browser's source of truth: the
 * session's durable cwd is the marker. This file owns the only destructive
 * filesystem work in the plugin, and every destructive path is first proved to
 * be one of this plugin's own session directories.
 */
import { mkdir, readdir, readFile, rename, rm, rmdir, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import {
  REGISTRY_FILE_NAME,
  STANDALONE_DIR_NAME,
  assertSessionId,
  cleanupPlan,
  emptyRegistry,
  isStandaloneCwd,
  listEntries,
  markArchived,
  markCleanupFailed,
  markHadMessage,
  normalizeRegistry,
  removeEntry,
  standaloneSessionIdFromCwd,
  upsertEntry,
  type StandaloneEntry,
  type StandaloneRegistryData,
} from '../shared/standalone.js'

/** Minimal logger surface; DSH's logger and tests both satisfy it. */
export interface RegistryLogger {
  info(message: string): void
  warn(message: string): void
}

/** Default logger: console with the plugin's uniform prefix. */
export function prefixedLogger(prefix = '[standalone-session]'): RegistryLogger {
  return {
    info: (message) => console.log(`${prefix} ${message}`),
    warn: (message) => console.warn(`${prefix} ${message}`),
  }
}

/** Outcome of one session-directory cleanup. */
export type CleanupOutcome =
  | { readonly kind: 'removed' }
  | { readonly kind: 'retained'; readonly reason: string }
  | { readonly kind: 'failed'; readonly error: string }

/** Facts used by {@link cleanupSessionDirectory}; injectable for tests. */
export interface DirectoryOps {
  stat(path: string): Promise<{ isDirectory(): boolean }>
  rm(path: string, options: { recursive: true; force: true }): Promise<void>
}

const defaultDirectoryOps: DirectoryOps = {
  stat: (path) => stat(path),
  rm: (path, options) => rm(path, options),
}

/** Hidden marker kept inside every session directory so empty-dir sweeps leave it alone. */
export const STANDALONE_KEEP_FILE = '.dsh-standalone-session'

/**
 * Create the hidden ownership marker once. The marker makes the directory
 * non-empty, so the orphan sweep cannot mistake a live-but-empty session
 * workspace for abandoned cache residue.
 * @param directory - own session directory.
 */
export async function ensureStandaloneKeepFile(directory: string): Promise<void> {
  try {
    await writeFile(join(directory, STANDALONE_KEEP_FILE), 'standalone session\n', {
      encoding: 'utf8',
      flag: 'wx',
    })
  } catch (error) {
    if (errorCode(error) !== 'EEXIST') throw error
  }
}

/** Error code reader that works for plain `Error` and Node's `ErrnoException`. */
function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? code : undefined
}

/** Diagnostic text without a stack trace. */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Whether one path is inside another (same path counts).
 * @param parent - containing directory.
 * @param child - candidate path.
 * @returns true when `child` is at or below `parent` lexically.
 */
export function isPathInside(parent: string, child: string): boolean {
  const rel = relative(resolve(parent), resolve(child))
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

/**
 * Whether the record's cwd is structurally one of this plugin's session
 * directories: an absolute path whose final segment is the session id and
 * whose parent is the standalone marker directory. This remains true when a
 * custom `DSH_HOME` puts the root somewhere other than this process's root.
 * @param entry - registry record.
 * @returns whether deletion may target that directory.
 */
export function isOwnedSessionDirectory(entry: StandaloneEntry): boolean {
  if (!isAbsolute(entry.cwd)) return false
  if (!isStandaloneCwd(entry.cwd)) return false
  if (standaloneSessionIdFromCwd(entry.cwd) !== entry.sessionId) return false
  return (
    basename(resolve(entry.cwd)) === entry.sessionId &&
    basename(dirname(resolve(entry.cwd))).toLowerCase() === STANDALONE_DIR_NAME
  )
}

/**
 * Remove one session directory according to its record. Never deletes a path
 * that is not the record's own session directory.
 * @param entry - registry record.
 * @param ops - filesystem operations, injectable for tests.
 * @param logger - diagnostic sink.
 * @returns the cleanup outcome.
 */
export async function cleanupSessionDirectory(
  entry: StandaloneEntry,
  ops: DirectoryOps = defaultDirectoryOps,
  logger: RegistryLogger = prefixedLogger(),
): Promise<CleanupOutcome> {
  if (!isOwnedSessionDirectory(entry)) {
    const error = `refusing to clean ${JSON.stringify(entry.cwd)}: not this plugin's session directory`
    logger.warn(error)
    return { kind: 'failed', error }
  }
  const target = resolve(entry.cwd)
  let exists = false
  try {
    const info = await ops.stat(target)
    exists = info.isDirectory()
  } catch (error) {
    if (errorCode(error) !== 'ENOENT') {
      const message = `could not inspect ${target}: ${errorMessage(error)}`
      logger.warn(message)
      return { kind: 'failed', error: message }
    }
  }

  let empty = true
  if (exists) {
    try {
      empty = (await readdir(target)).length === 0
    } catch (error) {
      if (errorCode(error) !== 'ENOENT') {
        const message = `could not list ${target}: ${errorMessage(error)}`
        logger.warn(message)
        return { kind: 'failed', error: message }
      }
    }
  }

  const plan = cleanupPlan(entry, { exists, empty })
  try {
    switch (plan.action) {
      case 'remove-entry':
        logger.info(`session directory already gone: ${target}`)
        return { kind: 'removed' }
      case 'remove-tree':
        await ops.rm(target, { recursive: true, force: true })
        logger.info(`removed standalone session directory: ${target}`)
        return { kind: 'removed' }
      case 'keep':
        logger.info(`retained standalone session directory: ${target}`)
        return { kind: 'retained', reason: plan.reason }
      default: {
        const exhaustive: never = plan
        return exhaustive
      }
    }
  } catch (error) {
    const message = `failed to clean ${target}: ${errorMessage(error)}`
    logger.warn(message)
    return { kind: 'failed', error: message }
  }
}

/**
 * Durable registry with serialized, atomic writes.
 *
 * Every mutation runs on one promise chain, so concurrent session
 * announcements cannot lose each other's records. A failed write keeps the
 * in-memory value and surfaces the error to the caller; the next write retries
 * the complete document.
 */
export class DurableStandaloneRegistry {
  readonly rootDir: string
  readonly filePath: string
  private data: StandaloneRegistryData = emptyRegistry()
  private queue: Promise<void> = Promise.resolve()
  private loadPromise: Promise<void> | undefined
  private loaded = false
  private readonly logger: RegistryLogger
  private readonly ops: DirectoryOps

  /**
   * @param rootDir - directory holding session directories and the registry file.
   * @param logger - diagnostic sink.
   * @param ops - directory operations, injectable for tests.
   */
  constructor(
    rootDir: string,
    logger: RegistryLogger = prefixedLogger(),
    ops: DirectoryOps = defaultDirectoryOps,
  ) {
    this.rootDir = resolve(rootDir)
    this.filePath = join(this.rootDir, REGISTRY_FILE_NAME)
    this.logger = logger
    this.ops = ops
  }

  /** Load the registry once, recovering a corrupt file by moving it aside. */
  load(): Promise<void> {
    this.loadPromise ??= this.loadOnce()
    return this.loadPromise
  }

  private async loadOnce(): Promise<void> {
    await mkdir(this.rootDir, { recursive: true })
    try {
      const text = await readFile(this.filePath, 'utf8')
      this.data = normalizeRegistry(JSON.parse(text))
      this.loaded = true
      return
    } catch (error) {
      if (errorCode(error) !== 'ENOENT') {
        const backup = `${this.filePath}.corrupt-${Date.now()}`
        try {
          await rename(this.filePath, backup)
          this.logger.warn(`registry was unreadable; moved it to ${backup}: ${errorMessage(error)}`)
        } catch (moveError) {
          this.logger.warn(
            `registry was unreadable and could not be moved aside: ${errorMessage(moveError)}`,
          )
        }
      }
      this.data = emptyRegistry()
      this.loaded = true
    }
  }

  /** Current immutable snapshot. */
  snapshot(): StandaloneRegistryData {
    return this.data
  }

  /** All records in stable id order. */
  list(): StandaloneEntry[] {
    return listEntries(this.data)
  }

  /** One record, if present. */
  get(sessionId: string): StandaloneEntry | undefined {
    return this.data.sessions[sessionId]
  }

  /** Await every queued mutation. */
  async flush(): Promise<void> {
    await this.queue
  }

  /**
   * Announce one standalone session (idempotent).
   * @param summary - Host session summary facts.
   */
  async announce(summary: {
    readonly sessionId: string
    readonly cwd?: string
    readonly blank?: boolean
  }): Promise<void> {
    let sessionId: string
    try {
      sessionId = assertSessionId(summary.sessionId)
    } catch {
      return
    }
    if (typeof summary.cwd !== 'string' || !isStandaloneCwd(summary.cwd)) return
    const existing = this.data.sessions[sessionId]
    const entry: StandaloneEntry = {
      sessionId,
      cwd: summary.cwd,
      standalone: true,
      createdAt: existing?.createdAt ?? Date.now(),
      hadMessage: existing?.hadMessage === true,
    }
    await this.mutate((data) => upsertEntry(data, entry))
  }

  /**
   * Mark one session as having carried a user-authored durable message.
   * @param sessionId - session identity.
   */
  async markActivity(sessionId: string): Promise<void> {
    if (this.data.sessions[sessionId] === undefined) return
    await this.mutate((data) => markHadMessage(data, sessionId))
  }

  /**
   * Mark archived sessions and clean the ones whose archive is visible.
   * @param archivedSessionIds - the Host's complete archive set.
   * @returns cleanup outcomes keyed by session.
   */
  async reconcileArchived(
    archivedSessionIds: ReadonlySet<string>,
    stillArchived?: (sessionId: string) => boolean,
    liveSessionIds?: ReadonlySet<string>,
  ): Promise<ReadonlyMap<string, CleanupOutcome>> {
    const outcomes = new Map<string, CleanupOutcome>()
    if (archivedSessionIds.size === 0) return outcomes
    for (const entry of this.list()) {
      if (!archivedSessionIds.has(entry.sessionId)) continue
      // An unarchive can land between the snapshot and the unlink; never
      // destroy a directory that the Host no longer reports as archived.
      if (stillArchived !== undefined && !stillArchived(entry.sessionId)) continue
      // A stale archive snapshot must never remove the cwd of a live session.
      if (liveSessionIds?.has(entry.sessionId) === true) continue
      await this.mutate((data) => markArchived(data, entry.sessionId))
      const outcome = await cleanupSessionDirectory(entry, this.ops, this.logger)
      outcomes.set(entry.sessionId, outcome)
      if (outcome.kind === 'failed') {
        await this.mutate((data) =>
          markCleanupFailed(data, entry.sessionId, outcome.error),
        )
      } else {
        await this.mutate((data) => removeEntry(data, entry.sessionId))
      }
    }
    return outcomes
  }

  /**
   * Recreate directories for live standalone records when they are missing.
   * Session creation accepts a cwd without creating it, so a blank session can
   * otherwise reach its first run with no working directory. Archived records
   * are deliberately skipped; their directory may have been cleaned already.
   * @param liveSessionIds - identities the Host currently holds, or undefined
   *   to repair every unarchived registry record.
   * @returns identities whose directory was created.
   */
  async ensureDirectories(liveSessionIds?: ReadonlySet<string>): Promise<string[]> {
    const created: string[] = []
    for (const entry of this.list()) {
      if (entry.archived === true) continue
      if (liveSessionIds !== undefined && !liveSessionIds.has(entry.sessionId)) continue
      if (!isPathInside(this.rootDir, entry.cwd)) continue
      if (!isOwnedSessionDirectory(entry)) continue
      try {
        const existing = await stat(entry.cwd).catch((error: unknown) => {
          if (errorCode(error) === 'ENOENT') return undefined
          throw error
        })
        if (existing !== undefined) {
          await ensureStandaloneKeepFile(entry.cwd)
          continue
        }
        await mkdir(entry.cwd, { recursive: true })
        await ensureStandaloneKeepFile(entry.cwd)
        created.push(entry.sessionId)
        this.logger.info(`recreated missing standalone session directory: ${entry.cwd}`)
      } catch (error) {
        this.logger.warn(
          `could not ensure session directory ${entry.cwd}: ${errorMessage(error)}`,
        )
      }
    }
    return created
  }

  /**
   * Remove old empty session directories that neither the registry nor the
   * live session store references. These are the residue of a failed create or
   * a crash between mkdir and the session announcement.
   * @param liveSessionIds - identities the Host currently holds.
   * @param minimumAgeMs - only directories older than this are eligible.
   * @returns identities whose directory was removed.
   */
  async sweepOrphanDirectories(
    liveSessionIds: ReadonlySet<string>,
    minimumAgeMs = 60_000,
  ): Promise<string[]> {
    let names: string[]
    try {
      names = await readdir(this.rootDir)
    } catch (error) {
      this.logger.warn(`could not list the standalone root: ${errorMessage(error)}`)
      return []
    }
    const removed: string[] = []
    const now = Date.now()
    for (const name of names) {
      if (!name.startsWith('session-')) continue
      if (this.data.sessions[name] !== undefined) continue
      if (liveSessionIds.has(name)) continue
      const target = join(this.rootDir, name)
      try {
        const info = await stat(target)
        if (!info.isDirectory()) continue
        if (now - info.mtimeMs < minimumAgeMs) continue
        if ((await readdir(target)).length > 0) continue
        await rmdir(target)
        removed.push(name)
        this.logger.info(`removed orphan standalone session directory: ${target}`)
      } catch (error) {
        if (errorCode(error) !== 'ENOENT') {
          this.logger.warn(`could not reclaim orphan ${target}: ${errorMessage(error)}`)
        }
      }
    }
    return removed
  }

  /**
   * Apply one pure mutation and persist it when the reference changed.
   * @param mutator - pure registry transform.
   */
  private async mutate(
    mutator: (data: StandaloneRegistryData) => StandaloneRegistryData,
  ): Promise<void> {
    const run = async (): Promise<void> => {
      if (!this.loaded) await this.load()
      const next = mutator(this.data)
      if (next === this.data) return
      this.data = next
      await this.write()
    }
    const pending = this.queue.then(run, run)
    this.queue = pending.then(
      () => undefined,
      () => undefined,
    )
    await pending
  }

  /** Atomically replace the registry file. */
  private async write(): Promise<void> {
    const temporary = `${this.filePath}.tmp-${process.pid}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`
    const body = `${JSON.stringify(this.data, null, 2)}\n`
    try {
      await writeFile(temporary, body, 'utf8')
      await rename(temporary, this.filePath)
    } catch (error) {
      await rm(temporary, { force: true }).catch(() => undefined)
      this.logger.warn(`could not persist the standalone registry: ${errorMessage(error)}`)
      throw error
    }
  }
}
