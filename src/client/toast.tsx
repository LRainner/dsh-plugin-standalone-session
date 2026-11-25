/**
 * Frame-wide notification region.
 *
 * The region is always in the DOM so assistive technologies can find a stable
 * place for announcements. Each toast exposes its own live role, an explicit
 * close button that keyboard users can reach, and pauses its auto-dismiss
 * timer while the pointer or focus is inside it.
 */
import { useEffect, useState, useSyncExternalStore, type ReactElement } from 'react'
import type { ClientContext, Translate } from './dsh.js'
import { NS } from './locales.js'
import { dismissNotice, getNoticeSnapshot, subscribeNotice } from './notice.js'

/** How long a notice stays before it dismisses itself. */
export const NOTICE_DURATION_MS = 6000

/**
 * Build the toast component with the bound translate function.
 * @param ctx - client root context.
 * @returns the `shell.overlay` component.
 */
export function createStandaloneToast(ctx: ClientContext): (props?: { readonly t?: Translate }) => ReactElement {
  const fallbackT = ctx.locale.bind(NS)
  return function StandaloneToast(props: { readonly t?: Translate } = {}): ReactElement {
    const t = props.t ?? fallbackT
    const notice = useSyncExternalStore(subscribeNotice, getNoticeSnapshot, getNoticeSnapshot)
    const [paused, setPaused] = useState(false)

    useEffect(() => {
      if (notice === null || paused) return
      const timer = window.setTimeout(dismissNotice, NOTICE_DURATION_MS)
      return () => window.clearTimeout(timer)
    }, [notice?.id, paused])

    useEffect(() => {
      setPaused(false)
    }, [notice?.id])

    return (
      <div className="ss-toastRegion" role="region" aria-label={t('toast.region')}>
        {notice === null ? null : (
          <div
            className={`ss-toast${notice.kind === 'error' ? ' ss-toastError' : ''}`}
            onPointerEnter={() => setPaused(true)}
            onPointerLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            <span
              className="ss-toastText"
              role={notice.kind === 'error' ? 'alert' : 'status'}
              aria-atomic="true"
            >
              {notice.text}
            </span>
            <button
              type="button"
              className="ss-toastClose"
              aria-label={t('toast.close')}
              onClick={dismissNotice}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="m3 3 8 8M11 3l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    )
  }
}
