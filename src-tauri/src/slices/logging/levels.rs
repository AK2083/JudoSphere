//! Development vs competition-day log level policy for the Tauri host.

use log::LevelFilter;

/// Build / hall-machine profile that selects the default host log level.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogProfile {
    /// Local development — verbose enough to debug.
    Development,
    /// Competition-day / release host — quieter so the hall machine is not flooded.
    CompetitionDay,
}

impl LogProfile {
    /// Map a `debug_assertions` flag to the profile (testable without cfg gymnastics).
    pub const fn from_debug_assertions(debug_assertions: bool) -> Self {
        if debug_assertions {
            Self::Development
        } else {
            Self::CompetitionDay
        }
    }

    /// Profile for this binary: debug builds → development, release → competition-day.
    pub const fn from_build() -> Self {
        Self::from_debug_assertions(cfg!(debug_assertions))
    }

    /// Default `log` / `tauri-plugin-log` filter for this profile.
    pub const fn level_filter(self) -> LevelFilter {
        match self {
            Self::Development => LevelFilter::Debug,
            Self::CompetitionDay => LevelFilter::Info,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn debug_assertions_selects_development_with_verbose_level() {
        let profile = LogProfile::from_debug_assertions(true);
        assert_eq!(profile, LogProfile::Development);
        assert_eq!(profile.level_filter(), LevelFilter::Debug);
    }

    #[test]
    fn release_flag_selects_competition_day_with_quieter_level() {
        let profile = LogProfile::from_debug_assertions(false);
        assert_eq!(profile, LogProfile::CompetitionDay);
        assert_eq!(profile.level_filter(), LevelFilter::Info);
        assert!(profile.level_filter() < LogProfile::Development.level_filter());
    }

    #[test]
    fn from_build_matches_debug_assertions_flag() {
        let expected = LogProfile::from_debug_assertions(cfg!(debug_assertions));
        assert_eq!(LogProfile::from_build(), expected);
        assert_eq!(LogProfile::from_build().level_filter(), expected.level_filter());
    }
}
