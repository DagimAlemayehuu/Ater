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
