/**
 * Browser components: the dedicated Standalone Sessions panel, the sidebar
 * entry/action, the native-row badge decorations, the hero badge and the toast.
 *
 * The designer constraint is deliberately narrow: this plugin never renders a
 * chat surface. Opening a row navigates to the native Conversation, and rename
 * and delete call the native Session/Workspace controllers.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from 'react'
import {
  isStandaloneCwd,
  relativeTime,
} from '../shared/standalone.js'
import {
  archiveStandalone,
  messageOf,
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
import { NS } from './locales.js'
import { dismissNotice, getNoticeSnapshot, showNotice, subscribeNotice } from './notice.js'
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

function basenameOf(path: string | undefined): string {
  if (typeof path !== 'string' || path === '') return ''
  const segments = path.split(/[\\/]+/).filter(Boolean)
  return segments.at(-1) ?? ''
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

/** Sidebar global-panel icon with a live count badge. */
export function createPanelIcon(ctx: ClientContext) {
  const fallbackT = ctx.locale.bind(NS)
  return function StandalonePanelIcon({
    size = 18,
    active = false,
    t,
  }: { readonly size?: number; readonly active?: boolean } & LocalizedProps): ReactElement {
    const translate = t ?? fallbackT
    const sessions = useSessionList(ctx)
    const workspaces = useWorkspaceSnapshot(ctx)
    const count = countStandalone(sessions, workspaces.archivedSessionIds)
    return (
      <span className="ss-panelIcon" title={translate('panel.label')}>
        <StandaloneIcon size={size} active={active} />
        {count > 0 ? (
          <span className="ss-panelCount" aria-hidden="true">
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </span>
    )
  }
}

/** Direct "New Standalone Session" sidebar footer action. */
export function createFooterAction(ctx: ClientContext) {
  const fallbackT = ctx.locale.bind(NS)
  return function StandaloneFooterAction({
    wide = true,
    t,
  }: { readonly wide?: boolean } & LocalizedProps): ReactElement {
    const translate = t ?? fallbackT
    const [busy, setBusy] = useState(false)
    const create = async (): Promise<void> => {
      if (busy) return
      setBusy(true)
      try {
        await startStandalone(ctx, translate)
      } catch (error) {
        showNotice('error', translate('toast.createFailed', { message: messageOf(error) }))
      } finally {
        setBusy(false)
      }
    }
    return (
      <button
        type="button"
        className={`ss-footerAction${wide ? '' : ' ss-footerRail'}`}
        aria-label={translate('footer.label')}
        title={translate('footer.tooltip')}
        disabled={busy}
        onClick={() => {
          void create()
        }}
      >
        <StandaloneIcon size={wide ? 15 : 18} />
        {wide ? <span className="ss-footerLabel">{translate('footer.label')}</span> : null}
      </button>
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
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault()
        onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onCancel])
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
      <input
        ref={inputRef}
        className="ss-input"
        value={value}
        maxLength={200}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            void submit()
          }
        }}
      />
      {error !== null ? <div className="ss-error">{t('panel.actionFailed', { message: error })}</div> : null}
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
      {error !== null ? <div className="ss-error">{t('panel.actionFailed', { message: error })}</div> : null}
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

    const create = async (): Promise<void> => {
      if (busy !== null) return
      setBusy('new')
      setError(null)
      try {
        await startStandalone(ctx, t)
      } catch (reason) {
        const message = messageOf(reason)
        setError(t('panel.actionFailed', { message }))
        showNotice('error', t('toast.createFailed', { message }))
      } finally {
        setBusy(null)
      }
    }

    const open = (row: SessionRow): void => {
      ctx.uiWorkspace.openSession(row.id)
    }

    const rename = async (row: SessionRow, title: string): Promise<void> => {
      setBusy(row.id)
      setError(null)
      try {
        await renameStandalone(ctx, row.id, title)
        setRenameTarget(null)
        showNotice('info', t('toast.renamed'))
      } catch (reason) {
        throw new Error(messageOf(reason))
      } finally {
        setBusy(null)
      }
    }

    const remove = async (row: SessionRow): Promise<void> => {
      setBusy(row.id)
      setError(null)
      try {
        await archiveStandalone(ctx, row.id)
        setDeleteTarget(null)
        showNotice('info', t('toast.deleted'))
      } catch (reason) {
        throw new Error(t('toast.deleteFailed', { message: messageOf(reason) }))
      } finally {
        setBusy(null)
      }
    }

    return (
      <section className="ss-panel" aria-label={t('panel.title')}>
        <div className="ss-shell">
          <header className="ss-header">
            <div>
              <div className="ss-titleRow">
                <h1 className="ss-title">{t('panel.title')}</h1>
                <span className="ss-badge">{t('panel.badge')}</span>
              </div>
              <p className="ss-description">{t('panel.description')}</p>
              <div className="ss-count">{t('panel.count', { n: rows.length })}</div>
            </div>
            <div className="ss-actions">
              <button
                type="button"
                className="ss-button ss-buttonPrimary"
                disabled={busy !== null}
                onClick={() => {
                  void create()
                }}
              >
                <StandaloneIcon size={14} />
                {t('panel.new')}
              </button>
            </div>
          </header>

          {error !== null ? <div className="ss-error">{error}</div> : null}

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
                  disabled={busy !== null}
                  onClick={() => {
                    void create()
                  }}
                >
                  <StandaloneIcon size={14} />
                  {t('panel.new')}
                </button>
              </div>
            </div>
          ) : (
            <div className="ss-list">
              {rows.map((row) => (
                <div className="ss-row" key={row.id}>
                  <div className="ss-rowMain">
                    <div className="ss-rowTitleRow">
                      <span className="ss-rowTitle" title={row.title ?? t('panel.untitled')}>
                        {row.title?.trim() || t('panel.untitled')}
                      </span>
                      <span className="ss-badge">{t('panel.badge')}</span>
                      {row.blank ? <span className="ss-count">{t('panel.blank')}</span> : null}
                      {row.running ? <span className="ss-stateRunning">{t('panel.running')}</span> : null}
                    </div>
                    <div className="ss-rowMeta">
                      <span>{relativeTime(row.updatedAt)}</span>
                      <span className="ss-dotSep">·</span>
                      <span className="ss-rowPath" title={row.cwd}>
                        {basenameOf(row.cwd)}
                      </span>
                    </div>
                  </div>
                  <div className="ss-rowActions">
                    <button
                      type="button"
                      className="ss-button ss-buttonQuiet"
                      disabled={busy !== null}
                      onClick={() => open(row)}
                    >
                      {t('panel.open')}
                    </button>
                    <button
                      type="button"
                      className="ss-button ss-buttonQuiet"
                      disabled={busy !== null}
                      onClick={() => setRenameTarget(row)}
                    >
                      {t('panel.rename')}
                    </button>
                    <button
                      type="button"
                      className="ss-button ss-buttonDanger"
                      disabled={busy !== null}
                      onClick={() => setDeleteTarget(row)}
                    >
                      {t('panel.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="ss-count" style={{ marginTop: 18 }}>
            {t('panel.archivedHint')}
          </p>
        </div>
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
