//! Focused end-to-end coverage for fingerprint stability + gate + known cache.
//!
//! Loaded only under `cfg(test)` from the error_report slice.

#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use crate::slices::database::migrations;
    use crate::slices::error_report::fingerprint::{derive_fingerprint, ErrorFingerprintInput};
    use crate::slices::error_report::preprocess::{
        preprocess_error_report, PreprocessDisposition, PreprocessOptions,
    };
    use crate::slices::error_report::store::{
        get_known_fingerprint, list_error_events_by_fingerprint, upsert_fingerprint_gate,
        upsert_known_fingerprint,
    };
    use crate::slices::error_report::types::{
        FingerprintGateWrite, KnownFingerprintStatus, KnownFingerprintWrite, NewErrorEvent,
    };

    fn open_db() -> Connection {
        let conn = Connection::open_in_memory().expect("in-memory sqlite");
        conn.execute_batch("PRAGMA foreign_keys = ON;")
            .expect("pragma");
        migrations::run(&conn).expect("migrations");
        conn
    }

    #[test]
    fn stable_fingerprint_feeds_gate_and_seeds_known_new() {
        let conn = open_db();
        let input = ErrorFingerprintInput {
            message: "  Score failed pin=4242  ".into(),
            error_type: Some("TypeError".into()),
            frames: Some(vec![
                "at run (/Users/adrian/app/src/Score.vue:10) 0xdead".into(),
            ]),
        };
        let fingerprint = derive_fingerprint(&input);
        let again = derive_fingerprint(&ErrorFingerprintInput {
            message: "score failed pin=9999".into(),
            error_type: Some("typeerror".into()),
            frames: Some(vec![
                "at run (C:\\Users\\x\\app\\src\\Score.vue:10) 0xabc".into(),
            ]),
        });
        assert_eq!(fingerprint, again);

        let first = preprocess_error_report(
            &conn,
            &NewErrorEvent {
                id: "evt-1".into(),
                fingerprint: fingerprint.clone(),
                source: "ui".into(),
                message: input.message.clone(),
                context_json: None,
                occurred_at: None,
            },
            &PreprocessOptions {
                cooldown_seconds: Some(90),
            },
        )
        .unwrap();
        assert_eq!(first.disposition, PreprocessDisposition::Recorded);
        assert_eq!(first.known.status, KnownFingerprintStatus::New);
        assert_eq!(first.gate.occurrence_count, 1);

        let gated = preprocess_error_report(
            &conn,
            &NewErrorEvent {
                id: "evt-2".into(),
                fingerprint: fingerprint.clone(),
                source: "ui".into(),
                message: input.message.clone(),
                context_json: None,
                occurred_at: None,
            },
            &PreprocessOptions {
                cooldown_seconds: Some(90),
            },
        )
        .unwrap();
        assert_eq!(gated.disposition, PreprocessDisposition::Gated);
        assert_eq!(gated.gate.occurrence_count, 2);
        assert_eq!(gated.known.status, KnownFingerprintStatus::New);
        assert_eq!(
            list_error_events_by_fingerprint(&conn, &fingerprint)
                .unwrap()
                .len(),
            1
        );
    }

    #[test]
    fn known_cache_holds_all_local_statuses_and_is_readable_after_gate() {
        let conn = open_db();
        for (fp, status) in [
            ("fp-new", KnownFingerprintStatus::New),
            ("fp-known", KnownFingerprintStatus::Known),
            ("fp-wip", KnownFingerprintStatus::InProgress),
        ] {
            upsert_known_fingerprint(
                &conn,
                &KnownFingerprintWrite {
                    fingerprint: fp.into(),
                    status: status.clone(),
                    remote_ref: None,
                    notes: None,
                },
            )
            .unwrap();
            let loaded = get_known_fingerprint(&conn, fp).unwrap().unwrap();
            assert_eq!(loaded.status, status);
        }

        // Expire cooldown so preprocess records, then confirm readable known status.
        upsert_fingerprint_gate(
            &conn,
            &FingerprintGateWrite {
                fingerprint: "fp-known".into(),
                occurrence_count: 3,
                first_seen_at: None,
                last_seen_at: None,
                cooldown_until: Some("2000-01-01 00:00:00".into()),
            },
        )
        .unwrap();

        let result = preprocess_error_report(
            &conn,
            &NewErrorEvent {
                id: "evt-known".into(),
                fingerprint: "fp-known".into(),
                source: "host".into(),
                message: "again".into(),
                context_json: None,
                occurred_at: None,
            },
            &PreprocessOptions {
                cooldown_seconds: Some(10),
            },
        )
        .unwrap();
        assert_eq!(result.disposition, PreprocessDisposition::Recorded);
        assert_eq!(result.known.status, KnownFingerprintStatus::Known);
        assert_eq!(result.gate.occurrence_count, 4);
    }
}
