/**
 * Row action menu.
 *
 * The menu is a `popover="manual"` element, so it renders in the top layer:
 * the scroll container that holds the list can no longer clip it. Position is
 * resolved with `placeMenu` (viewport clamp + flip above) and re-resolved on
 * open; the menu closes on an outside pointer press, `Esc` (focus returns to
 * the trigger), `Tab`/focus leaving the menu, scroll and resize.
 *
 * The `popover` attribute is progressive enhancement: where `showPopover` is
 * missing the menu falls back to the inline absolute placement in CSS.
 */
import {
  useLayoutEffect,
  useRef,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react'
import { placeMenu } from './menu-position.js'

export interface RowMenuProps {
  /** id of the trigger button, used as the menu's accessible name. */
  readonly triggerId: string
  readonly triggerRef: RefObject<HTMLButtonElement | null>
  readonly onClose: () => void
  readonly children: ReactNode
}

const POPOVER_ATTRS: Record<string, string> = { popover: 'manual' }

/**
 * One popup menu for the row that is currently open.
 * @param props - trigger id/ref, close callback and the menu items.
 * @returns the menu element.
 */
export function RowMenu({ triggerId, triggerRef, onClose, children }: RowMenuProps): ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useLayoutEffect(() => {
    const menu = ref.current
    if (menu === null) return
    const trigger = triggerRef.current
    const supportsPopover = typeof menu.showPopover === 'function'

    if (supportsPopover) {
      menu.style.visibility = 'hidden'
      try {
        menu.showPopover()
      } catch {
        // Already open or not connected: keep the element usable.
      }
    }

    if (supportsPopover && trigger !== null) {
      const anchor = trigger.getBoundingClientRect()
      const placement = placeMenu(
        { left: anchor.left, top: anchor.top, right: anchor.right, bottom: anchor.bottom },
        { width: menu.offsetWidth, height: menu.offsetHeight },
        { width: window.innerWidth, height: window.innerHeight },
      )
      menu.style.left = `${placement.left}px`
      menu.style.top = `${placement.top}px`
      menu.style.visibility = ''
    }

    // One tab stop for the whole menu: the focused item is tabbable, the rest
    // are reached with the arrow keys (a roving tabindex, since `focusgroup`
    // is not available everywhere yet).
    const syncTabIndex = (active: HTMLElement | undefined): void => {
      for (const item of menu.querySelectorAll<HTMLButtonElement>('button:not([disabled])')) {
        item.tabIndex = item === active ? 0 : -1
      }
    }
    const items = Array.from(menu.querySelectorAll<HTMLButtonElement>('button:not([disabled])'))
    const initial = items[0]
    syncTabIndex(initial)
    initial?.focus({ preventScroll: true })

    const pointerDown = (event: PointerEvent): void => {
      const target = event.target as Node
      if (menu.contains(target)) return
      if (triggerRef.current?.contains(target) === true) return
      onCloseRef.current()
    }

    const focusIn = (event: FocusEvent): void => {
      if (event.target instanceof HTMLElement) syncTabIndex(event.target)
    }

    const keyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        triggerRef.current?.focus({ preventScroll: true })
        onCloseRef.current()
        return
      }
      const enabled = Array.from(menu.querySelectorAll<HTMLButtonElement>('button:not([disabled])'))
      if (enabled.length === 0) return
      const current = enabled.indexOf(document.activeElement as HTMLButtonElement)
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const delta = event.key === 'ArrowDown' ? 1 : -1
        const next = enabled[(current + delta + enabled.length) % enabled.length]
        syncTabIndex(next)
        next?.focus()
      } else if (event.key === 'Home') {
        event.preventDefault()
        syncTabIndex(enabled[0])
        enabled[0]?.focus()
      } else if (event.key === 'End') {
        event.preventDefault()
        syncTabIndex(enabled[enabled.length - 1])
        enabled[enabled.length - 1]?.focus()
      }
    }

    const focusOut = (event: FocusEvent): void => {
      const next = event.relatedTarget as Node | null
      if (next !== null && menu.contains(next)) return
      onCloseRef.current()
    }

    // The trigger is fixed to the row: any scroll detaches the menu.
    const dismiss = (): void => onCloseRef.current()

    document.addEventListener('pointerdown', pointerDown, true)
    document.addEventListener('keydown', keyDown)
    menu.addEventListener('focusout', focusOut)
    menu.addEventListener('focusin', focusIn)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    return () => {
      document.removeEventListener('pointerdown', pointerDown, true)
      document.removeEventListener('keydown', keyDown)
      menu.removeEventListener('focusout', focusOut)
      menu.removeEventListener('focusin', focusIn)
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
      // Unmounting while focus is inside would otherwise drop it to <body>.
      if (menu.contains(document.activeElement)) {
        triggerRef.current?.focus({ preventScroll: true })
      }
      if (supportsPopover && menu.matches(':popover-open')) {
        try {
          menu.hidePopover()
        } catch {
          // The menu is already gone.
        }
      }
    }
  }, [triggerRef])

  return (
    <div
      {...POPOVER_ATTRS}
      ref={ref}
      className="ss-rowMenu"
      role="menu"
      aria-labelledby={triggerId}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  )
}
