// Life OS - Tauri Application Core
// Manages plugin registration and application lifecycle.

#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();
    
    // Register plugins on the builder
    builder = builder
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build());

    // Add logging in debug mode
    #[cfg(debug_assertions)]
    {
        println!("[Life OS] Debug mode active. Initializing plugins...");
        builder = builder.plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        );
    }

    builder
        .setup(|_app| {
            println!("[Life OS] Application setup complete.");
            
            // Spawn the sidecar in production
            #[cfg(not(debug_assertions))]
            {
                let handle = _app.handle();
                let sidecar = handle.shell().sidecar("life-os-api")
                    .expect("failed to create sidecar");
                
                let (_rx, _tx) = sidecar.spawn()
                    .expect("failed to spawn sidecar");
                
                println!("[Life OS] Production Sidecar Spawned.");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
