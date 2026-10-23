import { describe, expect, it, vi } from 'vitest'
import {
  STANDALONE_DIR_NAME,
  assertSessionId,
  cleanupPlan,
  defaultStandaloneRoot,
  emptyRegistry,
  isStandaloneCwd,
  joinPath,
  makeStandaloneCwd,
  markHadMessage,
  mintSessionId,
  normalizeRegistry,
  relativeTime,
  removeEntry,
  shouldUnlockComposer,
  standaloneSessionIdFromCwd,
  upsertEntry,
  type StandaloneEntry,
} from '../src/shared/standalone.js'
import { createStandaloneSession, isAbsoluteHostPath } from '../src/client/create.js'

const entry = (overrides: Partial<StandaloneEntry> = {}): StandaloneEntry => ({
  sessionId: 'session-1',
  cwd: '/home/u/.dsh/dsh-standalone-sessions/session-1',
  standalone: true,
  createdAt: 1,
  hadMessage: false,
  ...overrides,
})

describe('standalone path marker', () => {
  it('recognizes a marked cwd with a session child', () => {
    expect(isStandaloneCwd('/home/u/.dsh/dsh-standalone-sessions/session-1')).toBe(true)
    expect(isStandaloneCwd('C:\\Users\\u\\.dsh\\dsh-standalone-sessions\\session-1')).toBe(true)
  })

  it('rejects the bare root, unrelated paths and empty input', () => {
    expect(isStandaloneCwd('/home/u/.dsh/dsh-standalone-sessions')).toBe(false)
    expect(isStandaloneCwd('/home/u/projects/app')).toBe(false)
    expect(isStandaloneCwd('')).toBe(false)
    expect(isStandaloneCwd(undefined)).toBe(false)
  })

  it('extracts the session child', () => {
    expect(
      standaloneSessionIdFromCwd('/home/u/.dsh/dsh-standalone-sessions/session-1'),
    ).toBe('session-1')
    expect(standaloneSessionIdFromCwd('/home/u/projects/app')).toBeUndefined()
  })

  it('joins POSIX and Windows paths with their own separator family', () => {
    expect(joinPath('/home/u', '.dsh', STANDALONE_DIR_NAME)).toBe(
      '/home/u/.dsh/dsh-standalone-sessions',
    )
    expect(joinPath('C:\\Users\\u', '.dsh', STANDALONE_DIR_NAME)).toBe(
      'C:\\Users\\u\\.dsh\\dsh-standalone-sessions',
    )
    expect(defaultStandaloneRoot('/home/u')).toBe('/home/u/.dsh/dsh-standalone-sessions')
  })

  it('rejects traversal segments when joining', () => {
    expect(() => joinPath('/home/u', '..')).toThrow()
    expect(() => joinPath('/home/u', 'a/b')).toThrow()
  })
})

describe('session identity', () => {
  it('mints session-<uuid>', () => {
    expect(mintSessionId(() => '00000000-0000-4000-8000-000000000000')).toBe(
      'session-00000000-0000-4000-8000-000000000000',
    )
    expect(mintSessionId()).toMatch(/^session-[0-9a-f-]{36}$/)
    expect(() => mintSessionId(() => '../escape')).toThrow()
  })

  it('rejects ids with separators or the wrong prefix', () => {
    expect(assertSessionId('session-1')).toBe('session-1')
    expect(() => assertSessionId('other-1')).toThrow()
    expect(() => assertSessionId('session-a/b')).toThrow()
    expect(assertSessionId('session-..')).toBe('session-..')
    expect(() => assertSessionId('')).toThrow()
  })
})

describe('registry purity', () => {
  it('normalizes malformed records away', () => {
    const data = normalizeRegistry({
      version: 1,
      sessions: {
        'session-good': {
          sessionId: 'session-good',
          cwd: '/home/u/.dsh/dsh-standalone-sessions/session-good',
          standalone: true,
          createdAt: 12,
          hadMessage: true,
        },
        '../bad': { cwd: '/tmp/x' },
        'session-nocwd': { standalone: true },
        'session-mismatch': {
          cwd: '/home/u/.dsh/dsh-standalone-sessions/session-other',
        },
      },
    })
    expect(Object.keys(data.sessions)).toEqual(['session-good'])
    expect(data.sessions['session-good']?.hadMessage).toBe(true)
  })

  it('upserts without losing the original creation time or first-message fact', () => {
    const base = upsertEntry(emptyRegistry(), entry())
    const again = upsertEntry(base, entry({ createdAt: 99, hadMessage: true }))
    expect(again.sessions['session-1']?.createdAt).toBe(1)
    expect(again.sessions['session-1']?.hadMessage).toBe(true)
    expect(again).not.toBe(base)
  })

  it('marks activity idempotently and removes entries', () => {
    const base = upsertEntry(emptyRegistry(), entry())
    const marked = markHadMessage(base, 'session-1')
    expect(marked.sessions['session-1']?.hadMessage).toBe(true)
    expect(markHadMessage(marked, 'session-1')).toBe(marked)
    expect(markHadMessage(base, 'session-missing')).toBe(base)
    expect(removeEntry(marked, 'session-1').sessions).toEqual({})
    expect(removeEntry(marked, 'session-missing')).toBe(marked)
  })

  it('cleans an unused directory completely and keeps a used one', () => {
    expect(cleanupPlan(entry(), { exists: true, empty: true })).toEqual({
      action: 'remove-tree',
      reason: 'never-used',
    })
    expect(cleanupPlan(entry(), { exists: true, empty: false })).toEqual({
      action: 'keep',
      reason: 'not-empty',
    })
    expect(cleanupPlan(entry({ hadMessage: true }), { exists: true, empty: false })).toEqual({
      action: 'keep',
      reason: 'used',
    })
    expect(cleanupPlan(entry(), { exists: false, empty: false })).toEqual({
      action: 'remove-entry',
      reason: 'missing',
    })
  })
})

describe('composer policy', () => {
  it('unlocks only a disabled, standalone session', () => {
    const cwd = '/home/u/.dsh/dsh-standalone-sessions/session-1'
    expect(shouldUnlockComposer('session-1', cwd, true)).toBe(true)
    expect(shouldUnlockComposer('session-1', cwd, false)).toBe(false)
    expect(shouldUnlockComposer('session-1', '/home/u/projects/app', true)).toBe(false)
    expect(shouldUnlockComposer(undefined, cwd, true)).toBe(false)
  })
})

describe('creation strategy', () => {
  it('derives a unique marker cwd and opens the created session', async () => {
    const created: { cwd: string; sessionId: string }[] = []
    const opened: string[] = []
    const id = await createStandaloneSession({
      home: '/home/u',
      noHomeMessage: 'no home',
      randomUuid: () => 'uuid-1',
      create: async (options) => {
        created.push(options)
        return options.sessionId
      },
      open: (sessionId) => opened.push(sessionId),
    })
    expect(id).toBe('session-uuid-1')
    expect(created).toEqual([
      {
        cwd: `/home/u/.dsh/${STANDALONE_DIR_NAME}/session-uuid-1`,
        sessionId: 'session-uuid-1',
      },
    ])
    expect(opened).toEqual(['session-uuid-1'])
  })

  it('supports Windows homes', async () => {
    let cwd = ''
    await createStandaloneSession({
      home: 'C:\\Users\\u',
      noHomeMessage: 'no home',
      randomUuid: () => 'uuid-2',
      create: async (options) => {
        cwd = options.cwd
        return options.sessionId
      },
      open: () => undefined,
    })
    expect(cwd).toBe('C:\\Users\\u\\.dsh\\dsh-standalone-sessions\\session-uuid-2')
  })

  it('rolls the UI back when creation fails', async () => {
    const open = vi.fn()
    await expect(
      createStandaloneSession({
        home: '/home/u',
        noHomeMessage: 'no home',
        create: async () => {
          throw new Error('host refused')
        },
        open,
      }),
    ).rejects.toThrow('host refused')
    expect(open).not.toHaveBeenCalled()
  })

  it('still opens a committed session when navigation fails', async () => {
    const open = vi.fn(() => {
      throw new Error('navigation failed')
    })
    await expect(
      createStandaloneSession({
        home: '/home/u',
        noHomeMessage: 'no home',
        create: async (options) => options.sessionId,
        open,
      }),
    ).rejects.toThrow('navigation failed')
    expect(open).toHaveBeenCalledTimes(1)
  })

  it('refuses to guess without a host home', async () => {
    await expect(
      createStandaloneSession({
        home: undefined,
        noHomeMessage: 'no home',
        create: async (options) => options.sessionId,
        open: () => undefined,
      }),
    ).rejects.toThrow('no home')
  })

  it('recognizes absolute host paths', () => {
    expect(isAbsoluteHostPath('/home/u')).toBe(true)
    expect(isAbsoluteHostPath('C:\\Users\\u')).toBe(true)
    expect(isAbsoluteHostPath('\\\\server\\share')).toBe(true)
    expect(isAbsoluteHostPath('relative/path')).toBe(false)
  })
})

describe('relative time', () => {
  it('formats short deltas', () => {
    const now = Date.UTC(2026, 0, 2, 3, 4, 5)
    expect(relativeTime(now - 10_000, now)).toBe('now')
    expect(relativeTime(now - 5 * 60_000, now)).toBe('5m')
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe('3h')
    expect(relativeTime(now - 2 * 86_400_000, now)).toBe('2d')
    expect(relativeTime(0, now)).toBe('')
  })
})
