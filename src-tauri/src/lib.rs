mod slices;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            slices::logging::configure_log_builder(tauri_plugin_log::Builder::new()).build(),
        )
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
