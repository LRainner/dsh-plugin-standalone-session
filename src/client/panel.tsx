/**
 * The dedicated Standalone Sessions manager.
 *
 * Interaction contract:
 * - the search field filters titles and keeps the same node across modes;
 * - selecting a row in normal mode opens its native Conversation;
 * - selection mode turns the row into one label + checkbox (single tab stop)
 *   and keeps the toolbar in place;
 * - the row menu is a top-layer popover that flips above the trigger and
 *   closes on outside press, `Esc`, `Tab`, scroll and resize;
 * - rename/archive run in native modal dialogs, so focus containment, `Esc`
 *   and focus return come from the browser; a fallback moves focus to a
 *   neighbouring row when the invoker disappeared.
 */
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react'
import {
  archiveStandalone,
  archiveStandalones,
  messageOf,
  openManagementPanel,
  renameStandalone,
  startStandalone,
} from './actions.js'
import { StandaloneComposeIcon, StandaloneIcon } from './components.js'
import { ArchiveDialog, BatchArchiveDialog, RenameDialog } from './dialogs.js'
import {
  filterSessionRows,
  formatSessionTime,
  groupSessionRows,
  normalizeQuery,
  sessionTitle,
} from './format.js'
import {
  standaloneRows,
  useSessionList,
  useWorkspaceSnapshot,
} from './hooks.js'
import type { ClientContext, SessionRow, Translate } from './dsh.js'
import { NS } from './locales.js'
import { RowMenu } from './menu.js'
import {
  pruneSelection,
  selectAllRows,
  selectedRows,
  selectionState,
  toggleSelection,
} from './selection.js'

/**
 * `<search>` is the native element for a search/filter region. TypeScript's
 * JSX table can lag behind the platform, so it is typed as a plain element.
 */
const SearchRegion = 'search' as unknown as 'div'

interface LocalizedProps {
  readonly t?: Translate
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

/** Checkbox glyph shared by the select-all and row controls. */
function CheckGlyph(): ReactElement {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="m2.5 6.2 2.3 2.3 4.7-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Factory for the keyed `main` panel.
 * @param ctx - client root context.
 * @returns the panel component.
 */
export function createStandalonePanel(ctx: ClientContext) {
  const fallbackT = ctx.locale.bind(NS)
  let rememberedQuery = ''

  return function StandalonePanel(props: LocalizedProps): ReactElement {
    const t = props.t ?? fallbackT
    const { rows, loading } = useStandaloneRows(ctx)
    const [query, setQuery] = useState(() => rememberedQuery)
    const [effectiveQuery, setEffectiveQuery] = useState(() => rememberedQuery)
    const deferredQuery = useDeferredValue(effectiveQuery)
    const [now, setNow] = useState(() => Date.now())
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [renameTarget, setRenameTarget] = useState<SessionRow | null>(null)
    const [archiveTarget, setArchiveTarget] = useState<SessionRow | null>(null)
    const [menuTarget, setMenuTarget] = useState<string | null>(null)
    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
    const [batchTargets, setBatchTargets] = useState<readonly SessionRow[] | null>(null)
    const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null)
    const [announcement, setAnnouncement] = useState('')
    const panelRef = useRef<HTMLElement>(null)
    const createRef = useRef<HTMLButtonElement>(null)
    const selectAllRef = useRef<HTMLInputElement>(null)
    const batchButtonRef = useRef<HTMLButtonElement>(null)
    const menuTriggerRef = useRef<HTMLButtonElement | null>(null)
    const rowMenuRefs = useRef(new Map<string, HTMLButtonElement>())
    const announceTimer = useRef<number | undefined>(undefined)
    const lastSelectionAnnouncement = useRef('')
    const wasSelecting = useRef(false)
    const composing = useRef(false)
    const queryRef = useRef(query)
    queryRef.current = query
    const appliedQuery = useRef(normalizeQuery(effectiveQuery))
    const selectionModeRef = useRef(selectionMode)
    selectionModeRef.current = selectionMode

    const filteredRows = useMemo(
      () => filterSessionRows(rows, t, deferredQuery),
      [rows, deferredQuery, t],
    )
    const groups = useMemo(() => groupSessionRows(filteredRows, now), [filteredRows, now])
    const selected = useMemo(
      () => selectedRows(filteredRows, selectedIds),
      [filteredRows, selectedIds],
    )
    const state = useMemo(
      () => selectionState(filteredRows, selectedIds),
      [filteredRows, selectedIds],
    )
    const locked = creating || batchProgress !== null

    useEffect(() => {
      const tick = (): void => setNow(Date.now())
      const timer = window.setInterval(tick, 60_000)
      const onVisibility = (): void => {
        if (document.visibilityState === 'visible') tick()
      }
      document.addEventListener('visibilitychange', onVisibility)
      return () => {
        window.clearInterval(timer)
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }, [])

    useEffect(() => {
      const normalized = normalizeQuery(effectiveQuery)
      if (normalized === appliedQuery.current) return
      appliedQuery.current = normalized
      if (selectionMode) setSelectedIds(new Set())
    }, [effectiveQuery, selectionMode])

    useEffect(() => {
      const pruned = pruneSelection(filteredRows, selectedIds)
      if (pruned !== selectedIds) setSelectedIds(pruned)
      if (rows.length === 0 && selectionMode) {
        setSelectionMode(false)
        setSelectedIds(new Set())
      }
    }, [filteredRows, rows.length, selectedIds, selectionMode])

    useEffect(() => {
      if (selectionMode) selectAllRef.current?.focus({ preventScroll: true })
    }, [selectionMode])

    useEffect(() => {
      if (wasSelecting.current && !selectionMode && rows.length > 0) {
        batchButtonRef.current?.focus({ preventScroll: true })
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
          archiveTarget !== null ||
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
    }, [selectionMode, batchTargets, renameTarget, archiveTarget, menuTarget])

    useEffect(() => {
      return () => window.clearTimeout(announceTimer.current)
    }, [])

    useEffect(() => {
      if (!selectionMode) {
        lastSelectionAnnouncement.current = ''
        return
      }
      const text = t('panel.selectedItems', { n: state.count })
      if (text === lastSelectionAnnouncement.current) return
      const timer = window.setTimeout(() => {
        lastSelectionAnnouncement.current = text
        setAnnouncement(text)
      }, 250)
      return () => window.clearTimeout(timer)
    }, [selectionMode, state.count, t])

    const announce = (text: string): void => {
      window.clearTimeout(announceTimer.current)
      setAnnouncement('')
      announceTimer.current = window.setTimeout(() => setAnnouncement(text), 80)
    }

    /** Return focus when the native invoker is gone or nothing got it back. */
    const focusRowControl = (sessionId: string | null): void => {
      window.requestAnimationFrame(() => {
        if (document.activeElement !== null && document.activeElement !== document.body) return
        const rowControl =
          (sessionId !== null ? rowMenuRefs.current.get(sessionId) : undefined) ??
          document.querySelector<HTMLElement>('.ss-panel [data-ss-row-main]') ??
          createRef.current
        rowControl?.focus({ preventScroll: true })
      })
    }

    const closeRename = (): void => {
      const sessionId = renameTarget?.id ?? null
      setRenameTarget(null)
      focusRowControl(sessionId)
    }

    const closeArchive = (): void => {
      const sessionId = archiveTarget?.id ?? null
      setArchiveTarget(null)
      focusRowControl(sessionId)
    }

    const closeBatch = (): void => {
      setBatchTargets(null)
      focusRowControl(null)
    }

    const exitSelection = (): void => {
      setSelectionMode(false)
      setSelectedIds(new Set())
      setMenuTarget(null)
      setError(null)
    }

    const enterSelection = (): void => {
      if (locked || rows.length === 0) return
      setMenuTarget(null)
      setSelectedIds(new Set())
      setSelectionMode(true)
    }

    const create = async (): Promise<void> => {
      if (locked) return
      setCreating(true)
      setError(null)
      try {
        rememberedQuery = ''
        setQuery('')
        setEffectiveQuery('')
        await startStandalone(ctx, t)
      } catch (reason) {
        setError(t('panel.actionFailed', { message: messageOf(reason) }))
      } finally {
        setCreating(false)
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
      setSelectedIds(state.all ? new Set() : selectAllRows(filteredRows))
    }

    const rename = async (row: SessionRow, title: string): Promise<void> => {
      await renameStandalone(ctx, row.id, title)
    }

    const reopenIfUnmounted = (): void => {
      window.setTimeout(() => {
        if (panelRef.current === null || !panelRef.current.isConnected) {
          openManagementPanel(ctx, t)
        }
      }, 0)
    }

    const archive = async (row: SessionRow): Promise<void> => {
      await archiveStandalone(ctx, row.id, { stopActivity: row.running })
      reopenIfUnmounted()
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
      announce(t('panel.batchDeleting', { done: 0, total: targets.length }))
      try {
        const stopActivity = new Map(targets.map((row) => [row.id, row.running]))
        const result = await archiveStandalones(
          ctx,
          targets.map((row) => row.id),
          (done, total) => setBatchProgress({ done, total }),
          (sessionId) => stopActivity.get(sessionId) === true,
        )
        setSelectedIds(new Set(result.failed.map((failure) => failure.sessionId)))
        if (result.failed.length === 0) {
          setSelectionMode(false)
          announce(t('panel.batchDone', { n: result.archived.length }))
        } else {
          const message = t('panel.batchPartial', { n: result.failed.length })
          setError(message)
          announce(message)
        }
        reopenIfUnmounted()
      } catch (reason) {
        const message = t('panel.actionFailed', { message: messageOf(reason) })
        setError(message)
        announce(message)
        reopenIfUnmounted()
      } finally {
        setBatchProgress(null)
      }
    }

    const groupLabel = (key: 'today' | 'yesterday' | 'earlier' | 'unknown'): string => {
      if (key === 'today') return t('panel.groupToday')
      if (key === 'yesterday') return t('panel.groupYesterday')
      if (key === 'earlier') return t('panel.groupEarlier')
      return t('panel.groupUnknown')
    }

    const count = t('panel.count', { n: rows.length })
    const hasQuery = normalizeQuery(deferredQuery) !== ''
    const noRows = rows.length === 0
    const changeQuery = (value: string): void => {
      rememberedQuery = value
      setQuery(value)
      if (!composing.current) setEffectiveQuery(value)
    }
    const clearQuery = (): void => {
      rememberedQuery = ''
      setQuery('')
      setEffectiveQuery('')
    }

    return (
      <section ref={panelRef} className="ss-panel" aria-label={t('panel.title')}>
        <div className="ss-shell">
          <header className="ss-header">
            <div className="ss-headerMain">
              <div className="ss-titleRow">
                <h1 className="ss-title">{t('panel.title')}</h1>
                <span className="ss-count ss-countInline">{count}</span>
              </div>
              <p className="ss-statusLine">{t('panel.description')}</p>
            </div>
            <div className="ss-headerActions">
              <button
                ref={createRef}
                type="button"
                className="ss-button ss-buttonPrimary"
                aria-disabled={locked}
                onClick={() => {
                  void create()
                }}
              >
                <StandaloneComposeIcon size={14} />
                {creating ? t('panel.creating') : t('panel.new')}
              </button>
            </div>
          </header>

          <div className={`ss-tools${selectionMode ? ' ss-toolsSelecting' : ''}`}>
            <SearchRegion className="ss-search">
              <svg
                className="ss-searchIcon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="m10.5 10.5 2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                name="q"
                value={query}
                placeholder={t('panel.searchPlaceholder')}
                aria-label={t('panel.searchLabel')}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="search"
                disabled={batchProgress !== null}
                onChange={(event) => changeQuery(event.target.value)}
                onCompositionStart={() => {
                  composing.current = true
                }}
                onCompositionEnd={() => {
                  composing.current = false
                  setEffectiveQuery(queryRef.current)
                }}
              />
              {query !== '' ? (
                <button
                  type="button"
                  className="ss-clearSearch"
                  aria-label={t('panel.clearSearch')}
                  onClick={clearQuery}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="m3 3 8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </button>
              ) : null}
            </SearchRegion>
            <div className="ss-toolsActions">
              {selectionMode ? (
                <>
                  <label className="ss-selectAll">
                    <span className="ss-check">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        className="ss-checkInput"
                        checked={state.all}
                        disabled={locked || filteredRows.length === 0}
                        aria-label={
                          hasQuery
                            ? t('panel.selectAllCurrent', { n: filteredRows.length })
                            : t('panel.selectAllLabel')
                        }
                        onChange={toggleAll}
                      />
                      <span className="ss-checkBox" aria-hidden="true">
                        <CheckGlyph />
                      </span>
                    </span>
                    <span>{t('panel.selectAllShort')}</span>
                  </label>
                  <span className="ss-batchCount">
                    {t('panel.selectedItems', { n: state.count })}
                  </span>
                  <button
                    type="button"
                    className="ss-button ss-buttonQuiet ss-archiveSelected"
                    disabled={locked || state.count === 0}
                    onClick={beginBatch}
                  >
                    {t('panel.archiveSelected')}
                  </button>
                  <button
                    type="button"
                    className="ss-button ss-buttonQuiet"
                    disabled={locked}
                    onClick={exitSelection}
                  >
                    {t('panel.done')}
                  </button>
                </>
              ) : rows.length > 0 ? (
                <button
                  ref={batchButtonRef}
                  type="button"
                  className="ss-button ss-buttonQuiet ss-batchManage"
                  disabled={locked}
                  onClick={enterSelection}
                >
                  {t('panel.batchManage')}
                </button>
              ) : null}
            </div>
          </div>

          <span className="ss-visuallyHidden" aria-live="polite">
            {hasQuery ? t('panel.searchResults', { n: filteredRows.length }) : ''}
          </span>
          <span className="ss-visuallyHidden" aria-live="polite" aria-atomic="true">
            {announcement}
          </span>

          {error !== null ? (
            <div className="ss-feedback ss-feedbackError" role="alert">
              {error}
            </div>
          ) : null}

          {loading && noRows ? (
            <div className="ss-skeleton" role="status">
              <span className="ss-visuallyHidden">{t('panel.loading')}</span>
              {[0, 1, 2, 3].map((index) => (
                <div className="ss-skeletonRow" key={index} aria-hidden="true">
                  <span className="ss-skeletonIcon" />
                  <span className="ss-skeletonCopy">
                    <span className="ss-skeletonLine" />
                    <span className="ss-skeletonLine ss-skeletonLineShort" />
                  </span>
                </div>
              ))}
            </div>
          ) : noRows && !hasQuery ? (
            <div className="ss-empty">
              <p className="ss-emptyTitle">{t('panel.empty')}</p>
              <p className="ss-emptyHint">{t('panel.emptyHint')}</p>
              <div className="ss-emptyAction">
                <button
                  type="button"
                  className="ss-button ss-buttonPrimary"
                  aria-disabled={locked}
                  onClick={() => {
                    void create()
                  }}
                >
                  <StandaloneComposeIcon size={14} />
                  {creating ? t('panel.creating') : t('panel.new')}
                </button>
              </div>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="ss-empty ss-emptySearch">
              <p className="ss-emptyTitle">{t('panel.noSearchResults')}</p>
              <p className="ss-emptyHint">{t('panel.noSearchHint')}</p>
              <div className="ss-emptyAction">
                <button type="button" className="ss-button ss-buttonQuiet" onClick={clearQuery}>
                  {t('panel.clearSearch')}
                </button>
              </div>
            </div>
          ) : (
            groups.map((group) => (
              <section className="ss-group" key={group.key}>
                <h2 className="ss-groupTitle">{groupLabel(group.key)}</h2>
                <ul className="ss-list">
                  {group.rows.map((row) => {
                    const title = sessionTitle(row, t)
                    const updated = formatSessionTime(t, row.updatedAt, now)
                    const iso =
                      Number.isFinite(row.updatedAt) && row.updatedAt > 0
                        ? new Date(row.updatedAt).toISOString()
                        : undefined
                    const openMenu = menuTarget === row.id
                    const checked = selectedIds.has(row.id)
                    const checkId = `ss-row-check-${row.id}`
                    const menuTriggerId = `ss-row-menu-${row.id}`
                    const status = row.running ? (
                      <span className="ss-stateRunning">{t('panel.running')}</span>
                    ) : row.blank ? (
                      <span className="ss-stateBlank">{t('panel.blank')}</span>
                    ) : null
                    const content = (
                      <>
                        <span className="ss-rowTitleRow">
                          <span className="ss-rowTitle" title={title}>
                            {title}
                          </span>
                          {updated !== '' ? (
                            <time className="ss-rowTime" dateTime={iso}>
                              {updated}
                            </time>
                          ) : null}
                        </span>
                        <span className="ss-rowMeta">
                          {status}
                          {status !== null && updated !== '' ? (
                            <span className="ss-metaSeparator" aria-hidden="true">
                              ·
                            </span>
                          ) : null}
                          {updated !== '' ? (
                            <time className="ss-rowTimeCompact" dateTime={iso}>
                              {updated}
                            </time>
                          ) : null}
                        </span>
                      </>
                    )
                    return (
                      <li
                        className={`ss-row${openMenu ? ' ss-rowMenuOpen' : ''}${
                          selectionMode ? ' ss-rowSelecting' : ''
                        }${selectionMode && checked ? ' ss-rowSelected' : ''}`}
                        key={row.id}
                      >
                        <span className="ss-rowLead">
                          {selectionMode ? (
                            <label className="ss-check">
                              <input
                                id={checkId}
                                type="checkbox"
                                className="ss-checkInput"
                                checked={checked}
                                disabled={locked}
                                aria-label={t('panel.selectRow', { title })}
                                onChange={() => toggleRow(row.id)}
                              />
                              <span className="ss-checkBox" aria-hidden="true">
                                <CheckGlyph />
                              </span>
                            </label>
                          ) : (
                            <StandaloneIcon size={16} />
                          )}
                        </span>
                        {selectionMode ? (
                          <label className="ss-rowMain ss-rowMainSelecting" htmlFor={checkId}>
                            {content}
                          </label>
                        ) : (
                          <button
                            type="button"
                            className="ss-rowMain"
                            data-ss-row-main=""
                            disabled={locked}
                            onClick={() => open(row)}
                          >
                            {content}
                          </button>
                        )}
                        <div className="ss-rowActions">
                          {!selectionMode ? (
                            <button
                              type="button"
                              id={menuTriggerId}
                              className="ss-rowMenuButton"
                              aria-label={t('panel.moreFor', { title })}
                              aria-haspopup="menu"
                              aria-expanded={openMenu}
                              disabled={locked}
                              ref={(element) => {
                                if (element !== null) rowMenuRefs.current.set(row.id, element)
                                else rowMenuRefs.current.delete(row.id)
                              }}
                              onClick={(event) => {
                                event.stopPropagation()
                                menuTriggerRef.current = event.currentTarget
                                setMenuTarget(openMenu ? null : row.id)
                              }}
                              onKeyDown={(event) => event.stopPropagation()}
                            >
                              <span aria-hidden="true">⋯</span>
                            </button>
                          ) : null}
                          {!selectionMode && openMenu ? (
                            <RowMenu
                              triggerId={menuTriggerId}
                              triggerRef={menuTriggerRef}
                              onClose={() => setMenuTarget(null)}
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuTarget(null)
                                  rowMenuRefs.current.get(row.id)?.focus({ preventScroll: true })
                                  setRenameTarget(row)
                                }}
                              >
                                {t('panel.rename')}
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuTarget(null)
                                  rowMenuRefs.current.get(row.id)?.focus({ preventScroll: true })
                                  setArchiveTarget(row)
                                }}
                              >
                                {t('panel.archive')}
                              </button>
                            </RowMenu>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))
          )}
          <p className="ss-panelHint">{t('panel.archivedHint')}</p>
        </div>
        {batchTargets !== null ? (
          <BatchArchiveDialog
            targets={batchTargets}
            t={t}
            progress={batchProgress}
            closeBlockedHint={t('dialog.closeBlocked')}
            onClose={closeBatch}
            onConfirm={() => runBatch(batchTargets)}
          />
        ) : null}
        {renameTarget !== null ? (
          <RenameDialog
            row={renameTarget}
            t={t}
            closeBlockedHint={t('dialog.closeBlocked')}
            onClose={closeRename}
            onSave={(title) => rename(renameTarget, title)}
          />
        ) : null}
        {archiveTarget !== null ? (
          (() => {
            const latest = rows.find((row) => row.id === archiveTarget.id) ?? archiveTarget
            return (
              <ArchiveDialog
                row={latest}
                t={t}
                closeBlockedHint={t('dialog.closeBlocked')}
                onClose={closeArchive}
                onConfirm={() => archive(latest)}
              />
            )
          })()
        ) : null}
      </section>
    )
  }
}
