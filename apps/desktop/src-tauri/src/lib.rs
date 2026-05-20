// Ater - Tauri Application Core
// Manages plugin registration and application lifecycle.

pub mod db;
pub mod ml;
pub mod commands;

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
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
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
                                Ok(_child) => {
                                    println!("[Sidecar] Successfully spawned FastAPI via virtualenv Python on port {}", port);
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
                                Ok(_child) => {
                                    println!("[Sidecar] Successfully spawned FastAPI via 'uv' on port {}", port);
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
                port = get_available_port(8765).unwrap_or(8765);
                match app.shell().sidecar("ater-api") {
                    Ok(sidecar) => {
                        let sidecar = sidecar
                            .args(["--port", &port.to_string()])
                            .env("PYTHONUTF8", "1")
                            .env("PYTHONIOENCODING", "utf-8")
                            .env("ATER_PARENT_PID", &std::process::id().to_string());
                        match sidecar.spawn() {
                            Ok((rx, _child)) => {
                                println!("[Sidecar] Successfully spawned on port {}", port);
                                // CRITICAL: Drain stdout/stderr in a background task.
                                // If we drop `rx` immediately, the OS pipe buffer (~64KB) fills
                                // up and the Python process silently hangs when writing logs.
                                // This was the primary cause of Engine Failure on first launch.
                                tauri::async_runtime::spawn(async move {
                                    let mut rx = rx;
                                    while rx.recv().await.is_some() {
                                        // Intentionally discard — just keep the pipe drained.
                                    }
                                    println!("[Sidecar] stdout/stderr channel closed — process exited.");
                                });
                                // Note: `_child` is dropped here intentionally.
                                // tauri-plugin-shell does NOT kill the child on drop;
                                // the OS process keeps running until Tauri quits.
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
            app.manage(commands::AppState {
                db: std::sync::Mutex::new(None),
                ml: std::sync::Mutex::new(None),
            });

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_sidecar_port,
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
            commands::ater_interactive_quiz,
            commands::log_note_visit,
            commands::log_study_session,
            commands::log_practice_result,
            commands::get_study_history,
            commands::clear_study_history,
            commands::factory_reset,
            commands::srs_review,
            commands::srs_due,
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
            commands::get_vault_backlinks
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
