//! Versioned SQLite migrations applied by the host on startup.

use rusqlite::Connection;

struct Migration {
    version: i64,
    description: &'static str,
    sql: &'static str,
}

const MIGRATIONS: &[Migration] = &[Migration {
    version: 1,
    description: "create_app_kv",
    sql: include_str!("migrations/V001__create_app_kv.sql"),
}];

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
