/**
 * Node/tooling re-export of the shared log-level helpers.
 * Source of truth for names/default: `config/logging.json`.
 * Active level: `LOG_LEVEL` (see `envVar` in the JSON).
 */
export {
  DEFAULT_LOG_LEVEL,
  LOG_LEVEL_ENV_VAR,
  LOG_LEVEL_ORDER,
  LOG_LEVELS,
  parseLogLevel,
  resolveLogLevelFromEnv,
  type LogLevel
} from '@shared/config/logLevels.ts'
