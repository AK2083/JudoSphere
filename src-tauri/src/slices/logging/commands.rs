//! Tauri commands for host-UI → durable log intake and sanitized extracts.

use super::{accept_forwarded_ui_record, sanitize_structured_extract, ForwardedUiLogRecord};

/// Forward a host-UI log line into the local rolling log files (offline only).
///
/// Intended sink for the Vue forward facade (Feature #77 completes call-site wiring).
#[tauri::command]
pub fn forward_ui_log(
    level: String,
    message: String,
    source: Option<String>,
) -> Result<(), String> {
    let parsed = ForwardedUiLogRecord::parse_level(&level)
        .ok_or_else(|| format!("unknown log level: {level}"))?;
    accept_forwarded_ui_record(&ForwardedUiLogRecord::new(parsed, message, source));
    Ok(())
}

/// Return a sanitized log extract for UI display / later attach (never the raw dump).
///
/// JSON payloads are walked with the shared redact rules; plain text uses the same rules.
#[tauri::command]
pub fn sanitize_log_extract(raw: String) -> String {
    sanitize_structured_extract(&raw)
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::sanitize::REDACTED;

    #[test]
    fn forward_ui_log_accepts_known_level() {
        assert!(forward_ui_log("warn".into(), "hall noise".into(), None).is_ok());
        assert!(forward_ui_log(
            "error".into(),
            "boom".into(),
            Some("App.vue".into())
        )
        .is_ok());
    }

    #[test]
    fn forward_ui_log_rejects_unknown_level() {
        let err = forward_ui_log("loud".into(), "x".into(), None).unwrap_err();
        assert!(err.contains("unknown log level"));
    }

    #[test]
    fn sanitize_log_extract_redacts_secrets_via_shared_engine() {
        let out = sanitize_log_extract(r#"{"pin":"4242","note":"mat-1"}"#.into());
        assert!(!out.contains("4242"));
        assert!(out.contains(REDACTED));
        assert!(out.contains("mat-1"));
    }
}
