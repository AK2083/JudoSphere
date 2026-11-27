//! English log-label synonym catalog for redact rules.
//!
//! Single source: repo `config/log-redact.json`. Text labeled-key regexes and
//! JSON sensitive-key checks both derive from this file — do not duplicate lists
//! in Vue or elsewhere.

use regex::Regex;
use serde::Deserialize;
use std::collections::HashSet;
use std::sync::LazyLock;

const LOG_REDACT_JSON: &str = include_str!("../../../../../config/log-redact.json");

const LABELED_VALUE_GENERIC: &str =
    r#"(\s*[:=]\s*)(?:"([^"]*)"|'([^']*)'|([^\s"',;}\]]+))"#;

const LABELED_VALUE_PHONE: &str =
    r#"(\s*[:=]\s*)(?:"([^"]*)"|'([^']*)'|([+\d][\d\s./()-]{5,}))"#;

const LABELED_VALUE_NAME: &str = concat!(
    r#"(\s*[:=]\s*)(?:"([^"]*)"|'([^']*)'|"#,
    r#"([A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'\-]*(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'\-]*){0,3}))"#,
);

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LogRedactFile {
    version: u32,
    labels: LabelCategories,
    json_only_keys: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct LabelCategories {
    secret: Vec<String>,
    name: Vec<String>,
    phone: Vec<String>,
    dob: Vec<String>,
    email: Vec<String>,
}

/// Compiled synonym catalog shared by text and JSON redact paths.
pub struct RedactCatalog {
    pub labeled_secret: Regex,
    pub labeled_name: Regex,
    pub labeled_phone: Regex,
    pub labeled_dob: Regex,
    pub labeled_email: Regex,
    sensitive_keys: HashSet<String>,
}

fn redact_config() -> LogRedactFile {
    let file: LogRedactFile =
        serde_json::from_str(LOG_REDACT_JSON).expect("config/log-redact.json must be valid");
    assert!(file.version >= 1, "config/log-redact.json version must be >= 1");
    file
}

fn normalize_key(raw: &str) -> String {
    raw.trim().to_ascii_lowercase().replace('-', "_")
}

fn alternation(labels: &[String]) -> String {
    labels
        .iter()
        .map(|label| regex::escape(label))
        .collect::<Vec<_>>()
        .join("|")
}

fn labeled_regex(labels: &[String], value_pattern: &str, name: &str) -> Regex {
    assert!(
        !labels.is_empty(),
        "log-redact category {name} must list at least one label"
    );
    let pattern = format!(r"(?i)\b({})\b{}", alternation(labels), value_pattern);
    Regex::new(&pattern).unwrap_or_else(|err| panic!("invalid {name} redact regex: {err}"))
}

fn build_catalog(file: &LogRedactFile) -> RedactCatalog {
    let mut sensitive_keys = HashSet::new();
    for labels in [
        &file.labels.secret,
        &file.labels.name,
        &file.labels.phone,
        &file.labels.dob,
        &file.labels.email,
    ] {
        for label in labels {
            sensitive_keys.insert(normalize_key(label));
        }
    }
    for key in &file.json_only_keys {
        sensitive_keys.insert(normalize_key(key));
    }

    RedactCatalog {
        labeled_secret: labeled_regex(&file.labels.secret, LABELED_VALUE_GENERIC, "secret"),
        labeled_name: labeled_regex(&file.labels.name, LABELED_VALUE_NAME, "name"),
        labeled_phone: labeled_regex(&file.labels.phone, LABELED_VALUE_PHONE, "phone"),
        labeled_dob: labeled_regex(&file.labels.dob, LABELED_VALUE_GENERIC, "dob"),
        labeled_email: labeled_regex(&file.labels.email, LABELED_VALUE_GENERIC, "email"),
        sensitive_keys,
    }
}

static CATALOG: LazyLock<RedactCatalog> = LazyLock::new(|| build_catalog(&redact_config()));

/// Shared redact catalog (labels from `config/log-redact.json`).
pub fn catalog() -> &'static RedactCatalog {
    &CATALOG
}

impl RedactCatalog {
    /// Whether a JSON object key is sensitive (normalized `-` / case).
    pub fn is_sensitive_key(&self, key: &str) -> bool {
        self.sensitive_keys.contains(&normalize_key(key))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn catalog_loads_english_synonyms() {
        let cat = catalog();
        assert!(cat.is_sensitive_key("password"));
        assert!(cat.is_sensitive_key("passwd"));
        assert!(cat.is_sensitive_key("api-key"));
        assert!(cat.is_sensitive_key("API_KEY"));
        assert!(cat.is_sensitive_key("authorization"));
        assert!(cat.is_sensitive_key("email"));
        assert!(!cat.is_sensitive_key("level"));
        assert!(!cat.is_sensitive_key("message"));
    }

    #[test]
    fn config_version_is_at_least_one() {
        assert!(redact_config().version >= 1);
    }
}
