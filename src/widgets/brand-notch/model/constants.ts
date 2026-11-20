/** localStorage key for the persisted horizontal notch center offset. */
export const NOTCH_OFFSET_STORAGE_KEY = 'judosphere.app-shell.notch-offset-x'

/** DOM id of the expandable notch details region (aria-controls target). */
export const NOTCH_DETAILS_ID = 'brand-notch-details'

/** DOM id of the brand name text used for banner labelling. */
export const NOTCH_BRAND_ID = 'brand-notch-brand'

/** DOM id of the version line used as banner description. */
export const NOTCH_VERSION_ID = 'brand-notch-version'

/** Media query for narrow viewports where the notch collapses to an icon. */
export const NARROW_VIEWPORT_QUERY = '(max-width: 767px)'

/** Minimum gap in pixels between notch edges and the viewport sides. */
export const NOTCH_EDGE_GAP_PX = 8

/** Pointer movement in pixels before a gesture counts as a drag instead of a tap. */
export const NOTCH_DRAG_THRESHOLD_PX = 4

/** Milliseconds to ignore pointer-leave after opening so a tap does not instantly close. */
export const NOTCH_LEAVE_GRACE_MS = 350
