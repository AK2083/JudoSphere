//! Sanitize log excerpts before attach/export into feedback drafts.
//!
//! Uses the shared logging redact catalog — Vue must not supply a parallel path.

use crate::slices::logging::sanitize_structured_extract;

/// Sanitize a log excerpt for feedback attach or export (never the raw dump).
///
/// @param raw - Unsanitized log text or JSON extract.
/// @returns Host-sanitized extract safe to persist on a feedback draft.
pub fn sanitize_attached_log_excerpt(raw: &str) -> String {
    sanitize_structured_extract(raw)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shares_logging_sanitizer_for_secrets_and_pii() {
        let out = sanitize_attached_log_excerpt(
            r#"{"pin":"4242","token":"leak","note":"mat-1","email":"a@b.test"}"#,
        );
        assert!(!out.contains("4242"));
        assert!(!out.contains("leak"));
        assert!(!out.contains("a@b.test"));
        assert!(out.contains("[REDACTED]"));
        assert!(out.contains("mat-1"));
    }

    #[test]
    fn plain_text_excerpt_is_sanitized_too() {
        let out = sanitize_attached_log_excerpt("password=hall-secret ready");
        assert!(!out.contains("hall-secret"));
        assert!(out.contains("ready"));
        assert!(out.contains("[REDACTED]"));
    }
}
