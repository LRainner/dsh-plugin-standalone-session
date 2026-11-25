import { describe, expect, it } from 'vitest'
import { MENU_GAP, MENU_MARGIN, placeMenu, type MenuRect } from '../src/client/menu-position.js'

const viewport = { width: 1024, height: 768 }
const menu = { width: 160, height: 96 }

function anchor(overrides: Partial<MenuRect> = {}): MenuRect {
  return { left: 900, top: 300, right: 932, bottom: 332, ...overrides }
}

describe('row menu placement', () => {
  it('aligns the inline end and opens below with a gap', () => {
    const placement = placeMenu(anchor(), menu, viewport)
    expect(placement.left).toBe(932 - 160)
    expect(placement.top).toBe(332 + MENU_GAP)
    expect(placement.flipped).toBe(false)
  })

  it('flips above when the trigger sits close to the bottom edge', () => {
    const placement = placeMenu(anchor({ top: 700, bottom: 732 }), menu, viewport)
    expect(placement.flipped).toBe(true)
    expect(placement.top).toBe(700 - 96 - MENU_GAP)
  })

  it('clamps to the right margin on a narrow viewport', () => {
    const placement = placeMenu(anchor({ left: 100, right: 320 }), menu, { width: 320, height: 480 })
    expect(placement.left).toBe(320 - 160 - MENU_MARGIN)
  })

  it('keeps the left margin when the menu is wider than the viewport', () => {
    const placement = placeMenu(anchor({ left: 4, right: 24 }), { width: 400, height: 96 }, { width: 320, height: 480 })
    expect(placement.left).toBe(MENU_MARGIN)
  })

  it('pins to the top margin when neither side has room', () => {
    const placement = placeMenu(
      anchor({ top: 320, bottom: 352 }),
      { width: 160, height: 700 },
      { width: 1024, height: 768 },
    )
    expect(placement.top).toBe(MENU_MARGIN)
  })

  it('stays put while the menu exactly fits below', () => {
    const placement = placeMenu(
      anchor({ top: 300, bottom: 332 }),
      { width: 160, height: 768 - 332 - MENU_GAP - MENU_MARGIN },
      viewport,
    )
    expect(placement.flipped).toBe(false)
    expect(placement.top).toBe(332 + MENU_GAP)
  })
})
