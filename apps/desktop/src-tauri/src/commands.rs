use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{State, Manager};
use tauri::path::BaseDirectory;
use crate::db::{VectorDB, SearchResult, VectorDocument};
use crate::ml::ModelEngine;

pub struct AppState {
    pub db: Mutex<Option<VectorDB>>,
    pub ml: Mutex<Option<ModelEngine>>,
}

fn find_model_dir(app_handle: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    if let Ok(res_path) = app_handle.path().resolve("onnx_model", BaseDirectory::Resource) {
        if res_path.exists() {
            return Ok(res_path);
        }
    }

    if let Ok(res_dir) = app_handle.path().resource_dir() {
        let path = res_dir.join("onnx_model");
        if path.exists() {
            return Ok(path);
        }
        // Fallback: check if the files exist directly in the resource root (flattened packaging)
        if res_dir.join("model.onnx").exists() && res_dir.join("tokenizer.json").exists() {
            return Ok(res_dir);
        }
    }

    Err("Could not locate onnx_model directory containing model.onnx and tokenizer.json".to_string())
}

#[tauri::command]
pub async fn initialize_database(
    state: State<'_, AppState>,
    db_path: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // 1. Determine persist directory
    let persist_dir = if db_path.trim().is_empty() {
        app_handle.path().app_data_dir()
            .map_err(|e| format!("Could not find app data directory: {}", e))?
            .join("vector_store")
    } else {
        std::path::PathBuf::from(db_path).join(".ater").join("vector_store")
    };

    if let Some(parent) = persist_dir.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create database parent directories: {}", e))?;
    }
    std::fs::create_dir_all(&persist_dir)
        .map_err(|e| format!("Failed to create database directory: {}", e))?;

    // 2. Initialize LanceDB database
    let db = VectorDB::init(&persist_dir).await?;

    // 3. Find the ONNX model directory
    let model_dir = find_model_dir(&app_handle)?;

    // 4. Initialize ModelEngine
    let ml = ModelEngine::init(&model_dir)?;

    // 5. Store in state
    let mut db_guard = state.db.lock().map_err(|e| format!("Failed to lock DB state: {}", e))?;
    *db_guard = Some(db);

    let mut ml_guard = state.ml.lock().map_err(|e| format!("Failed to lock ML state: {}", e))?;
    *ml_guard = Some(ml);

    println!("[Tauri Native RAG] Successfully initialized LanceDB at {:?}", persist_dir);
    println!("[Tauri Native RAG] Successfully initialized ModelEngine from {:?}", model_dir);

    Ok(())
}

#[tauri::command]
pub async fn init_app(
    state: State<'_, AppState>,
    db_path: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    initialize_database(state, db_path, app_handle).await
}

#[tauri::command]
pub async fn add_document(
    state: State<'_, AppState>,
    content: String,
    metadata: HashMap<String, String>,
) -> Result<(), String> {
    // 1. Generate the embedding vector inside a short-lived block to drop the mutex guard before awaits
    let vector = {
        let mut ml_guard = state.ml.lock().map_err(|e| format!("Failed to lock ML engine: {}", e))?;
        let ml = ml_guard.as_mut().ok_or_else(|| "ML Engine not initialized. Call initialize_database first.".to_string())?;
        ml.get_embedding(&content).map_err(|e| format!("Failed to generate embedding: {}", e))?
    };

    // 2. Extract database by cloning the thread-safe instance in a short-lived block
    let db = {
        let db_guard = state.db.lock().map_err(|e| format!("Failed to lock Database: {}", e))?;
        db_guard.clone().ok_or_else(|| "Database not initialized. Call initialize_database first.".to_string())?
    };

    let id = metadata.get("id").cloned().unwrap_or_else(|| {
        use sha2::Digest;
        let mut hasher = sha2::Sha256::new();
        hasher.update(content.as_bytes());
        format!("{:x}", hasher.finalize())
    });
    let source = metadata.get("source").cloned().unwrap_or_default();
    let filename = metadata.get("filename").cloned().unwrap_or_default();
    let folder = metadata.get("folder").cloned().unwrap_or_default();
    let metadata_json = serde_json::to_string(&metadata).unwrap_or_default();

    // Delete existing documents for the same source to avoid duplication during sync
    if !source.is_empty() {
        let escaped_source = source.replace('\'', "''");
        let _ = db.delete_documents(&format!("source = '{}'", escaped_source)).await;
    }

    let doc = VectorDocument {
        id,
        content,
        source,
        filename,
        folder,
        metadata: metadata_json,
        vector,
    };

    db.add_documents(vec![doc]).await
        .map_err(|e| format!("Failed to add document to database: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn embed_and_store_text(
    state: State<'_, AppState>,
    content: String,
    metadata: HashMap<String, String>,
) -> Result<(), String> {
    add_document(state, content, metadata).await
}

#[tauri::command]
pub async fn search_similar(
    state: State<'_, AppState>,
    query: String,
    limit: usize,
) -> Result<Vec<SearchResult>, String> {
    // 1. Generate the query embedding vector inside a short-lived block
    let query_vector = {
        let mut ml_guard = state.ml.lock().map_err(|e| format!("Failed to lock ML engine: {}", e))?;
        let ml = ml_guard.as_mut().ok_or_else(|| "ML Engine not initialized. Call initialize_database first.".to_string())?;
        ml.get_embedding(&query).map_err(|e| format!("Failed to generate query embedding: {}", e))?
    };

    // 2. Extract database by cloning the thread-safe instance in a short-lived block
    let db = {
        let db_guard = state.db.lock().map_err(|e| format!("Failed to lock Database: {}", e))?;
        db_guard.clone().ok_or_else(|| "Database not initialized. Call initialize_database first.".to_string())?
    };

    db.query(query_vector, limit, None).await
        .map_err(|e| format!("Database query failed: {}", e))
}

// --- Added Native Vault & Sidecar Proxy Commands ---

use std::path::PathBuf;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ObsidianFileRust {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub modified: Option<String>,
    pub size: Option<u64>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct AppConfig {
    #[serde(rename = "obsidianVaultPath")]
    pub obsidian_vault_path: Option<String>,
    #[serde(rename = "inboxPath")]
    pub inbox_path: Option<String>,
    #[serde(rename = "aiProvider")]
    pub ai_provider: Option<String>,
    #[serde(rename = "aiModel")]
    pub ai_model: Option<String>,
    #[serde(rename = "aiBaseUrl")]
    pub ai_base_url: Option<String>,
    #[serde(rename = "aiMaxTpm")]
    pub ai_max_tpm: Option<u32>,
    #[serde(rename = "aiMaxRpm")]
    pub ai_max_rpm: Option<u32>,
    #[serde(rename = "aiMaxTpd")]
    pub ai_max_tpd: Option<u32>,
    #[serde(rename = "aiMaxRpd")]
    pub ai_max_rpd: Option<u32>,
    #[serde(rename = "aiMaxConcurrency")]
    pub ai_max_concurrency: Option<u32>,
    #[serde(rename = "aiApiKey")]
    pub ai_api_key: Option<String>,
    #[serde(rename = "autoDeploy")]
    pub auto_deploy: Option<bool>,
    #[serde(rename = "academicFolderPath")]
    pub academic_folder_path: Option<String>,
}

fn load_app_config(app_handle: &tauri::AppHandle) -> Result<AppConfig, String> {
    let config_path = app_handle.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?
        .join("ater_config.json");
    
    if !config_path.exists() {
        return Ok(AppConfig::default());
    }
    
    let content = std::fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config file: {}", e))?;
    
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config JSON: {}", e))
}

fn heal_vault_structure(vault_root: &std::path::Path) {
    let main_folders = vec!["Inbox", "Notes", "database"];
    for f in main_folders {
        let _ = std::fs::create_dir_all(vault_root.join(f));
    }
    
    // Core database folders
    let db_folders = vec![
        "database/assignments",
        "database/exams",
        "database/study planner",
        "database/courses",
        "database/semesters",
        "database/years",
        // Nested Select property subfolders
        "database/courses/status",
        "database/courses/difficulty",
        "database/courses/grade",
        "database/courses/professor",
        "database/semesters/status",
        "database/years/status",
        "database/years/academic level",
        "database/assignments/status",
        "database/assignments/priority",
        "database/assignments/type",
        "database/exams/type",
        "database/study planner/status",
        "database/study planner/confidence",
        "database/study planner/type"
    ];
    for f in db_folders {
        let _ = std::fs::create_dir_all(vault_root.join(f));
    }
    
    // Create default property md files
    let default_files = vec![
        ("database/courses/status/Planned.md", "---\ntitle: Planned\n---\n# Planned"),
        ("database/courses/status/In Progress.md", "---\ntitle: In Progress\n---\n# In Progress"),
        ("database/courses/status/Completed.md", "---\ntitle: Completed\n---\n# Completed"),
        ("database/courses/difficulty/Easy.md", "---\ntitle: Easy\n---\n# Easy"),
        ("database/courses/difficulty/Medium.md", "---\ntitle: Medium\n---\n# Medium"),
        ("database/courses/difficulty/Hard.md", "---\ntitle: Hard\n---\n# Hard"),
        ("database/courses/difficulty/Expert.md", "---\ntitle: Expert\n---\n# Expert"),
        ("database/courses/grade/A.md", "---\ntitle: A\n---\n# A"),
        ("database/courses/grade/B.md", "---\ntitle: B\n---\n# B"),
        ("database/courses/grade/C.md", "---\ntitle: C\n---\n# C"),
        ("database/courses/grade/D.md", "---\ntitle: D\n---\n# D"),
        ("database/courses/grade/F.md", "---\ntitle: F\n---\n# F"),
        ("database/courses/grade/P.md", "---\ntitle: P\n---\n# P"),
        
        ("database/semesters/status/Planned.md", "---\ntitle: Planned\n---\n# Planned"),
        ("database/semesters/status/Active.md", "---\ntitle: Active\n---\n# Active"),
        ("database/semesters/status/Completed.md", "---\ntitle: Completed\n---\n# Completed"),
        
        ("database/years/status/Active.md", "---\ntitle: Active\n---\n# Active"),
        ("database/years/status/Completed.md", "---\ntitle: Completed\n---\n# Completed"),
        ("database/years/status/Future.md", "---\ntitle: Future\n---\n# Future"),
        ("database/years/academic level/Undergraduate.md", "---\ntitle: Undergraduate\n---\n# Undergraduate"),
        ("database/years/academic level/Graduate.md", "---\ntitle: Graduate\n---\n# Graduate"),
        ("database/years/academic level/PhD.md", "---\ntitle: PhD\n---\n# PhD"),
        
        ("database/assignments/status/Planned.md", "---\ntitle: Planned\n---\n# Planned"),
        ("database/assignments/status/In Progress.md", "---\ntitle: In Progress\n---\n# In Progress"),
        ("database/assignments/status/Completed.md", "---\ntitle: Completed\n---\n# Completed"),
        ("database/assignments/priority/Low.md", "---\ntitle: Low\n---\n# Low"),
        ("database/assignments/priority/Medium.md", "---\ntitle: Medium\n---\n# Medium"),
        ("database/assignments/priority/High.md", "---\ntitle: High\n---\n# High"),
        ("database/assignments/type/Homework.md", "---\ntitle: Homework\n---\n# Homework"),
        ("database/assignments/type/Project.md", "---\ntitle: Project\n---\n# Project"),
        ("database/assignments/type/Reading.md", "---\ntitle: Reading\n---\n# Reading"),
        ("database/assignments/type/Lab.md", "---\ntitle: Lab\n---\n# Lab"),
        
        ("database/exams/type/Midterm.md", "---\ntitle: Midterm\n---\n# Midterm"),
        ("database/exams/type/Final.md", "---\ntitle: Final\n---\n# Final"),
        ("database/exams/type/Quiz.md", "---\ntitle: Quiz\n---\n# Quiz"),
        ("database/exams/type/Assignment.md", "---\ntitle: Assignment\n---\n# Assignment"),
        
        ("database/study planner/status/Not Started.md", "---\ntitle: Not Started\n---\n# Not Started"),
        ("database/study planner/status/Planned.md", "---\ntitle: Planned\n---\n# Planned"),
        ("database/study planner/status/In Progress.md", "---\ntitle: In Progress\n---\n# In Progress"),
        ("database/study planner/status/Reviewing.md", "---\ntitle: Reviewing\n---\n# Reviewing"),
        ("database/study planner/status/Completed.md", "---\ntitle: Completed\n---\n# Completed"),
        ("database/study planner/confidence/Low.md", "---\ntitle: Low\n---\n# Low"),
        ("database/study planner/confidence/Medium.md", "---\ntitle: Medium\n---\n# Medium"),
        ("database/study planner/confidence/High.md", "---\ntitle: High\n---\n# High"),
        ("database/study planner/type/Hub.md", "---\ntitle: Hub\n---\n# Hub"),
        ("database/study planner/type/Atomic.md", "---\ntitle: Atomic\n---\n# Atomic"),
        ("database/study planner/type/Possible Questions.md", "---\ntitle: Possible Questions\n---\n# Possible Questions"),
    ];
    for (path_str, content) in default_files {
        let p = vault_root.join(path_str);
        if !p.exists() {
            let _ = std::fs::write(&p, content);
        }
    }
}

fn get_vault_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let config = load_app_config(app_handle)?;
    let p = config.obsidian_vault_path
        .ok_or_else(|| "Obsidian Vault Path is not configured. Please open settings and configure it.".to_string())?;
    let path = PathBuf::from(p);
    if !path.exists() {
        return Err(format!("Obsidian Vault Path does not exist on disk: {:?}", path));
    }
    
    // HEAL VAULT DYNAMICALLY & INSTANTLY
    heal_vault_structure(&path);
    
    Ok(path)
}

fn resolve_path_robust(path_str: &str, app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let path = PathBuf::from(path_str);
    
    // 1. If it already exists or is absolute, use it directly!
    if path.exists() || path.is_absolute() {
        return Ok(path);
    }
    
    // 2. Check Windows absolute path starting with drive letter (e.g. C:\...)
    let chars: Vec<char> = path_str.chars().collect();
    if chars.len() > 1 && chars[1] == ':' && chars[0].is_alphabetic() {
        return Ok(path);
    }
    
    // 3. Check if it's Unix absolute path with the leading slash stripped
    #[cfg(not(target_os = "windows"))]
    {
        let potential_abs = PathBuf::from("/").join(path_str);
        if potential_abs.exists() {
            return Ok(potential_abs);
        }
    }
    
    // 4. Fallback to vault path
    let vault_path = get_vault_path(app_handle)?;
    Ok(vault_path.join(path_str))
}

fn get_proxy_headers(config: &AppConfig) -> reqwest::header::HeaderMap {
    use reqwest::header::{HeaderMap, HeaderValue};
    let mut headers = HeaderMap::new();
    
    if let Some(ref val) = config.ai_provider {
        if let Ok(h_val) = HeaderValue::from_str(val) {
            headers.insert("X-AI-Provider", h_val);
        }
    }
    if let Some(ref val) = config.ai_api_key {
        if let Ok(h_val) = HeaderValue::from_str(val) {
            headers.insert("X-AI-Key", h_val);
        }
    }
    if let Some(ref val) = config.ai_model {
        if let Ok(h_val) = HeaderValue::from_str(val) {
            headers.insert("X-AI-Model", h_val);
        }
    }
    if let Some(ref val) = config.ai_base_url {
        if !val.trim().is_empty() {
            if let Ok(h_val) = HeaderValue::from_str(val) {
                headers.insert("X-AI-Base-Url", h_val);
            }
        }
    }
    if let Some(val) = config.ai_max_tpm {
        if let Ok(h_val) = HeaderValue::from_str(&val.to_string()) {
            headers.insert("X-AI-Max-TPM", h_val);
        }
    }
    if let Some(val) = config.ai_max_rpm {
        if let Ok(h_val) = HeaderValue::from_str(&val.to_string()) {
            headers.insert("X-AI-Max-RPM", h_val);
        }
    }
    if let Some(val) = config.ai_max_tpd {
        if let Ok(h_val) = HeaderValue::from_str(&val.to_string()) {
            headers.insert("X-AI-Max-TPD", h_val);
        }
    }
    if let Some(val) = config.ai_max_rpd {
        if let Ok(h_val) = HeaderValue::from_str(&val.to_string()) {
            headers.insert("X-AI-Max-RPD", h_val);
        }
    }
    if let Some(val) = config.ai_max_concurrency {
        if let Ok(h_val) = HeaderValue::from_str(&val.to_string()) {
            headers.insert("X-AI-Max-Concurrency", h_val);
        }
    }
    if let Some(ref val) = config.obsidian_vault_path {
        if let Ok(h_val) = HeaderValue::from_str(val) {
            headers.insert("X-Vault-Path", h_val);
        }
    }
    if let Some(ref val) = config.inbox_path {
        if let Ok(h_val) = HeaderValue::from_str(val) {
            headers.insert("X-Inbox-Path", h_val);
        }
    }
    if let Some(ref val) = config.academic_folder_path {
        if let Ok(h_val) = HeaderValue::from_str(val) {
            headers.insert("X-Academic-Path", h_val);
        }
    }
    if let Some(val) = config.auto_deploy {
        if let Ok(h_val) = HeaderValue::from_str(&val.to_string()) {
            headers.insert("X-Auto-Deploy", h_val);
        }
    }
    headers
}

async fn proxy_post<T: serde::Serialize, R: serde::de::DeserializeOwned>(
    port: u16,
    path: &str,
    body: &T,
    headers: reqwest::header::HeaderMap,
) -> Result<R, String> {
    let client = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_millis(3000))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());
    let url = format!("http://127.0.0.1:{}{}", port, path);
    let mut attempt = 0;
    let max_attempts = 5;
    let mut last_err = None;

    while attempt < max_attempts {
        match client.post(&url)
            .headers(headers.clone())
            .json(body)
            .send()
            .await
        {
            Ok(res) => {
                if !res.status().is_success() {
                    let status = res.status();
                    let err_text = res.text().await.unwrap_or_default();
                    return Err(format!("Sidecar API returned error status {}: {}", status, err_text));
                }
                return res.json::<R>()
                    .await
                    .map_err(|e| format!("Failed to parse sidecar response: {}", e));
            }
            Err(e) => {
                last_err = Some(e);
                attempt += 1;
                if attempt < max_attempts {
                    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                }
            }
        }
    }

    Err(format!("Failed to send request to sidecar API (after {} attempts): {}", max_attempts, last_err.unwrap()))
}

async fn proxy_get<R: serde::de::DeserializeOwned>(
    port: u16,
    path: &str,
    headers: reqwest::header::HeaderMap,
) -> Result<R, String> {
    let client = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_millis(3000))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());
    let url = format!("http://127.0.0.1:{}{}", port, path);
    let mut attempt = 0;
    let max_attempts = 5;
    let mut last_err = None;

    while attempt < max_attempts {
        match client.get(&url)
            .headers(headers.clone())
            .send()
            .await
        {
            Ok(res) => {
                if !res.status().is_success() {
                    let status = res.status();
                    let err_text = res.text().await.unwrap_or_default();
                    return Err(format!("Sidecar API returned error status {}: {}", status, err_text));
                }
                return res.json::<R>()
                    .await
                    .map_err(|e| format!("Failed to parse sidecar response: {}", e));
            }
            Err(e) => {
                last_err = Some(e);
                attempt += 1;
                if attempt < max_attempts {
                    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                }
            }
        }
    }

    Err(format!("Failed to send request to sidecar API (after {} attempts): {}", max_attempts, last_err.unwrap()))
}

async fn proxy_patch<T: serde::Serialize, R: serde::de::DeserializeOwned>(
    port: u16,
    path: &str,
    body: &T,
    headers: reqwest::header::HeaderMap,
) -> Result<R, String> {
    let client = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_millis(3000))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());
    let url = format!("http://127.0.0.1:{}{}", port, path);
    let mut attempt = 0;
    let max_attempts = 5;
    let mut last_err = None;

    while attempt < max_attempts {
        match client.patch(&url)
            .headers(headers.clone())
            .json(body)
            .send()
            .await
        {
            Ok(res) => {
                if !res.status().is_success() {
                    let status = res.status();
                    let err_text = res.text().await.unwrap_or_default();
                    return Err(format!("Sidecar API returned error status {}: {}", status, err_text));
                }
                return res.json::<R>()
                    .await
                    .map_err(|e| format!("Failed to parse sidecar response: {}", e));
            }
            Err(e) => {
                last_err = Some(e);
                attempt += 1;
                if attempt < max_attempts {
                    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                }
            }
        }
    }

    Err(format!("Failed to send request to sidecar API (after {} attempts): {}", max_attempts, last_err.unwrap()))
}

async fn proxy_delete<R: serde::de::DeserializeOwned>(
    port: u16,
    path: &str,
    headers: reqwest::header::HeaderMap,
) -> Result<R, String> {
    let client = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_millis(3000))
        .build()
        .unwrap_or_else(|_| reqwest::Client::new());
    let url = format!("http://127.0.0.1:{}{}", port, path);
    let mut attempt = 0;
    let max_attempts = 5;
    let mut last_err = None;

    while attempt < max_attempts {
        match client.delete(&url)
            .headers(headers.clone())
            .send()
            .await
        {
            Ok(res) => {
                if !res.status().is_success() {
                    let status = res.status();
                    let err_text = res.text().await.unwrap_or_default();
                    return Err(format!("Sidecar API returned error status {}: {}", status, err_text));
                }
                return res.json::<R>()
                    .await
                    .map_err(|e| format!("Failed to parse sidecar response: {}", e));
            }
            Err(e) => {
                last_err = Some(e);
                attempt += 1;
                if attempt < max_attempts {
                    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                }
            }
        }
    }

    Err(format!("Failed to send request to sidecar API (after {} attempts): {}", max_attempts, last_err.unwrap()))
}

fn walk_dir(
    dir: &std::path::Path,
    root: &std::path::Path,
    files: &mut Vec<ObsidianFileRust>,
) -> Result<(), String> {
    if !dir.exists() {
        return Ok(());
    }
    for entry in std::fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or_default()
            .to_string();
        
        let name_lower = name.to_lowercase();
        if name.starts_with('.') 
            || name == "node_modules"
            || name_lower.contains("ater_queue")
            || name_lower.contains("ater_que")
            || name_lower.ends_with(".db")
            || name_lower.ends_with(".db-shm")
            || name_lower.ends_with(".db-wal")
            || name_lower.ends_with(".db-journal")
        {
            continue;
        }
        
        let is_dir = path.is_dir();
        let relative_path = path.strip_prefix(root)
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .to_string()
            .replace('\\', "/");
            
        let mut modified = None;
        let mut size = None;
        if let Ok(metadata) = entry.metadata() {
            if let Ok(m_time) = metadata.modified() {
                let dt: chrono::DateTime<chrono::Utc> = m_time.into();
                modified = Some(dt.to_rfc3339());
            }
            size = Some(metadata.len());
        }
        
        files.push(ObsidianFileRust {
            name,
            path: relative_path,
            is_dir,
            modified,
            size,
        });
        
        if is_dir {
            walk_dir(&path, root, files)?;
        }
    }
    Ok(())
}

fn parse_markdown_note(content: &str) -> (serde_json::Value, String) {
    if !content.starts_with("---") {
        return (serde_json::Value::Object(serde_json::Map::new()), content.to_string());
    }
    
    if let Some(second_idx) = content[3..].find("---") {
        let actual_second_idx = second_idx + 3;
        let frontmatter_str = &content[3..actual_second_idx];
        let remaining_content = &content[actual_second_idx + 3..];
        
        let mut map = serde_json::Map::new();
        let mut current_key: Option<String> = None;
        let mut current_list: Option<Vec<serde_json::Value>> = None;

        for line in frontmatter_str.lines() {
            let line_trimmed = line.trim();
            if line_trimmed.is_empty() {
                continue;
            }
            
            // Check if this is a list item in a block list
            if line_trimmed.starts_with("- ") {
                if current_key.is_some() {
                    let mut item_val = line_trimmed[2..].trim().to_string();
                    // Strip optional quotes
                    if (item_val.starts_with('"') && item_val.ends_with('"')) || 
                       (item_val.starts_with('\'') && item_val.ends_with('\'')) {
                        if item_val.len() >= 2 {
                            item_val = item_val[1..item_val.len() - 1].to_string();
                        }
                    }
                    
                    let parsed_item = if let Ok(num) = item_val.parse::<i64>() {
                        serde_json::Value::Number(num.into())
                    } else if item_val.to_lowercase() == "true" {
                        serde_json::Value::Bool(true)
                    } else if item_val.to_lowercase() == "false" {
                        serde_json::Value::Bool(false)
                    } else {
                        serde_json::Value::String(item_val)
                    };
                    
                    if let Some(ref mut list) = current_list {
                        list.push(parsed_item);
                    } else {
                        let mut new_list = Vec::new();
                        new_list.push(parsed_item);
                        current_list = Some(new_list);
                    }
                    continue;
                }
            }
            
            // If we have a pending list, insert it before moving to the next key
            if let Some(key) = current_key.take() {
                if let Some(list) = current_list.take() {
                    map.insert(key, serde_json::Value::Array(list));
                }
            }
            
            if let Some(colon_idx) = line_trimmed.find(':') {
                let key = line_trimmed[..colon_idx].trim().to_string();
                let mut value_str = line_trimmed[colon_idx + 1..].trim().to_string();
                
                // Strip optional quotes
                if (value_str.starts_with('"') && value_str.ends_with('"')) || 
                   (value_str.starts_with('\'') && value_str.ends_with('\'')) {
                    if value_str.len() >= 2 {
                        value_str = value_str[1..value_str.len() - 1].to_string();
                    }
                }
                
                if value_str.is_empty() {
                    // This could be the start of a block list
                    current_key = Some(key);
                    current_list = Some(Vec::new());
                } else if value_str.to_lowercase() == "true" {
                    map.insert(key, serde_json::Value::Bool(true));
                } else if value_str.to_lowercase() == "false" {
                    map.insert(key, serde_json::Value::Bool(false));
                } else if let Ok(num) = value_str.parse::<i64>() {
                    map.insert(key, serde_json::Value::Number(num.into()));
                } else if value_str.starts_with('[') && value_str.ends_with(']') && !(value_str.starts_with("[[") && value_str.ends_with("]]")) {
                    let items_str = &value_str[1..value_str.len() - 1];
                    let mut arr = Vec::new();
                    for item in items_str.split(',') {
                        let item_trim = item.trim();
                        if !item_trim.is_empty() {
                            let mut inner_item = item_trim.to_string();
                            if (inner_item.starts_with('"') && inner_item.ends_with('"')) || 
                               (inner_item.starts_with('\'') && inner_item.ends_with('\'')) {
                                if inner_item.len() >= 2 {
                                    inner_item = inner_item[1..inner_item.len() - 1].to_string();
                                }
                            }
                            if let Ok(num) = inner_item.parse::<i64>() {
                                arr.push(serde_json::Value::Number(num.into()));
                            } else {
                                arr.push(serde_json::Value::String(inner_item));
                            }
                        }
                    }
                    map.insert(key, serde_json::Value::Array(arr));
                } else {
                    map.insert(key, serde_json::Value::String(value_str));
                }
            }
        }
        
        // Handle any final pending list
        if let Some(key) = current_key {
            if let Some(list) = current_list {
                map.insert(key, serde_json::Value::Array(list));
            }
        }
        
        return (serde_json::Value::Object(map), remaining_content.to_string());
    }
    
    (serde_json::Value::Object(serde_json::Map::new()), content.to_string())
}

fn serialize_frontmatter(map: &serde_json::Map<String, serde_json::Value>) -> String {
    let mut out = String::new();
    out.push_str("---\n");
    for (k, v) in map {
        match v {
            serde_json::Value::Bool(b) => {
                out.push_str(&format!("{}: {}\n", k, b));
            }
            serde_json::Value::Number(num) => {
                out.push_str(&format!("{}: {}\n", k, num));
            }
            serde_json::Value::String(s) => {
                if s.starts_with("[[") && s.ends_with("]]") {
                    out.push_str(&format!("{}: \"{}\"\n", k, s));
                } else {
                    out.push_str(&format!("{}: {}\n", k, s));
                }
            }
            serde_json::Value::Array(arr) => {
                let items: Vec<String> = arr.iter().map(|item| {
                    match item {
                        serde_json::Value::Number(n) => n.to_string(),
                        serde_json::Value::Bool(b) => b.to_string(),
                        serde_json::Value::String(s) => {
                            if s.starts_with("[[") && s.ends_with("]]") {
                                format!("\"{}\"", s)
                            } else {
                                s.clone()
                            }
                        }
                        _ => item.to_string(),
                    }
                }).collect();
                out.push_str(&format!("{}: [{}]\n", k, items.join(", ")));
            }
            _ => {}
        }
    }
    out.push_str("---\n");
    out
}

#[tauri::command]
pub async fn list_obsidian_files(app_handle: tauri::AppHandle) -> Result<Vec<ObsidianFileRust>, String> {
    let vault_path = get_vault_path(&app_handle)?;
    let mut files = Vec::new();
    walk_dir(&vault_path, &vault_path, &mut files)?;
    Ok(files)
}

#[tauri::command]
pub async fn read_obsidian_note(
    path: String,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let full_path = resolve_path_robust(&path, &app_handle)?;
    
    let content = std::fs::read_to_string(&full_path)
        .map_err(|e| format!("Failed to read note {}: {}", path, e))?;
        
    let (metadata, note_content) = parse_markdown_note(&content);
    
    let mut res = serde_json::Map::new();
    res.insert("metadata".to_string(), metadata);
    res.insert("content".to_string(), serde_json::Value::String(note_content));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn update_obsidian_note(
    state: State<'_, AppState>,
    path: String,
    content: String,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let full_path = resolve_path_robust(&path, &app_handle)?;
    
    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }
    
    std::fs::write(&full_path, &content)
        .map_err(|e| format!("Failed to write note: {}", e))?;
        
    let filename = full_path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or_default()
        .to_string();
    let folder = path.rfind('/').map(|idx| path[..idx].to_string()).unwrap_or_default();
    
    let mut metadata = HashMap::new();
    metadata.insert("id".to_string(), path.clone());
    metadata.insert("source".to_string(), path.clone());
    metadata.insert("filename".to_string(), filename);
    metadata.insert("folder".to_string(), folder);
    
    let _ = add_document(state, content, metadata).await;
    
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn delete_obsidian_item(
    state: State<'_, AppState>,
    path: String,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let full_path = resolve_path_robust(&path, &app_handle)?;
    
    if full_path.is_dir() {
        std::fs::remove_dir_all(&full_path)
            .map_err(|e| format!("Failed to delete directory: {}", e))?;
    } else if full_path.is_file() {
        std::fs::remove_file(&full_path)
            .map_err(|e| format!("Failed to delete file: {}", e))?;
    }
    
    let db = {
        let db_guard = state.db.lock().map_err(|e| format!("Failed to lock Database: {}", e))?;
        db_guard.clone()
    };
    if let Some(db) = db {
        let escaped_path = path.replace('\'', "''");
        let _ = db.delete_documents(&format!("source = '{}'", escaped_path)).await;
    }
    
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn create_obsidian_file(
    state: State<'_, AppState>,
    path: String,
    content: String,
    overwrite: bool,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let full_path = resolve_path_robust(&path, &app_handle)?;
    
    if full_path.exists() && !overwrite {
        return Err("File already exists".to_string());
    }
    
    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }
    
    std::fs::write(&full_path, &content)
        .map_err(|e| format!("Failed to write note: {}", e))?;
        
    let filename = full_path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or_default()
        .to_string();
    let folder = path.rfind('/').map(|idx| path[..idx].to_string()).unwrap_or_default();
    
    let mut metadata = HashMap::new();
    metadata.insert("id".to_string(), path.clone());
    metadata.insert("source".to_string(), path.clone());
    metadata.insert("filename".to_string(), filename);
    metadata.insert("folder".to_string(), folder);
    
    let _ = add_document(state, content, metadata).await;
    
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    res.insert("path".to_string(), serde_json::Value::String(path));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn create_obsidian_folder(
    path: String,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let full_path = resolve_path_robust(&path, &app_handle)?;
    
    std::fs::create_dir_all(&full_path)
        .map_err(|e| format!("Failed to create folder: {}", e))?;
        
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    res.insert("path".to_string(), serde_json::Value::String(path));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn move_obsidian_item(
    state: State<'_, AppState>,
    old_path: String,
    new_path: String,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let old_full = resolve_path_robust(&old_path, &app_handle)?;
    let new_full = resolve_path_robust(&new_path, &app_handle)?;
    
    if let Some(parent) = new_full.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }
    
    std::fs::rename(&old_full, &new_full)
        .map_err(|e| format!("Failed to move item: {}", e))?;
        
    let db = {
        let db_guard = state.db.lock().map_err(|e| format!("Failed to lock Database: {}", e))?;
        db_guard.clone()
    };
    if let Some(db) = db {
        let escaped_old = old_path.replace('\'', "''");
        let _ = db.delete_documents(&format!("source = '{}'", escaped_old)).await;
        
        if new_full.is_file() {
            if let Ok(content) = std::fs::read_to_string(&new_full) {
                let filename = new_full.file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or_default()
                    .to_string();
                let folder = new_path.rfind('/').map(|idx| new_path[..idx].to_string()).unwrap_or_default();
                
                let mut metadata = HashMap::new();
                metadata.insert("id".to_string(), new_path.clone());
                metadata.insert("source".to_string(), new_path.clone());
                metadata.insert("filename".to_string(), filename);
                metadata.insert("folder".to_string(), folder);
                
                let _ = add_document(state, content, metadata).await;
            }
        }
    }
    
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    res.insert("old_path".to_string(), serde_json::Value::String(old_path));
    res.insert("new_path".to_string(), serde_json::Value::String(new_path));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn find_vault_page(
    page_name: String,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let vault_path = get_vault_path(&app_handle)?;
    
    // 1. Strip hash anchors if present (e.g. Chapter_Two.pdf#page=12 -> Chapter_Two.pdf)
    let clean_page_name = if page_name.contains('#') {
        page_name.split('#').next().unwrap_or(&page_name).to_string()
    } else {
        page_name
    };
    
    // 2. Normalize query: lowercase, replace spaces with underscores, normalise slashes
    let query_norm = clean_page_name
        .to_lowercase()
        .replace('\\', "/")
        .replace(' ', "_")
        .replace(".md", "")
        .replace(".pdf", "");
    
    // Extract just the filename component of the query
    let query_filename = query_norm
        .split('/')
        .last()
        .unwrap_or(&query_norm)
        .to_string();
    
    let is_pdf = clean_page_name.to_lowercase().ends_with(".pdf") || clean_page_name.to_lowercase().contains(".pdf");
    
    let mut files = Vec::new();
    walk_dir(&vault_path, &vault_path, &mut files)?;
    
    // Phase 1: Try exact relative path match first
    for f in &files {
        if !f.is_dir {
            let f_path_norm = f.path
                .to_lowercase()
                .replace('\\', "/")
                .replace(' ', "_")
                .replace(".md", "")
                .replace(".pdf", "");
            
            if f_path_norm == query_norm {
                let mut res = serde_json::Map::new();
                res.insert("found".to_string(), serde_json::Value::Bool(true));
                res.insert("path".to_string(), serde_json::Value::String(f.path.clone()));
                res.insert("file_name".to_string(), serde_json::Value::String(f.name.clone()));
                return Ok(serde_json::Value::Object(res));
            }
        }
    }
    
    // Phase 2: Try match against just the filename (exact match)
    for f in &files {
        if !f.is_dir {
            let f_name_norm = f.name
                .to_lowercase()
                .replace(' ', "_")
                .replace(".md", "")
                .replace(".pdf", "");
            
            if f_name_norm == query_filename {
                // If it's a PDF query, make sure we return a PDF file, or vice versa if possible
                let is_f_pdf = f.path.to_lowercase().ends_with(".pdf");
                if is_pdf == is_f_pdf {
                    let mut res = serde_json::Map::new();
                    res.insert("found".to_string(), serde_json::Value::Bool(true));
                    res.insert("path".to_string(), serde_json::Value::String(f.path.clone()));
                    res.insert("file_name".to_string(), serde_json::Value::String(f.name.clone()));
                    return Ok(serde_json::Value::Object(res));
                }
            }
        }
    }
    
    // Phase 3: Loose filename match as last resort (ignoring exact pdf/md type)
    for f in &files {
        if !f.is_dir {
            let f_name_norm = f.name
                .to_lowercase()
                .replace(' ', "_")
                .replace(".md", "")
                .replace(".pdf", "");
            
            if f_name_norm == query_filename {
                let mut res = serde_json::Map::new();
                res.insert("found".to_string(), serde_json::Value::Bool(true));
                res.insert("path".to_string(), serde_json::Value::String(f.path.clone()));
                res.insert("file_name".to_string(), serde_json::Value::String(f.name.clone()));
                return Ok(serde_json::Value::Object(res));
            }
        }
    }
    
    let mut res = serde_json::Map::new();
    res.insert("found".to_string(), serde_json::Value::Bool(false));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn list_hubs(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let vault_path = get_vault_path(&app_handle)?;
    let mut files = Vec::new();
    walk_dir(&vault_path, &vault_path, &mut files)?;
    
    let mut hubs = Vec::new();
    let mut seen_paths = std::collections::HashSet::new();
    for f in files {
        if !f.is_dir && f.path.ends_with(".md") {
            if !seen_paths.insert(f.path.clone()) {
                continue;
            }
            let is_hub_file = f.name.ends_with("_Hub.md");
            let full_path = vault_path.join(&f.path);
            if let Ok(content) = std::fs::read_to_string(&full_path) {
                let (meta, _) = parse_markdown_note(&content);
                let mut is_hub = is_hub_file;
                if let Some(meta_obj) = meta.as_object() {
                    if let Some(t) = meta_obj.get("type").and_then(|t| t.as_str()) {
                        if t == "hub" {
                            is_hub = true;
                        }
                    }
                }
                if is_hub {
                    let mut hub = serde_json::Map::new();
                    let id = f.path.replace(".md", "");
                    let title = meta.get("title")
                        .and_then(|t| t.as_str())
                        .map(|s| s.to_string())
                        .unwrap_or_else(|| f.name.replace("_Hub", "").replace(".md", "").replace("_", " "));
                    hub.insert("id".to_string(), serde_json::Value::String(id));
                    hub.insert("title".to_string(), serde_json::Value::String(title));
                    hub.insert("path".to_string(), serde_json::Value::String(f.path.clone()));
                    
                    if let Some(course) = meta.get("course").and_then(|c| c.as_str()) {
                        hub.insert("course".to_string(), serde_json::Value::String(course.to_string()));
                    }
                    if let Some(unit) = meta.get("unit").and_then(|u| u.as_str()) {
                        hub.insert("unit".to_string(), serde_json::Value::String(unit.to_string()));
                    }
                    if let Some(semester) = meta.get("semester").and_then(|s| s.as_str()) {
                        hub.insert("semester".to_string(), serde_json::Value::String(semester.to_string()));
                    }
                    
                    hubs.push(serde_json::Value::Object(hub));
                }
            }
        }
    }
    
    let mut res = serde_json::Map::new();
    res.insert("hubs".to_string(), serde_json::Value::Array(hubs));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn list_hub_notes(
    hub_id: String,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let vault_path = get_vault_path(&app_handle)?;
    let mut files = Vec::new();
    walk_dir(&vault_path, &vault_path, &mut files)?;
    
    // Extract only the filename stem of the hub_id to handle directory nesting consistently
    let normalized_hub_id = hub_id.replace('\\', "/");
    let hub_filename = normalized_hub_id.split('/').last().unwrap_or(&normalized_hub_id).to_string();
    let normalized_hub = hub_filename.to_lowercase().replace(' ', "_").replace("_hub", "");
    
    let mut notes = Vec::new();
    for f in files {
        if !f.is_dir && f.path.ends_with(".md") && !f.name.ends_with("_Hub.md") {
            let full_path = vault_path.join(&f.path);
            if let Ok(content) = std::fs::read_to_string(&full_path) {
                let (meta, _) = parse_markdown_note(&content);
                if let Some(meta_obj) = meta.as_object() {
                    if let Some(hub_link) = meta_obj.get("hub").and_then(|h| h.as_str()) {
                        let clean_hub = hub_link.trim_matches('[')
                            .trim_matches(']')
                            .to_lowercase()
                            .replace(' ', "_")
                            .replace("_hub", "");
                        let clean_hub_normalized = clean_hub.replace('\\', "/");
                        let clean_hub_filename = clean_hub_normalized.split('/').last().unwrap_or(&clean_hub_normalized).to_string();
                        if clean_hub_filename == normalized_hub {
                            let mut note = serde_json::Map::new();
                            note.insert("path".to_string(), serde_json::Value::String(f.path.clone()));
                            note.insert("name".to_string(), serde_json::Value::String(f.name.clone()));
                            let title = meta.get("title")
                                .cloned()
                                .unwrap_or_else(|| serde_json::Value::String(f.name.replace(".md", "").replace("_", " ")));
                            note.insert("title".to_string(), title);
                            notes.push(serde_json::Value::Object(note));
                        }
                    }
                }
            }
        }
    }
    
    let mut res = serde_json::Map::new();
    res.insert("notes".to_string(), serde_json::Value::Array(notes));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn academics_dashboard(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    if let Ok(res) = proxy_get(sidecar_config.port, "/api/academics/dashboard", headers).await {
        return Ok(res);
    }

    let vault_root = get_vault_path(&app_handle)?;
    let mut data = serde_json::Map::new();
    data.insert("semesters".to_string(), serde_json::Value::Array(Vec::new()));
    data.insert("courses".to_string(), serde_json::Value::Array(Vec::new()));
    data.insert("units".to_string(), serde_json::Value::Array(Vec::new()));
    data.insert("exams".to_string(), serde_json::Value::Array(Vec::new()));
    data.insert("assignments".to_string(), serde_json::Value::Array(Vec::new()));
    data.insert("study_sessions".to_string(), serde_json::Value::Array(Vec::new()));
    data.insert("years".to_string(), serde_json::Value::Array(Vec::new()));

    let mapping = vec![
        ("semesters", "semesters"),
        ("courses", "courses"),
        ("exams", "exams"),
        ("assignments", "assignments"),
        ("study planner", "study_sessions"),
        ("years", "years"),
    ];

    for (folder_name, key) in mapping {
        let folder_path = vault_root.join("database").join(folder_name);
        if folder_path.exists() && folder_path.is_dir() {
            let mut items = Vec::new();
            if let Ok(entries) = std::fs::read_dir(&folder_path) {
                for entry in entries.filter_map(Result::ok) {
                    let path = entry.path();
                    let file_name = path.file_name().and_then(|s| s.to_str()).unwrap_or("");
                    if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") && !file_name.starts_with('.') {
                        if let Ok(content) = std::fs::read_to_string(&path) {
                            let (frontmatter, _) = parse_markdown_note(&content);
                            if let serde_json::Value::Object(mut map) = frontmatter {
                                let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("").to_string();
                                map.insert("id".to_string(), serde_json::Value::String(stem.clone()));
                                if !map.contains_key("title") {
                                    map.insert("title".to_string(), serde_json::Value::String(stem.clone()));
                                }
                                let rel_path = path.strip_prefix(&vault_root).map(|p| p.to_string_lossy().to_string()).unwrap_or_else(|_| path.to_string_lossy().to_string());
                                map.insert("path".to_string(), serde_json::Value::String(rel_path));
                                items.push(serde_json::Value::Object(map));
                            }
                        }
                    }
                }
            }
            data.insert(key.to_string(), serde_json::Value::Array(items));
        }
    }

    Ok(serde_json::Value::Object(data))
}

#[tauri::command]
pub async fn academics_sync_profile(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let _: Result<serde_json::Value, _> = proxy_post(sidecar_config.port, "/api/academics/sync-profile", &serde_json::Value::Object(serde_json::Map::new()), headers).await;

    let vault_root = get_vault_path(&app_handle)?;
    let main_folders = vec!["Inbox", "Notes", "database"];
    for f in main_folders {
        let _ = std::fs::create_dir_all(vault_root.join(f));
    }
    
    // Core database folders
    let db_folders = vec![
        "database/assignments",
        "database/exams",
        "database/study planner",
        "database/courses",
        "database/semesters",
        "database/years",
        // Nested Select property subfolders
        "database/courses/status",
        "database/courses/difficulty",
        "database/courses/grade",
        "database/courses/professor",
        "database/semesters/status",
        "database/years/status",
        "database/years/academic level",
        "database/assignments/status",
        "database/assignments/priority",
        "database/assignments/type",
        "database/exams/type",
        "database/study planner/status",
        "database/study planner/confidence",
        "database/study planner/type"
    ];
    for f in db_folders {
        let _ = std::fs::create_dir_all(vault_root.join(f));
    }
    
    // Create default property md files
    let default_files = vec![
        ("database/courses/status/Planned.md", "---\ntitle: Planned\n---\n# Planned"),
        ("database/courses/status/In Progress.md", "---\ntitle: In Progress\n---\n# In Progress"),
        ("database/courses/status/Completed.md", "---\ntitle: Completed\n---\n# Completed"),
        ("database/courses/difficulty/Easy.md", "---\ntitle: Easy\n---\n# Easy"),
        ("database/courses/difficulty/Medium.md", "---\ntitle: Medium\n---\n# Medium"),
        ("database/courses/difficulty/Hard.md", "---\ntitle: Hard\n---\n# Hard"),
        ("database/courses/difficulty/Expert.md", "---\ntitle: Expert\n---\n# Expert"),
        ("database/courses/grade/A.md", "---\ntitle: A\n---\n# A"),
        ("database/courses/grade/B.md", "---\ntitle: B\n---\n# B"),
        ("database/courses/grade/C.md", "---\ntitle: C\n---\n# C"),
        ("database/courses/grade/D.md", "---\ntitle: D\n---\n# D"),
        ("database/courses/grade/F.md", "---\ntitle: F\n---\n# F"),
        ("database/courses/grade/P.md", "---\ntitle: P\n---\n# P"),
        
        ("database/semesters/status/Planned.md", "---\ntitle: Planned\n---\n# Planned"),
        ("database/semesters/status/Active.md", "---\ntitle: Active\n---\n# Active"),
        ("database/semesters/status/Completed.md", "---\ntitle: Completed\n---\n# Completed"),
        
        ("database/years/status/Active.md", "---\ntitle: Active\n---\n# Active"),
        ("database/years/status/Completed.md", "---\ntitle: Completed\n---\n# Completed"),
        ("database/years/status/Future.md", "---\ntitle: Future\n---\n# Future"),
        ("database/years/academic level/Undergraduate.md", "---\ntitle: Undergraduate\n---\n# Undergraduate"),
        ("database/years/academic level/Graduate.md", "---\ntitle: Graduate\n---\n# Graduate"),
        ("database/years/academic level/PhD.md", "---\ntitle: PhD\n---\n# PhD"),
        
        ("database/assignments/status/Planned.md", "---\ntitle: Planned\n---\n# Planned"),
        ("database/assignments/status/In Progress.md", "---\ntitle: In Progress\n---\n# In Progress"),
        ("database/assignments/status/Completed.md", "---\ntitle: Completed\n---\n# Completed"),
        ("database/assignments/priority/Low.md", "---\ntitle: Low\n---\n# Low"),
        ("database/assignments/priority/Medium.md", "---\ntitle: Medium\n---\n# Medium"),
        ("database/assignments/priority/High.md", "---\ntitle: High\n---\n# High"),
        ("database/assignments/type/Homework.md", "---\ntitle: Homework\n---\n# Homework"),
        ("database/assignments/type/Project.md", "---\ntitle: Project\n---\n# Project"),
        ("database/assignments/type/Reading.md", "---\ntitle: Reading\n---\n# Reading"),
        ("database/assignments/type/Lab.md", "---\ntitle: Lab\n---\n# Lab"),
        
        ("database/exams/type/Midterm.md", "---\ntitle: Midterm\n---\n# Midterm"),
        ("database/exams/type/Final.md", "---\ntitle: Final\n---\n# Final"),
        ("database/exams/type/Quiz.md", "---\ntitle: Quiz\n---\n# Quiz"),
        ("database/exams/type/Assignment.md", "---\ntitle: Assignment\n---\n# Assignment"),
        
        ("database/study planner/status/Not Started.md", "---\ntitle: Not Started\n---\n# Not Started"),
        ("database/study planner/status/Planned.md", "---\ntitle: Planned\n---\n# Planned"),
        ("database/study planner/status/In Progress.md", "---\ntitle: In Progress\n---\n# In Progress"),
        ("database/study planner/status/Reviewing.md", "---\ntitle: Reviewing\n---\n# Reviewing"),
        ("database/study planner/status/Completed.md", "---\ntitle: Completed\n---\n# Completed"),
        ("database/study planner/confidence/Low.md", "---\ntitle: Low\n---\n# Low"),
        ("database/study planner/confidence/Medium.md", "---\ntitle: Medium\n---\n# Medium"),
        ("database/study planner/confidence/High.md", "---\ntitle: High\n---\n# High"),
        ("database/study planner/type/Hub.md", "---\ntitle: Hub\n---\n# Hub"),
        ("database/study planner/type/Atomic.md", "---\ntitle: Atomic\n---\n# Atomic"),
        ("database/study planner/type/Possible Questions.md", "---\ntitle: Possible Questions\n---\n# Possible Questions"),
    ];
    
    for (path_str, content) in default_files {
        let p = vault_root.join(path_str);
        if !p.exists() {
            let _ = std::fs::write(&p, content);
        }
    }

    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn ater_process(
    payload: serde_json::Value,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/ater/process", &payload, headers).await
}

#[tauri::command]
pub async fn ater_generate_plan(
    payload: serde_json::Value,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/ater/plan", &payload, headers).await
}

#[tauri::command]
pub async fn ater_confirm(
    payload: serde_json::Value,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/ater/confirm", &payload, headers).await
}

#[tauri::command]
pub async fn ater_queue_status(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_get(sidecar_config.port, "/api/ater/queue/status", headers).await
}

#[tauri::command]
pub async fn ater_list_inbox(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_get(sidecar_config.port, "/api/ater/inbox", headers).await
}

#[tauri::command]
pub async fn ater_list_generated(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_get(sidecar_config.port, "/api/ater/generated", headers).await
}

#[tauri::command]
pub async fn ater_watcher_toggle(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/ater/watcher/toggle", &serde_json::Value::Object(serde_json::Map::new()), headers).await
}

#[tauri::command]
pub async fn get_ai_rate_limits(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_get(sidecar_config.port, "/api/ai/rate-limits", headers).await
}

#[tauri::command]
pub async fn get_ai_usage(
    key_hash: Option<String>,
    timeframe: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let path = if let Some(hash) = key_hash {
        format!("/api/ai/usage?key_hash={}&timeframe={}", hash, timeframe)
    } else {
        format!("/api/ai/usage?timeframe={}", timeframe)
    };
    proxy_get(sidecar_config.port, &path, headers).await
}

#[tauri::command]
pub async fn get_all_keys_usage(
    timeframe: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let path = format!("/api/ai/usage/all?timeframe={}", timeframe);
    proxy_get(sidecar_config.port, &path, headers).await
}

#[tauri::command]
pub async fn test_ai_connection(
    target: String,
    override_config: Option<AppConfig>,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let mut config = load_app_config(&app_handle)?;
    if let Some(overrides) = override_config {
        if let Some(val) = overrides.ai_provider {
            config.ai_provider = Some(val);
        }
        if let Some(val) = overrides.ai_api_key {
            config.ai_api_key = Some(val);
        }
        if let Some(val) = overrides.ai_model {
            config.ai_model = Some(val);
        }
        if let Some(val) = overrides.ai_base_url {
            config.ai_base_url = Some(val);
        }
        if let Some(val) = overrides.ai_max_tpm {
            config.ai_max_tpm = Some(val);
        }
        if let Some(val) = overrides.ai_max_rpm {
            config.ai_max_rpm = Some(val);
        }
        if let Some(val) = overrides.ai_max_tpd {
            config.ai_max_tpd = Some(val);
        }
        if let Some(val) = overrides.ai_max_rpd {
            config.ai_max_rpd = Some(val);
        }
        if let Some(val) = overrides.ai_max_concurrency {
            config.ai_max_concurrency = Some(val);
        }
    }
    let headers = get_proxy_headers(&config);
    let mut payload = serde_json::Map::new();
    payload.insert("target".to_string(), serde_json::Value::String(target));
    proxy_post(sidecar_config.port, "/api/ai/test-connection", &serde_json::Value::Object(payload), headers).await
}

#[tauri::command]
pub async fn explain_pdf_selection(
    payload: serde_json::Value,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/ater/explain", &payload, headers).await
}

#[tauri::command]
pub async fn generate_quick_questions(
    payload: serde_json::Value,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/ater/quick-questions", &payload, headers).await
}

#[tauri::command]
pub async fn ater_explain(
    payload: serde_json::Value,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/ater/explain", &payload, headers).await
}

#[tauri::command]
pub async fn ater_chat(
    payload: serde_json::Value,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/ater/chat", &payload, headers).await
}

#[tauri::command]
pub async fn ater_interactive_quiz(
    payload: serde_json::Value,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/ater/interactive-quiz", &payload, headers).await
}

#[tauri::command]
pub async fn log_note_visit(
    note_path: String,
    duration_seconds: f64,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let mut payload = serde_json::Map::new();
    payload.insert("note_path".to_string(), serde_json::Value::String(note_path));
    payload.insert("duration_seconds".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(duration_seconds).ok_or("Invalid duration")?));
    proxy_post(sidecar_config.port, "/api/obsidian/log-visit", &serde_json::Value::Object(payload), headers).await
}

#[tauri::command]
pub async fn log_study_session(
    hub_id: String,
    duration_seconds: f64,
    mode: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let mut payload = serde_json::Map::new();
    payload.insert("hub_id".to_string(), serde_json::Value::String(hub_id));
    payload.insert("duration_seconds".to_string(), serde_json::Value::Number(serde_json::Number::from_f64(duration_seconds).ok_or("Invalid duration")?));
    payload.insert("mode".to_string(), serde_json::Value::String(mode));
    proxy_post(sidecar_config.port, "/api/study/log-session", &serde_json::Value::Object(payload), headers).await
}

#[tauri::command]
pub async fn log_practice_result(
    hub_id: String,
    score: i64,
    total: i64,
    note_path: Option<String>,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let mut payload = serde_json::Map::new();
    payload.insert("hub_id".to_string(), serde_json::Value::String(hub_id));
    payload.insert("score".to_string(), serde_json::Value::Number(score.into()));
    payload.insert("total".to_string(), serde_json::Value::Number(total.into()));
    if let Some(path) = note_path {
        payload.insert("note_path".to_string(), serde_json::Value::String(path));
    }
    proxy_post(sidecar_config.port, "/api/study/log-practice", &serde_json::Value::Object(payload), headers).await
}

#[tauri::command]
pub async fn get_study_history(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_get(sidecar_config.port, "/api/study/history", headers).await
}

#[tauri::command]
pub async fn clear_study_history(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    if let Some(ref path_str) = config.obsidian_vault_path {
        let persist_dir = std::path::PathBuf::from(path_str).join(".ater").join("vector_store");
        if persist_dir.exists() {
            let _ = std::fs::remove_dir_all(&persist_dir);
        }
        
        let inbox_path = config.inbox_path.clone().unwrap_or_else(|| format!("{}/Inbox", path_str));
        let db_path = std::path::PathBuf::from(inbox_path).join("ater_queue.db");
        if db_path.exists() {
            let _ = std::fs::remove_file(&db_path);
        }
    }
    
    let headers = get_proxy_headers(&config);
    let _: Result<serde_json::Value, _> = proxy_post(sidecar_config.port, "/api/study/reset", &serde_json::Value::Object(serde_json::Map::new()), headers).await;

    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn factory_reset(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    
    if let Some(ref path_str) = config.obsidian_vault_path {
        let vault_root = std::path::PathBuf::from(path_str);
        
        let persist_dir = vault_root.join(".ater");
        if persist_dir.exists() {
            let _ = std::fs::remove_dir_all(&persist_dir);
        }
        
        let database_dir = vault_root.join("database");
        if database_dir.exists() {
            let _ = std::fs::remove_dir_all(&database_dir);
        }
        
        let inbox_path = config.inbox_path.clone().unwrap_or_else(|| format!("{}/Inbox", path_str));
        let db_path = std::path::PathBuf::from(inbox_path).join("ater_queue.db");
        if db_path.exists() {
            let _ = std::fs::remove_file(&db_path);
        }
    }
    
    if let Ok(app_dir) = app_handle.path().app_data_dir() {
        let config_path = app_dir.join("ater_config.json");
        if config_path.exists() {
            let _ = std::fs::remove_file(&config_path);
        }
    }
    
    let headers = get_proxy_headers(&config);
    let _: Result<serde_json::Value, _> = proxy_post(sidecar_config.port, "/api/system/factory-reset", &serde_json::Value::Object(serde_json::Map::new()), headers).await;

    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn srs_review(
    note_path: String,
    rating: i64,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let mut payload = serde_json::Map::new();
    payload.insert("note_path".to_string(), serde_json::Value::String(note_path));
    payload.insert("rating".to_string(), serde_json::Value::Number(rating.into()));
    proxy_post(sidecar_config.port, "/api/srs/review", &serde_json::Value::Object(payload), headers).await
}

#[tauri::command]
pub async fn srs_due(
    hub_id: Option<String>,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let path = if let Some(hid) = hub_id {
        format!("/api/srs/due?hub_id={}", hid)
    } else {
        "/api/srs/due".to_string()
    };
    proxy_get(sidecar_config.port, &path, headers).await
}

#[tauri::command]
pub async fn record_performance(
    payload: serde_json::Value,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/analytics/record", &payload, headers).await
}

#[tauri::command]
pub async fn vault_list(
    hub_id: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let path = format!("/api/practice/vault/list?hub_id={}", hub_id);
    proxy_get(sidecar_config.port, &path, headers).await
}

#[tauri::command]
pub async fn vault_upload_text(
    hub_id: String,
    source_name: String,
    source_text: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let mut payload = serde_json::Map::new();
    payload.insert("hub_id".to_string(), serde_json::Value::String(hub_id));
    payload.insert("source_name".to_string(), serde_json::Value::String(source_name));
    payload.insert("source_text".to_string(), serde_json::Value::String(source_text));
    proxy_post(sidecar_config.port, "/api/practice/vault/upload", &serde_json::Value::Object(payload), headers).await
}

#[tauri::command]
pub async fn vault_generate(
    vault_paths: Vec<String>,
    mode: String,
    hub_id: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let mut payload = serde_json::Map::new();
    payload.insert("vault_paths".to_string(), serde_json::Value::Array(vault_paths.into_iter().map(serde_json::Value::String).collect()));
    payload.insert("mode".to_string(), serde_json::Value::String(mode));
    payload.insert("hub_id".to_string(), serde_json::Value::String(hub_id));
    proxy_post(sidecar_config.port, "/api/practice/vault/generate", &serde_json::Value::Object(payload), headers).await
}

#[tauri::command]
pub async fn explain_question(
    payload: serde_json::Value,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/practice/explain", &payload, headers).await
}

#[tauri::command]
pub async fn list_practices(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_get(sidecar_config.port, "/api/practice/list", headers).await
}

#[tauri::command]
pub async fn get_practice_status(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_get(sidecar_config.port, "/api/practice/status", headers).await
}

#[tauri::command]
pub async fn get_practice(
    path: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let mut payload = serde_json::Map::new();
    payload.insert("path".to_string(), serde_json::Value::String(path));
    proxy_post(sidecar_config.port, "/api/practice/get", &serde_json::Value::Object(payload), headers).await
}

#[tauri::command]
pub async fn delete_practice(
    path: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let mut payload = serde_json::Map::new();
    payload.insert("path".to_string(), serde_json::Value::String(path));
    proxy_post(sidecar_config.port, "/api/practice/delete", &serde_json::Value::Object(payload), headers).await
}

#[tauri::command]
pub async fn update_practice_score(
    path: String,
    score: f64,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let mut payload = serde_json::Map::new();
    payload.insert("path".to_string(), serde_json::Value::String(path));
    payload.insert("score".to_string(), serde_json::Value::Number(serde_number_from_f64(score)?));
    proxy_post(sidecar_config.port, "/api/practice/score", &serde_json::Value::Object(payload), headers).await
}

fn serde_number_from_f64(val: f64) -> Result<serde_json::Number, String> {
    serde_json::Number::from_f64(val).ok_or_else(|| "Invalid float value".to_string())
}

#[tauri::command]
pub async fn generate_practice(
    hub_id: String,
    config_payload: serde_json::Value,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let mut payload = serde_json::Map::new();
    payload.insert("hub_id".to_string(), serde_json::Value::String(hub_id));
    payload.insert("config".to_string(), config_payload);
    proxy_post(sidecar_config.port, "/api/practice/generate", &serde_json::Value::Object(payload), headers).await
}

#[tauri::command]
pub async fn get_practice_analytics(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_get(sidecar_config.port, "/api/practice/analytics", headers).await
}

#[tauri::command]
pub async fn log_practice_attempt(
    note_id: String,
    question_type: String,
    is_correct: bool,
    time_taken_seconds: i64,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let mut payload = serde_json::Map::new();
    payload.insert("note_id".to_string(), serde_json::Value::String(note_id));
    payload.insert("question_type".to_string(), serde_json::Value::String(question_type));
    payload.insert("is_correct".to_string(), serde_json::Value::Bool(is_correct));
    payload.insert("time_taken_seconds".to_string(), serde_json::Value::Number(time_taken_seconds.into()));
    proxy_post(sidecar_config.port, "/api/practice/log", &serde_json::Value::Object(payload), headers).await
}

#[tauri::command]
pub async fn rag_watcher_toggle(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/rag/watcher/toggle", &serde_json::Value::Object(serde_json::Map::new()), headers).await
}

#[tauri::command]
pub async fn get_rag_sync_status(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_get(sidecar_config.port, "/api/rag/sync-status", headers).await
}

#[tauri::command]
pub async fn rag_sync_vault(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/rag/sync", &serde_json::Value::Object(serde_json::Map::new()), headers).await
}

#[tauri::command]
pub async fn vault_upload_file(
    hub_id: String,
    file_path: String,
    file_name: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    
    let file_bytes = std::fs::read(&file_path)
        .map_err(|e| format!("Failed to read file from path {}: {}", file_path, e))?;
        
    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{}/api/practice/vault/upload-file?hub_id={}", sidecar_config.port, hub_id);
    
    use reqwest::multipart;
    let part = multipart::Part::bytes(file_bytes)
        .file_name(file_name);
        
    let form = multipart::Form::new()
        .part("file", part);
        
    let res = client.post(&url)
        .headers(headers)
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Failed to send file upload: {}", e))?;
        
    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Upload returned error: {}", err_text));
    }
    
    res.json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))
}

#[tauri::command]
pub async fn list_vault_databases(
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let vault_root = get_vault_path(&app_handle)?;
    let database_dir = vault_root.join("database");
    
    let mut results = Vec::new();
    if database_dir.exists() && database_dir.is_dir() {
        if let Ok(entries) = std::fs::read_dir(&database_dir) {
            for entry in entries.filter_map(Result::ok) {
                let path = entry.path();
                if path.is_dir() {
                    let folder_name = path.file_name().and_then(|s| s.to_str()).unwrap_or("").to_string();
                    if !folder_name.starts_with('.') {
                        let mut db = serde_json::Map::new();
                        db.insert("name".to_string(), serde_json::Value::String(folder_name.clone()));
                        db.insert("id".to_string(), serde_json::Value::String(folder_name));
                        results.push(serde_json::Value::Object(db));
                    }
                }
            }
        }
    }
    
    let mut res = serde_json::Map::new();
    res.insert("databases".to_string(), serde_json::Value::Array(results));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn fetch_vault_areas() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("areas".to_string(), serde_json::Value::Array(Vec::new()));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn initialize_vault(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let vault_root = get_vault_path(&app_handle)?;
    let main_folders = vec!["Inbox", "Notes", "database"];
    for f in main_folders {
        let _ = std::fs::create_dir_all(vault_root.join(f));
    }
    
    // Attempt proxy but return success anyway
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    let _: Result<serde_json::Value, _> = proxy_post(sidecar_config.port, "/api/vault/initialize", &serde_json::Value::Object(serde_json::Map::new()), headers).await;
    
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    res.insert("message".to_string(), serde_json::Value::String("Vault initialized".to_string()));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn create_vault_database(id: String) -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    res.insert("id".to_string(), serde_json::Value::String(id));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn delete_vault_database() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn update_vault_database_schema() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn query_vault_database(
    db_name: String,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let vault_root = get_vault_path(&app_handle)?;
    let db_path = vault_root.join("database").join(&db_name);
    
    let mut results = Vec::new();
    if db_path.exists() && db_path.is_dir() {
        if let Ok(entries) = std::fs::read_dir(&db_path) {
            for entry in entries.filter_map(Result::ok) {
                let path = entry.path();
                let file_name = path.file_name().and_then(|s| s.to_str()).unwrap_or("");
                if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") && !file_name.starts_with('.') {
                    if let Ok(content) = std::fs::read_to_string(&path) {
                        let (frontmatter, _) = parse_markdown_note(&content);
                        if let serde_json::Value::Object(mut map) = frontmatter {
                            let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("").to_string();
                            map.insert("id".to_string(), serde_json::Value::String(stem.clone()));
                            if !map.contains_key("title") {
                                map.insert("title".to_string(), serde_json::Value::String(stem.clone()));
                            }
                            let rel_path = path.strip_prefix(&vault_root).map(|p| p.to_string_lossy().to_string()).unwrap_or_else(|_| path.to_string_lossy().to_string());
                            map.insert("path".to_string(), serde_json::Value::String(rel_path));
                            results.push(serde_json::Value::Object(map));
                        }
                    }
                }
            }
        }
    }
    
    let mut res = serde_json::Map::new();
    res.insert("results".to_string(), serde_json::Value::Array(results));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn list_vault_database_rows(
    db_name: String,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    query_vault_database(db_name, app_handle).await
}

#[tauri::command]
pub async fn list_vault_templates() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("templates".to_string(), serde_json::Value::Array(Vec::new()));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn update_vault_row(
    db_name: String,
    id: String,
    properties: serde_json::Value,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    
    // Attempt sidecar proxy
    let proxy_path = format!(
        "/api/vault/databases/{}/{}",
        percent_encoding::utf8_percent_encode(&db_name, percent_encoding::NON_ALPHANUMERIC),
        percent_encoding::utf8_percent_encode(&id, percent_encoding::NON_ALPHANUMERIC)
    );
    let mut payload = serde_json::Map::new();
    payload.insert("properties".to_string(), properties.clone());
    if let Ok(res) = proxy_patch(sidecar_config.port, &proxy_path, &serde_json::Value::Object(payload), headers).await {
        return Ok(res);
    }

    // Direct filesystem fallback
    let vault_root = get_vault_path(&app_handle)?;
    let db_path = vault_root.join("database").join(&db_name);
    let file_path = db_path.join(format!("{}.md", id));
    
    let props_map = if let serde_json::Value::Object(map) = properties.clone() {
        map
    } else {
        serde_json::Map::new()
    };
    
    if file_path.exists() {
        if let Ok(content) = std::fs::read_to_string(&file_path) {
            let (mut frontmatter, body) = parse_markdown_note(&content);
            if let serde_json::Value::Object(ref mut map) = frontmatter {
                for (k, v) in props_map.iter() {
                    map.insert(k.clone(), v.clone());
                }
                let new_frontmatter_str = serialize_frontmatter(map);
                let new_content = format!("{}{}", new_frontmatter_str, body);
                let _ = std::fs::write(&file_path, new_content);
                
                let mut res = map.clone();
                res.insert("id".to_string(), serde_json::Value::String(id.clone()));
                return Ok(serde_json::Value::Object(res));
            }
        }
    }
    
    let frontmatter = serialize_frontmatter(&props_map);
    let content = format!("{}\n# {}\n\nUpdated automatically.\n", frontmatter, id);
    let _ = std::fs::write(&file_path, content);
    
    let mut res = props_map.clone();
    res.insert("id".to_string(), serde_json::Value::String(id));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn create_vault_row(
    db_name: String,
    title: String,
    properties: serde_json::Value,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    
    // Attempt sidecar proxy
    let proxy_path = format!(
        "/api/vault/databases/{}",
        percent_encoding::utf8_percent_encode(&db_name, percent_encoding::NON_ALPHANUMERIC)
    );
    let mut payload = serde_json::Map::new();
    payload.insert("title".to_string(), serde_json::Value::String(title.clone()));
    payload.insert("properties".to_string(), properties.clone());
    if let Ok(res) = proxy_post(sidecar_config.port, &proxy_path, &serde_json::Value::Object(payload), headers).await {
        return Ok(res);
    }

    // Direct filesystem fallback
    let vault_root = get_vault_path(&app_handle)?;
    let db_path = vault_root.join("database").join(&db_name);
    let _ = std::fs::create_dir_all(&db_path);
    
    let safe_title = title.replace("/", "-").replace("\\", "-").replace(":", "-");
    let file_path = db_path.join(format!("{}.md", safe_title));
    
    let mut props_map = if let serde_json::Value::Object(map) = properties {
        map
    } else {
        serde_json::Map::new()
    };
    
    props_map.insert("title".to_string(), serde_json::Value::String(title.clone()));
    
    let frontmatter = serialize_frontmatter(&props_map);
    let content = format!("{}\n# {}\n\nCreated automatically.\n", frontmatter, title);
    
    std::fs::write(&file_path, content).map_err(|e| e.to_string())?;
    
    let mut res = props_map.clone();
    res.insert("id".to_string(), serde_json::Value::String(safe_title));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn delete_vault_row(
    db_name: String,
    id: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    
    // Attempt sidecar proxy
    let proxy_path = format!(
        "/api/vault/databases/{}/{}",
        percent_encoding::utf8_percent_encode(&db_name, percent_encoding::NON_ALPHANUMERIC),
        percent_encoding::utf8_percent_encode(&id, percent_encoding::NON_ALPHANUMERIC)
    );
    if let Ok(res) = proxy_delete(sidecar_config.port, &proxy_path, headers).await {
        return Ok(res);
    }

    // Direct filesystem fallback
    let vault_root = get_vault_path(&app_handle)?;
    let db_path = vault_root.join("database").join(&db_name);
    let file_path = db_path.join(format!("{}.md", id));
    if file_path.exists() {
        std::fs::remove_file(file_path).map_err(|e| e.to_string())?;
        let mut res = serde_json::Map::new();
        res.insert("success".to_string(), serde_json::Value::Bool(true));
        return Ok(serde_json::Value::Object(res));
    }
    Err("Row not found".to_string())
}

#[tauri::command]
pub async fn rename_vault_file(
    db_name: String,
    old_id: String,
    new_id: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    
    // Attempt sidecar proxy
    let proxy_path = format!(
        "/api/vault/databases/{}/{}/rename",
        percent_encoding::utf8_percent_encode(&db_name, percent_encoding::NON_ALPHANUMERIC),
        percent_encoding::utf8_percent_encode(&old_id, percent_encoding::NON_ALPHANUMERIC)
    );
    let mut payload = serde_json::Map::new();
    payload.insert("new_name".to_string(), serde_json::Value::String(new_id.clone()));
    if let Ok(res) = proxy_post(sidecar_config.port, &proxy_path, &serde_json::Value::Object(payload), headers).await {
        return Ok(res);
    }

    // Direct filesystem fallback
    let vault_root = get_vault_path(&app_handle)?;
    let db_path = vault_root.join("database").join(&db_name);
    let old_file = db_path.join(format!("{}.md", old_id));
    let new_file = db_path.join(format!("{}.md", new_id));
    if old_file.exists() {
        std::fs::rename(old_file, new_file).map_err(|e| e.to_string())?;
        let mut res = serde_json::Map::new();
        res.insert("success".to_string(), serde_json::Value::Bool(true));
        res.insert("name".to_string(), serde_json::Value::String(new_id));
        return Ok(serde_json::Value::Object(res));
    }
    Err("Row not found".to_string())
}

#[tauri::command]
pub async fn get_vault_options(
    source: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    
    // Attempt sidecar proxy
    let proxy_path = format!("/api/vault/options?source={}", percent_encoding::utf8_percent_encode(&source, percent_encoding::NON_ALPHANUMERIC));
    if let Ok(res) = proxy_get(sidecar_config.port, &proxy_path, headers).await {
        return Ok(res);
    }

    // Direct filesystem fallback
    let vault_root = get_vault_path(&app_handle)?;
    let source_path = vault_root.join(&source);
    let mut options = Vec::new();
    
    if source_path.exists() && source_path.is_dir() {
        if let Ok(entries) = std::fs::read_dir(source_path) {
            for entry in entries.filter_map(Result::ok) {
                let path = entry.path();
                if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
                    if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                        options.push(serde_json::Value::String(stem.to_string()));
                    }
                }
            }
        }
    }
    
    options.sort_by(|a, b| a.as_str().unwrap_or("").cmp(b.as_str().unwrap_or("")));
    
    let mut res = serde_json::Map::new();
    res.insert("options".to_string(), serde_json::Value::Array(options));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn create_vault_option(
    source: String,
    name: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    
    // Attempt sidecar proxy
    let proxy_path = "/api/vault/options";
    let mut payload = serde_json::Map::new();
    payload.insert("source".to_string(), serde_json::Value::String(source.clone()));
    payload.insert("name".to_string(), serde_json::Value::String(name.clone()));
    if let Ok(res) = proxy_post(sidecar_config.port, proxy_path, &serde_json::Value::Object(payload), headers).await {
        return Ok(res);
    }

    // Direct filesystem fallback
    let vault_root = get_vault_path(&app_handle)?;
    let source_path = vault_root.join(&source);
    if !source_path.exists() {
        std::fs::create_dir_all(&source_path).map_err(|e| e.to_string())?;
    }
    let md_file = source_path.join(format!("{}.md", name));
    if !md_file.exists() {
        std::fs::write(&md_file, format!("---\ntitle: {}\n---", name)).map_err(|e| e.to_string())?;
    }

    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    res.insert("name".to_string(), serde_json::Value::String(name));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn update_vault_option(
    source: String,
    old_name: String,
    new_name: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    
    // Attempt sidecar proxy
    let proxy_path = format!("/api/vault/options?old_name={}", percent_encoding::utf8_percent_encode(&old_name, percent_encoding::NON_ALPHANUMERIC));
    let mut payload = serde_json::Map::new();
    payload.insert("source".to_string(), serde_json::Value::String(source.clone()));
    payload.insert("name".to_string(), serde_json::Value::String(new_name.clone()));
    if let Ok(res) = proxy_patch(sidecar_config.port, &proxy_path, &serde_json::Value::Object(payload), headers).await {
        return Ok(res);
    }

    // Direct filesystem fallback
    let vault_root = get_vault_path(&app_handle)?;
    let source_path = vault_root.join(&source);
    let old_file = source_path.join(format!("{}.md", old_name));
    let new_file = source_path.join(format!("{}.md", new_name));
    if old_file.exists() {
        std::fs::rename(old_file, new_file).map_err(|e| e.to_string())?;
        let mut res = serde_json::Map::new();
        res.insert("success".to_string(), serde_json::Value::Bool(true));
        res.insert("name".to_string(), serde_json::Value::String(new_name));
        return Ok(serde_json::Value::Object(res));
    }
    Err("Option not found".to_string())
}

#[tauri::command]
pub async fn delete_vault_option(
    source: String,
    name: String,
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    
    // Attempt sidecar proxy
    let proxy_path = format!(
        "/api/vault/options?source={}&name={}",
        percent_encoding::utf8_percent_encode(&source, percent_encoding::NON_ALPHANUMERIC),
        percent_encoding::utf8_percent_encode(&name, percent_encoding::NON_ALPHANUMERIC)
    );
    if let Ok(res) = proxy_delete(sidecar_config.port, &proxy_path, headers).await {
        return Ok(res);
    }

    // Direct filesystem fallback
    let vault_root = get_vault_path(&app_handle)?;
    let source_path = vault_root.join(&source);
    let md_file = source_path.join(format!("{}.md", name));
    if md_file.exists() {
        std::fs::remove_file(md_file).map_err(|e| e.to_string())?;
        let mut res = serde_json::Map::new();
        res.insert("success".to_string(), serde_json::Value::Bool(true));
        return Ok(serde_json::Value::Object(res));
    }
    Err("Option not found".to_string())
}

#[tauri::command]
fn walk_for_graph(dir: &std::path::Path, root: &std::path::Path, nodes: &mut Vec<serde_json::Value>, links: &mut Vec<serde_json::Value>) -> Result<(), String> {
    if !dir.exists() { return Ok(()); }
    for entry in std::fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = path.file_name().and_then(|n| n.to_str()).unwrap_or_default().to_string();
        
        if name.starts_with('.') || name == "node_modules" { continue; }
        
        if path.is_dir() {
            walk_for_graph(&path, root, nodes, links)?;
        } else if path.extension().and_then(|s| s.to_str()) == Some("md") {
            let rel_path = path.strip_prefix(root).unwrap_or(&path).to_string_lossy().to_string().replace("\\", "/");
            let file_stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("Unknown").to_string();
            
            let group = match rel_path.split('/').next() {
                Some("database") => "database",
                Some("Notes") => "note",
                _ => "other",
            };

            let mut node = serde_json::Map::new();
            node.insert("id".to_string(), serde_json::Value::String(rel_path.clone()));
            node.insert("name".to_string(), serde_json::Value::String(file_stem.clone()));
            node.insert("group".to_string(), serde_json::Value::String(group.to_string()));
            nodes.push(serde_json::Value::Object(node));

            if let Ok(content) = std::fs::read_to_string(&path) {
                let (frontmatter, _) = parse_markdown_note(&content);
                if let Some(fm_obj) = frontmatter.as_object() {
                    // Bidirectional frontmatter hub linking: extract hub link if present
                    if let Some(hub_val) = fm_obj.get("hub").and_then(|h| h.as_str()) {
                        let clean_hub = hub_val.trim_matches('[')
                            .trim_matches(']')
                            .split('|')
                            .next()
                            .unwrap_or("")
                            .trim();
                        if !clean_hub.is_empty() {
                            let mut link = serde_json::Map::new();
                            link.insert("source".to_string(), serde_json::Value::String(rel_path.clone()));
                            link.insert("target".to_string(), serde_json::Value::String(clean_hub.to_string()));
                            links.push(serde_json::Value::Object(link));
                        }
                    }
                }

                let mut start = 0;
                while let Some(s) = content[start..].find("[[") {
                    let s_idx = start + s;
                    if let Some(e) = content[s_idx..].find("]]") {
                        let e_idx = s_idx + e;
                        let link_content = &content[s_idx + 2..e_idx];
                        let target_name = link_content.split('|').next().unwrap_or("").trim();
                        if !target_name.is_empty() {
                            let mut link = serde_json::Map::new();
                            link.insert("source".to_string(), serde_json::Value::String(rel_path.clone()));
                            // The frontend resolves the target name to an ID if needed, 
                            // but react-force-graph supports matching string IDs. 
                            // For a naive match, we can just pass the target_name.
                            // Obsidian Graph generally creates phantom nodes if target doesn't exist.
                            link.insert("target".to_string(), serde_json::Value::String(target_name.to_string()));
                            links.push(serde_json::Value::Object(link));
                        }
                        start = e_idx + 2;
                    } else {
                        break;
                    }
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn get_vault_graph(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let vault_root = get_vault_path(&app_handle)?;
    let mut nodes = Vec::new();
    let mut links = Vec::new();
    
    walk_for_graph(&vault_root, &vault_root, &mut nodes, &mut links)?;

    // Map targets that are just "names" to actual "rel_paths" where possible
    let mut name_to_id = std::collections::HashMap::new();
    for n in &nodes {
        if let Some(n_obj) = n.as_object() {
            if let (Some(id), Some(name)) = (n_obj.get("id").and_then(|v| v.as_str()), n_obj.get("name").and_then(|v| v.as_str())) {
                name_to_id.insert(name.to_lowercase(), id.to_string());
            }
        }
    }

    let mut mapped_links = Vec::new();
    for l in links {
        if let Some(mut l_map) = l.as_object().cloned() {
            if let Some(target) = l_map.get("target").and_then(|v| v.as_str()) {
                if let Some(mapped_id) = name_to_id.get(&target.to_lowercase()) {
                    l_map.insert("target".to_string(), serde_json::Value::String(mapped_id.clone()));
                } else {
                    // Create phantom nodes for unresolved links
                    let phantom_id = target.to_string();
                    if !name_to_id.contains_key(&phantom_id.to_lowercase()) {
                        let mut phantom_node = serde_json::Map::new();
                        phantom_node.insert("id".to_string(), serde_json::Value::String(phantom_id.clone()));
                        phantom_node.insert("name".to_string(), serde_json::Value::String(phantom_id.clone()));
                        phantom_node.insert("group".to_string(), serde_json::Value::String("unresolved".to_string()));
                        nodes.push(serde_json::Value::Object(phantom_node));
                        name_to_id.insert(phantom_id.to_lowercase(), phantom_id.clone());
                    }
                    l_map.insert("target".to_string(), serde_json::Value::String(phantom_id));
                }
            }
            mapped_links.push(serde_json::Value::Object(l_map));
        }
    }

    let mut res = serde_json::Map::new();
    res.insert("nodes".to_string(), serde_json::Value::Array(nodes));
    res.insert("links".to_string(), serde_json::Value::Array(mapped_links));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn get_vault_backlinks() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("backlinks".to_string(), serde_json::Value::Array(Vec::new()));
    Ok(serde_json::Value::Object(res))
}
