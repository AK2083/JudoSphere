//! Central host-side sanitize/redact for log text and structured extracts.
//!
//! Display and export/attach paths must call these functions — do not reimplement
//! redaction rules in Vue. Log field labels are English-only (host logs stay EN);
//! synonyms live in `config/log-redact.json` via [`catalog`].

mod catalog;

use catalog::catalog;
use regex::Regex;
use serde_json::{Map, Value};
use std::sync::LazyLock;

/// Placeholder written in place of secrets, tokens, PINs, and unnecessary PII.
pub const REDACTED: &str = "[REDACTED]";

/// `Bearer <token>` credentials in free text or headers.
static BEARER_TOKEN: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)\bBearer\s+[A-Za-z0-9._\-+=/]+").expect("bearer token regex")
});

/// Compact JWT-shaped triples (`eyJ…`).
static JWT: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b").expect("jwt regex")
});

/// Bare email addresses in log lines (shape-based, not a label synonym).
static EMAIL_SHAPE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}\b").expect("email shape regex")
});

/// Replace a labeled `key[:=]value` match, preserving quote style when present.
fn redact_labeled(re: &Regex, input: &str) -> String {
    re.replace_all(input, |caps: &regex::Captures| {
        let key = &caps[1];
        let sep = &caps[2];
        if caps.get(3).is_some() {
            format!("{key}{sep}\"{REDACTED}\"")
        } else if caps.get(4).is_some() {
            format!("{key}{sep}'{REDACTED}'")
        } else {
            format!("{key}{sep}{REDACTED}")
        }
    })
    .into_owned()
}

/// Apply centralized redact rules to plain log text.
pub fn sanitize_log_text(input: &str) -> String {
    let cat = catalog();
    let mut out = input.to_string();
    out = BEARER_TOKEN
        .replace_all(&out, format!("Bearer {REDACTED}"))
        .into_owned();
    out = JWT.replace_all(&out, REDACTED).into_owned();
    out = redact_labeled(&cat.labeled_secret, &out);
    out = redact_labeled(&cat.labeled_name, &out);
    out = redact_labeled(&cat.labeled_email, &out);
    out = EMAIL_SHAPE.replace_all(&out, REDACTED).into_owned();
    out = redact_labeled(&cat.labeled_phone, &out);
    out = redact_labeled(&cat.labeled_dob, &out);
    out
}

/// Sanitize a structured JSON extract (objects, arrays, and string leaves).
pub fn sanitize_json_value(value: &Value) -> Value {
    let cat = catalog();
    match value {
        Value::Object(map) => {
            let mut out = Map::new();
            for (key, child) in map {
                if cat.is_sensitive_key(key) {
                    out.insert(key.clone(), Value::String(REDACTED.to_string()));
                } else {
                    out.insert(key.clone(), sanitize_json_value(child));
                }
            }
            Value::Object(out)
        }
        Value::Array(items) => Value::Array(items.iter().map(sanitize_json_value).collect()),
        Value::String(text) => Value::String(sanitize_log_text(text)),
        other => other.clone(),
    }
}

/// Sanitize a structured extract: JSON when parseable, otherwise plain text rules.
pub fn sanitize_structured_extract(raw: &str) -> String {
    match serde_json::from_str::<Value>(raw) {
        Ok(value) => serde_json::to_string(&sanitize_json_value(&value))
            .expect("serde_json::Value always serializes"),
        Err(_) => sanitize_log_text(raw),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn redacts_labeled_secrets_tokens_and_pins() {
        let input = "login password=hall-secret token: abc.def pin='4242' api_key=\"k-9\"";
        let out = sanitize_log_text(input);
        assert!(!out.contains("hall-secret"));
        assert!(!out.contains("abc.def"));
        assert!(!out.contains("4242"));
        assert!(!out.contains("k-9"));
        assert!(out.contains("password="));
        assert!(out.contains(REDACTED));
    }

    #[test]
    fn redacts_bearer_and_jwt() {
        let jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signaturepart";
        let input = format!("Authorization: Bearer {jwt} raw={jwt}");
        let out = sanitize_log_text(&input);
        assert!(!out.contains("signaturepart"));
        assert!(out.contains(&format!("Bearer {REDACTED}")));
        assert!(out.matches(REDACTED).count() >= 2);
    }

    #[test]
    fn redacts_agreed_pii_patterns() {
        let input = concat!(
            "competitor: Ada Example ",
            "email ada.example@club.test ",
            "phone=+49 170 1234567 ",
            "dob=1990-05-01 ",
            "member_name=\"Max Mustermann\""
        );
        let out = sanitize_log_text(input);
        assert!(!out.contains("Ada Example"));
        assert!(!out.contains("ada.example@club.test"));
        assert!(!out.contains("170 1234567"));
        assert!(!out.contains("1990-05-01"));
        assert!(!out.contains("Max Mustermann"));
        assert!(out.contains(REDACTED));
    }

    #[test]
    fn leaves_innocent_log_text_intact() {
        let input = "match mat-2 started at 10:15 level=info source=scoring";
        assert_eq!(sanitize_log_text(input), input);
    }

    #[test]
    fn sanitize_json_value_redacts_sensitive_keys_and_string_leaves() {
        let value = json!({
            "level": "error",
            "pin": "9999",
            "context": {
                "message": "failed for email coach@club.test",
                "count": 2,
                "ok": true,
                "nested": null
            },
            "tags": ["token=leak", 1]
        });
        let out = sanitize_json_value(&value);
        assert_eq!(out["pin"], REDACTED);
        assert_eq!(out["level"], "error");
        assert_eq!(out["context"]["count"], 2);
        assert_eq!(out["context"]["ok"], true);
        assert!(out["context"]["nested"].is_null());
        let message = out["context"]["message"].as_str().unwrap();
        assert!(!message.contains("coach@club.test"));
        assert!(message.contains(REDACTED));
        let tag = out["tags"][0].as_str().unwrap();
        assert!(!tag.contains("leak"));
        assert_eq!(out["tags"][1], 1);
    }

    #[test]
    fn sanitize_structured_extract_handles_json_and_plain_text() {
        let json_out = sanitize_structured_extract(r#"{"token":"abc","note":"ok"}"#);
        let parsed: Value = serde_json::from_str(&json_out).unwrap();
        assert_eq!(parsed["token"], REDACTED);
        assert_eq!(parsed["note"], "ok");

        let plain = sanitize_structured_extract("pin=1234 ready");
        assert!(!plain.contains("1234"));
        assert!(plain.contains("ready"));
    }

    #[test]
    fn is_sensitive_key_uses_catalog_synonyms() {
        let cat = catalog();
        assert!(cat.is_sensitive_key("api-key"));
        assert!(cat.is_sensitive_key("API_KEY"));
        assert!(cat.is_sensitive_key("first_name"));
        assert!(cat.is_sensitive_key("member-name"));
        assert!(cat.is_sensitive_key("authorization"));
        assert!(!cat.is_sensitive_key("level"));
        assert!(!cat.is_sensitive_key("message"));
    }

    #[test]
    fn labeled_secret_keeps_quote_style() {
        let out = sanitize_log_text(r#"secret="top" token='x' pin=1"#);
        assert!(out.contains("secret=\"[REDACTED]\""));
        assert!(out.contains("token='[REDACTED]'"));
        assert!(out.contains("pin=[REDACTED]"));
    }
}
