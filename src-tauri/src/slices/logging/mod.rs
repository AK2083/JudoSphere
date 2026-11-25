//! Host logging surface (future `judosphere-log` Cargo crate root).
//!
//! - **Call sites** use [`HostLogger`] — no `tauri-plugin-log` types.
//! - **App wiring** (`lib.rs`) uses [`configure_log_builder`] once at startup for durable file sinks.
//! - Host UI forwards via [`commands::forward_ui_log`] into [`accept_forwarded_ui_record`].
//!
//! Additional types (`LogProfile`, `HOST_UI_TARGET`, …) live in submodules and can be
//! re-exported when a call site needs them — avoid unused root re-exports.

pub mod commands;

mod config;
mod facade;
mod intake;
mod levels;

pub use config::configure_log_builder;
pub use facade::{HostLogger, HOST_TARGET};
pub use intake::{accept_forwarded_ui_record, ForwardedUiLogRecord};
