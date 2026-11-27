//! Stable host-side error fingerprint derivation.
//!
//! Fingerprint material is sanitized first (same redact rules as display/export),
//! then normalized and hashed. Vue must not reimplement this logic.

use regex::Regex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::sync::LazyLock;

use crate::slices::logging::sanitize_log_text;

/// Schema version embedded in the hashed material so algorithm changes do not collide.
const FINGERPRINT_VERSION: &str = "v1";

/// Maximum number of key stack frames included in the fingerprint.
const MAX_FRAMES: usize = 8;

/// Hex / memory addresses that would make fingerprints unstable across runs.
static HEX_ADDR: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)\b0x[0-9a-f]+\b").expect("hex address regex")
});

/// Absolute Unix or Windows paths collapsed to the final path segment.
static ABS_PATH: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)(?:[a-z]:\\|/)(?:[^\s:]+[/\\])+([^\s:/\\]+)").expect("abs path regex")
});

/// Collapses runs of whitespace to a single space.
static WHITESPACE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\s+").expect("whitespace regex"));

/// Input for host-side fingerprint derivation (camelCase for Tauri/JS).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ErrorFingerprintInput {
    /// Human-readable error message (sanitized before hashing).
    pub message: String,
    /// Optional error type / name (e.g. `TypeError`).
    #[serde(default)]
    pub error_type: Option<String>,
    /// Optional key stack frames (top frames; volatile addresses/paths are normalized).
    #[serde(default)]
    pub frames: Option<Vec<String>>,
}

/// Derive a stable fingerprint from sanitized + normalized message, type, and key frames.
///
/// Same logical input always yields the same hex SHA-256 string. PII/secrets in the
/// raw input are redacted via [`sanitize_log_text`] before they enter the hash.
pub fn derive_fingerprint(input: &ErrorFingerprintInput) -> String {
    let material = fingerprint_material(input);
    hex_sha256(&material)
}

/// Build the canonical (sanitized + normalized) string that is hashed.
pub fn fingerprint_material(input: &ErrorFingerprintInput) -> String {
    let error_type = input
        .error_type
        .as_deref()
        .map(prepare_part)
        .filter(|part| !part.is_empty())
        .unwrap_or_default();
    let message = prepare_part(&input.message);
    let frames = input
        .frames
        .as_deref()
        .unwrap_or(&[])
        .iter()
        .map(|frame| prepare_part(frame))
        .filter(|frame| !frame.is_empty())
        .take(MAX_FRAMES)
        .collect::<Vec<_>>()
        .join("\n");

    format!("{FINGERPRINT_VERSION}|{error_type}|{message}|{frames}")
}

fn prepare_part(raw: &str) -> String {
    normalize_fingerprint_text(&sanitize_log_text(raw))
}

/// Normalize sanitized text for stable fingerprinting across runs and hosts.
pub fn normalize_fingerprint_text(input: &str) -> String {
    let mut out = input.trim().to_lowercase();
    out = HEX_ADDR.replace_all(&out, "0x?").into_owned();
    out = ABS_PATH.replace_all(&out, "$1").into_owned();
    out = WHITESPACE.replace_all(&out, " ").into_owned();
    out.trim().to_string()
}

fn hex_sha256(material: &str) -> String {
    let digest = Sha256::digest(material.as_bytes());
    let mut hex = String::with_capacity(digest.len() * 2);
    for byte in digest {
        use std::fmt::Write;
        let _ = write!(hex, "{byte:02x}");
    }
    hex
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn same_normalized_input_yields_same_fingerprint() {
        let a = ErrorFingerprintInput {
            message: "  Boom at Mat  ".into(),
            error_type: Some("TypeError".into()),
            frames: Some(vec!["at score (App.vue:10)".into()]),
        };
        let b = ErrorFingerprintInput {
            message: "boom at mat".into(),
            error_type: Some("typeerror".into()),
            frames: Some(vec!["at score (app.vue:10)".into()]),
        };
        assert_eq!(derive_fingerprint(&a), derive_fingerprint(&b));
        assert_eq!(derive_fingerprint(&a).len(), 64);
    }

    #[test]
    fn different_messages_yield_different_fingerprints() {
        let a = ErrorFingerprintInput {
            message: "boom-a".into(),
            error_type: None,
            frames: None,
        };
        let b = ErrorFingerprintInput {
            message: "boom-b".into(),
            error_type: None,
            frames: None,
        };
        assert_ne!(derive_fingerprint(&a), derive_fingerprint(&b));
    }

    #[test]
    fn sanitizes_pii_before_hashing() {
        let with_secret = ErrorFingerprintInput {
            message: "failed pin=4242 token=leak".into(),
            error_type: Some("Error".into()),
            frames: None,
        };
        let again = ErrorFingerprintInput {
            message: "failed pin=9999 token=other-secret".into(),
            error_type: Some("Error".into()),
            frames: None,
        };
        // Different secret values still collide once redacted.
        assert_eq!(derive_fingerprint(&with_secret), derive_fingerprint(&again));
        let material = fingerprint_material(&with_secret);
        assert!(!material.contains("4242"));
        assert!(!material.contains("leak"));
        assert!(material.contains("[redacted]"));
    }

    #[test]
    fn normalizes_hex_addresses_and_absolute_paths_in_frames() {
        let a = ErrorFingerprintInput {
            message: "crash".into(),
            error_type: Some("Error".into()),
            frames: Some(vec![
                "at run (/Users/adrian/Projekte/JudoSphere/src/App.vue:12) 0xdeadbeef".into(),
            ]),
        };
        let b = ErrorFingerprintInput {
            message: "crash".into(),
            error_type: Some("Error".into()),
            frames: Some(vec![
                "at run (C:\\Users\\other\\JudoSphere\\src\\App.vue:12) 0xabc123".into(),
            ]),
        };
        assert_eq!(derive_fingerprint(&a), derive_fingerprint(&b));
        let material = fingerprint_material(&a);
        assert!(material.contains("app.vue:12"));
        assert!(material.contains("0x?"));
        assert!(!material.contains("adrian"));
        assert!(!material.contains("deadbeef"));
    }

    #[test]
    fn caps_frames_and_skips_empty_parts() {
        let frames: Vec<String> = (0..12).map(|i| format!("frame-{i}")).collect();
        let input = ErrorFingerprintInput {
            message: "  ".into(),
            error_type: Some("   ".into()),
            frames: Some(frames),
        };
        let material = fingerprint_material(&input);
        assert!(material.starts_with("v1||"));
        for i in 0..8 {
            assert!(material.contains(&format!("frame-{i}")));
        }
        assert!(!material.contains("frame-8"));
        assert!(!material.contains("frame-11"));
    }

    #[test]
    fn default_input_is_stable() {
        let empty = ErrorFingerprintInput::default();
        let explicit = ErrorFingerprintInput {
            message: String::new(),
            error_type: None,
            frames: None,
        };
        assert_eq!(derive_fingerprint(&empty), derive_fingerprint(&explicit));
        assert_eq!(fingerprint_material(&empty), "v1|||");
    }

    #[test]
    fn normalize_fingerprint_text_trims_and_collapses_whitespace() {
        assert_eq!(
            normalize_fingerprint_text("  Hello\t\nWorld  "),
            "hello world"
        );
    }
}
