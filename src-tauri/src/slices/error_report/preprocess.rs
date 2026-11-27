//! Local preprocess gate: cooldown/dedup before full error/report payloads.
//!
//! Identical fingerprints inside an active cooldown bump
//! [`error_fingerprint_gates`] occurrence only — no duplicate full event row.

use rusqlite::{Connection, params};

use super::store::{
    bump_fingerprint_occurrence, get_error_event, get_fingerprint_gate, insert_error_event,
    is_fingerprint_in_cooldown,
};
use super::types::{ErrorEvent, FingerprintGate, NewErrorEvent};
use serde::{Deserialize, Serialize};

/// Default local cooldown window (5 minutes) for duplicate fingerprint gating.
pub const DEFAULT_COOLDOWN_SECONDS: i64 = 300;

/// Whether the preprocess path stored a full event or only bumped the gate.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PreprocessDisposition {
    /// Full local event/payload was written (first sighting or cooldown expired).
    Recorded,
    /// Cooldown still active — occurrence only, no new full payload.
    Gated,
}

/// Result of applying the local preprocess gate.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PreprocessResult {
    pub disposition: PreprocessDisposition,
    pub fingerprint: String,
    pub gate: FingerprintGate,
    /// Present when [`PreprocessDisposition::Recorded`].
    pub event: Option<ErrorEvent>,
}

/// Optional overrides for a preprocess call (camelCase for Tauri/JS).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PreprocessOptions {
    /// Cooldown window in seconds. Defaults to [`DEFAULT_COOLDOWN_SECONDS`].
    #[serde(default)]
    pub cooldown_seconds: Option<i64>,
}

/// Apply the local preprocess gate for an error/report candidate.
///
/// - Inside cooldown → bump occurrence in SQLite, skip full event insert.
/// - First sighting or expired cooldown → insert full event, then refresh gate/cooldown.
pub fn preprocess_error_report(
    conn: &Connection,
    event: &NewErrorEvent,
    options: &PreprocessOptions,
) -> Result<PreprocessResult, String> {
    let cooldown_seconds = options
        .cooldown_seconds
        .unwrap_or(DEFAULT_COOLDOWN_SECONDS);
    if cooldown_seconds < 0 {
        return Err("cooldown_seconds must be >= 0".into());
    }

    if is_fingerprint_in_cooldown(conn, &event.fingerprint)? {
        let gate = refresh_gate_cooldown(conn, &event.fingerprint, cooldown_seconds)?;
        return Ok(PreprocessResult {
            disposition: PreprocessDisposition::Gated,
            fingerprint: event.fingerprint.clone(),
            gate,
            event: None,
        });
    }

    insert_error_event(conn, event)?;
    let gate = refresh_gate_cooldown(conn, &event.fingerprint, cooldown_seconds)?;
    let stored = get_error_event(conn, &event.id)?
        .ok_or_else(|| "error event missing after insert".to_string())?;

    Ok(PreprocessResult {
        disposition: PreprocessDisposition::Recorded,
        fingerprint: event.fingerprint.clone(),
        gate,
        event: Some(stored),
    })
}

/// Bump occurrence and set `cooldown_until` to now + `cooldown_seconds` via SQLite.
fn refresh_gate_cooldown(
    conn: &Connection,
    fingerprint: &str,
    cooldown_seconds: i64,
) -> Result<FingerprintGate, String> {
    // Compute the timestamp in SQLite so host clock format matches gate rows.
    let cooldown_until: String = conn
        .query_row(
            "SELECT datetime('now', printf('+%d seconds', ?1))",
            params![cooldown_seconds],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;

    bump_fingerprint_occurrence(conn, fingerprint, Some(cooldown_until.as_str()))?;
    get_fingerprint_gate(conn, fingerprint)?
        .ok_or_else(|| "fingerprint gate missing after cooldown refresh".into())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::slices::database::migrations;
    use crate::slices::error_report::store::{
        list_error_events_by_fingerprint, upsert_fingerprint_gate,
    };
    use crate::slices::error_report::types::FingerprintGateWrite;

    fn open_db() -> Connection {
        let conn = Connection::open_in_memory().expect("in-memory sqlite");
        conn.execute_batch("PRAGMA foreign_keys = ON;")
            .expect("pragma");
        migrations::run(&conn).expect("migrations");
        conn
    }

    fn sample_event(id: &str, fingerprint: &str) -> NewErrorEvent {
        NewErrorEvent {
            id: id.into(),
            fingerprint: fingerprint.into(),
            source: "ui".into(),
            message: "boom".into(),
            context_json: Some(r#"{"route":"/"}"#.into()),
            occurred_at: None,
        }
    }

    #[test]
    fn first_occurrence_records_full_event_and_opens_cooldown() {
        let conn = open_db();
        let result = preprocess_error_report(
            &conn,
            &sample_event("evt-1", "fp-a"),
            &PreprocessOptions {
                cooldown_seconds: Some(60),
            },
        )
        .unwrap();

        assert_eq!(result.disposition, PreprocessDisposition::Recorded);
        assert_eq!(result.gate.occurrence_count, 1);
        assert!(result.gate.cooldown_until.is_some());
        assert_eq!(result.event.as_ref().map(|e| e.id.as_str()), Some("evt-1"));
        assert_eq!(list_error_events_by_fingerprint(&conn, "fp-a").unwrap().len(), 1);
    }

    #[test]
    fn identical_fingerprint_within_cooldown_is_gated() {
        let conn = open_db();
        let opts = PreprocessOptions {
            cooldown_seconds: Some(120),
        };
        preprocess_error_report(&conn, &sample_event("evt-1", "fp-a"), &opts).unwrap();

        let gated =
            preprocess_error_report(&conn, &sample_event("evt-2", "fp-a"), &opts).unwrap();
        assert_eq!(gated.disposition, PreprocessDisposition::Gated);
        assert!(gated.event.is_none());
        assert_eq!(gated.gate.occurrence_count, 2);
        assert_eq!(list_error_events_by_fingerprint(&conn, "fp-a").unwrap().len(), 1);
    }

    #[test]
    fn expired_cooldown_records_another_full_event() {
        let conn = open_db();
        preprocess_error_report(
            &conn,
            &sample_event("evt-1", "fp-a"),
            &PreprocessOptions {
                cooldown_seconds: Some(60),
            },
        )
        .unwrap();

        // Force cooldown into the past so the next call is out of window.
        upsert_fingerprint_gate(
            &conn,
            &FingerprintGateWrite {
                fingerprint: "fp-a".into(),
                occurrence_count: 1,
                first_seen_at: None,
                last_seen_at: None,
                cooldown_until: Some("2000-01-01 00:00:00".into()),
            },
        )
        .unwrap();

        let again = preprocess_error_report(
            &conn,
            &sample_event("evt-2", "fp-a"),
            &PreprocessOptions {
                cooldown_seconds: Some(60),
            },
        )
        .unwrap();
        assert_eq!(again.disposition, PreprocessDisposition::Recorded);
        assert_eq!(again.gate.occurrence_count, 2);
        assert_eq!(list_error_events_by_fingerprint(&conn, "fp-a").unwrap().len(), 2);
    }

    #[test]
    fn rejects_negative_cooldown() {
        let conn = open_db();
        let err = preprocess_error_report(
            &conn,
            &sample_event("evt-1", "fp-a"),
            &PreprocessOptions {
                cooldown_seconds: Some(-1),
            },
        )
        .unwrap_err();
        assert!(err.contains("cooldown_seconds"));
    }

    #[test]
    fn default_options_use_default_cooldown_constant() {
        let conn = open_db();
        let result =
            preprocess_error_report(&conn, &sample_event("evt-1", "fp-b"), &PreprocessOptions::default())
                .unwrap();
        assert_eq!(result.disposition, PreprocessDisposition::Recorded);
        assert_eq!(result.gate.occurrence_count, 1);
        assert!(DEFAULT_COOLDOWN_SECONDS > 0);
    }
}
