/** Caret or range inside a text control before a context-menu open. */
export type TextSelectionSnapshot = {
  start: number
  end: number
}

/**
 * Reads the current selection from a text control.
 * @param el - Input or textarea exposing selection offsets.
 * @returns Snapshot of `selectionStart` / `selectionEnd`.
 */
export function readTextSelection(
  el: Pick<HTMLTextAreaElement, 'selectionStart' | 'selectionEnd'>
): TextSelectionSnapshot {
  return {
    start: el.selectionStart,
    end: el.selectionEnd
  }
}

/**
 * Whether the snapshot is a caret (no range) that WebKit may expand on right-click.
 * @param snapshot - Selection captured on right mouse down.
 * @returns `true` when start and end are equal.
 */
export function shouldRestoreCollapsedSelection(snapshot: TextSelectionSnapshot): boolean {
  return snapshot.start === snapshot.end
}

/**
 * Restores a previously captured selection on a text control.
 * @param el - Input or textarea that supports `setSelectionRange`.
 * @param snapshot - Selection to re-apply.
 */
export function restoreTextSelection(
  el: Pick<HTMLTextAreaElement, 'setSelectionRange'>,
  snapshot: TextSelectionSnapshot
): void {
  el.setSelectionRange(snapshot.start, snapshot.end)
}

/**
 * After the browser may expand a caret into a word for the context menu, restore the caret.
 * No-op when the user already had a range selected.
 * @param el - Text control that opened the context menu.
 * @param snapshot - Selection captured on right mouse down.
 */
export function restoreCollapsedSelectionAfterContextMenu(
  el: Pick<HTMLTextAreaElement, 'setSelectionRange'>,
  snapshot: TextSelectionSnapshot
): void {
  if (!shouldRestoreCollapsedSelection(snapshot)) {
    return
  }
  queueMicrotask(() => {
    restoreTextSelection(el, snapshot)
  })
}
