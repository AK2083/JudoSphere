//! rusqlite read/write helpers for error/report tables.

use rusqlite::{Connection, OptionalExtension, params};

use super::types::{
    ErrorEvent, FeedbackDraft, FeedbackDraftStatus, FeedbackDraftWrite, FingerprintGate,
    FingerprintGateWrite, KnownFingerprint, KnownFingerprintStatus, KnownFingerprintWrite,
    NewErrorEvent,
};

fn require_non_empty(field: &str, value: &str) -> Result<(), String> {
    if value.trim().is_empty() {
        Err(format!("{field} must not be empty"))
    } else {
        Ok(())
    }
}

/// Inserts a new error/report event.
pub fn insert_error_event(conn: &Connection, event: &NewErrorEvent) -> Result<(), String> {
    require_non_empty("id", &event.id)?;
    require_non_empty("fingerprint", &event.fingerprint)?;
    require_non_empty("source", &event.source)?;
    require_non_empty("message", &event.message)?;

    match &event.occurred_at {
        Some(occurred_at) => {
            require_non_empty("occurred_at", occurred_at)?;
            conn.execute(
                "INSERT INTO error_events (
                    id, fingerprint, source, message, context_json, occurred_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    event.id,
                    event.fingerprint,
                    event.source,
                    event.message,
                    event.context_json,
                    occurred_at
                ],
            )
            .map_err(|error| error.to_string())?;
        }
        None => {
            conn.execute(
                "INSERT INTO error_events (
                    id, fingerprint, source, message, context_json
                 ) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![
                    event.id,
                    event.fingerprint,
                    event.source,
                    event.message,
                    event.context_json
                ],
            )
            .map_err(|error| error.to_string())?;
        }
    }

    Ok(())
}

/// Loads one error/report event by id.
pub fn get_error_event(conn: &Connection, id: &str) -> Result<Option<ErrorEvent>, String> {
    require_non_empty("id", id)?;
    conn.query_row(
        "SELECT id, fingerprint, source, message, context_json, occurred_at, created_at
         FROM error_events WHERE id = ?1",
        [id],
        |row| {
            Ok(ErrorEvent {
                id: row.get(0)?,
                fingerprint: row.get(1)?,
                source: row.get(2)?,
                message: row.get(3)?,
                context_json: row.get(4)?,
                occurred_at: row.get(5)?,
                created_at: row.get(6)?,
            })
        },
    )
    .optional()
    .map_err(|error| error.to_string())
}

/// Lists error/report events for a fingerprint (newest first).
pub fn list_error_events_by_fingerprint(
    conn: &Connection,
    fingerprint: &str,
) -> Result<Vec<ErrorEvent>, String> {
    require_non_empty("fingerprint", fingerprint)?;
    let mut statement = conn
        .prepare(
            "SELECT id, fingerprint, source, message, context_json, occurred_at, created_at
             FROM error_events
             WHERE fingerprint = ?1
             ORDER BY occurred_at DESC, created_at DESC",
        )
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([fingerprint], |row| {
            Ok(ErrorEvent {
                id: row.get(0)?,
                fingerprint: row.get(1)?,
                source: row.get(2)?,
                message: row.get(3)?,
                context_json: row.get(4)?,
                occurred_at: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|error| error.to_string())?;

    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

/// Inserts or replaces occurrence/cooldown gate state for a fingerprint.
pub fn upsert_fingerprint_gate(
    conn: &Connection,
    gate: &FingerprintGateWrite,
) -> Result<(), String> {
    require_non_empty("fingerprint", &gate.fingerprint)?;
    if gate.occurrence_count < 0 {
        return Err("occurrence_count must be >= 0".into());
    }

    conn.execute(
        "INSERT INTO error_fingerprint_gates (
            fingerprint, occurrence_count, first_seen_at, last_seen_at, cooldown_until, updated_at
         ) VALUES (
            ?1,
            ?2,
            COALESCE(?3, datetime('now')),
            COALESCE(?4, datetime('now')),
            ?5,
            datetime('now')
         )
         ON CONFLICT(fingerprint) DO UPDATE SET
           occurrence_count = excluded.occurrence_count,
           first_seen_at = COALESCE(?3, error_fingerprint_gates.first_seen_at),
           last_seen_at = COALESCE(?4, datetime('now')),
           cooldown_until = excluded.cooldown_until,
           updated_at = datetime('now')",
        params![
            gate.fingerprint,
            gate.occurrence_count,
            gate.first_seen_at,
            gate.last_seen_at,
            gate.cooldown_until
        ],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

/// Increments occurrence count (or creates the gate row) and refreshes last_seen / cooldown.
pub fn bump_fingerprint_occurrence(
    conn: &Connection,
    fingerprint: &str,
    cooldown_until: Option<&str>,
) -> Result<FingerprintGate, String> {
    require_non_empty("fingerprint", fingerprint)?;

    conn.execute(
        "INSERT INTO error_fingerprint_gates (
            fingerprint, occurrence_count, first_seen_at, last_seen_at, cooldown_until, updated_at
         ) VALUES (?1, 1, datetime('now'), datetime('now'), ?2, datetime('now'))
         ON CONFLICT(fingerprint) DO UPDATE SET
           occurrence_count = error_fingerprint_gates.occurrence_count + 1,
           last_seen_at = datetime('now'),
           cooldown_until = excluded.cooldown_until,
           updated_at = datetime('now')",
        params![fingerprint, cooldown_until],
    )
    .map_err(|error| error.to_string())?;

    get_fingerprint_gate(conn, fingerprint)?
        .ok_or_else(|| "fingerprint gate missing after bump".into())
}

/// Loads gate state for a fingerprint.
pub fn get_fingerprint_gate(
    conn: &Connection,
    fingerprint: &str,
) -> Result<Option<FingerprintGate>, String> {
    require_non_empty("fingerprint", fingerprint)?;
    conn.query_row(
        "SELECT fingerprint, occurrence_count, first_seen_at, last_seen_at, cooldown_until, updated_at
         FROM error_fingerprint_gates WHERE fingerprint = ?1",
        [fingerprint],
        |row| {
            Ok(FingerprintGate {
                fingerprint: row.get(0)?,
                occurrence_count: row.get(1)?,
                first_seen_at: row.get(2)?,
                last_seen_at: row.get(3)?,
                cooldown_until: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    )
    .optional()
    .map_err(|error| error.to_string())
}

/// Inserts or updates a known-fingerprint cache entry.
pub fn upsert_known_fingerprint(
    conn: &Connection,
    entry: &KnownFingerprintWrite,
) -> Result<(), String> {
    require_non_empty("fingerprint", &entry.fingerprint)?;

    conn.execute(
        "INSERT INTO known_fingerprints (
            fingerprint, status, remote_ref, notes, created_at, updated_at
         ) VALUES (?1, ?2, ?3, ?4, datetime('now'), datetime('now'))
         ON CONFLICT(fingerprint) DO UPDATE SET
           status = excluded.status,
           remote_ref = excluded.remote_ref,
           notes = excluded.notes,
           updated_at = datetime('now')",
        params![
            entry.fingerprint,
            entry.status.as_str(),
            entry.remote_ref,
            entry.notes
        ],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

/// Loads a known-fingerprint cache entry.
pub fn get_known_fingerprint(
    conn: &Connection,
    fingerprint: &str,
) -> Result<Option<KnownFingerprint>, String> {
    require_non_empty("fingerprint", fingerprint)?;
    conn.query_row(
        "SELECT fingerprint, status, remote_ref, notes, created_at, updated_at
         FROM known_fingerprints WHERE fingerprint = ?1",
        [fingerprint],
        |row| {
            let status_raw: String = row.get(1)?;
            Ok((
                row.get::<_, String>(0)?,
                status_raw,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
            ))
        },
    )
    .optional()
    .map_err(|error| error.to_string())?
    .map(
        |(fingerprint, status_raw, remote_ref, notes, created_at, updated_at)| {
            Ok(KnownFingerprint {
                fingerprint,
                status: KnownFingerprintStatus::parse(&status_raw)?,
                remote_ref,
                notes,
                created_at,
                updated_at,
            })
        },
    )
    .transpose()
}

/// Inserts or updates a local feedback draft.
///
/// `log_excerpt_json` is sanitized with the shared logging redact rules before persist
/// so attach never stores a raw unsanitized dump.
pub fn upsert_feedback_draft(conn: &Connection, draft: &FeedbackDraftWrite) -> Result<(), String> {
    require_non_empty("id", &draft.id)?;

    let log_excerpt_json = draft
        .log_excerpt_json
        .as_ref()
        .map(|raw| super::sanitize_attached_log_excerpt(raw));

    conn.execute(
        "INSERT INTO feedback_drafts (
            id, fingerprint, notes, log_excerpt_json, status, created_at, updated_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'), datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           fingerprint = excluded.fingerprint,
           notes = excluded.notes,
           log_excerpt_json = excluded.log_excerpt_json,
           status = excluded.status,
           updated_at = datetime('now')",
        params![
            draft.id,
            draft.fingerprint,
            draft.notes,
            log_excerpt_json,
            draft.status.as_str()
        ],
    )
    .map_err(|error| error.to_string())?;
    Ok(())
}

/// Loads one feedback draft by id.
pub fn get_feedback_draft(conn: &Connection, id: &str) -> Result<Option<FeedbackDraft>, String> {
    require_non_empty("id", id)?;
    conn.query_row(
        "SELECT id, fingerprint, notes, log_excerpt_json, status, created_at, updated_at
         FROM feedback_drafts WHERE id = ?1",
        [id],
        |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, String>(6)?,
            ))
        },
    )
    .optional()
    .map_err(|error| error.to_string())?
    .map(
        |(id, fingerprint, notes, log_excerpt_json, status_raw, created_at, updated_at)| {
            Ok(FeedbackDraft {
                id,
                fingerprint,
                notes,
                log_excerpt_json,
                status: FeedbackDraftStatus::parse(&status_raw)?,
                created_at,
                updated_at,
            })
        },
    )
    .transpose()
}

/// Lists feedback drafts with the given status (newest first).
pub fn list_feedback_drafts_by_status(
    conn: &Connection,
    status: &FeedbackDraftStatus,
) -> Result<Vec<FeedbackDraft>, String> {
    let mut statement = conn
        .prepare(
            "SELECT id, fingerprint, notes, log_excerpt_json, status, created_at, updated_at
             FROM feedback_drafts
             WHERE status = ?1
             ORDER BY updated_at DESC, created_at DESC",
        )
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([status.as_str()], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, Option<String>>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, String>(6)?,
            ))
        })
        .map_err(|error| error.to_string())?;

    let mut drafts = Vec::new();
    for row in rows {
        let (id, fingerprint, notes, log_excerpt_json, status_raw, created_at, updated_at) =
            row.map_err(|error| error.to_string())?;
        drafts.push(FeedbackDraft {
            id,
            fingerprint,
            notes,
            log_excerpt_json,
            status: FeedbackDraftStatus::parse(&status_raw)?,
            created_at,
            updated_at,
        });
    }
    Ok(drafts)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::slices::database::migrations;

    fn open_db() -> Connection {
        let conn = Connection::open_in_memory().expect("in-memory sqlite");
        conn.execute_batch("PRAGMA foreign_keys = ON;")
            .expect("pragma");
        migrations::run(&conn).expect("migrations");
        conn
    }

    #[test]
    fn error_event_round_trip_and_list() {
        let conn = open_db();
        insert_error_event(
            &conn,
            &NewErrorEvent {
                id: "evt-1".into(),
                fingerprint: "fp-a".into(),
                source: "ui".into(),
                message: "boom".into(),
                context_json: Some(r#"{"route":"/"}"#.into()),
                occurred_at: Some("2026-11-27T12:00:00Z".into()),
            },
        )
        .unwrap();
        insert_error_event(
            &conn,
            &NewErrorEvent {
                id: "evt-2".into(),
                fingerprint: "fp-a".into(),
                source: "host".into(),
                message: "boom again".into(),
                context_json: None,
                occurred_at: None,
            },
        )
        .unwrap();

        let loaded = get_error_event(&conn, "evt-1").unwrap().unwrap();
        assert_eq!(loaded.fingerprint, "fp-a");
        assert_eq!(loaded.context_json.as_deref(), Some(r#"{"route":"/"}"#));
        assert_eq!(loaded.occurred_at, "2026-11-27T12:00:00Z");

        let listed = list_error_events_by_fingerprint(&conn, "fp-a").unwrap();
        assert_eq!(listed.len(), 2);
        assert!(get_error_event(&conn, "missing").unwrap().is_none());
    }

    #[test]
    fn insert_error_event_rejects_empty_fields() {
        let conn = open_db();
        let err = insert_error_event(
            &conn,
            &NewErrorEvent {
                id: " ".into(),
                fingerprint: "fp".into(),
                source: "ui".into(),
                message: "x".into(),
                context_json: None,
                occurred_at: None,
            },
        )
        .unwrap_err();
        assert!(err.contains("id"));
    }

    #[test]
    fn fingerprint_gate_upsert_and_bump() {
        let conn = open_db();
        upsert_fingerprint_gate(
            &conn,
            &FingerprintGateWrite {
                fingerprint: "fp-gate".into(),
                occurrence_count: 2,
                first_seen_at: Some("2026-11-27T10:00:00Z".into()),
                last_seen_at: Some("2026-11-27T11:00:00Z".into()),
                cooldown_until: Some("2026-11-27T12:00:00Z".into()),
            },
        )
        .unwrap();

        let gate = get_fingerprint_gate(&conn, "fp-gate").unwrap().unwrap();
        assert_eq!(gate.occurrence_count, 2);
        assert_eq!(gate.cooldown_until.as_deref(), Some("2026-11-27T12:00:00Z"));

        let bumped =
            bump_fingerprint_occurrence(&conn, "fp-gate", Some("2026-11-27T13:00:00Z")).unwrap();
        assert_eq!(bumped.occurrence_count, 3);
        assert_eq!(
            bumped.cooldown_until.as_deref(),
            Some("2026-11-27T13:00:00Z")
        );

        let created = bump_fingerprint_occurrence(&conn, "fp-new", None).unwrap();
        assert_eq!(created.occurrence_count, 1);
        assert!(created.cooldown_until.is_none());

        assert!(
            upsert_fingerprint_gate(
                &conn,
                &FingerprintGateWrite {
                    fingerprint: "fp-bad".into(),
                    occurrence_count: -1,
                    first_seen_at: None,
                    last_seen_at: None,
                    cooldown_until: None,
                },
            )
            .is_err()
        );
    }

    #[test]
    fn known_fingerprint_round_trip() {
        let conn = open_db();
        upsert_known_fingerprint(
            &conn,
            &KnownFingerprintWrite {
                fingerprint: "fp-k".into(),
                status: KnownFingerprintStatus::New,
                remote_ref: None,
                notes: Some("first sighting".into()),
            },
        )
        .unwrap();
        upsert_known_fingerprint(
            &conn,
            &KnownFingerprintWrite {
                fingerprint: "fp-k".into(),
                status: KnownFingerprintStatus::InProgress,
                remote_ref: Some("GH-12".into()),
                notes: None,
            },
        )
        .unwrap();

        let entry = get_known_fingerprint(&conn, "fp-k").unwrap().unwrap();
        assert_eq!(entry.status, KnownFingerprintStatus::InProgress);
        assert_eq!(entry.remote_ref.as_deref(), Some("GH-12"));
        assert!(get_known_fingerprint(&conn, "missing").unwrap().is_none());
    }

    #[test]
    fn feedback_draft_round_trip_and_list_by_status() {
        let conn = open_db();
        upsert_feedback_draft(
            &conn,
            &FeedbackDraftWrite {
                id: "draft-1".into(),
                fingerprint: Some("fp-a".into()),
                notes: "mat 2 crashed".into(),
                log_excerpt_json: Some(r#"{"lines":[]}"#.into()),
                status: FeedbackDraftStatus::Pending,
            },
        )
        .unwrap();
        upsert_feedback_draft(
            &conn,
            &FeedbackDraftWrite {
                id: "draft-2".into(),
                fingerprint: None,
                notes: "ready to send later".into(),
                log_excerpt_json: None,
                status: FeedbackDraftStatus::Ready,
            },
        )
        .unwrap();

        let pending = list_feedback_drafts_by_status(&conn, &FeedbackDraftStatus::Pending).unwrap();
        assert_eq!(pending.len(), 1);
        assert_eq!(pending[0].id, "draft-1");

        upsert_feedback_draft(
            &conn,
            &FeedbackDraftWrite {
                id: "draft-1".into(),
                fingerprint: Some("fp-a".into()),
                notes: "updated".into(),
                log_excerpt_json: None,
                status: FeedbackDraftStatus::Discarded,
            },
        )
        .unwrap();

        let draft = get_feedback_draft(&conn, "draft-1").unwrap().unwrap();
        assert_eq!(draft.status, FeedbackDraftStatus::Discarded);
        assert_eq!(draft.notes, "updated");
        assert!(get_feedback_draft(&conn, "missing").unwrap().is_none());
    }

    #[test]
    fn feedback_draft_attach_persists_sanitized_log_excerpt_only() {
        let conn = open_db();
        upsert_feedback_draft(
            &conn,
            &FeedbackDraftWrite {
                id: "draft-secret".into(),
                fingerprint: Some("fp-s".into()),
                notes: "organizer note without secrets".into(),
                log_excerpt_json: Some(
                    r#"{"pin":"4242","token":"leak","message":"mat-2 boom"}"#.into(),
                ),
                status: FeedbackDraftStatus::Pending,
            },
        )
        .unwrap();

        let draft = get_feedback_draft(&conn, "draft-secret").unwrap().unwrap();
        let excerpt = draft.log_excerpt_json.expect("excerpt stored");
        assert!(!excerpt.contains("4242"));
        assert!(!excerpt.contains("leak"));
        assert!(excerpt.contains("mat-2 boom"));
        assert!(excerpt.contains("[REDACTED]"));
        assert_eq!(draft.notes, "organizer note without secrets");
    }
}
