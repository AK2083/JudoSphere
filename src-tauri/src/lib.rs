mod slices;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let db = slices::database::open(app.handle())?;
            app.manage(db);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            slices::greet::commands::greet,
            slices::database::commands::get_app_value,
            slices::database::commands::set_app_value,
            slices::database::commands::delete_app_value,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
