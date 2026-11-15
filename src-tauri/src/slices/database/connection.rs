//! Opens and owns the local SQLite connection.

use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use rusqlite::Connection;
use tauri::{AppHandle, Manager};

use super::migrations;

/// Shared SQLite connection for the Tauri host.
pub struct DbState(pub Mutex<Connection>);

/// Resolves `…/<app-data>/judosphere.db` and creates the parent directory if needed.
pub fn database_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir.join("judosphere.db"))
}

/// Opens SQLite, runs migrations, and wraps the connection for managed state.
pub fn open(app: &AppHandle) -> Result<DbState, String> {
    let path = database_path(app)?;
    let conn = Connection::open(&path).map_err(|error| error.to_string())?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|error| error.to_string())?;
    migrations::run(&conn)?;
    log::info!("sqlite ready at {}", path.display());
    Ok(DbState(Mutex::new(conn)))
}
