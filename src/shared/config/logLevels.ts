import defaults from '@config/logging.json' with { type: 'json' }

/**
 * Log level vocabulary + env resolution.
 * Canonical data: `config/logging.json` (also read by the Tauri host).
 * Active min level: environment variable {@link LOG_LEVEL_ENV_VAR}.
 */

/** Canonical level names in severity order (error = most severe). */
export const LOG_LEVELS = defaults.levels as unknown as readonly [
  'error',
  'warn',
  'info',
  'debug',
  'trace'
]

/**
 *
 */
export type LogLevel = (typeof LOG_LEVELS)[number]

/** Environment variable that carries the active min level. */
export const LOG_LEVEL_ENV_VAR = defaults.envVar

/** Fallback when the env var is unset or invalid. */
export const DEFAULT_LOG_LEVEL = defaults.defaultLevel as unknown as LogLevel

/** Numeric order for gating (lower = more severe); derived from `levels` array order. */
export const LOG_LEVEL_ORDER: Record<LogLevel, number> = LOG_LEVELS.reduce(
  (order, level, index) => {
    order[level] = index
    return order
  },
  {
    error: -1,
    warn: -1,
    info: -1,
    debug: -1,
    trace: -1
  } satisfies Record<LogLevel, number>
)

/**
 * Parses a level name against the canonical list in `config/logging.json`.
 * @param raw - Candidate level string.
 * @returns Normalized level, or `undefined` when unknown.
 */
export function parseLogLevel(raw: string | undefined | null): LogLevel | undefined {
  if (raw === undefined || raw === null) {
    return undefined
  }
  const normalized = raw.trim().toLowerCase()
  const alias = normalized === 'warning' ? 'warn' : normalized
  return (LOG_LEVELS as readonly string[]).includes(alias) ? (alias as LogLevel) : undefined
}

/**
 * Resolves the min level from env (`LOG_LEVEL`), else `defaultLevel` from JSON.
 * @param readEnv - Env reader (pass `import.meta.env` lookup from Vite app code).
 * @returns Canonical min level.
 */
export function resolveLogLevelFromEnv(readEnv: (key: string) => string | undefined): LogLevel {
  return parseLogLevel(readEnv(LOG_LEVEL_ENV_VAR)) ?? DEFAULT_LOG_LEVEL
}
