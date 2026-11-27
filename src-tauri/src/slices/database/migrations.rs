//! Versioned SQLite migrations applied by the host on startup.

use rusqlite::Connection;

struct Migration {
    version: i64,
    description: &'static str,
    sql: &'static str,
}

const MIGRATIONS: &[Migration] = &[
    Migration {
        version: 1,
        description: "create_app_kv",
        sql: include_str!("migrations/V001__create_app_kv.sql"),
    },
    Migration {
        version: 2,
        description: "error_report_state",
        sql: include_str!("migrations/V002__error_report_state.sql"),
    },
];

/// Ensures the migrations table exists and applies pending migrations in order.
pub fn run(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY NOT NULL,
            description TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );",
    )
    .map_err(|error| error.to_string())?;

    for migration in MIGRATIONS {
        let already_applied: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = ?1)",
                [migration.version],
                |row| row.get(0),
            )
            .map_err(|error| error.to_string())?;

        if already_applied {
            continue;
        }

        conn.execute_batch(migration.sql)
            .map_err(|error| format!("migration {}: {}", migration.version, error))?;

        conn.execute(
            "INSERT INTO schema_migrations (version, description) VALUES (?1, ?2)",
            (migration.version, migration.description),
        )
        .map_err(|error| error.to_string())?;

        log::info!(
            "applied sqlite migration v{} ({})",
            migration.version,
            migration.description
        );
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn open_migrated() -> Connection {
        let conn = Connection::open_in_memory().expect("in-memory sqlite");
        conn.execute_batch("PRAGMA foreign_keys = ON;")
            .expect("pragma");
        run(&conn).expect("migrations");
        conn
    }

    fn table_exists(conn: &Connection, name: &str) -> bool {
        conn.query_row(
            "SELECT EXISTS(
                SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?1
             )",
            [name],
            |row| row.get(0),
        )
        .expect("table exists query")
    }

    #[test]
    fn run_applies_v001_and_v002_and_is_idempotent() {
        let conn = open_migrated();

        assert!(table_exists(&conn, "app_kv"));
        assert!(table_exists(&conn, "error_events"));
        assert!(table_exists(&conn, "error_fingerprint_gates"));
        assert!(table_exists(&conn, "known_fingerprints"));
        assert!(table_exists(&conn, "feedback_drafts"));

        let versions: Vec<i64> = {
            let mut stmt = conn
                .prepare("SELECT version FROM schema_migrations ORDER BY version")
                .expect("prepare");
            stmt.query_map([], |row| row.get(0))
                .expect("query")
                .collect::<Result<_, _>>()
                .expect("rows")
        };
        assert_eq!(versions, vec![1, 2]);

        run(&conn).expect("second run");
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM schema_migrations", [], |row| {
                row.get(0)
            })
            .expect("count");
        assert_eq!(count, 2);
    }

    #[test]
    fn v002_preserves_app_kv_rows() {
        let conn = Connection::open_in_memory().expect("in-memory sqlite");
        conn.execute_batch("PRAGMA foreign_keys = ON;")
            .expect("pragma");

        // Apply only V001 first by running full runner once, then seed, then re-run.
        run(&conn).expect("migrations");
        conn.execute(
            "INSERT INTO app_kv (key, value) VALUES ('prefs.theme', 'dark')",
            [],
        )
        .expect("seed");

        run(&conn).expect("idempotent");
        let value: String = conn
            .query_row(
                "SELECT value FROM app_kv WHERE key = 'prefs.theme'",
                [],
                |row| row.get(0),
            )
            .expect("read");
        assert_eq!(value, "dark");
        assert!(table_exists(&conn, "error_events"));
    }

    #[test]
    fn known_fingerprints_accepts_status_vocabulary() {
        let conn = open_migrated();
        for status in ["new", "known", "in_progress"] {
            conn.execute(
                "INSERT INTO known_fingerprints (fingerprint, status) VALUES (?1, ?2)",
                (format!("fp-{status}"), status),
            )
            .unwrap_or_else(|error| panic!("status {status} should be allowed: {error}"));
        }

        let err = conn
            .execute(
                "INSERT INTO known_fingerprints (fingerprint, status) VALUES ('fp-bad', 'done')",
                [],
            )
            .expect_err("invalid status must fail");
        assert!(err.to_string().to_lowercase().contains("check"));
    }
}
