//! Serializable records for offline error/report SQLite state.

use serde::{Deserialize, Serialize};

/// Allowed statuses for the local known-fingerprint cache.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum KnownFingerprintStatus {
    New,
    Known,
    InProgress,
}

impl KnownFingerprintStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::New => "new",
            Self::Known => "known",
            Self::InProgress => "in_progress",
        }
    }

    pub fn parse(value: &str) -> Result<Self, String> {
        match value {
            "new" => Ok(Self::New),
            "known" => Ok(Self::Known),
            "in_progress" => Ok(Self::InProgress),
            other => Err(format!("unknown known-fingerprint status: {other}")),
        }
    }
}

/// Local-only feedback draft lifecycle (no upload in this milestone).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FeedbackDraftStatus {
    Pending,
    Ready,
    Discarded,
}

impl FeedbackDraftStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Pending => "pending",
            Self::Ready => "ready",
            Self::Discarded => "discarded",
        }
    }

    pub fn parse(value: &str) -> Result<Self, String> {
        match value {
            "pending" => Ok(Self::Pending),
            "ready" => Ok(Self::Ready),
            "discarded" => Ok(Self::Discarded),
            other => Err(format!("unknown feedback-draft status: {other}")),
        }
    }
}

/// Input for inserting an error/report event.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewErrorEvent {
    pub id: String,
    pub fingerprint: String,
    pub source: String,
    pub message: String,
    pub context_json: Option<String>,
    pub occurred_at: Option<String>,
}

/// Stored error/report event row.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorEvent {
    pub id: String,
    pub fingerprint: String,
    pub source: String,
    pub message: String,
    pub context_json: Option<String>,
    pub occurred_at: String,
    pub created_at: String,
}

/// Upsert payload for occurrence/cooldown gate state.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FingerprintGateWrite {
    pub fingerprint: String,
    pub occurrence_count: i64,
    pub first_seen_at: Option<String>,
    pub last_seen_at: Option<String>,
    pub cooldown_until: Option<String>,
}

/// Stored fingerprint gate row.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FingerprintGate {
    pub fingerprint: String,
    pub occurrence_count: i64,
    pub first_seen_at: String,
    pub last_seen_at: String,
    pub cooldown_until: Option<String>,
    pub updated_at: String,
}

/// Upsert payload for the known-fingerprint cache.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KnownFingerprintWrite {
    pub fingerprint: String,
    pub status: KnownFingerprintStatus,
    pub remote_ref: Option<String>,
    pub notes: Option<String>,
}

/// Stored known-fingerprint cache row.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KnownFingerprint {
    pub fingerprint: String,
    pub status: KnownFingerprintStatus,
    pub remote_ref: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Upsert payload for a local feedback draft.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FeedbackDraftWrite {
    pub id: String,
    pub fingerprint: Option<String>,
    pub notes: String,
    pub log_excerpt_json: Option<String>,
    pub status: FeedbackDraftStatus,
}

/// Stored feedback draft row.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FeedbackDraft {
    pub id: String,
    pub fingerprint: Option<String>,
    pub notes: String,
    pub log_excerpt_json: Option<String>,
    pub status: FeedbackDraftStatus,
    pub created_at: String,
    pub updated_at: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn known_status_round_trips() {
        for status in [
            KnownFingerprintStatus::New,
            KnownFingerprintStatus::Known,
            KnownFingerprintStatus::InProgress,
        ] {
            assert_eq!(
                KnownFingerprintStatus::parse(status.as_str()).unwrap(),
                status
            );
        }
        assert!(KnownFingerprintStatus::parse("done").is_err());
    }

    #[test]
    fn draft_status_round_trips() {
        for status in [
            FeedbackDraftStatus::Pending,
            FeedbackDraftStatus::Ready,
            FeedbackDraftStatus::Discarded,
        ] {
            assert_eq!(FeedbackDraftStatus::parse(status.as_str()).unwrap(), status);
        }
        assert!(FeedbackDraftStatus::parse("sent").is_err());
    }
}
