//! Offline error/report SQLite state (events, gates, known fingerprints, drafts).

pub mod commands;
pub mod fingerprint;
pub mod log_excerpt;
pub mod preprocess;
pub mod store;
pub mod types;

pub use log_excerpt::sanitize_attached_log_excerpt;
