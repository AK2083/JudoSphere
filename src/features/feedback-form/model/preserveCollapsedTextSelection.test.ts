import { describe, expect, it, vi } from 'vitest'

import {
  readTextSelection,
  restoreCollapsedSelectionAfterContextMenu,
  restoreTextSelection,
  shouldRestoreCollapsedSelection
} from './preserveCollapsedTextSelection'

function fakeTextControl(start: number, end: number) {
  const control = {
    selectionStart: start,
    selectionEnd: end,
    setSelectionRange: vi.fn()
  }
  control.setSelectionRange.mockImplementation((nextStart: number, nextEnd: number) => {
    control.selectionStart = nextStart
    control.selectionEnd = nextEnd
  })
  return control
}

describe('preserveCollapsedTextSelection', () => {
  it('reads and restores selection snapshots', () => {
    const el = fakeTextControl(3, 8)

    expect(readTextSelection(el)).toEqual({ start: 3, end: 8 })
    expect(shouldRestoreCollapsedSelection({ start: 3, end: 8 })).toBe(false)
    expect(shouldRestoreCollapsedSelection({ start: 4, end: 4 })).toBe(true)

    restoreTextSelection(el, { start: 1, end: 2 })
    expect(el.setSelectionRange).toHaveBeenCalledWith(1, 2)
    expect(el.selectionStart).toBe(1)
    expect(el.selectionEnd).toBe(2)
  })

  it('restores a collapsed caret after context menu on the next microtask', async () => {
    const el = fakeTextControl(5, 5)

    restoreCollapsedSelectionAfterContextMenu(el, { start: 5, end: 5 })
    el.selectionStart = 0
    el.selectionEnd = 12

    expect(el.setSelectionRange).not.toHaveBeenCalled()
    await Promise.resolve()
    expect(el.setSelectionRange).toHaveBeenCalledWith(5, 5)
    expect(el.selectionStart).toBe(5)
    expect(el.selectionEnd).toBe(5)
  })

  it('does not restore when the user already selected a range', async () => {
    const el = fakeTextControl(2, 9)

    restoreCollapsedSelectionAfterContextMenu(el, { start: 2, end: 9 })
    await Promise.resolve()
    expect(el.setSelectionRange).not.toHaveBeenCalled()
  })
})
