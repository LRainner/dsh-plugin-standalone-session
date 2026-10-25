import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionListState, SessionRow } from '../src/client/dsh.js'
import {
  StandaloneLaunchCoordinator,
  armStandaloneLauncher,
  clearStandaloneLauncherArm,
  isStandaloneLauncherArmed,
} from '../src/client/launcher.js'

const markerCwd = (id: string): string =>
  `/home/u/.dsh/dsh-standalone-sessions/${id}`

function row(id: string, overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id,
    displayTitle: id,
    cwd: markerCwd(id),
    running: false,
    blank: true,
    updatedAt: 1,
    ...overrides,
  }
}

function snapshot(rows: readonly SessionRow[]): SessionListState {
  return {
    ids: rows.map((entry) => entry.id),
    byId: Object.fromEntries(rows.map((entry) => [entry.id, entry])),
    phase: 'ready',
  }
}

function fixture(): {
  coordinator: StandaloneLaunchCoordinator
  create: ReturnType<typeof vi.fn>
  setRows: (rows: readonly SessionRow[]) => void
} {
  let rows: SessionRow[] = []
  let next = 1
  const setRows = (value: readonly SessionRow[]): void => {
    rows = [...value]
  }
  const create = vi.fn(async (): Promise<string> => {
    const id = `session-${next++}`
    rows = [...rows, row(id)]
    return id
  })
  const coordinator = new StandaloneLaunchCoordinator({
    sessions: () => snapshot(rows),
    archivedSessionIds: () => [],
    create,
  })
  return { coordinator, create, setRows }
}

describe('standalone launcher coordinator', () => {
  it('creates once, then reuses the still-blank session', async () => {
    const { coordinator, create } = fixture()
    await expect(coordinator.launch()).resolves.toEqual({
      sessionId: 'session-1',
      reused: false,
    })
    await expect(coordinator.launch()).resolves.toEqual({
      sessionId: 'session-1',
      reused: true,
    })
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('creates a new session once the bridged session has a message', async () => {
    const { coordinator, create, setRows } = fixture()
    await coordinator.launch()
    setRows([row('session-1', { blank: false })])
    await expect(coordinator.launch()).resolves.toEqual({
      sessionId: 'session-2',
      reused: false,
    })
    expect(create).toHaveBeenCalledTimes(2)
  })

  it('does not reuse an archived or no-longer-live session', async () => {
    const { coordinator, create, setRows } = fixture()
    await coordinator.launch()
    setRows([])
    await coordinator.launch()
    expect(create).toHaveBeenCalledTimes(2)

    const archived = new StandaloneLaunchCoordinator({
      sessions: () => snapshot([row('session-9')]),
      archivedSessionIds: () => ['session-9'],
      create: async () => 'session-10',
    })
    await expect(archived.launch()).resolves.toEqual({
      sessionId: 'session-10',
      reused: false,
    })
  })

  it('does not reuse a row whose cwd lost the standalone marker', async () => {
    const { coordinator, create, setRows } = fixture()
    await coordinator.launch()
    setRows([row('session-1', { cwd: '/home/u/projects/app' })])
    await coordinator.launch()
    expect(create).toHaveBeenCalledTimes(2)
  })

  it('dedupes concurrent launches into one create', async () => {
    let resolveCreate!: (id: string) => void
    const create = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveCreate = resolve
        }),
    )
    const coordinator = new StandaloneLaunchCoordinator({
      sessions: () => snapshot([]),
      archivedSessionIds: () => [],
      create,
    })
    const first = coordinator.launch()
    const second = coordinator.launch()
    expect(create).toHaveBeenCalledTimes(1)
    resolveCreate('session-1')
    await expect(Promise.all([first, second])).resolves.toEqual([
      { sessionId: 'session-1', reused: false },
      { sessionId: 'session-1', reused: false },
    ])
  })

  it('releases the in-flight lock after a failure so retry can create', async () => {
    let fail = true
    const create = vi.fn(async (): Promise<string> => {
      if (fail) {
        fail = false
        throw new Error('host refused')
      }
      return 'session-1'
    })
    const coordinator = new StandaloneLaunchCoordinator({
      sessions: () => snapshot([]),
      archivedSessionIds: () => [],
      create,
    })
    await expect(coordinator.launch()).rejects.toThrow('host refused')
    await expect(coordinator.launch()).resolves.toEqual({
      sessionId: 'session-1',
      reused: false,
    })
    expect(create).toHaveBeenCalledTimes(2)
  })
})

describe('launcher arm window', () => {
  beforeEach(() => {
    clearStandaloneLauncherArm()
  })

  it('accepts a recent click and expires an old one', () => {
    armStandaloneLauncher(1_000)
    expect(isStandaloneLauncherArmed(1_500)).toBe(true)
    expect(isStandaloneLauncherArmed(1_000 + 3_001)).toBe(false)
  })

  it('can be cleared explicitly', () => {
    armStandaloneLauncher(1_000)
    clearStandaloneLauncherArm()
    expect(isStandaloneLauncherArmed(1_001)).toBe(false)
  })
})
