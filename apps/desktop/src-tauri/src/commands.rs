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
    #[serde(rename = "isDir")]
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
    #[serde(rename = "aiApiKey")]
    pub ai_api_key: Option<String>,
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

fn get_vault_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let config = load_app_config(app_handle)?;
    let p = config.obsidian_vault_path
        .ok_or_else(|| "Obsidian Vault Path is not configured. Please open settings and configure it.".to_string())?;
    let path = PathBuf::from(p);
    if !path.exists() {
        return Err(format!("Obsidian Vault Path does not exist on disk: {:?}", path));
    }
    Ok(path)
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
    headers
}

async fn proxy_post<T: serde::Serialize, R: serde::de::DeserializeOwned>(
    port: u16,
    path: &str,
    body: &T,
    headers: reqwest::header::HeaderMap,
) -> Result<R, String> {
    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{}{}", port, path);
    let res = client.post(&url)
        .headers(headers)
        .json(body)
        .send()
        .await
        .map_err(|e| format!("Failed to send request to sidecar API: {}", e))?;
    
    if !res.status().is_success() {
        let status = res.status();
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Sidecar API returned error status {}: {}", status, err_text));
    }
    
    res.json::<R>()
        .await
        .map_err(|e| format!("Failed to parse sidecar response: {}", e))
}

async fn proxy_get<R: serde::de::DeserializeOwned>(
    port: u16,
    path: &str,
    headers: reqwest::header::HeaderMap,
) -> Result<R, String> {
    let client = reqwest::Client::new();
    let url = format!("http://127.0.0.1:{}{}", port, path);
    let res = client.get(&url)
        .headers(headers)
        .send()
        .await
        .map_err(|e| format!("Failed to send request to sidecar API: {}", e))?;
    
    if !res.status().is_success() {
        let status = res.status();
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Sidecar API returned error status {}: {}", status, err_text));
    }
    
    res.json::<R>()
        .await
        .map_err(|e| format!("Failed to parse sidecar response: {}", e))
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
        
        if name.starts_with('.') || name == "node_modules" {
            continue;
        }
        
        let is_dir = path.is_dir();
        let relative_path = path.strip_prefix(root)
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .to_string();
            
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
        for line in frontmatter_str.lines() {
            let line = line.trim();
            if line.is_empty() {
                continue;
            }
            if let Some(colon_idx) = line.find(':') {
                let key = line[..colon_idx].trim().to_string();
                let mut value_str = line[colon_idx + 1..].trim().to_string();
                
                if (value_str.starts_with('"') && value_str.ends_with('"')) || 
                   (value_str.starts_with('\'') && value_str.ends_with('\'')) {
                    if value_str.len() >= 2 {
                        value_str = value_str[1..value_str.len() - 1].to_string();
                    }
                }
                
                if value_str.to_lowercase() == "true" {
                    map.insert(key, serde_json::Value::Bool(true));
                } else if value_str.to_lowercase() == "false" {
                    map.insert(key, serde_json::Value::Bool(false));
                } else if let Ok(num) = value_str.parse::<i64>() {
                    map.insert(key, serde_json::Value::Number(num.into()));
                } else if value_str.starts_with('[') && value_str.ends_with(']') {
                    let items_str = &value_str[1..value_str.len() - 1];
                    let mut arr = Vec::new();
                    for item in items_str.split(',') {
                        let item_trim = item.trim();
                        if !item_trim.is_empty() {
                            if let Ok(num) = item_trim.parse::<i64>() {
                                arr.push(serde_json::Value::Number(num.into()));
                            } else {
                                arr.push(serde_json::Value::String(item_trim.to_string()));
                            }
                        }
                    }
                    map.insert(key, serde_json::Value::Array(arr));
                } else {
                    map.insert(key, serde_json::Value::String(value_str));
                }
            }
        }
        
        return (serde_json::Value::Object(map), remaining_content.to_string());
    }
    
    (serde_json::Value::Object(serde_json::Map::new()), content.to_string())
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
    let vault_path = get_vault_path(&app_handle)?;
    let full_path = vault_path.join(&path);
    
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
    let vault_path = get_vault_path(&app_handle)?;
    let full_path = vault_path.join(&path);
    
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
    let vault_path = get_vault_path(&app_handle)?;
    let full_path = vault_path.join(&path);
    
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
    let vault_path = get_vault_path(&app_handle)?;
    let full_path = vault_path.join(&path);
    
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
    let vault_path = get_vault_path(&app_handle)?;
    let full_path = vault_path.join(&path);
    
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
    let vault_path = get_vault_path(&app_handle)?;
    let old_full = vault_path.join(&old_path);
    let new_full = vault_path.join(&new_path);
    
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
    let normalized_query = page_name.to_lowercase().replace(' ', "_").replace(".md", "");
    
    let mut files = Vec::new();
    walk_dir(&vault_path, &vault_path, &mut files)?;
    
    for f in files {
        if !f.is_dir && f.path.ends_with(".md") {
            let name_clean = f.name.to_lowercase().replace(' ', "_").replace(".md", "");
            if name_clean == normalized_query {
                let mut res = serde_json::Map::new();
                res.insert("found".to_string(), serde_json::Value::Bool(true));
                res.insert("path".to_string(), serde_json::Value::String(f.path));
                res.insert("file_name".to_string(), serde_json::Value::String(f.name));
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
    for f in files {
        if !f.is_dir && f.path.ends_with(".md") {
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
    
    let normalized_hub = hub_id.to_lowercase().replace(' ', "_").replace("_hub", "");
    
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
                        if clean_hub == normalized_hub {
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
    proxy_get(sidecar_config.port, "/api/academics/dashboard", headers).await
}

#[tauri::command]
pub async fn academics_sync_profile(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/academics/sync-profile", &serde_json::Value::Object(serde_json::Map::new()), headers).await
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
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
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
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/study/reset", &serde_json::Value::Object(serde_json::Map::new()), headers).await
}

#[tauri::command]
pub async fn factory_reset(
    sidecar_config: State<'_, crate::SidecarConfig>,
    app_handle: tauri::AppHandle,
) -> Result<serde_json::Value, String> {
    let config = load_app_config(&app_handle)?;
    let headers = get_proxy_headers(&config);
    proxy_post(sidecar_config.port, "/api/system/factory-reset", &serde_json::Value::Object(serde_json::Map::new()), headers).await
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
pub async fn list_vault_databases() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("databases".to_string(), serde_json::Value::Array(Vec::new()));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn fetch_vault_areas() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("areas".to_string(), serde_json::Value::Array(Vec::new()));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn initialize_vault() -> Result<serde_json::Value, String> {
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
pub async fn query_vault_database() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("results".to_string(), serde_json::Value::Array(Vec::new()));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn list_vault_database_rows() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("results".to_string(), serde_json::Value::Array(Vec::new()));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn list_vault_templates() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("templates".to_string(), serde_json::Value::Array(Vec::new()));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn update_vault_row(id: String, properties: serde_json::Value) -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    res.insert("id".to_string(), serde_json::Value::String(id));
    res.insert("properties".to_string(), properties);
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn create_vault_row(title: String, properties: serde_json::Value) -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    res.insert("id".to_string(), serde_json::Value::String("row".to_string()));
    res.insert("title".to_string(), serde_json::Value::String(title));
    res.insert("properties".to_string(), properties);
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn delete_vault_row() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn rename_vault_file() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn get_vault_options() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("options".to_string(), serde_json::Value::Array(Vec::new()));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn create_vault_option(name: String) -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    res.insert("name".to_string(), serde_json::Value::String(name));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn update_vault_option(name: String) -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    res.insert("name".to_string(), serde_json::Value::String(name));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn delete_vault_option() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("success".to_string(), serde_json::Value::Bool(true));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn get_vault_graph() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("nodes".to_string(), serde_json::Value::Array(Vec::new()));
    res.insert("links".to_string(), serde_json::Value::Array(Vec::new()));
    Ok(serde_json::Value::Object(res))
}

#[tauri::command]
pub async fn get_vault_backlinks() -> Result<serde_json::Value, String> {
    let mut res = serde_json::Map::new();
    res.insert("backlinks".to_string(), serde_json::Value::Array(Vec::new()));
    Ok(serde_json::Value::Object(res))
}
