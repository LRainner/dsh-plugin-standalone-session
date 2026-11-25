/**
 * Sidebar entries and native-row decorations.
 *
 * The designer constraint is deliberately narrow: this plugin never renders a
 * chat surface. The management panel lives in `panel.tsx`; the sidebar row
 * opens the launcher, which creates (or reuses) a blank standalone session and
 * then opens its native Conversation.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react'
import { isStandaloneCwd } from '../shared/standalone.js'
import { messageOf, openManagementPanel, standaloneCoordinator } from './actions.js'
import { countStandalone, useSessionCwd, useSessionList, useWorkspaceSnapshot } from './hooks.js'
import {
  armStandaloneLauncher,
  clearStandaloneLauncherArm,
  isStandaloneLauncherArmed,
} from './launcher.js'
import { NS } from './locales.js'
import type { ClientContext, Translate } from './dsh.js'

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
export function StandaloneComposeIcon({
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
  const coordinator = standaloneCoordinator(ctx, fallbackT)

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
      <span className="ss-rowMark" title={translate('row.hover')} aria-hidden="true">
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
