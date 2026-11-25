//! Min log level from environment — vocabulary shared via `config/logging.json`.

use log::{Level, LevelFilter};
use serde::Deserialize;

const LOGGING_CONFIG_JSON: &str = include_str!("../../../../config/logging.json");

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LoggingConfigFile {
    env_var: String,
    levels: Vec<String>,
    default_level: String,
}

fn logging_config() -> LoggingConfigFile {
    serde_json::from_str(LOGGING_CONFIG_JSON).expect("config/logging.json must be valid")
}

fn normalize_level_name(raw: &str) -> String {
    let normalized = raw.trim().to_ascii_lowercase();
    if normalized == "warning" {
        "warn".to_string()
    } else {
        normalized
    }
}

fn is_configured_level(name: &str) -> bool {
    logging_config().levels.iter().any(|level| level == name)
}

/// Parses a level name from the canonical JSON vocabulary into a `log::Level`.
pub fn parse_level(raw: &str) -> Option<Level> {
    let name = normalize_level_name(raw);
    if !is_configured_level(&name) {
        return None;
    }
    Some(match name.as_str() {
        "error" => Level::Error,
        "warn" => Level::Warn,
        "info" => Level::Info,
        "debug" => Level::Debug,
        // JSON vocabulary only allows the five names above; anything else is rejected earlier.
        _ => Level::Trace,
    })
}

/// Parses a level name from the canonical JSON vocabulary into a `LevelFilter`.
pub fn parse_level_filter(raw: &str) -> Option<LevelFilter> {
    parse_level(raw).map(|level| level.to_level_filter())
}

/// Resolves min level from explicit runtime / compile-time values (testable).
pub fn resolve_level_filter(
    runtime_env: Option<&str>,
    compile_time_env: Option<&str>,
    default_level: &str,
) -> LevelFilter {
    if let Some(value) = runtime_env {
        if let Some(filter) = parse_level_filter(value) {
            return filter;
        }
    }
    if let Some(value) = compile_time_env {
        if let Some(filter) = parse_level_filter(value) {
            return filter;
        }
    }
    parse_level_filter(default_level).unwrap_or(LevelFilter::Info)
}

/// Resolves the host min level: process env → compile-time env → JSON `defaultLevel`.
pub fn resolve_level_filter_from_env() -> LevelFilter {
    let config = logging_config();
    let runtime = std::env::var(&config.env_var).ok();
    resolve_level_filter(
        runtime.as_deref(),
        option_env!("LOG_LEVEL"),
        &config.default_level,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn config_lists_expected_levels_and_env_var() {
        let config = logging_config();
        assert_eq!(config.env_var, "LOG_LEVEL");
        assert_eq!(
            config.levels,
            vec![
                "error".to_string(),
                "warn".to_string(),
                "info".to_string(),
                "debug".to_string(),
                "trace".to_string()
            ]
        );
        assert_eq!(config.default_level, "info");
    }

    #[test]
    fn parse_level_accepts_vocabulary_and_warning_alias() {
        assert_eq!(parse_level(" ERROR "), Some(Level::Error));
        assert_eq!(parse_level("warning"), Some(Level::Warn));
        assert_eq!(parse_level_filter("info"), Some(LevelFilter::Info));
        assert_eq!(parse_level("debug"), Some(Level::Debug));
        assert_eq!(parse_level("trace"), Some(Level::Trace));
        assert_eq!(parse_level("loud"), None);
    }

    #[test]
    fn resolve_prefers_runtime_then_compile_time_then_default() {
        assert_eq!(
            resolve_level_filter(Some("debug"), Some("warn"), "info"),
            LevelFilter::Debug
        );
        assert_eq!(
            resolve_level_filter(Some("loud"), Some("warn"), "info"),
            LevelFilter::Warn
        );
        assert_eq!(
            resolve_level_filter(None, Some("error"), "info"),
            LevelFilter::Error
        );
        assert_eq!(
            resolve_level_filter(None, Some("loud"), "info"),
            LevelFilter::Info
        );
        assert_eq!(resolve_level_filter(None, None, "info"), LevelFilter::Info);
        assert_eq!(
            resolve_level_filter(None, None, "loud"),
            LevelFilter::Info
        );
    }

    #[test]
    fn resolve_from_env_smoke() {
        let _ = resolve_level_filter_from_env();
    }
}
