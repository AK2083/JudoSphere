//! Local SQLite database owned by the Tauri host (`rusqlite`).

pub mod commands;
pub mod connection;
pub mod migrations;

pub use connection::open;
