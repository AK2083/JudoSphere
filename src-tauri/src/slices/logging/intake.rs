//! Intake for host-UI log records forwarded into the durable host trail.
//!
//! Feature #77 wires Vue → this module via [`super::commands::forward_ui_log`].

use log::Level;

use super::facade::{HostLogger, HOST_UI_TARGET};
use super::levels::parse_level as parse_configured_level;

/// A log record forwarded from the host UI (no cloud; local host only).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ForwardedUiLogRecord {
    pub level: Level,
    pub message: String,
    /// Optional UI source hint (e.g. component or stack frame label) — not PII-bearing by contract.
    pub source: Option<String>,
}

impl ForwardedUiLogRecord {
    /// Build a record for intake.
    pub fn new(level: Level, message: impl Into<String>, source: Option<String>) -> Self {
        Self {
            level,
            message: message.into(),
            source,
        }
    }

    /// Parse a level name using the shared `config/logging.json` vocabulary.
    pub fn parse_level(name: &str) -> Option<Level> {
        parse_configured_level(name)
    }

    /// Message written to the host log (source prefix when present and non-empty).
    pub fn display_message(&self) -> String {
        match &self.source {
            Some(source) if !source.is_empty() => format!("[{source}] {}", self.message),
            _ => self.message.clone(),
        }
    }
}

/// Accept a forwarded host-UI record into the durable host log (offline file trail).
pub fn accept_forwarded_ui_record(record: &ForwardedUiLogRecord) {
    HostLogger::log(record.level, HOST_UI_TARGET, &record.display_message());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn display_message_without_source_is_plain() {
        let record = ForwardedUiLogRecord::new(Level::Warn, "boom", None);
        assert_eq!(record.display_message(), "boom");
    }

    #[test]
    fn display_message_with_empty_source_is_plain() {
        let record = ForwardedUiLogRecord::new(Level::Error, "boom", Some(String::new()));
        assert_eq!(record.display_message(), "boom");
    }

    #[test]
    fn display_message_prefixes_non_empty_source() {
        let record = ForwardedUiLogRecord::new(Level::Info, "ready", Some("App.vue".into()));
        assert_eq!(record.display_message(), "[App.vue] ready");
    }

    #[test]
    fn parse_level_accepts_known_names() {
        assert_eq!(ForwardedUiLogRecord::parse_level("ERROR"), Some(Level::Error));
        assert_eq!(ForwardedUiLogRecord::parse_level(" warning "), Some(Level::Warn));
        assert_eq!(ForwardedUiLogRecord::parse_level("info"), Some(Level::Info));
        assert_eq!(ForwardedUiLogRecord::parse_level("debug"), Some(Level::Debug));
        assert_eq!(ForwardedUiLogRecord::parse_level("trace"), Some(Level::Trace));
        assert_eq!(ForwardedUiLogRecord::parse_level("nope"), None);
    }

    #[test]
    fn accept_forwarded_ui_record_emits_without_panic() {
        let record = ForwardedUiLogRecord::new(Level::Error, "ui failure", Some("main".into()));
        accept_forwarded_ui_record(&record);
        accept_forwarded_ui_record(&ForwardedUiLogRecord::new(Level::Debug, "noise", None));
    }
}
