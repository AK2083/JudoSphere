//! Tauri command adapters for error/report SQLite state.

use tauri::State;

use crate::slices::database::connection::DbState;

use super::fingerprint::{derive_fingerprint, ErrorFingerprintInput};
use super::store;
use super::types::{
    ErrorEvent, FeedbackDraft, FeedbackDraftStatus, FeedbackDraftWrite, FingerprintGate,
    FingerprintGateWrite, KnownFingerprint, KnownFingerprintWrite, NewErrorEvent,
};

/// Derives a stable error fingerprint on the host (sanitized + normalized SHA-256).
#[tauri::command]
pub fn derive_error_fingerprint(input: ErrorFingerprintInput) -> String {
    derive_fingerprint(&input)
}

/// Inserts an error/report event into the local SQLite database.
#[tauri::command]
pub fn insert_error_event(state: State<'_, DbState>, event: NewErrorEvent) -> Result<(), String> {
    let conn = state.0.lock().map_err(|error| error.to_string())?;
    store::insert_error_event(&conn, &event)
}

/// Loads one error/report event by id.
#[tauri::command]
pub fn get_error_event(
    state: State<'_, DbState>,
    id: String,
) -> Result<Option<ErrorEvent>, String> {
    let conn = state.0.lock().map_err(|error| error.to_string())?;
    store::get_error_event(&conn, &id)
}

/// Lists error/report events for a fingerprint (newest first).
#[tauri::command]
pub fn list_error_events_by_fingerprint(
    state: State<'_, DbState>,
    fingerprint: String,
) -> Result<Vec<ErrorEvent>, String> {
    let conn = state.0.lock().map_err(|error| error.to_string())?;
    store::list_error_events_by_fingerprint(&conn, &fingerprint)
}

/// Upserts occurrence/cooldown gate state for a fingerprint.
#[tauri::command]
pub fn upsert_fingerprint_gate(
    state: State<'_, DbState>,
    gate: FingerprintGateWrite,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|error| error.to_string())?;
    store::upsert_fingerprint_gate(&conn, &gate)
}

/// Bumps occurrence count for a fingerprint and optionally sets cooldown_until.
#[tauri::command]
pub fn bump_fingerprint_occurrence(
    state: State<'_, DbState>,
    fingerprint: String,
    cooldown_until: Option<String>,
) -> Result<FingerprintGate, String> {
    let conn = state.0.lock().map_err(|error| error.to_string())?;
    store::bump_fingerprint_occurrence(&conn, &fingerprint, cooldown_until.as_deref())
}

/// Loads gate state for a fingerprint.
#[tauri::command]
pub fn get_fingerprint_gate(
    state: State<'_, DbState>,
    fingerprint: String,
) -> Result<Option<FingerprintGate>, String> {
    let conn = state.0.lock().map_err(|error| error.to_string())?;
    store::get_fingerprint_gate(&conn, &fingerprint)
}

/// Upserts a known-fingerprint cache entry.
#[tauri::command]
pub fn upsert_known_fingerprint(
    state: State<'_, DbState>,
    entry: KnownFingerprintWrite,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|error| error.to_string())?;
    store::upsert_known_fingerprint(&conn, &entry)
}

/// Loads a known-fingerprint cache entry.
#[tauri::command]
pub fn get_known_fingerprint(
    state: State<'_, DbState>,
    fingerprint: String,
) -> Result<Option<KnownFingerprint>, String> {
    let conn = state.0.lock().map_err(|error| error.to_string())?;
    store::get_known_fingerprint(&conn, &fingerprint)
}

/// Upserts a local feedback draft (not uploaded in this milestone).
///
/// `log_excerpt_json` is sanitized on the host before persist (same rules as export).
#[tauri::command]
pub fn upsert_feedback_draft(
    state: State<'_, DbState>,
    draft: FeedbackDraftWrite,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|error| error.to_string())?;
    store::upsert_feedback_draft(&conn, &draft)
}

/// Loads one feedback draft by id.
#[tauri::command]
pub fn get_feedback_draft(
    state: State<'_, DbState>,
    id: String,
) -> Result<Option<FeedbackDraft>, String> {
    let conn = state.0.lock().map_err(|error| error.to_string())?;
    store::get_feedback_draft(&conn, &id)
}

/// Lists feedback drafts by status (newest first).
#[tauri::command]
pub fn list_feedback_drafts_by_status(
    state: State<'_, DbState>,
    status: FeedbackDraftStatus,
) -> Result<Vec<FeedbackDraft>, String> {
    let conn = state.0.lock().map_err(|error| error.to_string())?;
    store::list_feedback_drafts_by_status(&conn, &status)
}
