//! Host logging surface (future `judosphere-log` Cargo crate root).
//!
//! - **Call sites** use [`HostLogger`] — no `tauri-plugin-log` types.
//! - **App wiring** (`lib.rs`) uses [`configure_log_builder`] once at startup for durable file sinks.
//! - Host UI forwards via [`commands::forward_ui_log`] into [`accept_forwarded_ui_record`].
//! - Display / export / attach paths use [`sanitize_log_text`] /
//!   [`sanitize_structured_extract`] (via [`commands::sanitize_log_extract`]).
//!
//! Level vocabulary + env var: repo `config/logging.json` (`LOG_LEVEL`).
//! Redact label synonyms: repo `config/log-redact.json`.

pub mod commands;

mod config;
mod facade;
mod intake;
mod levels;
mod sanitize;

pub use config::configure_log_builder;
pub use facade::{HostLogger, HOST_TARGET};
pub use intake::{accept_forwarded_ui_record, ForwardedUiLogRecord};
pub use sanitize::sanitize_structured_extract;
