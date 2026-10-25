import { describe, expect, it, vi } from 'vitest'
import type { ClientContext, Translate } from '../src/client/dsh.js'
import { openManagementPanel, startStandalone } from '../src/client/actions.js'
import { PANEL_ID } from '../src/client/panels.js'

const t: Translate = (key) => key

function context(overrides: Record<string, unknown> = {}): ClientContext {
  return {
    locale: { register: vi.fn(), bind: () => t },
    sessions: {
      list: { getSnapshot: () => ({ ids: [], byId: {} }), subscribe: () => () => undefined },
      create: vi.fn(async (options: { sessionId: string }) => options.sessionId),
      using: vi.fn(),
    },
    workspaces: {
      list: {
        getSnapshot: () => ({ items: [], archivedSessionIds: [] }),
        subscribe: () => () => undefined,
      },
    },
    uiWorkspace: { openSession: vi.fn(), startSession: vi.fn() },
    commandUi: { register: vi.fn() },
    layout: { selectPanel: vi.fn() },
    remote: { $host: { home: '/home/u' } },
    slots: {
      inject: vi.fn(),
      register: vi.fn(),
      entries: () => [],
    },
    effect: vi.fn(),
    get: vi.fn(),
    ...overrides,
  } as unknown as ClientContext
}

describe('management entry', () => {
  it('selects the management panel through the public layout service', () => {
    const selectPanel = vi.fn()
    openManagementPanel(context({ layout: { selectPanel } }), t)
    expect(selectPanel).toHaveBeenCalledWith(PANEL_ID)
  })
})

describe('explicit standalone creation', () => {
  it('creates a marker cwd and opens the native conversation', async () => {
    const create = vi.fn(async (options: { cwd: string; sessionId: string }) => options.sessionId)
    const openSession = vi.fn()
    const ctx = context({
      sessions: {
        list: { getSnapshot: () => ({ ids: [], byId: {} }), subscribe: () => () => undefined },
        create,
        using: vi.fn(),
      },
      uiWorkspace: { openSession, startSession: vi.fn() },
    })
    const sessionId = await startStandalone(ctx, t)
    expect(sessionId).toMatch(/^session-/)
    expect(create).toHaveBeenCalledTimes(1)
    const options = create.mock.calls[0]?.[0]
    expect(options?.sessionId).toBe(sessionId)
    expect(options?.cwd).toContain('/.dsh/dsh-standalone-sessions/')
    expect(options?.cwd.endsWith(sessionId)).toBe(true)
    expect(openSession).toHaveBeenCalledWith(sessionId)
  })
})
