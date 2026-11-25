//! Crate-ready host logging facade over the standard `log` crate.
//!
//! Call sites depend on this API only — never on `tauri-plugin-log` types.
//! Durable sinks are owned by the configured host plugin (see `config`).

use log::Level;

/// Default `log` target for host-slice messages.
pub const HOST_TARGET: &str = "judosphere::host";

/// Default `log` target for records forwarded from the host UI.
pub const HOST_UI_TARGET: &str = "judosphere::host_ui";

/// Host logging facade — thin wrapper so a later `judosphere-log` crate can re-home this API.
#[derive(Debug, Default, Clone, Copy)]
pub struct HostLogger;

impl HostLogger {
    /// Emit at an arbitrary [`Level`].
    pub fn log(level: Level, target: &str, message: &str) {
        match level {
            Level::Error => Self::error(target, message),
            Level::Warn => Self::warn(target, message),
            Level::Info => Self::info(target, message),
            Level::Debug => Self::debug(target, message),
            Level::Trace => Self::trace(target, message),
        }
    }

    /// Emit an error-level record.
    pub fn error(target: &str, message: &str) {
        log::error!(target: target, "{message}");
    }

    /// Emit a warning-level record.
    pub fn warn(target: &str, message: &str) {
        log::warn!(target: target, "{message}");
    }

    /// Emit an info-level record.
    pub fn info(target: &str, message: &str) {
        log::info!(target: target, "{message}");
    }

    /// Emit a debug-level record.
    pub fn debug(target: &str, message: &str) {
        log::debug!(target: target, "{message}");
    }

    /// Emit a trace-level record.
    pub fn trace(target: &str, message: &str) {
        log::trace!(target: target, "{message}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn facade_emits_all_levels_without_panic() {
        HostLogger::error(HOST_TARGET, "error");
        HostLogger::warn(HOST_TARGET, "warn");
        HostLogger::info(HOST_TARGET, "info");
        HostLogger::debug(HOST_TARGET, "debug");
        HostLogger::trace(HOST_TARGET, "trace");
        for level in [
            Level::Error,
            Level::Warn,
            Level::Info,
            Level::Debug,
            Level::Trace,
        ] {
            HostLogger::log(level, HOST_UI_TARGET, "via log()");
        }
    }

    #[test]
    fn targets_are_stable_crate_surface() {
        assert_eq!(HOST_TARGET, "judosphere::host");
        assert_eq!(HOST_UI_TARGET, "judosphere::host_ui");
        let logger = HostLogger;
        assert_eq!(format!("{logger:?}"), "HostLogger");
        let _copy = logger;
        let _default = HostLogger::default();
    }
}
