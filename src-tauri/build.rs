//! Embed `LOG_LEVEL` from the process env or repo `.env*` files at compile time.

use std::fs;
use std::path::Path;

const LOG_LEVEL_ENV: &str = "LOG_LEVEL";

fn main() {
    embed_log_level_env();
    println!("cargo:rerun-if-changed=../config/logging.json");
    tauri_build::build();
}

fn embed_log_level_env() {
    println!("cargo:rerun-if-env-changed={LOG_LEVEL_ENV}");

    if let Ok(value) = std::env::var(LOG_LEVEL_ENV) {
        if !value.trim().is_empty() {
            println!("cargo:rustc-env={LOG_LEVEL_ENV}={}", value.trim());
            return;
        }
    }

    for relative in [
        "../.env.local",
        "../.env.development",
        "../.env",
        ".env.local",
        ".env.development",
        ".env",
    ] {
        if let Some(value) = read_env_key_from_file(Path::new(relative), LOG_LEVEL_ENV) {
            println!("cargo:rerun-if-changed={relative}");
            println!("cargo:rustc-env={LOG_LEVEL_ENV}={value}");
            return;
        }
    }
}

fn read_env_key_from_file(path: &Path, key: &str) -> Option<String> {
    let content = fs::read_to_string(path).ok()?;
    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let (name, value) = line.split_once('=')?;
        if name.trim() != key {
            continue;
        }
        let value = value.trim().trim_matches('"').trim_matches('\'').to_string();
        if value.is_empty() {
            return None;
        }
        return Some(value);
    }
    None
}
