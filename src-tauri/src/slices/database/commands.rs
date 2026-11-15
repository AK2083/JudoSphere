//! Tauri commands for host-owned SQLite access.

use tauri::State;

use super::connection::DbState;

/// Reads a value from `app_kv`.
#[tauri::command]
pub fn get_app_value(state: State<'_, DbState>, key: String) -> Result<Option<String>, String> {
    let conn = state.0.lock().map_err(|error| error.to_string())?;
    let mut statement = conn
        .prepare("SELECT value FROM app_kv WHERE key = ?1 LIMIT 1")
        .map_err(|error| error.to_string())?;

    let mut rows = statement
        .query(rusqlite::params![key])
        .map_err(|error| error.to_string())?;

    match rows.next().map_err(|error| error.to_string())? {
        Some(row) => Ok(Some(row.get(0).map_err(|error| error.to_string())?)),
        None => Ok(None),
    }
}

/// Inserts or updates a value in `app_kv`.
#[tauri::command]
pub fn set_app_value(state: State<'_, DbState>, key: String, value: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|error| error.to_string())?;
    conn.execute(
        "INSERT INTO app_kv (key, value, updated_at) VALUES (?1, ?2, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at",
        rusqlite::params![key, value],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

/// Deletes a key from `app_kv`.
#[tauri::command]
pub fn delete_app_value(state: State<'_, DbState>, key: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|error| error.to_string())?;
    conn.execute("DELETE FROM app_kv WHERE key = ?1", rusqlite::params![key])
        .map_err(|error| error.to_string())?;
    Ok(())
}
