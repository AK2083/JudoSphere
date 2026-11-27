mod slices;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(slices::logging::configure_log_builder(tauri_plugin_log::Builder::new()).build())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db = slices::database::open(app.handle())?;
            app.manage(db);
            slices::logging::HostLogger::info(
                slices::logging::HOST_TARGET,
                "host started (database ready)",
            );
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            slices::greet::commands::greet,
            slices::database::commands::get_app_value,
            slices::database::commands::set_app_value,
            slices::database::commands::delete_app_value,
            slices::logging::commands::forward_ui_log,
            slices::logging::commands::sanitize_log_extract,
            slices::error_report::commands::insert_error_event,
            slices::error_report::commands::get_error_event,
            slices::error_report::commands::list_error_events_by_fingerprint,
            slices::error_report::commands::upsert_fingerprint_gate,
            slices::error_report::commands::bump_fingerprint_occurrence,
            slices::error_report::commands::get_fingerprint_gate,
            slices::error_report::commands::upsert_known_fingerprint,
            slices::error_report::commands::get_known_fingerprint,
            slices::error_report::commands::upsert_feedback_draft,
            slices::error_report::commands::get_feedback_draft,
            slices::error_report::commands::list_feedback_drafts_by_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
