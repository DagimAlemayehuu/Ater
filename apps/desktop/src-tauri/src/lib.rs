// Ater - Tauri Application Core
// Manages plugin registration and application lifecycle.

use std::net::TcpListener;
use tauri::{Manager, State};
use tauri_plugin_shell::ShellExt;
use sha2::Digest;

pub struct SidecarConfig {
    pub port: u16,
}

#[tauri::command]
fn get_sidecar_port(state: State<'_, SidecarConfig>) -> u16 {
    state.port
}

fn get_available_port(start_port: u16) -> Option<u16> {
    (start_port..9000).find(|port| TcpListener::bind(("127.0.0.1", *port)).is_ok())
}

#[tauri::command]
async fn export_logs(_app: tauri::AppHandle) -> Result<String, String> {
    let log_dir = dirs::home_dir()
        .ok_or_else(|| "Could not find home directory".to_string())?
        .join(".ater")
        .join("logs");

    if !log_dir.exists() {
        return Err("No logs found".to_string());
    }

    let zip_path = std::env::temp_dir().join("ater_logs.zip");
    
    // Simple zip command using system zip on macOS/Linux
    let status = std::process::Command::new("zip")
        .arg("-r")
        .arg(&zip_path)
        .arg(".")
        .current_dir(&log_dir)
        .status()
        .map_err(|e| format!("Failed to run zip: {}", e))?;

    if !status.success() {
        return Err("Zip command failed".to_string());
    }

    Ok(zip_path.to_string_lossy().to_string())
}

#[tauri::command]
fn get_machine_id() -> Result<String, String> {
    let id = machine_uid::get().map_err(|e| e.to_string())?;
    let mut hasher = sha2::Sha256::new();
    hasher.update(id.as_bytes());
    let result = hasher.finalize();
    Ok(format!("{:x}", result))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_stronghold::Builder::new(|password| {
            use argon2::{Argon2, Algorithm, Version, Params};
            let salt = b"ater_secure_salt"; // 16 bytes
            let mut hash = [0u8; 32];
            let argon2 = Argon2::new(
                Algorithm::Argon2id,
                Version::V0x13,
                Params::new(65536, 1, 4, Some(32)).unwrap(),
            );
            argon2.hash_password_into(password.as_bytes(), salt, &mut hash).expect("failed to hash password");
            hash.to_vec()
        }).build())
        .setup(|app| {
            let mut port = 8765;
            let mut should_spawn = true;

            // In debug mode, if 8765 is already in use, we assume an external 
            // sidecar (like the one from `pnpm run sidecar:dev`) is running.
            if cfg!(debug_assertions) {
                if TcpListener::bind(("127.0.0.1", 8765)).is_err() {
                    should_spawn = false;
                    port = 8765;
                }
            }

            if should_spawn {
                port = get_available_port(8765).unwrap_or(8765);
                let sidecar_command = app.shell().sidecar("ater-api")
                    .expect("failed to create sidecar command")
                    .args(&["--port", &port.to_string()]);

                let (mut _rx, _child) = sidecar_command.spawn()
                    .expect("failed to spawn sidecar");
            }

            app.manage(SidecarConfig { port });

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_sidecar_port, export_logs, get_machine_id])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
