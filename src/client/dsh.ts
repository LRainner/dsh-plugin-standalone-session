/**
 * The narrow, structurally typed DSH browser surface this plugin consumes.
 *
 * DSH's own client packages are provided by the running host's module graph,
 * not by npm at this plugin's version. Declaring only the faces used here keeps
 * the plugin buildable without importing stale published type packages.
 */
import type { ComponentType } from 'react'

/** Observable snapshot source shared by the workspace and session controllers. */
export interface ObservableSnapshot<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

/** One Session catalog row, as consumed by the sidebar and this plugin's panel. */
export interface SessionRow {
  readonly id: string
  readonly title?: string
  readonly displayTitle: string
  readonly cwd?: string
  readonly parentId?: string
  readonly origin?: 'subagent'
  readonly running: boolean
  readonly blank: boolean
  readonly updatedAt: number
}

/** Complete Session catalog snapshot. */
export interface SessionListState {
  readonly ids: readonly string[]
  readonly byId: Readonly<Record<string, SessionRow>>
  readonly phase?: string
}

/** One workspace row from the Workspace follow stream. */
export interface WorkspaceRow {
  readonly workspaceId: string
  readonly path: string
  readonly title: string
  readonly sessionIds: readonly string[]
}

/** Complete workspace snapshot. */
export interface WorkspaceSnapshot {
  readonly items: readonly WorkspaceRow[]
  readonly archivedSessionIds: readonly string[]
  readonly pinnedSessionIds?: readonly string[]
  readonly phase?: string
}

/** Remote failure/result envelope returned by Session mutations. */
export type RemoteResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: { readonly code: string; readonly message: string } }

/** One retained Client Session generation. */
export interface SessionReference {
  readonly binding: {
    readonly session: {
      rename(title: string): Promise<RemoteResult<{ readonly title: string; readonly seq: number }>>
    }
  }
  release(): void
}

/** Browser Session service (`ctx.sessions`). */
export interface SessionService {
  readonly list: ObservableSnapshot<SessionListState>
  create(options?: {
    workspaceId?: string
    cwd?: string
    sessionId?: string
    agentPreset?: string
  }): Promise<string>
  using<T>(
    target: string,
    options: { source: string; signal?: AbortSignal },
    operation: (reference: SessionReference) => T | Promise<T>,
  ): Promise<T>
}

/** Browser Workspace service (`ctx.workspaces`). */
export interface WorkspaceService {
  readonly list: ObservableSnapshot<WorkspaceSnapshot>
  create(input: { path: string }): Promise<WorkspaceRow>
  delete(workspaceId: string): Promise<void>
  archiveSession(sessionId: string, options?: { readonly stopActivity?: boolean }): Promise<void>
  unarchiveSession(sessionId: string): Promise<void>
}

/** Cross-controller navigation (`ctx.uiWorkspace`). */
export interface UiWorkspaceService {
  openSession(target: string): void
  startSession(workspaceId?: string): void
}

/** Localized translate function. */
export interface Translate {
  (key: string, values?: Readonly<Record<string, string | number>>): string
}

/** Browser locale registry (`ctx.locale`). */
export interface LocaleService {
  register(namespace: string, dictionaries: Readonly<Record<string, Readonly<Record<string, string>>>>): () => void
  bind(namespace: string): Translate
}

/** One client command contribution accepted by `ctx.commandUi`. */
export interface CommandContribution {
  readonly name: string
  label?(): string
  description?(): string
  readonly icon?: ComponentType<{ size?: number }>
  available(session: unknown): boolean
  readonly ui:
    | { readonly kind: 'action'; run(session: unknown): void }
    | {
        readonly kind: 'popupSelect'
        options(session: unknown, signal: AbortSignal): Promise<readonly unknown[]>
        onSelect(option: unknown, session: unknown): void | Promise<void>
      }
}

/** Browser command registry (`ctx.commandUi`). */
export interface CommandUiService {
  register(contribution: CommandContribution): () => void
}

/** One slot ledger entry (the registrant object behind a slot render). */
export interface SlotEntry {
  readonly options?: {
    readonly priority?: number
    readonly [key: string]: unknown
  }
  component: ComponentType<any>
  readonly [key: string]: unknown
}

/** Slot registry (`ctx.slots`). */
export interface SlotService {
  inject(name: string, factory: () => unknown): () => void
  register(entry: Readonly<Record<string, unknown>>, component: ComponentType<any>): () => void
  entries(name: string): readonly SlotEntry[]
  subscribe?(name: string, listener: () => void): () => void
}

/** Cordis effect helper and service lookup. */
export interface ClientContext {
  readonly slots: SlotService
  readonly locale: LocaleService
  readonly sessions: SessionService
  readonly workspaces: WorkspaceService
  readonly uiWorkspace: UiWorkspaceService
  readonly commandUi: CommandUiService
  readonly remote?: { readonly $host?: { readonly home?: string } }
  effect(execute: () => (() => void) | void, label?: string): unknown
  get(name: string): unknown
}
