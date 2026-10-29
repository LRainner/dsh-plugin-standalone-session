/**
 * Browser components: the dedicated Standalone Sessions panel, the sidebar
 * entry/action, the native-row badge decorations, the hero badge and the toast.
 *
 * The designer constraint is deliberately narrow: this plugin never renders a
 * chat surface. Opening a row navigates to the native Conversation, and rename
 * and delete call the native Session/Workspace controllers.
 */
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from 'react'
import { isStandaloneCwd } from '../shared/standalone.js'
import {
  archiveStandalone,
  archiveStandalones,
  createStandaloneSessionId,
  messageOf,
  openManagementPanel,
  renameStandalone,
  startStandalone,
} from './actions.js'
import {
  countStandalone,
  standaloneRows,
  useSessionCwd,
  useSessionList,
  useWorkspaceSnapshot,
} from './hooks.js'
import {
  armStandaloneLauncher,
  clearStandaloneLauncherArm,
  isStandaloneLauncherArmed,
  StandaloneLaunchCoordinator,
} from './launcher.js'
import { relativeTimeLabel } from './format.js'
import { NS } from './locales.js'
import { dismissNotice, getNoticeSnapshot, showNotice, subscribeNotice } from './notice.js'
import {
  pruneSelection,
  selectAllRows,
  selectedRows,
  selectionState,
  toggleSelection,
} from './selection.js'
import type { ClientContext, SessionRow, Translate } from './dsh.js'

interface LocalizedProps {
  readonly t?: Translate
}

/** Small chat-with-spark mark used by the command and sidebar entry. */
export function StandaloneIcon({
  size = 16,
  active = false,
}: {
  readonly size?: number
  readonly active?: boolean
}): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ color: active ? 'var(--dsw-alias-state-business-primary, #2563eb)' : 'currentColor' }}
    >
      <path
        d="M2.5 3.25c0-.69.56-1.25 1.25-1.25h8.5c.69 0 1.25.56 1.25 1.25v6.5c0 .69-.56 1.25-1.25 1.25H7.4L4.6 13.2a.55.55 0 0 1-.9-.43V11H3.75c-.69 0-1.25-.56-1.25-1.25v-6.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M8 3.4l.55 1.5 1.5.55-1.5.55L8 7.5l-.55-1.5-1.5-.55 1.5-.55L8 3.4Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Chat bubble with an explicit plus: the create entry's own shape. */
function StandaloneComposeIcon({
  size = 16,
  active = false,
}: {
  readonly size?: number
  readonly active?: boolean
}): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ color: active ? 'var(--dsw-alias-state-business-primary, #2563eb)' : 'currentColor' }}
    >
      <path
        d="M2.5 3.25c0-.69.56-1.25 1.25-1.25h8.5c.69 0 1.25.56 1.25 1.25v6.5c0 .69-.56 1.25-1.25 1.25H7.4L4.6 13.2a.55.55 0 0 1-.9-.43V11H3.75c-.69 0-1.25-.56-1.25-1.25v-6.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M8 4.3v3.4M6.3 6h3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/** Compact list mark for the management footer action. */
function StandaloneListIcon({ size = 16 }: { readonly size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M5.5 4h8M5.5 8h8M5.5 12h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="3" cy="4" r="0.8" fill="currentColor" />
      <circle cx="3" cy="8" r="0.8" fill="currentColor" />
      <circle cx="3" cy="12" r="0.8" fill="currentColor" />
    </svg>
  )
}

function useStandaloneRows(ctx: ClientContext): { rows: SessionRow[]; loading: boolean } {
  const sessions = useSessionList(ctx)
  const workspaces = useWorkspaceSnapshot(ctx)
  const rows = useMemo(
    () => standaloneRows(sessions, workspaces.archivedSessionIds),
    [sessions, workspaces.archivedSessionIds],
  )
  return { rows, loading: sessions.phase === 'pending' }
}

/** Launcher glyph: a chat mark with a plus badge. */
export function createLauncherEntryIcon() {
  return function StandaloneLauncherIcon({
    size = 18,
    active = false,
  }: {
    readonly size?: number
    readonly active?: boolean
  }): ReactElement {
    const ref = useRef<HTMLSpanElement>(null)
    useEffect(() => {
      const button = ref.current?.closest('button')
      if (button == null) return
      const arm = (): void => armStandaloneLauncher()
      // Capture phase runs before the sidebar's own onClick -> selectPanel.
      // The whole row (glyph and label) arms the launcher, while a layout or
      // history restore never produces this click.
      button.addEventListener('click', arm, true)
      return () => button.removeEventListener('click', arm, true)
    }, [])
    return (
      <span ref={ref} className="ss-panelIcon">
        <StandaloneComposeIcon size={size} active={active} />
      </span>
    )
  }
}

/** Sidebar footer action that opens the management panel. */
export function createManageFooterAction(ctx: ClientContext) {
  const fallbackT = ctx.locale.bind(NS)
  return function StandaloneManageFooterAction({
    wide = true,
    t,
  }: { readonly wide?: boolean } & LocalizedProps): ReactElement {
    const translate = t ?? fallbackT
    const sessions = useSessionList(ctx)
    const workspaces = useWorkspaceSnapshot(ctx)
    const count = countStandalone(sessions, workspaces.archivedSessionIds)
    const label =
      count > 0 ? translate('footer.manageCount', { n: count }) : translate('footer.manage')
    return (
      <button
        type="button"
        className={`ss-footerAction${wide ? '' : ' ss-footerRail'}`}
        aria-label={label}
        title={translate('footer.manageTooltip')}
        onClick={() => openManagementPanel(ctx, translate)}
      >
        <span className="ss-panelIcon">
          <StandaloneListIcon size={wide ? 15 : 18} />
        </span>
        {wide ? <span className="ss-footerLabel">{label}</span> : null}
      </button>
    )
  }
}

/**
 * Launcher main panel. Selecting the sidebar row mounts this component, which
 * creates (or reuses a blank) standalone session and then opens its native
 * conversation. A real row click must have armed it; a layout restore without
 * a gesture gets an explicit CTA instead of a silent session.
 */
export function createStandaloneLauncher(ctx: ClientContext) {
  const fallbackT = ctx.locale.bind(NS)
  const coordinator = new StandaloneLaunchCoordinator({
    sessions: () => ctx.sessions.list.getSnapshot(),
    archivedSessionIds: () => ctx.workspaces.list.getSnapshot().archivedSessionIds,
    create: () => createStandaloneSessionId(ctx, fallbackT),
  })

  return function StandaloneLauncher(props: LocalizedProps): ReactElement {
    const t = props.t ?? fallbackT
    const [phase, setPhase] = useState<'idle' | 'creating' | 'error'>(() =>
      isStandaloneLauncherArmed() ? 'creating' : 'idle',
    )
    const [error, setError] = useState<string | null>(null)
    const mounted = useRef(true)
    useEffect(() => {
      mounted.current = true
      return () => {
        mounted.current = false
      }
    }, [])

    const run = async (): Promise<void> => {
      setPhase('creating')
      setError(null)
      try {
        const result = await coordinator.launch()
        if (!mounted.current) return
        ctx.uiWorkspace.openSession(result.sessionId)
        setPhase('idle')
      } catch (reason) {
        if (!mounted.current) return
        setError(messageOf(reason))
        setPhase('error')
      } finally {
        clearStandaloneLauncherArm()
      }
    }

    useEffect(() => {
      if (!isStandaloneLauncherArmed()) {
        setPhase((current) => (current === 'creating' ? 'idle' : current))
        return
      }
      void run()
      // The launcher is one-shot per mount; run closes over stable ctx/services.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (phase === 'creating') {
      return (
        <div className="ss-launcher">
          <div className="ss-launcherCard" aria-live="polite">
            <div className="ss-launcherSpinner" aria-hidden="true" />
            <p className="ss-launcherTitle">{t('launcher.creating')}</p>
          </div>
        </div>
      )
    }

    if (phase === 'error') {
      return (
        <div className="ss-launcher">
          <div className="ss-launcherCard" role="alert">
            <p className="ss-launcherTitle">{t('launcher.failedTitle')}</p>
            <p className="ss-launcherHint">
              {t('panel.actionFailed', { message: error ?? '' })}
            </p>
            <div className="ss-launcherActions">
              <button
                type="button"
                className="ss-button ss-buttonPrimary"
                onClick={() => {
                  void run()
                }}
              >
                {t('launcher.retry')}
              </button>
              <button
                type="button"
                className="ss-button ss-buttonQuiet"
                onClick={() => openManagementPanel(ctx, t)}
              >
                {t('launcher.manage')}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="ss-launcher">
        <div className="ss-launcherCard">
          <p className="ss-launcherTitle">{t('entry.label')}</p>
          <p className="ss-launcherHint">{t('launcher.hint')}</p>
          <div className="ss-launcherActions">
            <button
              type="button"
              className="ss-button ss-buttonPrimary"
              onClick={() => {
                void run()
              }}
            >
              {t('entry.label')}
            </button>
            <button
              type="button"
              className="ss-button ss-buttonQuiet"
              onClick={() => openManagementPanel(ctx, t)}
            >
              {t('launcher.manage')}
            </button>
          </div>
        </div>
      </div>
    )
  }
}

/** Badge in the native New Session hero options row. */
export function createHeroBadge(ctx: ClientContext) {
  const fallbackT = ctx.locale.bind(NS)
  return function StandaloneHeroBadge({
    sessionId,
    t,
  }: { readonly sessionId?: string } & LocalizedProps): ReactElement | null {
    const translate = t ?? fallbackT
    const cwd = useSessionCwd(ctx, sessionId)
    if (!isStandaloneCwd(cwd)) return null
    return (
      <span className="ss-badge ss-heroBadge" title={translate('hero.hint')}>
        {translate('hero.badge')}
      </span>
    )
  }
}

/** Tiny leading mark on a native Ungrouped session row. */
export function createRowLeading(ctx: ClientContext) {
  const fallbackT = ctx.locale.bind(NS)
  return function StandaloneRowLeading({
    sessionId,
    t,
  }: { readonly sessionId?: string } & LocalizedProps): ReactElement | null {
    const translate = t ?? fallbackT
    const cwd = useSessionCwd(ctx, sessionId)
    if (!isStandaloneCwd(cwd)) return null
    return (
      <span className="ss-rowMark" title={translate('row.hover')} aria-label={translate('row.hover')}>
        {translate('row.mark')}
      </span>
    )
  }
}

/** Full badge line in the native session row hover card. */
export function createRowHover(ctx: ClientContext) {
  const fallbackT = ctx.locale.bind(NS)
  return function StandaloneRowHover({
    sessionId,
    t,
  }: { readonly sessionId?: string } & LocalizedProps): ReactElement | null {
    const translate = t ?? fallbackT
    const cwd = useSessionCwd(ctx, sessionId)
    if (!isStandaloneCwd(cwd)) return null
    return (
      <div className="ss-rowHover">
        <span className="ss-badge">{translate('panel.badge')}</span>
        <span>{translate('row.hover')}</span>
      </div>
    )
  }
}

/** Frame-wide toast for creation and cleanup-adjacent failures. */
export function StandaloneToast(): ReactElement | null {
  const notice = useSyncExternalStore(subscribeNotice, getNoticeSnapshot, getNoticeSnapshot)
  if (notice === null) return null
  return (
    <div
      className={`ss-toast${notice.kind === 'error' ? ' ss-toastError' : ''}`}
      role={notice.kind === 'error' ? 'alert' : 'status'}
      onClick={dismissNotice}
    >
      {notice.text}
    </div>
  )
}

interface DialogFrameProps {
  readonly title: string
  readonly children: ReactNode
  readonly footer: ReactNode
  readonly onCancel: () => void
  readonly busy?: boolean
}

function DialogFrame({ title, children, footer, onCancel, busy = false }: DialogFrameProps): ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const onCancelRef = useRef(onCancel)
  const busyRef = useRef(busy)
  onCancelRef.current = onCancel
  busyRef.current = busy
  useEffect(() => {
    const dialog = ref.current
    if (dialog === null) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusables = (): HTMLElement[] =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      )
    focusables()[0]?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !busyRef.current) {
        event.preventDefault()
        onCancelRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus({ preventScroll: true })
    }
  }, [])
  return (
    <div
      className="ss-dialogBackdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
    >
      <div className="ss-dialog" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <h2 className="ss-dialogTitle">{title}</h2>
        {children}
        <div className="ss-dialogFooter">{footer}</div>
      </div>
    </div>
  )
}

function RenameDialog({
  row,
  t,
  onCancel,
  onSave,
}: {
  readonly row: SessionRow
  readonly t: Translate
  readonly onCancel: () => void
  readonly onSave: (title: string) => Promise<void>
}): ReactElement {
  const [value, setValue] = useState(row.title?.trim() ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])
  const submit = async (): Promise<void> => {
    const title = value.trim()
    if (title === '') {
      setError(t('panel.titleRequired'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onSave(title)
    } catch (reason) {
      setError(messageOf(reason))
    } finally {
      setBusy(false)
    }
  }
  return (
    <DialogFrame
      title={t('panel.renameTitle')}
      busy={busy}
      onCancel={onCancel}
      footer={
        <>
          <button type="button" className="ss-button ss-buttonQuiet" disabled={busy} onClick={onCancel}>
            {t('panel.cancel')}
          </button>
          <button
            type="button"
            className="ss-button ss-buttonPrimary"
            disabled={busy}
            onClick={() => {
              void submit()
            }}
          >
            {t('panel.save')}
          </button>
        </>
      }
    >
      <label className="ss-fieldLabel" htmlFor="ss-rename-input">
        {t('panel.renameLabel')}
      </label>
      <input
        id="ss-rename-input"
        ref={inputRef}
        className="ss-input"
        value={value}
        maxLength={200}
        aria-invalid={error !== null}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            void submit()
          }
        }}
      />
      {error !== null ? <div className="ss-error">{error}</div> : null}
    </DialogFrame>
  )
}

function DeleteDialog({
  row,
  t,
  onCancel,
  onConfirm,
}: {
  readonly row: SessionRow
  readonly t: Translate
  readonly onCancel: () => void
  readonly onConfirm: () => Promise<void>
}): ReactElement {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirm = async (): Promise<void> => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
    } catch (reason) {
      setError(messageOf(reason))
      setBusy(false)
    }
  }
  return (
    <DialogFrame
      title={t('panel.deleteTitle')}
      busy={busy}
      onCancel={onCancel}
      footer={
        <>
          <button type="button" className="ss-button ss-buttonQuiet" disabled={busy} onClick={onCancel}>
            {t('panel.cancel')}
          </button>
          <button
            type="button"
            className="ss-button ss-buttonDanger"
            disabled={busy}
            onClick={() => {
              void confirm()
            }}
          >
            {t('panel.deleteConfirm')}
          </button>
        </>
      }
    >
      <p className="ss-dialogBody">{t('panel.deleteBody')}</p>
      {!row.blank ? <p className="ss-dialogBody">{t('panel.deleteKeepDir')}</p> : null}
      {error !== null ? <div className="ss-error">{error}</div> : null}
    </DialogFrame>
  )
}

/**
 * Confirmation for a frozen batch snapshot. The dialog only renders a short
 * preview; the full selection was already chosen in the panel.
 */
function BatchDeleteDialog({
  targets,
  t,
  progress,
  onCancel,
  onConfirm,
}: {
  readonly targets: readonly SessionRow[]
  readonly t: Translate
  readonly progress: { readonly done: number; readonly total: number } | null
  readonly onCancel: () => void
  readonly onConfirm: () => Promise<void>
}): ReactElement {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const busy = submitting || progress !== null
  const running = targets.filter((row) => row.running).length
  const hasBlank = targets.some((row) => row.blank)
  const confirm = async (): Promise<void> => {
    if (busy) return
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm()
    } catch (reason) {
      setError(messageOf(reason))
      setSubmitting(false)
    }
  }
  return (
    <DialogFrame
      title={t('panel.batchDeleteTitle', { n: targets.length })}
      busy={busy}
      onCancel={onCancel}
      footer={
        <>
          <button
            type="button"
            className="ss-button ss-buttonQuiet"
            disabled={busy}
            onClick={onCancel}
          >
            {t('panel.cancel')}
          </button>
          <button
            type="button"
            className="ss-button ss-buttonDanger"
            disabled={busy}
            aria-busy={progress !== null}
            onClick={() => {
              void confirm()
            }}
          >
            {progress === null
              ? t('panel.batchDelete')
              : t('panel.batchDeleting', {
                  done: progress.done,
                  total: progress.total,
                })}
          </button>
        </>
      }
    >
      <p className="ss-dialogBody">
        {t('panel.batchDeleteBody', { n: targets.length })}
      </p>
      {running > 0 ? (
        <p className="ss-batchWarning">{t('panel.batchDeleteRunning', { n: running })}</p>
      ) : null}
      {hasBlank ? <p className="ss-batchDirs">{t('panel.batchDeleteDirs')}</p> : null}
      {error !== null ? <div className="ss-error">{error}</div> : null}
    </DialogFrame>
  )
}

/**
 * Factory for the keyed `main` panel.
 * @param ctx - client root context.
 * @returns the panel component.
 */
export function createStandalonePanel(ctx: ClientContext) {
  const fallbackT = ctx.locale.bind(NS)
  return function StandalonePanel(props: LocalizedProps): ReactElement {
    const t = props.t ?? fallbackT
    const { rows, loading } = useStandaloneRows(ctx)
    const [busy, setBusy] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [renameTarget, setRenameTarget] = useState<SessionRow | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<SessionRow | null>(null)
    const [menuTarget, setMenuTarget] = useState<string | null>(null)
    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
    const [batchTargets, setBatchTargets] = useState<readonly SessionRow[] | null>(null)
    const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const menuButtonRef = useRef<HTMLButtonElement>(null)
    const selectAllRef = useRef<HTMLInputElement>(null)
    const selectButtonRef = useRef<HTMLButtonElement>(null)
    const panelRef = useRef<HTMLElement>(null)
    const wasSelecting = useRef(false)

    const selected = useMemo(() => selectedRows(rows, selectedIds), [rows, selectedIds])
    const state = useMemo(() => selectionState(rows, selectedIds), [rows, selectedIds])
    const locked = busy !== null || batchProgress !== null

    const exitSelection = (): void => {
      setSelectionMode(false)
      setSelectedIds(new Set())
      setMenuTarget(null)
      setError(null)
    }

    const enterSelection = (): void => {
      if (locked) return
      setMenuTarget(null)
      setSelectedIds(new Set())
      setSelectionMode(true)
    }

    useEffect(() => {
      if (menuTarget === null) return
      menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
      const onPointerDown = (event: PointerEvent): void => {
        if (menuRef.current?.contains(event.target as Node)) return
        setMenuTarget(null)
      }
      const onKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
          setMenuTarget(null)
          menuButtonRef.current?.focus()
        }
      }
      document.addEventListener('pointerdown', onPointerDown)
      document.addEventListener('keydown', onKeyDown)
      return () => {
        document.removeEventListener('pointerdown', onPointerDown)
        document.removeEventListener('keydown', onKeyDown)
      }
    }, [menuTarget])

    useEffect(() => {
      const pruned = pruneSelection(rows, selectedIds)
      if (pruned !== selectedIds) setSelectedIds(pruned)
      if (rows.length === 0 && selectionMode) {
        setSelectionMode(false)
        setSelectedIds(new Set())
      }
    }, [rows, selectedIds, selectionMode])

    useEffect(() => {
      if (selectionMode) selectAllRef.current?.focus({ preventScroll: true })
    }, [selectionMode])

    useEffect(() => {
      if (wasSelecting.current && !selectionMode && rows.length > 0) {
        selectButtonRef.current?.focus({ preventScroll: true })
      }
      wasSelecting.current = selectionMode
    }, [selectionMode, rows.length])

    useEffect(() => {
      if (selectAllRef.current !== null) selectAllRef.current.indeterminate = state.some
    }, [state.some, selectionMode])

    useEffect(() => {
      if (!selectionMode) return
      const onKey = (event: KeyboardEvent): void => {
        if (
          batchTargets !== null ||
          renameTarget !== null ||
          deleteTarget !== null ||
          menuTarget !== null
        ) {
          return
        }
        if (event.key === 'Escape') {
          event.preventDefault()
          exitSelection()
        }
      }
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }, [selectionMode, batchTargets, renameTarget, deleteTarget, menuTarget])

    const create = async (): Promise<void> => {
      if (locked) return
      setBusy('new')
      setError(null)
      try {
        await startStandalone(ctx, t)
      } catch (reason) {
        setError(t('panel.actionFailed', { message: messageOf(reason) }))
      } finally {
        setBusy(null)
      }
    }

    const open = (row: SessionRow): void => {
      if (locked) return
      setMenuTarget(null)
      try {
        ctx.uiWorkspace.openSession(row.id)
      } catch (reason) {
        setError(t('panel.actionFailed', { message: messageOf(reason) }))
      }
    }

    const toggleRow = (sessionId: string): void => {
      if (locked) return
      setSelectedIds((current) => toggleSelection(current, sessionId))
    }

    const toggleAll = (): void => {
      if (locked) return
      setSelectedIds(state.all ? new Set() : selectAllRows(rows))
    }

    const rename = async (row: SessionRow, title: string): Promise<void> => {
      setBusy(row.id)
      setError(null)
      try {
        await renameStandalone(ctx, row.id, title)
        setRenameTarget(null)
      } catch (reason) {
        throw new Error(messageOf(reason))
      } finally {
        setBusy(null)
      }
    }

    const reopenIfUnmounted = (): void => {
      window.setTimeout(() => {
        if (panelRef.current === null || !panelRef.current.isConnected) {
          openManagementPanel(ctx, t)
        }
      }, 0)
    }

    const remove = async (row: SessionRow): Promise<void> => {
      setBusy(row.id)
      setError(null)
      try {
        await archiveStandalone(ctx, row.id)
        // Archiving the active session may navigate away. Only reopen when the
        // panel actually unmounted; selecting the same panel again is a no-op
        // that can still cause a visible repaint in the host.
        reopenIfUnmounted()
        setDeleteTarget(null)
      } catch (reason) {
        throw new Error(messageOf(reason))
      } finally {
        setBusy(null)
      }
    }

    const beginBatch = (): void => {
      if (locked || selected.length === 0) return
      setMenuTarget(null)
      setError(null)
      setBatchProgress(null)
      setBatchTargets([...selected])
    }

    const runBatch = async (targets: readonly SessionRow[]): Promise<void> => {
      setBatchProgress({ done: 0, total: targets.length })
      setError(null)
      try {
        const result = await archiveStandalones(
          ctx,
          targets.map((row) => row.id),
          (done, total) => setBatchProgress({ done, total }),
        )
        setBatchTargets(null)
        setSelectedIds(new Set(result.failed.map((failure) => failure.sessionId)))
        if (result.failed.length === 0) {
          setSelectionMode(false)
        } else {
          const message = t('panel.batchPartial', { n: result.failed.length })
          setError(message)
          showNotice('error', message)
        }
        reopenIfUnmounted()
      } catch (reason) {
        setBatchTargets(null)
        const message = t('panel.actionFailed', { message: messageOf(reason) })
        setError(message)
        showNotice('error', message)
        reopenIfUnmounted()
      } finally {
        setBatchProgress(null)
      }
    }

    const count = t('panel.count', { n: rows.length })

    return (
      <section ref={panelRef} className="ss-panel" aria-label={t('panel.title')}>
        <div className="ss-shell">
          <header
            className="ss-header"
            role={selectionMode ? 'toolbar' : undefined}
            aria-label={selectionMode ? t('panel.selectToolbar') : undefined}
          >
            <div className="ss-headerMain">
              <div className="ss-titleRow">
                <h1 className="ss-title">{t('panel.title')}</h1>
                <span className="ss-count ss-countInline">
                  {selectionMode
                    ? t('panel.selectedCount', { n: state.count, total: rows.length })
                    : count}
                </span>
              </div>
              <p
                className={`ss-statusLine${error !== null ? ' ss-statusLineError' : ''}`}
                role={error !== null ? 'alert' : undefined}
                title={error ?? undefined}
              >
                {error ??
                  (selectionMode ? t('panel.selectionHint') : t('panel.description'))}
              </p>
            </div>
            <div className="ss-headerActions">
              {selectionMode ? (
                <>
                  <label className="ss-selectAll">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className="ss-checkbox"
                      checked={state.all}
                      disabled={locked}
                      aria-label={t('panel.selectAllLabel')}
                      onChange={toggleAll}
                    />
                    <span>{t('panel.selectAll')}</span>
                  </label>
                  <span className="ss-deleteSlot">
                    {state.count > 0 ? (
                      <button
                        type="button"
                        className="ss-button ss-buttonDanger"
                        disabled={locked}
                        onClick={beginBatch}
                      >
                        {t('panel.batchDelete')}
                      </button>
                    ) : null}
                  </span>
                  <button
                    type="button"
                    className="ss-selectButton"
                    disabled={locked}
                    onClick={exitSelection}
                  >
                    {t('panel.cancel')}
                  </button>
                </>
              ) : rows.length > 0 ? (
                <button
                  ref={selectButtonRef}
                  type="button"
                  className="ss-selectButton"
                  disabled={locked}
                  onClick={enterSelection}
                >
                  {t('panel.select')}
                </button>
              ) : null}
            </div>
          </header>


          {loading && rows.length === 0 ? (
            <div className="ss-empty">
              <p className="ss-emptyHint">{t('panel.loading')}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="ss-empty">
              <p className="ss-emptyTitle">{t('panel.empty')}</p>
              <p className="ss-emptyHint">{t('panel.emptyHint')}</p>
              <div className="ss-emptyAction">
                <button
                  type="button"
                  className="ss-button ss-buttonPrimary"
                  disabled={locked}
                  onClick={() => {
                    void create()
                  }}
                >
                  <StandaloneComposeIcon size={14} />
                  {t('panel.new')}
                </button>
              </div>
            </div>
          ) : (
            <ul className="ss-list">
              {rows.map((row) => {
                const title = row.title?.trim() || t('panel.untitled')
                const updated = relativeTimeLabel(t, row.updatedAt)
                const openMenu = menuTarget === row.id
                const checked = selectedIds.has(row.id)
                const metaItems: ReactNode[] = []
                if (updated !== '') metaItems.push(<span key="time">{updated}</span>)
                if (row.running) {
                  metaItems.push(
                    <span key="running" className="ss-stateRunning">
                      {t('panel.running')}
                    </span>,
                  )
                }
                if (row.blank) {
                  metaItems.push(
                    <span key="blank" className="ss-status">
                      <span className="ss-statusDot" aria-hidden="true" />
                      {t('panel.blank')}
                    </span>,
                  )
                }
                return (
                  <li
                    className={`ss-row${openMenu ? ' ss-rowMenuOpen' : ''}${
                      selectionMode && checked ? ' ss-rowSelected' : ''
                    }`}
                    key={row.id}
                  >
                    <span className="ss-rowLead">
                      {selectionMode ? (
                        <input
                          type="checkbox"
                          className="ss-checkbox"
                          checked={checked}
                          disabled={locked}
                          aria-label={t('panel.selectRow', { title })}
                          onChange={() => toggleRow(row.id)}
                        />
                      ) : (
                        <StandaloneIcon size={14} />
                      )}
                    </span>
                    <button
                      type="button"
                      className="ss-rowMain"
                      disabled={locked}
                      aria-pressed={selectionMode ? checked : undefined}
                      onClick={() => {
                        if (selectionMode) toggleRow(row.id)
                        else open(row)
                      }}
                      onKeyDown={(event) => {
                        if (!selectionMode && event.key === 'ArrowDown') {
                          event.preventDefault()
                          setMenuTarget(row.id)
                        }
                      }}
                    >
                      <div className="ss-rowTitleRow">
                        <span className="ss-rowTitle" title={title}>
                          {title}
                        </span>
                      </div>
                      {metaItems.length > 0 ? (
                        <div className="ss-rowMeta">
                          {metaItems.map((item, index) => (
                            <Fragment key={index}>
                              {index > 0 ? <span className="ss-dotSep">·</span> : null}
                              {item}
                            </Fragment>
                          ))}
                        </div>
                      ) : null}
                    </button>
                    <div className="ss-rowActions">
                      {!selectionMode ? (
                        <>
                          <button
                            type="button"
                            className="ss-rowMenuButton"
                            aria-label={t('panel.more')}
                            aria-haspopup="menu"
                            aria-expanded={openMenu}
                            disabled={locked}
                            ref={openMenu ? menuButtonRef : undefined}
                            onClick={(event) => {
                              event.stopPropagation()
                              setMenuTarget(openMenu ? null : row.id)
                            }}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <span aria-hidden="true">⋯</span>
                          </button>
                          {openMenu ? (
                            <div
                              className="ss-rowMenu"
                              role="menu"
                              ref={menuRef}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                role="menuitem"
                                disabled={locked}
                                onClick={() => {
                                  setMenuTarget(null)
                                  setRenameTarget(row)
                                }}
                              >
                                {t('panel.rename')}
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                className="ss-rowMenuDanger"
                                disabled={locked}
                                onClick={() => {
                                  setMenuTarget(null)
                                  setDeleteTarget(row)
                                }}
                              >
                                {t('panel.delete')}
                              </button>
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="ss-panelHint">{t('panel.archivedHint')}</p>
        </div>
        {batchTargets !== null ? (
          <BatchDeleteDialog
            targets={batchTargets}
            t={t}
            progress={batchProgress}
            onCancel={() => {
              if (batchProgress === null) setBatchTargets(null)
            }}
            onConfirm={() => runBatch(batchTargets)}
          />
        ) : null}
        {renameTarget !== null ? (
          <RenameDialog
            row={renameTarget}
            t={t}
            onCancel={() => setRenameTarget(null)}
            onSave={(title) => rename(renameTarget, title)}
          />
        ) : null}
        {deleteTarget !== null ? (
          <DeleteDialog
            row={deleteTarget}
            t={t}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => remove(deleteTarget)}
          />
        ) : null}
      </section>
    )
  }
}
