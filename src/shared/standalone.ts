/**
 * Pure, platform-neutral rules shared by the host half, the browser half and
 * the tests. Nothing here touches `node:fs`, the DSH runtime or the DOM.
 *
 * The durable standalone marker is the session's own working directory: the
 * host and the browser both mint and recognize
 * `<DSH_HOME>/dsh-standalone-sessions/<sessionId>`. A host-owned JSON registry
 * records richer lifecycle facts (first user message, cleanup state), but the
 * browser never depends on reading that file: the session's durable `cwd`
 * already carries the marker across restarts.
 */

/** Directory under the DSH home that owns every standalone session cwd. */
export const STANDALONE_DIR_NAME = 'dsh-standalone-sessions'

/** Prefix for every session identity this plugin mints. */
export const SESSION_ID_PREFIX = 'session-'

/** Schema version of the host-owned registry file. */
export const REGISTRY_VERSION = 1 as const

/** Name of the host-owned registry file inside the standalone root. */
export const REGISTRY_FILE_NAME = 'registry.json'

/** One durable standalone-session record. */
export interface StandaloneEntry {
  readonly sessionId: string
  readonly cwd: string
  /** Durable marker; never inferred from a missing workspace id. */
  readonly standalone: true
  readonly createdAt: number
  /** Whether a user-authored durable message was ever observed. */
  readonly hadMessage: boolean
  /** Set once the session is archived (the native delete gesture). */
  readonly archived?: boolean
  /** Set when the host could not remove the session directory. */
  readonly cleanupFailed?: boolean
  readonly cleanupError?: string
  readonly cleanedAt?: number
}

/** The complete registry payload written to disk. */
export interface StandaloneRegistryData {
  readonly version: typeof REGISTRY_VERSION
  readonly sessions: Readonly<Record<string, StandaloneEntry>>
}

/** A cleanup decision derived from a record and the directory's live state. */
export type CleanupPlan =
  | { readonly action: 'remove-entry'; readonly reason: 'missing' }
  | { readonly action: 'remove-tree'; readonly reason: 'never-used' }
  | { readonly action: 'keep'; readonly reason: 'used' | 'not-empty' }

/** Injectable random UUID source used by tests. */
export type UuidSource = () => string

/** An empty registry payload. */
export function emptyRegistry(): StandaloneRegistryData {
  return { version: REGISTRY_VERSION, sessions: {} }
}

/** Lowercase path segments, treating both separators as boundaries. */
function pathSegments(path: string): string[] {
  return path.split(/[\\/]+/).filter((segment) => segment !== '')
}

/**
 * Whether a session cwd carries this plugin's standalone marker segment with a
 * session child below it. The comparison is case-insensitive so a shared home
 * path mounted with different casing still classifies correctly.
 * @param cwd - session working directory, if any.
 * @returns whether the cwd lives below a `dsh-standalone-sessions` directory.
 */
export function isStandaloneCwd(cwd: string | undefined | null): boolean {
  if (typeof cwd !== 'string' || cwd.trim() === '') return false
  const segments = pathSegments(cwd)
  for (let index = 0; index < segments.length - 1; index += 1) {
    if (segments[index]?.toLowerCase() === STANDALONE_DIR_NAME) return true
  }
  return false
}

/**
 * The final path segment of a standalone cwd, when the cwd is one.
 * @param cwd - session working directory.
 * @returns the segment below the standalone root, or undefined.
 */
export function standaloneSessionIdFromCwd(cwd: string | undefined | null): string | undefined {
  if (!isStandaloneCwd(cwd)) return undefined
  const segments = pathSegments(cwd ?? '')
  const last = segments.at(-1)
  return last === undefined || last === '' ? undefined : last
}

/**
 * Join path segments with the separator family the base path already uses.
 * Kept browser-safe: no `node:path` import.
 * @param base - absolute base path.
 * @param segments - child names; traversal segments are rejected.
 * @returns the joined path.
 */
export function joinPath(base: string, ...segments: string[]): string {
  const separator = base.includes('\\') && !base.includes('/') ? '\\' : '/'
  const trimmed = base.replace(/[\\/]+$/, '')
  const children = segments.filter((segment) => segment !== '')
  for (const child of children) {
    if (child === '.' || child === '..' || child.includes('/') || child.includes('\\')) {
      throw new Error(`invalid path segment: ${JSON.stringify(child)}`)
    }
  }
  return children.length === 0 ? trimmed : `${trimmed}${separator}${children.join(separator)}`
}

/**
 * Default root for standalone session directories under an OS home.
 * @param home - host user home directory.
 * @returns `<home>/.dsh/dsh-standalone-sessions`.
 */
export function defaultStandaloneRoot(home: string): string {
  return joinPath(home, '.dsh', STANDALONE_DIR_NAME)
}

/**
 * Mint one standalone session cwd.
 * @param home - host user home directory.
 * @param sessionId - the pre-minted session identity.
 * @returns the session directory below the default standalone root.
 */
export function makeStandaloneCwd(home: string, sessionId: string): string {
  assertSessionId(sessionId)
  return joinPath(defaultStandaloneRoot(home), sessionId)
}

/**
 * Reject ids that could escape the standalone root when used as a directory.
 * @param sessionId - candidate identity.
 * @returns the identity, typed as a plain string.
 */
export function assertSessionId(sessionId: unknown): string {
  if (typeof sessionId !== 'string' || sessionId === '' || sessionId.length > 200) {
    throw new Error('invalid standalone session id')
  }
  if (!sessionId.startsWith(SESSION_ID_PREFIX)) {
    throw new Error(`standalone session id must start with "${SESSION_ID_PREFIX}"`)
  }
  if (sessionId.includes('/') || sessionId.includes('\\') || sessionId === '.' || sessionId === '..') {
    throw new Error('standalone session id must not contain a path separator')
  }
  return sessionId
}

/**
 * One RFC 4122 version-4 UUID, with a non-cryptographic fallback for hosts
 * without `crypto.randomUUID` (the identity is a directory name, not a secret).
 * @returns a lowercase UUID string.
 */
export function randomUuid(): string {
  const source = globalThis.crypto
  if (source !== undefined && typeof source.randomUUID === 'function') return source.randomUUID()
  const bytes = new Uint8Array(16)
  if (source !== undefined && typeof source.getRandomValues === 'function') {
    source.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Mint a DSH-shaped session identity.
 * @param uuidSource - UUID source, injectable for deterministic tests.
 * @returns `session-<uuid>`.
 */
export function mintSessionId(uuidSource: UuidSource = randomUuid): string {
  const uuid = uuidSource()
  return assertSessionId(`${SESSION_ID_PREFIX}${uuid}`)
}

/** Immutable copy of one registry map. */
function cloneSessions(
  sessions: Readonly<Record<string, StandaloneEntry>>,
): Record<string, StandaloneEntry> {
  const copy: Record<string, StandaloneEntry> = {}
  for (const [id, entry] of Object.entries(sessions)) copy[id] = entry
  return copy
}

/**
 * Validate and normalize an unknown on-disk registry payload. Malformed entries
 * are dropped rather than repaired into a wrong directory.
 * @param value - parsed JSON value.
 * @returns a complete registry payload.
 */
export function normalizeRegistry(value: unknown): StandaloneRegistryData {
  if (typeof value !== 'object' || value === null) return emptyRegistry()
  const sessions = (value as { sessions?: unknown }).sessions
  if (typeof sessions !== 'object' || sessions === null) return emptyRegistry()
  const normalized: Record<string, StandaloneEntry> = {}
  for (const [id, raw] of Object.entries(sessions as Record<string, unknown>)) {
    if (typeof raw !== 'object' || raw === null) continue
    const candidate = raw as Record<string, unknown>
    let sessionId: string
    try {
      sessionId = assertSessionId(id)
    } catch {
      continue
    }
    if (typeof candidate.cwd !== 'string' || !isStandaloneCwd(candidate.cwd)) continue
    if (standaloneSessionIdFromCwd(candidate.cwd) !== sessionId) continue
    const createdAt =
      typeof candidate.createdAt === 'number' && Number.isFinite(candidate.createdAt)
        ? candidate.createdAt
        : Date.now()
    const entry: StandaloneEntry = {
      sessionId,
      cwd: candidate.cwd,
      standalone: true,
      createdAt,
      hadMessage: candidate.hadMessage === true,
      ...(candidate.archived === true ? { archived: true } : {}),
      ...(candidate.cleanupFailed === true ? { cleanupFailed: true } : {}),
      ...(typeof candidate.cleanupError === 'string'
        ? { cleanupError: candidate.cleanupError }
        : {}),
      ...(typeof candidate.cleanedAt === 'number' && Number.isFinite(candidate.cleanedAt)
        ? { cleanedAt: candidate.cleanedAt }
        : {}),
    }
    normalized[sessionId] = entry
  }
  return { version: REGISTRY_VERSION, sessions: normalized }
}

/**
 * Insert or refresh one session record. An existing record keeps the original
 * creation time and its first-message fact; the cwd always follows the observed
 * session header so a moved home cannot leave a stale cleanup target.
 * @param data - current registry.
 * @param entry - observed standalone session.
 * @returns the next registry (a new object).
 */
export function upsertEntry(
  data: StandaloneRegistryData,
  entry: StandaloneEntry,
): StandaloneRegistryData {
  const previous = data.sessions[entry.sessionId]
  const merged: StandaloneEntry = {
    sessionId: entry.sessionId,
    cwd: entry.cwd,
    standalone: true,
    createdAt: previous?.createdAt ?? entry.createdAt,
    hadMessage: previous?.hadMessage === true || entry.hadMessage === true,
    ...(previous?.archived === true || entry.archived === true ? { archived: true } : {}),
    ...(previous?.cleanupFailed === true ? { cleanupFailed: true } : {}),
    ...(previous?.cleanupError !== undefined ? { cleanupError: previous.cleanupError } : {}),
    ...(previous?.cleanedAt !== undefined ? { cleanedAt: previous.cleanedAt } : {}),
  }
  if (
    previous !== undefined &&
    previous.cwd === merged.cwd &&
    previous.hadMessage === merged.hadMessage &&
    previous.archived === merged.archived
  ) {
    return data
  }
  const sessions = cloneSessions(data.sessions)
  sessions[entry.sessionId] = merged
  return { version: REGISTRY_VERSION, sessions }
}

/**
 * Mark one record as having observed a user-authored durable message.
 * @param data - current registry.
 * @param sessionId - session identity.
 * @returns the next registry, or the same reference when nothing changed.
 */
export function markHadMessage(
  data: StandaloneRegistryData,
  sessionId: string,
): StandaloneRegistryData {
  const previous = data.sessions[sessionId]
  if (previous === undefined || previous.hadMessage) return data
  const sessions = cloneSessions(data.sessions)
  sessions[sessionId] = { ...previous, hadMessage: true }
  return { version: REGISTRY_VERSION, sessions }
}

/**
 * Record an archive observation without losing the cleanup target.
 * @param data - current registry.
 * @param sessionId - session identity.
 * @returns the next registry, or the same reference when nothing changed.
 */
export function markArchived(
  data: StandaloneRegistryData,
  sessionId: string,
): StandaloneRegistryData {
  const previous = data.sessions[sessionId]
  if (previous === undefined || previous.archived === true) return data
  const sessions = cloneSessions(data.sessions)
  sessions[sessionId] = { ...previous, archived: true }
  return { version: REGISTRY_VERSION, sessions }
}

/**
 * Drop one record after its directory cleanup succeeded.
 * @param data - current registry.
 * @param sessionId - session identity.
 * @returns the next registry, or the same reference when absent.
 */
export function removeEntry(
  data: StandaloneRegistryData,
  sessionId: string,
): StandaloneRegistryData {
  if (data.sessions[sessionId] === undefined) return data
  const sessions = cloneSessions(data.sessions)
  delete sessions[sessionId]
  return { version: REGISTRY_VERSION, sessions }
}

/**
 * Record a failed cleanup so a later sweep can retry and operators can see why.
 * @param data - current registry.
 * @param sessionId - session identity.
 * @param message - diagnostic text.
 * @returns the next registry.
 */
export function markCleanupFailed(
  data: StandaloneRegistryData,
  sessionId: string,
  message: string,
): StandaloneRegistryData {
  const previous = data.sessions[sessionId]
  if (previous === undefined) return data
  const sessions = cloneSessions(data.sessions)
  sessions[sessionId] = { ...previous, cleanupFailed: true, cleanupError: message }
  return { version: REGISTRY_VERSION, sessions }
}

/** All records in stable id order. */
export function listEntries(data: StandaloneRegistryData): StandaloneEntry[] {
  return Object.keys(data.sessions)
    .sort((left, right) => left.localeCompare(right))
    .map((id) => data.sessions[id])
    .filter((entry): entry is StandaloneEntry => entry !== undefined)
}

/**
 * Decide what a deletion may remove. A session that never carried a user
 * message owns its directory completely; one that did keeps its directory so
 * an unarchive can still resume in the recorded cwd.
 * @param entry - registry record.
 * @param directoryState - live directory facts.
 * @returns the cleanup plan.
 */
export function cleanupPlan(
  entry: StandaloneEntry,
  directoryState: { readonly exists: boolean; readonly empty: boolean },
): CleanupPlan {
  if (!directoryState.exists) return { action: 'remove-entry', reason: 'missing' }
  if (entry.hadMessage) return { action: 'keep', reason: 'used' }
  // A blank session normally owns an empty directory. Anything inside it may be
  // user or agent data, so never treat "no recorded activity" as permission to
  // delete content.
  if (!directoryState.empty) return { action: 'keep', reason: 'not-empty' }
  return { action: 'remove-tree', reason: 'never-used' }
}

/**
 * Whether a composer render should be unlocked for one standalone session.
 * The native InputBar disables itself when a session has no workspace; this
 * plugin's standalone sessions are exactly that state.
 * @param sessionId - rendered session (undefined on the New Session page).
 * @param cwd - that session's durable working directory.
 * @param disabled - the native composer's inert flag.
 * @returns whether the override applies.
 */
export function shouldUnlockComposer(
  sessionId: string | undefined,
  cwd: string | undefined,
  disabled: boolean,
): boolean {
  return disabled && sessionId !== undefined && isStandaloneCwd(cwd)
}

/**
 * Stable, human-readable relative time for panel rows.
 * @param timestamp - epoch milliseconds; non-finite values return an empty string.
 * @param now - comparison instant.
 * @returns a short relative label.
 */
export function relativeTime(timestamp: number, now = Date.now()): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return ''
  const delta = Math.max(0, now - timestamp)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (delta < minute) return 'now'
  if (delta < hour) return `${Math.floor(delta / minute)}m`
  if (delta < day) return `${Math.floor(delta / hour)}h`
  if (delta < 30 * day) return `${Math.floor(delta / day)}d`
  return new Date(timestamp).toISOString().slice(0, 10)
}
