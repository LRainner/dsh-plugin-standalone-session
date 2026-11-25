/**
 * Pure viewport-placement math for the row menu.
 *
 * The menu is rendered in the top layer (Popover API), so it is positioned with
 * `position: fixed` and must stay inside the visual viewport: align to the
 * trigger's inline end, flip above when there is not enough room below, and
 * clamp at every edge. Keeping this out of the component makes the flip and
 * clamp rules directly unit-testable.
 */

/** Axis-aligned rectangle in CSS pixels, viewport coordinates. */
export interface MenuRect {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}

/** Rendered size of the menu. */
export interface MenuSize {
  readonly width: number
  readonly height: number
}

/** Visual viewport size. */
export interface MenuViewport {
  readonly width: number
  readonly height: number
}

/** Resolved top-left corner and whether the menu was flipped above the anchor. */
export interface MenuPlacement {
  readonly left: number
  readonly top: number
  readonly flipped: boolean
}

/** Space between the trigger and the menu. */
export const MENU_GAP = 6

/** Minimum distance kept between the menu and the viewport edges. */
export const MENU_MARGIN = 8

/**
 * Place a menu next to its trigger without leaving the viewport.
 * @param anchor - trigger rectangle in viewport coordinates.
 * @param menu - measured menu size.
 * @param viewport - visual viewport size.
 * @param gap - distance between trigger and menu.
 * @param margin - minimum distance to the viewport edges.
 * @returns the top-left corner and whether the menu flipped above the trigger.
 */
export function placeMenu(
  anchor: MenuRect,
  menu: MenuSize,
  viewport: MenuViewport,
  gap: number = MENU_GAP,
  margin: number = MENU_MARGIN,
): MenuPlacement {
  const maxLeft = viewport.width - menu.width - margin
  const preferredLeft = anchor.right - menu.width
  const left = Math.round(
    maxLeft < margin ? margin : Math.min(Math.max(preferredLeft, margin), maxLeft),
  )

  const spaceBelow = viewport.height - anchor.bottom - gap - margin
  const below = anchor.bottom + gap
  const above = anchor.top - menu.height - gap
  const fitsBelow = menu.height <= spaceBelow
  const fitsAbove = above >= margin

  if (fitsBelow) {
    return { left, top: Math.round(below), flipped: false }
  }
  if (fitsAbove) {
    return { left, top: Math.round(above), flipped: true }
  }
  // Neither side fits: pin to the top margin and let the menu scroll.
  return {
    left,
    top: margin,
    flipped: above > below,
  }
}
