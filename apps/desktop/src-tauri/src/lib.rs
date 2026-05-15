// Ater - Tauri Application Core
// Manages plugin registration and application lifecycle.

use std::net::TcpListener;
use tauri::{Manager, State};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

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
async fn export_logs(app: tauri::AppHandle) -> Result<String, String> {
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
            let config = argon2::Config {
                variant: argon2::Variant::Argon2id,
                version: argon2::Version::Version13,
                mem_cost: 65536,
                time_cost: 1,
                lanes: 4,
                thread_mode: argon2::ThreadMode::Parallel,
                secret: &[],
                ad: &[],
                hash_length: 32,
            };
            argon2::hash_raw(password.as_bytes(), b"ater_secure_salt_v1", &config).expect("failed to hash password")
        }).build())
        .setup(|app| {
            let port = get_available_port(8765).unwrap_or(8765);
            app.manage(SidecarConfig { port });

            let sidecar_command = app.shell().sidecar("ater-api")
                .expect("failed to create sidecar command")
                .args(&["--port", &port.to_string()]);

            let (mut _rx, _child) = sidecar_command.spawn()
                .expect("failed to spawn sidecar");

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
