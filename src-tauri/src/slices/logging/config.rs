//! Rolling local-file logging policy for the Tauri host.

use log::LevelFilter;
use tauri_plugin_log::{
    Builder, RotationStrategy, Target, TargetKind, TimezoneStrategy,
};

use super::levels::resolve_level_filter_from_env;

/// Rotate the active log file once it reaches this size (bytes).
///
/// Larger than the plugin’s 40 KiB default so a competition day leaves a
/// usable trail before rotation.
pub const MAX_FILE_SIZE_BYTES: u64 = 2_000_000;

/// How many dated rotated files to retain (the active file is separate).
pub const ROTATION_KEEP_COUNT: usize = 5;

/// Log file stem under the OS app log directory (`judosphere.log`).
pub const LOG_FILE_STEM: &str = "judosphere";

/// Where host file logs are written.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogDestination {
    /// OS-specific app log directory (`TargetKind::LogDir`) — fully local / offline.
    AppLogDir,
}

/// Explicit rolling-file policy applied to `tauri-plugin-log`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct FileLoggingPolicy {
    pub destination: LogDestination,
    pub max_file_size_bytes: u64,
    pub rotation_keep_count: usize,
    pub file_stem: &'static str,
    pub level_filter: LevelFilter,
}

impl FileLoggingPolicy {
    /// Defaults: local log dir, rolling files, min level from `LOG_LEVEL`.
    pub fn defaults() -> Self {
        Self::with_level(resolve_level_filter_from_env())
    }

    /// Defaults with an explicit level filter (tests / overrides).
    pub const fn with_level(level_filter: LevelFilter) -> Self {
        Self {
            destination: LogDestination::AppLogDir,
            max_file_size_bytes: MAX_FILE_SIZE_BYTES,
            rotation_keep_count: ROTATION_KEEP_COUNT,
            file_stem: LOG_FILE_STEM,
            level_filter,
        }
    }

    /// File logging uses only local destinations — no cloud / remote shipping.
    pub const fn is_offline_only(&self) -> bool {
        matches!(self.destination, LogDestination::AppLogDir)
    }

    /// Plugin rotation strategy derived from [`Self::rotation_keep_count`].
    pub fn rotation_strategy(&self) -> RotationStrategy {
        RotationStrategy::KeepSome(self.rotation_keep_count)
    }

    /// Apply this policy to a `tauri-plugin-log` builder (targets, size, rotation).
    pub fn apply(self, builder: Builder) -> Builder {
        debug_assert!(
            self.is_offline_only(),
            "host file logging must stay local/offline (no remote targets)"
        );

        let file_target = match self.destination {
            LogDestination::AppLogDir => Target::new(TargetKind::LogDir {
                file_name: Some(self.file_stem.to_string()),
            }),
        };

        builder
            .clear_targets()
            .targets([Target::new(TargetKind::Stdout), file_target])
            .max_file_size(u128::from(self.max_file_size_bytes))
            .rotation_strategy(self.rotation_strategy())
            .timezone_strategy(TimezoneStrategy::UseLocal)
            .level(self.level_filter)
    }
}

/// Configure rolling local file logging on a fresh plugin builder.
pub fn configure_log_builder(builder: Builder) -> Builder {
    FileLoggingPolicy::defaults().apply(builder)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_write_to_app_log_dir_with_rolling_size_and_count() {
        let policy = FileLoggingPolicy::defaults();

        assert_eq!(policy.destination, LogDestination::AppLogDir);
        assert_eq!(policy.file_stem, LOG_FILE_STEM);
        assert_eq!(policy.max_file_size_bytes, MAX_FILE_SIZE_BYTES);
        assert_eq!(policy.rotation_keep_count, ROTATION_KEEP_COUNT);
        assert!(policy.max_file_size_bytes > 40_000);
        assert!(policy.rotation_keep_count >= 1);
    }

    #[test]
    fn with_level_applies_explicit_filter() {
        let quiet = FileLoggingPolicy::with_level(LevelFilter::Warn);
        let verbose = FileLoggingPolicy::with_level(LevelFilter::Debug);
        assert_eq!(quiet.level_filter, LevelFilter::Warn);
        assert_eq!(verbose.level_filter, LevelFilter::Debug);
        assert!(quiet.level_filter < verbose.level_filter);

        let _quiet_builder = quiet.apply(Builder::new());
        let _verbose_builder = verbose.apply(Builder::new());
    }

    #[test]
    fn defaults_are_offline_only() {
        assert!(FileLoggingPolicy::defaults().is_offline_only());
    }

    #[test]
    fn rotation_strategy_uses_keep_count() {
        let policy = FileLoggingPolicy::defaults();
        let _strategy = policy.rotation_strategy();
        assert_eq!(policy.rotation_keep_count, ROTATION_KEEP_COUNT);
    }

    #[test]
    fn configure_log_builder_applies_defaults_without_panic() {
        let _builder = configure_log_builder(Builder::new());
        assert!(FileLoggingPolicy::defaults().is_offline_only());
    }

    #[test]
    fn apply_accepts_custom_policy_values() {
        let policy = FileLoggingPolicy {
            destination: LogDestination::AppLogDir,
            max_file_size_bytes: 100_000,
            rotation_keep_count: 2,
            file_stem: "custom",
            level_filter: LevelFilter::Warn,
        };

        let _builder = policy.apply(Builder::new());
        assert!(policy.is_offline_only());
        assert_eq!(policy.rotation_keep_count, 2);
        assert_eq!(policy.file_stem, "custom");
        assert_eq!(policy.max_file_size_bytes, 100_000);
        assert_eq!(policy.level_filter, LevelFilter::Warn);
    }
}
