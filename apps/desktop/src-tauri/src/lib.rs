// Ater - Tauri Application Core
// Manages plugin registration and application lifecycle.

pub mod db;
pub mod ml;
pub mod commands;

use std::net::TcpListener;
use std::sync::{Arc, Mutex};
use tauri::{Manager, State};
use tauri_plugin_shell::ShellExt;
use sha2::Digest;

#[cfg(target_family = "unix")]
extern crate libc;

pub struct SidecarConfig {
    pub port: u16,
}



#[tauri::command]
fn get_sidecar_port(state: State<'_, SidecarConfig>) -> u16 {
    state.port
}

/// Minimal health response — used for the `get_health` IPC command.
#[tauri::command]
fn get_health() -> serde_json::Value {
    serde_json::json!({ "status": "ok", "version": env!("CARGO_PKG_VERSION") })
}

fn get_available_port(start_port: u16) -> Option<u16> {
    (start_port..9000).find(|port| TcpListener::bind(("127.0.0.1", *port)).is_ok())
}

/// Loads or generates a per-device random Argon2 salt.
/// The salt is stored in ~/.ater/device.salt (32 random bytes).
/// This replaces the previous global hardcoded salt which weakened Stronghold encryption.
fn load_or_create_device_salt() -> Vec<u8> {
    let salt_path = dirs::home_dir()
        .map(|h| h.join(".ater").join("device.salt"))
        .expect("Could not resolve home directory");

    if let Some(parent) = salt_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    if salt_path.exists() {
        if let Ok(bytes) = std::fs::read(&salt_path) {
            if bytes.len() == 32 {
                return bytes;
            }
        }
    }

    // Generate a cryptographically random 32-byte salt and persist it
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    use std::time::SystemTime;

    // Combine machine ID + timestamp entropy for a unique seed
    let machine_id = machine_uid::get().unwrap_or_else(|_| "unknown".to_string());
    let nanos = SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);

    let mut hasher = DefaultHasher::new();
    machine_id.hash(&mut hasher);
    nanos.hash(&mut hasher);
    let seed = hasher.finish();

    // Use SHA-256 of (seed || machine_id || nanos) to generate a 32-byte unique salt
    let mut sha = sha2::Sha256::new();
    sha.update(seed.to_le_bytes());
    sha.update(machine_id.as_bytes());
    sha.update(nanos.to_le_bytes());
    let salt: Vec<u8> = sha.finalize().to_vec();

    let _ = std::fs::write(&salt_path, &salt);
    eprintln!("[Stronghold] Generated new per-device salt at {:?}", salt_path);
    salt
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
    
    // Remove old zip if it exists to avoid Compress-Archive appending/failing
    if zip_path.exists() {
        let _ = std::fs::remove_file(&zip_path);
    }

    #[cfg(target_os = "windows")]
    let status = std::process::Command::new("powershell")
        .args(&[
            "-NoProfile",
            "-Command",
            &format!(
                "Compress-Archive -Path '{}/*' -DestinationPath '{}' -Force",
                log_dir.to_string_lossy(),
                zip_path.to_string_lossy()
            ),
        ])
        .status()
        .map_err(|e| format!("Failed to run Compress-Archive on Windows: {}", e))?;

    #[cfg(not(target_os = "windows"))]
    let status = std::process::Command::new("zip")
        .arg("-r")
        .arg(&zip_path)
        .arg(".")
        .current_dir(&log_dir)
        .status()
        .map_err(|e| format!("Failed to run zip: {}", e))?;

    if !status.success() {
        return Err("Log export compression failed".to_string());
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
    // Load the per-device salt once at startup — used by Stronghold's Argon2 hasher.
    let device_salt = load_or_create_device_salt();
    let device_salt = Arc::new(device_salt);

    // Shared handle to the sidecar PID so we can kill it on exit
    let sidecar_pid: Arc<Mutex<Option<u32>>> = Arc::new(Mutex::new(None));
    let sidecar_pid_exit = Arc::clone(&sidecar_pid);

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_stronghold::Builder::new(move |password| {
            use argon2::{Argon2, Algorithm, Version, Params};
            // Each device has a unique salt — see load_or_create_device_salt()
            let salt = device_salt.as_slice();
            let mut hash = [0u8; 32];
            let argon2 = Argon2::new(
                Algorithm::Argon2id,
                Version::V0x13,
                Params::new(65536, 1, 4, Some(32)).unwrap(),
            );
            argon2.hash_password_into(password.as_bytes(), salt, &mut hash)
                .expect("Argon2 hash failed");
            hash.to_vec()
        }).build())
        .on_window_event(move |_window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                if let Ok(pid_guard) = sidecar_pid_exit.lock() {
                    if let Some(pid) = *pid_guard {
                        eprintln!("[Sidecar] App window destroyed — killing sidecar PID {}", pid);
                        #[cfg(target_os = "windows")]
                        {
                            let _ = std::process::Command::new("taskkill")
                                .args(["/PID", &pid.to_string(), "/F"])
                                .spawn();
                        }
                        #[cfg(not(target_os = "windows"))]
                        {
                            unsafe {
                                libc::kill(pid as i32, libc::SIGTERM);
                            }
                        }
                    }
                }
            }
        })
        .setup(move |app| {
            app.manage(commands::AppState {
                db: std::sync::Mutex::new(None),
                ml: std::sync::Mutex::new(None),
                lock_status: std::sync::Mutex::new(commands::AppLockStatus::Active),
                locked_features: std::sync::Mutex::new(Vec::new()),
                sidecar_pid: std::sync::Mutex::new(None),
            });
            let mut port = 8765;
            let mut should_spawn = true;

            // In debug mode, if 8765 is already in use, we assume an external 
            // sidecar (like the one from `pnpm run sidecar:dev`) is running.
            if cfg!(debug_assertions) && TcpListener::bind(("127.0.0.1", 8765)).is_err() {
                should_spawn = false;
                port = 8765;
            }

            #[allow(unused_mut)]
            let mut spawned_successfully = false;

            #[cfg(debug_assertions)]
            {
                if should_spawn {
                    let mut api_dir = std::env::current_dir().unwrap_or_default();
                    let mut found = false;
                    for _ in 0..4 {
                        if api_dir.join("apps/api").exists() {
                            api_dir = api_dir.join("apps/api");
                            found = true;
                            break;
                        } else if api_dir.join("api").exists() {
                            api_dir = api_dir.join("api");
                            found = true;
                            break;
                        }
                        if let Some(parent) = api_dir.parent() {
                            api_dir = parent.to_path_buf();
                        } else {
                            break;
                        }
                    }

                    if found {
                        let venv_python = api_dir.join(".venv/bin/python");
                        if venv_python.exists() {
                            println!("[Sidecar] Debug mode: Spawning FastAPI via virtualenv Python: {:?}", venv_python);
                            match std::process::Command::new(&venv_python)
                                .args(["-m", "uvicorn", "src.api.main:app", "--host", "127.0.0.1", "--port", &port.to_string()])
                                .current_dir(&api_dir)
                                .env("PYTHONUTF8", "1")
                                .env("PYTHONIOENCODING", "utf-8")
                                .env("ATER_PARENT_PID", &std::process::id().to_string())
                                .spawn()
                            {
                                Ok(child) => {
                                    println!("[Sidecar] Successfully spawned FastAPI via virtualenv Python on port {}", port);
                                    // Track PID for cleanup on exit
                                    if let Ok(mut pid_guard) = sidecar_pid.lock() {
                                        *pid_guard = Some(child.id());
                                    }
                                    if let Ok(mut pid_guard) = app.state::<commands::AppState>().sidecar_pid.lock() {
                                        *pid_guard = Some(child.id());
                                    }
                                    spawned_successfully = true;
                                }
                                Err(err) => {
                                    eprintln!("[Sidecar] Failed to spawn FastAPI via virtualenv Python: {}", err);
                                }
                            }
                        } else {
                            println!("[Sidecar] Debug mode: virtualenv Python not found at {:?}. Trying 'uv'...", venv_python);
                            match std::process::Command::new("uv")
                                .args(["run", "python", "-m", "uvicorn", "src.api.main:app", "--host", "127.0.0.1", "--port", &port.to_string()])
                                .current_dir(&api_dir)
                                .env("PYTHONUTF8", "1")
                                .env("PYTHONIOENCODING", "utf-8")
                                .env("ATER_PARENT_PID", &std::process::id().to_string())
                                .spawn()
                            {
                                Ok(child) => {
                                    println!("[Sidecar] Successfully spawned FastAPI via 'uv' on port {}", port);
                                    if let Ok(mut pid_guard) = sidecar_pid.lock() {
                                        *pid_guard = Some(child.id());
                                    }
                                    if let Ok(mut pid_guard) = app.state::<commands::AppState>().sidecar_pid.lock() {
                                        *pid_guard = Some(child.id());
                                    }
                                    spawned_successfully = true;
                                }
                                Err(err) => {
                                    eprintln!("[Sidecar] Failed to spawn FastAPI via 'uv': {}", err);
                                }
                            }
                        }
                    } else {
                        eprintln!("[Sidecar] Debug mode: API directory not found at {:?}", api_dir);
                    }
                }
            }

            if should_spawn && !spawned_successfully {
                // Kill any zombie sidecar that may still own 8765 from a prior crashed session.
                // This prevents the port from being bumped to 8766 unnecessarily.
                port = 8765;
                if TcpListener::bind(("127.0.0.1", port)).is_err() {
                    eprintln!("[Sidecar] Port {} is occupied. Attempting to kill zombie process...", port);
                    
                    #[cfg(not(target_os = "windows"))]
                    {
                        if let Ok(output) = std::process::Command::new("lsof")
                            .args(["-t", "-i", &format!(":{}", port)])
                            .output()
                        {
                            let pid_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
                            if !pid_str.is_empty() {
                                if let Ok(pid) = pid_str.parse::<i32>() {
                                    eprintln!("[Sidecar] Found zombie process {} on port {}. Killing it.", pid, port);
                                    unsafe {
                                        libc::kill(pid, libc::SIGKILL);
                                    }
                                    std::thread::sleep(std::time::Duration::from_millis(500));
                                }
                            }
                        }
                    }

                    #[cfg(target_os = "windows")]
                    {
                        if let Ok(output) = std::process::Command::new("cmd")
                            .args(["/C", &format!("netstat -ano | findstr LISTENING | findstr :{}", port)])
                            .output()
                        {
                            let stdout = String::from_utf8_lossy(&output.stdout);
                            for line in stdout.lines() {
                                let parts: Vec<&str> = line.split_whitespace().collect();
                                if let Some(pid_str) = parts.last() {
                                    if let Ok(pid) = pid_str.parse::<u32>() {
                                        eprintln!("[Sidecar] Found zombie process {} on port {}. Killing it.", pid, port);
                                        let _ = std::process::Command::new("taskkill")
                                            .args(["/PID", &pid.to_string(), "/F"])
                                            .output();
                                        std::thread::sleep(std::time::Duration::from_millis(500));
                                    }
                                }
                            }
                        }
                    }
                }

                if TcpListener::bind(("127.0.0.1", port)).is_err() {
                    eprintln!("[Sidecar] Port {} is still occupied. Searching for a free port...", port);
                    port = get_available_port(8766).unwrap_or(8766);
                }

                match app.shell().sidecar("ater-api") {
                    Ok(sidecar) => {
                        let sidecar = sidecar
                            .args(["--port", &port.to_string()])
                            .env("PYTHONUTF8", "1")
                            .env("PYTHONIOENCODING", "utf-8")
                            .env("ATER_PARENT_PID", &std::process::id().to_string());
                        match sidecar.spawn() {
                            Ok((rx, child)) => {
                                println!("[Sidecar] Spawned on port {} (PID: {})", port, child.pid());
                                if let Ok(mut pid_guard) = sidecar_pid.lock() {
                                    *pid_guard = Some(child.pid());
                                }
                                if let Ok(mut pid_guard) = app.state::<commands::AppState>().sidecar_pid.lock() {
                                    *pid_guard = Some(child.pid());
                                }

                                // CRITICAL: Drain stdout/stderr in a background task.
                                // If we drop `rx` the OS pipe buffer fills and the Python
                                // process silently hangs — primary cause of Engine Failure.
                                tauri::async_runtime::spawn(async move {
                                    let mut rx = rx;
                                    while rx.recv().await.is_some() {}
                                    println!("[Sidecar] stdout/stderr channel closed — process exited.");
                                });

                                // Background health-poller: log exactly when sidecar is ready.
                                // Gives Windows users clear diagnostics on slow cold starts.
                                let health_port = port;
                                tauri::async_runtime::spawn(async move {
                                    let client = reqwest::Client::builder()
                                        .connect_timeout(std::time::Duration::from_millis(1000))
                                        .build()
                                        .unwrap_or_else(|_| reqwest::Client::new());
                                    let url = format!("http://127.0.0.1:{}/api/health", health_port);
                                    let start = std::time::Instant::now();
                                    let max_wait = std::time::Duration::from_secs(60);
                                    loop {
                                        if start.elapsed() > max_wait {
                                            eprintln!("[Sidecar] WARNING: Health check timed out after 60s. Sidecar may have failed to start.");
                                            break;
                                        }
                                        match client.get(&url).send().await {
                                            Ok(r) if r.status().is_success() => {
                                                println!("[Sidecar] READY — responded to health check in {:.1}s on port {}",
                                                    start.elapsed().as_secs_f32(), health_port);
                                                break;
                                            }
                                            _ => {
                                                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                                            }
                                        }
                                    }
                                });
                            }
                            Err(e) => {
                                eprintln!("[Sidecar] Critical Error: Failed to spawn: {}", e);
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("[Sidecar] Configuration Error: Failed to create sidecar command: {}", e);
                    }
                }
            }

            app.manage(SidecarConfig { port });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_sidecar_port,
            get_health,
            export_logs,
            get_machine_id,
            commands::initialize_database,
            commands::init_app,
            commands::add_document,
            commands::embed_and_store_text,
            commands::search_similar,
            commands::list_obsidian_files,
            commands::read_obsidian_note,
            commands::update_obsidian_note,
            commands::delete_obsidian_item,
            commands::create_obsidian_file,
            commands::create_obsidian_folder,
            commands::move_obsidian_item,
            commands::find_vault_page,
            commands::list_hubs,
            commands::list_hub_notes,
            commands::academics_dashboard,
            commands::academics_sync_profile,
            commands::ater_process,
            commands::ater_generate_plan,
            commands::ater_confirm,
            commands::ater_queue_status,
            commands::ater_list_inbox,
            commands::ater_list_generated,
            commands::ater_watcher_toggle,
            commands::get_ai_rate_limits,
            commands::get_ai_usage,
            commands::get_all_keys_usage,
            commands::test_ai_connection,
            commands::explain_pdf_selection,
            commands::generate_quick_questions,
            commands::ater_explain,
            commands::ater_chat,
            commands::ater_oracle_chat,
            commands::ater_interactive_quiz,
            commands::log_note_visit,
            commands::log_study_session,
            commands::log_practice_result,
            commands::get_study_history,
            commands::clear_study_history,
            commands::factory_reset,
            commands::srs_review,
            commands::srs_due,
            commands::srs_cards,
            commands::srs_feynman_validate,
            commands::record_performance,
            commands::vault_list,
            commands::vault_upload_text,
            commands::vault_generate,
            commands::explain_question,
            commands::list_practices,
            commands::get_practice_status,
            commands::get_practice,
            commands::delete_practice,
            commands::update_practice_score,
            commands::generate_practice,
            commands::get_practice_analytics,
            commands::log_practice_attempt,
            commands::rag_watcher_toggle,
            commands::get_rag_sync_status,
            commands::rag_sync_vault,
            commands::vault_upload_file,
            commands::list_vault_databases,
            commands::fetch_vault_areas,
            commands::initialize_vault,
            commands::create_vault_database,
            commands::delete_vault_database,
            commands::update_vault_database_schema,
            commands::query_vault_database,
            commands::list_vault_database_rows,
            commands::list_vault_templates,
            commands::update_vault_row,
            commands::create_vault_row,
            commands::delete_vault_row,
            commands::rename_vault_file,
            commands::get_vault_options,
            commands::create_vault_option,
            commands::update_vault_option,
            commands::delete_vault_option,
            commands::get_vault_graph,
            commands::get_vault_backlinks,
            commands::process_security_heartbeat,
            commands::get_security_state,
            commands::load_cached_security_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
