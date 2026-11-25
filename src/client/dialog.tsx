/**
 * Native modal dialog frame.
 *
 * `<dialog>` + `showModal()` gives what a hand-written overlay has to rebuild:
 * an inert page, focus containment, the top layer (no z-index or
 * `container-type` surprises), `Esc` and the back gesture, `::backdrop`, and
 * focus return to the invoker. It is Baseline widely available.
 *
 * Dismissal policy: `closedby="any"` adds click-outside where supported; the
 * pointer fallback covers browsers that do not ship `closedby` yet. `Esc` and
 * the back gesture work either way. While `busy`, a close request is refused
 * and a visible, announced hint explains why.
 */
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react'

export interface DialogProps {
  readonly title: string
  readonly description?: ReactNode
  readonly children?: ReactNode
  readonly footer: ReactNode
  readonly busy?: boolean
  readonly dialogRef: RefObject<HTMLDialogElement>
  readonly onClose: () => void
  readonly closeBlockedHint: string
}

/** `closedby` is not in React's JSX types yet; pass it as a plain attribute. */
const CLOSED_BY_ANY: Record<string, string> = { closedby: 'any' }

function supportsClosedBy(): boolean {
  return typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype
}

/**
 * Modal dialog with a native `<dialog>` body.
 * @param props - title, body, footer and dismissal callbacks.
 * @returns the rendered dialog, mounted only while it should be open.
 */
export function Dialog({
  title,
  description,
  children,
  footer,
  busy = false,
  dialogRef,
  onClose,
  closeBlockedHint,
}: DialogProps): ReactElement {
  const titleId = useId()
  const descriptionId = useId()
  const hintId = useId()
  const [blocked, setBlocked] = useState(false)
  const busyRef = useRef(busy)
  const onCloseRef = useRef(onClose)
  busyRef.current = busy
  onCloseRef.current = onClose

  useEffect(() => {
    if (!busy) setBlocked(false)
  }, [busy])

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null || !dialog.isConnected) return
    if (!dialog.open) dialog.showModal()
    dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]')?.focus({ preventScroll: true })

    const cancel = (event: Event): void => {
      if (!busyRef.current) return
      event.preventDefault()
      setBlocked(true)
    }
    const close = (): void => {
      setBlocked(false)
      onCloseRef.current()
    }
    dialog.addEventListener('cancel', cancel)
    dialog.addEventListener('close', close)
    return () => {
      dialog.removeEventListener('cancel', cancel)
      dialog.removeEventListener('close', close)
      if (dialog.open) dialog.close()
    }
  }, [dialogRef])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null || supportsClosedBy()) return
    let pressedOutside = false
    const isOutside = (event: PointerEvent): boolean => {
      const rect = dialog.getBoundingClientRect()
      return (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
    }
    const pointerDown = (event: PointerEvent): void => {
      pressedOutside = isOutside(event)
    }
    const pointerUp = (event: PointerEvent): void => {
      // Require press and release outside so a text-selection drag never closes.
      if (!pressedOutside || !isOutside(event) || busyRef.current) return
      dialog.close('dismiss')
    }
    dialog.addEventListener('pointerdown', pointerDown)
    dialog.addEventListener('pointerup', pointerUp)
    return () => {
      dialog.removeEventListener('pointerdown', pointerDown)
      dialog.removeEventListener('pointerup', pointerUp)
    }
  }, [dialogRef])

  const describedBy = [description !== undefined ? descriptionId : null, blocked ? hintId : null]
    .filter((id): id is string => id !== null)
    .join(' ')

  return (
    <dialog
      {...CLOSED_BY_ANY}
      ref={dialogRef}
      className="ss-dialog"
      aria-labelledby={titleId}
      aria-describedby={describedBy === '' ? undefined : describedBy}
    >
      <h2 className="ss-dialogTitle" id={titleId}>
        {title}
      </h2>
      {description !== undefined ? (
        <p className="ss-dialogBody" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {blocked ? (
        <p className="ss-dialogHint" id={hintId} role="status">
          {closeBlockedHint}
        </p>
      ) : null}
      {children}
      <div className="ss-dialogFooter">{footer}</div>
    </dialog>
  )
}
