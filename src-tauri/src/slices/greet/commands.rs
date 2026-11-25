use crate::slices::logging::{HostLogger, HOST_TARGET};

#[tauri::command]
pub fn greet(name: &str) -> String {
    // Log length only — avoid putting caller-provided names into durable logs.
    HostLogger::debug(HOST_TARGET, &format!("greet invoked (name_len={})", name.len()));
    format!("Hello, {name}! You've been greeted from Rust!")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greet_returns_host_message_and_logs_without_panic() {
        let message = greet("Ada");
        assert_eq!(message, "Hello, Ada! You've been greeted from Rust!");
        assert!(greet("").contains("Hello, !"));
    }
}
