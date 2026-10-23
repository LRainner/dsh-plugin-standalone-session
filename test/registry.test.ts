import { mkdir, mkdtemp, readdir, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DurableStandaloneRegistry,
  cleanupSessionDirectory,
  isOwnedSessionDirectory,
  isPathInside,
  prefixedLogger,
  type DirectoryOps,
  type RegistryLogger,
} from '../src/host/registry.js'
import { STANDALONE_DIR_NAME, type StandaloneEntry } from '../src/shared/standalone.js'

interface CapturedLogger extends RegistryLogger {
  readonly lines: string[]
}

function captureLogger(): CapturedLogger {
  const lines: string[] = []
  return {
    lines,
    info: (message) => lines.push(`info:${message}`),
    warn: (message) => lines.push(`warn:${message}`),
  }
}

let base = ''
let root = ''

beforeEach(async () => {
  base = await mkdtemp(join(tmpdir(), 'dsh-standalone-test-'))
  root = join(base, STANDALONE_DIR_NAME)
})

afterEach(async () => {
  await rm(base, { recursive: true, force: true })
})

function record(id: string, hadMessage = false): StandaloneEntry {
  return {
    sessionId: id,
    cwd: join(root, id),
    standalone: true,
    createdAt: 1,
    hadMessage,
  }
}

describe('registry persistence', () => {
  it('starts empty, announces, and survives a reload', async () => {
    const logger = captureLogger()
    const registry = new DurableStandaloneRegistry(root, logger)
    await registry.load()
    expect(registry.list()).toEqual([])
    await registry.announce(record('session-1'))
    await registry.flush()
    expect(registry.list()).toHaveLength(1)

    const reopened = new DurableStandaloneRegistry(root, logger)
    await reopened.load()
    expect(reopened.list()).toHaveLength(1)
    expect(reopened.list()[0]?.cwd).toBe(join(root, 'session-1'))
  })

  it('serializes concurrent announcements without losing records', async () => {
    const registry = new DurableStandaloneRegistry(root, captureLogger())
    await registry.load()
    await Promise.all(
      Array.from({ length: 25 }, (_, index) => registry.announce(record(`session-${index}`))),
    )
    await registry.flush()
    const reopened = new DurableStandaloneRegistry(root, captureLogger())
    await reopened.load()
    expect(reopened.list()).toHaveLength(25)
  })

  it('marks the first user message durably', async () => {
    const registry = new DurableStandaloneRegistry(root, captureLogger())
    await registry.load()
    await registry.announce(record('session-1'))
    await registry.markActivity('session-1')
    await registry.markActivity('session-missing')
    await registry.flush()
    const reopened = new DurableStandaloneRegistry(root, captureLogger())
    await reopened.load()
    expect(reopened.get('session-1')?.hadMessage).toBe(true)
  })

  it('recovers a corrupt registry by moving it aside', async () => {
    await mkdir(root, { recursive: true })
    await writeFile(join(root, 'registry.json'), '{not json', 'utf8')
    const logger = captureLogger()
    const registry = new DurableStandaloneRegistry(root, logger)
    await registry.load()
    expect(registry.list()).toEqual([])
    const names = await readdir(root)
    expect(names.some((name) => name.startsWith('registry.json.corrupt-'))).toBe(true)
    expect(logger.lines.some((line) => line.startsWith('warn:'))).toBe(true)
  })
})

describe('directory cleanup', () => {
  it('removes an empty never-used session directory', async () => {
    const dir = record('session-1').cwd
    await mkdir(dir, { recursive: true })
    const outcome = await cleanupSessionDirectory(record('session-1'), undefined, captureLogger())
    expect(outcome.kind).toBe('removed')
    await expect(readdir(dir)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('keeps a non-empty directory even without recorded activity', async () => {
    const dir = record('session-1').cwd
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'scratch.txt'), 'temporary', 'utf8')
    const outcome = await cleanupSessionDirectory(record('session-1'), undefined, captureLogger())
    expect(outcome).toEqual({ kind: 'retained', reason: 'not-empty' })
    expect(await readdir(dir)).toEqual(['scratch.txt'])
  })

  it('keeps the directory of a session that already carried messages', async () => {
    const dir = record('session-1', true).cwd
    await mkdir(dir, { recursive: true })
    const outcome = await cleanupSessionDirectory(
      record('session-1', true),
      undefined,
      captureLogger(),
    )
    expect(outcome).toEqual({ kind: 'retained', reason: 'used' })
    expect(await readdir(dir)).toEqual([])
  })

  it('treats an already-missing directory as removed', async () => {
    const outcome = await cleanupSessionDirectory(record('session-1'), undefined, captureLogger())
    expect(outcome).toEqual({ kind: 'removed' })
  })

  it('refuses to delete a path that is not this plugin’s session directory', async () => {
    const outside = join(base, 'session-1')
    await mkdir(outside, { recursive: true })
    const logger = captureLogger()
    const outcome = await cleanupSessionDirectory(
      { ...record('session-1'), cwd: outside },
      undefined,
      logger,
    )
    expect(outcome.kind).toBe('failed')
    expect(await readdir(outside)).toEqual([])
    expect(logger.lines.some((line) => line.includes('refusing'))).toBe(true)
  })

  it('reports a filesystem failure instead of swallowing it', async () => {
    const ops: DirectoryOps = {
      stat: async () => ({ isDirectory: () => true }),
      rm: async () => {
        throw new Error('permission denied')
      },
    }
    const outcome = await cleanupSessionDirectory(record('session-1'), ops, captureLogger())
    expect(outcome.kind).toBe('failed')
    if (outcome.kind === 'failed') expect(outcome.error).toContain('permission denied')
  })

  it('is idempotent when the archived sweep retries after a failure', async () => {
    const logger = captureLogger()
    const failing: DirectoryOps = {
      stat: async () => ({ isDirectory: () => true }),
      rm: async () => {
        throw new Error('locked')
      },
    }
    const registry = new DurableStandaloneRegistry(root, logger, failing)
    await registry.load()
    await registry.announce(record('session-1'))
    const outcomes = await registry.reconcileArchived(new Set(['session-1']))
    expect(outcomes.get('session-1')?.kind).toBe('failed')
    const entry = registry.get('session-1')
    expect(entry?.cleanupFailed).toBe(true)
    expect(entry?.cleanupError).toContain('locked')
    expect(entry?.archived).toBe(true)
  })
})

describe('archive reconciliation', () => {
  it('cleans an unused archived session and drops the record', async () => {
    const registry = new DurableStandaloneRegistry(root, captureLogger())
    await registry.load()
    await registry.announce(record('session-1'))
    const dir = record('session-1').cwd
    await mkdir(dir, { recursive: true })
    const outcomes = await registry.reconcileArchived(new Set(['session-1']))
    expect(outcomes.get('session-1')).toEqual({ kind: 'removed' })
    expect(registry.get('session-1')).toBeUndefined()
    await expect(readdir(dir)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('does not delete a session the Host has already unarchived', async () => {
    const registry = new DurableStandaloneRegistry(root, captureLogger())
    await registry.load()
    await registry.announce(record('session-1'))
    const dir = record('session-1').cwd
    await mkdir(dir, { recursive: true })
    const outcomes = await registry.reconcileArchived(
      new Set(['session-1']),
      () => false,
    )
    expect(outcomes.size).toBe(0)
    expect(registry.get('session-1')?.archived).toBeUndefined()
    expect(await readdir(dir)).toEqual([])
  })

  it('does nothing when the archive set is empty', async () => {
    const registry = new DurableStandaloneRegistry(root, captureLogger())
    await registry.load()
    await registry.announce(record('session-1'))
    const outcomes = await registry.reconcileArchived(new Set())
    expect(outcomes.size).toBe(0)
    expect(registry.get('session-1')).toBeDefined()
  })
})

describe('orphan sweep', () => {
  it('removes an old empty directory no live session owns', async () => {
    const registry = new DurableStandaloneRegistry(root, captureLogger())
    await registry.load()
    const orphan = join(root, 'session-orphan')
    await mkdir(orphan, { recursive: true })
    const old = new Date(Date.now() - 3_600_000)
    await utimes(orphan, old, old)
    const removed = await registry.sweepOrphanDirectories(new Set(), 60_000)
    expect(removed).toEqual(['session-orphan'])
    await expect(readdir(orphan)).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('leaves a live or recent directory alone', async () => {
    const registry = new DurableStandaloneRegistry(root, captureLogger())
    await registry.load()
    const live = join(root, 'session-live')
    const fresh = join(root, 'session-fresh')
    await mkdir(live, { recursive: true })
    await mkdir(fresh, { recursive: true })
    const old = new Date(Date.now() - 3_600_000)
    await utimes(live, old, old)
    const removed = await registry.sweepOrphanDirectories(new Set(['session-live']), 60_000)
    expect(removed).toEqual([])
    expect(await readdir(live)).toEqual([])
    expect(await readdir(fresh)).toEqual([])
  })

  it('never removes a non-empty orphan directory', async () => {
    const registry = new DurableStandaloneRegistry(root, captureLogger())
    await registry.load()
    const orphan = join(root, 'session-orphan')
    await mkdir(orphan, { recursive: true })
    await writeFile(join(orphan, 'keep.txt'), 'user data', 'utf8')
    const old = new Date(Date.now() - 3_600_000)
    await utimes(orphan, old, old)
    expect(await registry.sweepOrphanDirectories(new Set(), 0)).toEqual([])
    expect(await readdir(orphan)).toEqual(['keep.txt'])
  })
})

describe('path safety', () => {
  it('knows when a path is inside another', () => {
    expect(isPathInside('/a/b', '/a/b/c')).toBe(true)
    expect(isPathInside('/a/b', '/a/b')).toBe(true)
    expect(isPathInside('/a/b', '/a/bb')).toBe(false)
    expect(isPathInside('/a/b', '/a')).toBe(false)
  })

  it('accepts only a session directory directly below the marker', () => {
    expect(isOwnedSessionDirectory(record('session-1'))).toBe(true)
    expect(isOwnedSessionDirectory({ ...record('session-1'), cwd: join(base, 'session-1') })).toBe(
      false,
    )
    expect(
      isOwnedSessionDirectory({ ...record('session-1'), cwd: join(root, 'session-other') }),
    ).toBe(false)
  })
})

describe('logger prefix', () => {
  it('uses the uniform prefix', () => {
    const logger = prefixedLogger('[standalone-session]')
    const info = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    logger.info('hello')
    expect(info).toHaveBeenCalledWith('[standalone-session] hello')
  })
})
