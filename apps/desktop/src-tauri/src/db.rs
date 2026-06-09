use arrow_array::{
    ArrayRef, FixedSizeListArray, Float32Array, RecordBatch, RecordBatchIterator, StringArray,
};
use arrow_schema::{DataType, Field, Schema};
use futures::TryStreamExt;
use lancedb::query::{ExecutableQuery, QueryBase};
use lancedb::{connect, Connection, Table};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub content: String,
    pub source: String,
    pub filename: String,
    pub folder: String,
    pub metadata: String, // JSON metadata string
    pub distance: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorDocument {
    pub id: String,
    pub content: String,
    pub source: String,
    pub filename: String,
    pub folder: String,
    pub metadata: String, // JSON metadata string
    pub vector: Vec<f32>,
}

#[derive(Clone)]
pub struct VectorDB {
    connection: Connection,
    table_name: String,
}

impl VectorDB {
    /// Initializes a LanceDB instance in the given persistent directory,
    /// and gets or creates the default vault table.
    pub async fn init(persist_dir: &Path) -> Result<Self, String> {
        let path_str = persist_dir
            .to_str()
            .ok_or_else(|| "Invalid persistence directory path".to_string())?;

        let conn = connect(path_str)
            .execute()
            .await
            .map_err(|e| format!("Failed to connect to LanceDB: {}", e))?;

        let db = Self {
            connection: conn,
            table_name: "ater_vault".to_string(),
        };

        // Create the table if it doesn't exist
        db.ensure_table_exists().await?;

        Ok(db)
    }

    /// Helper to get the Arrow schema for the vault table.
    fn get_schema() -> Arc<Schema> {
        Arc::new(Schema::new(vec![
            Field::new("id", DataType::Utf8, false),
            Field::new("content", DataType::Utf8, false),
            Field::new("source", DataType::Utf8, false),
            Field::new("filename", DataType::Utf8, false),
            Field::new("folder", DataType::Utf8, false),
            Field::new("metadata", DataType::Utf8, true),
            Field::new(
                "vector",
                DataType::FixedSizeList(Arc::new(Field::new("item", DataType::Float32, true)), 384),
                false,
            ),
        ]))
    }

    /// Checks if the table exists, and creates it with the correct schema if it doesn't.
    async fn ensure_table_exists(&self) -> Result<(), String> {
        let tables = self
            .connection
            .table_names()
            .execute()
            .await
            .map_err(|e| format!("Failed to list tables: {}", e))?;

        if !tables.contains(&self.table_name) {
            // Create an empty record batch with our schema to initialize the table
            let schema = Self::get_schema();
            let empty_batch = RecordBatch::new_empty(schema.clone());
            let reader = RecordBatchIterator::new(vec![Ok(empty_batch)].into_iter(), schema);

            self.connection
                .create_table(&self.table_name, Box::new(reader))
                .execute()
                .await
                .map_err(|e| format!("Failed to create table '{}': {}", self.table_name, e))?;
        }

        Ok(())
    }

    /// Retrieves the table handle.
    async fn get_table(&self) -> Result<Table, String> {
        self.connection
            .open_table(&self.table_name)
            .execute()
            .await
            .map_err(|e| format!("Failed to open table '{}': {}", self.table_name, e))
    }

    /// Adds a list of vector documents to the database.
    pub async fn add_documents(&self, docs: Vec<VectorDocument>) -> Result<(), String> {
        if docs.is_empty() {
            return Ok(());
        }

        let schema = Self::get_schema();
        let num_rows = docs.len();

        let mut ids = Vec::with_capacity(num_rows);
        let mut contents = Vec::with_capacity(num_rows);
        let mut sources = Vec::with_capacity(num_rows);
        let mut filenames = Vec::with_capacity(num_rows);
        let mut folders = Vec::with_capacity(num_rows);
        let mut metadatas = Vec::with_capacity(num_rows);
        let mut flat_vectors = Vec::with_capacity(num_rows * 384);

        for doc in docs {
            if doc.vector.len() != 384 {
                return Err(format!(
                    "Vector dimension mismatch: expected 384, got {}",
                    doc.vector.len()
                ));
            }
            ids.push(doc.id);
            contents.push(doc.content);
            sources.push(doc.source);
            filenames.push(doc.filename);
            folders.push(doc.folder);
            metadatas.push(doc.metadata);
            flat_vectors.extend(doc.vector);
        }

        let ids_array = StringArray::from(ids);
        let contents_array = StringArray::from(contents);
        let sources_array = StringArray::from(sources);
        let filenames_array = StringArray::from(filenames);
        let folders_array = StringArray::from(folders);
        let metadatas_array = StringArray::from(metadatas);

        let values = Float32Array::from(flat_vectors);
        let values_ref: ArrayRef = Arc::new(values);
        let item_field = Arc::new(Field::new("item", DataType::Float32, true));
        let vector_array = FixedSizeListArray::try_new(item_field, 384, values_ref, None)
            .map_err(|e| format!("Failed to build Arrow FixedSizeListArray: {}", e))?;

        let batch = RecordBatch::try_new(
            schema.clone(),
            vec![
                Arc::new(ids_array),
                Arc::new(contents_array),
                Arc::new(sources_array),
                Arc::new(filenames_array),
                Arc::new(folders_array),
                Arc::new(metadatas_array),
                Arc::new(vector_array),
            ],
        )
        .map_err(|e| format!("Failed to create RecordBatch: {}", e))?;

        let reader = RecordBatchIterator::new(vec![Ok(batch)].into_iter(), schema);

        let table = self.get_table().await?;
        table
            .add(Box::new(reader))
            .execute()
            .await
            .map_err(|e| format!("Failed to add documents to LanceDB: {}", e))?;

        Ok(())
    }

    /// Queries the vector store for nearest neighbors.
    pub async fn query(
        &self,
        query_vector: Vec<f32>,
        n_results: usize,
        where_clause: Option<&str>,
    ) -> Result<Vec<SearchResult>, String> {
        if query_vector.len() != 384 {
            return Err(format!(
                "Query vector dimension mismatch: expected 384, got {}",
                query_vector.len()
            ));
        }

        let table = self.get_table().await?;
        let builder = table.query();

        let mut q_builder = builder
            .nearest_to(query_vector)
            .map_err(|e| format!("Query nearest_to failed: {}", e))?
            .limit(n_results);

        if let Some(clause) = where_clause {
            q_builder = q_builder.only_if(clause);
        }

        let stream = q_builder
            .execute()
            .await
            .map_err(|e| format!("Failed to execute query: {}", e))?;

        let batches: Vec<RecordBatch> = stream
            .try_collect()
            .await
            .map_err(|e| format!("Failed to collect query result stream: {}", e))?;

        let mut results = Vec::new();

        for batch in batches {
            let num_rows = batch.num_rows();
            if num_rows == 0 {
                continue;
            }

            let ids_col = batch
                .column_by_name("id")
                .ok_or_else(|| "id column not found in results".to_string())?
                .as_any()
                .downcast_ref::<StringArray>()
                .ok_or_else(|| "Failed to downcast id column".to_string())?;

            let content_col = batch
                .column_by_name("content")
                .ok_or_else(|| "content column not found in results".to_string())?
                .as_any()
                .downcast_ref::<StringArray>()
                .ok_or_else(|| "Failed to downcast content column".to_string())?;

            let source_col = batch
                .column_by_name("source")
                .ok_or_else(|| "source column not found in results".to_string())?
                .as_any()
                .downcast_ref::<StringArray>()
                .ok_or_else(|| "Failed to downcast source column".to_string())?;

            let filename_col = batch
                .column_by_name("filename")
                .ok_or_else(|| "filename column not found in results".to_string())?
                .as_any()
                .downcast_ref::<StringArray>()
                .ok_or_else(|| "Failed to downcast filename column".to_string())?;

            let folder_col = batch
                .column_by_name("folder")
                .ok_or_else(|| "folder column not found in results".to_string())?
                .as_any()
                .downcast_ref::<StringArray>()
                .ok_or_else(|| "Failed to downcast folder column".to_string())?;

            let metadata_col = batch
                .column_by_name("metadata")
                .ok_or_else(|| "metadata column not found in results".to_string())?
                .as_any()
                .downcast_ref::<StringArray>()
                .ok_or_else(|| "Failed to downcast metadata column".to_string())?;

            let distance_col = batch
                .column_by_name("_distance")
                .ok_or_else(|| "_distance column not found in results".to_string())?
                .as_any()
                .downcast_ref::<Float32Array>()
                .ok_or_else(|| "Failed to downcast _distance column".to_string())?;

            for i in 0..num_rows {
                results.push(SearchResult {
                    id: ids_col.value(i).to_string(),
                    content: content_col.value(i).to_string(),
                    source: source_col.value(i).to_string(),
                    filename: filename_col.value(i).to_string(),
                    folder: folder_col.value(i).to_string(),
                    metadata: metadata_col.value(i).to_string(),
                    distance: distance_col.value(i),
                });
            }
        }

        Ok(results)
    }

    /// Deletes all documents matching a SQL filter predicate (e.g. source = 'file_path').
    pub async fn delete_documents(&self, filter: &str) -> Result<(), String> {
        let table = self.get_table().await?;
        table
            .delete(filter)
            .await
            .map_err(|e| format!("Failed to delete documents: {}", e))?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::SystemTime;

    #[tokio::test]
    async fn test_vector_db_workflow() {
        let now = SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let temp_dir = std::env::temp_dir().join(format!("lancedb_test_{}", now));
        std::fs::create_dir_all(&temp_dir).unwrap();

        // 1. Initialize DB
        let db = VectorDB::init(&temp_dir).await.expect("Failed to init DB");

        // 2. Insert dummy vector
        let dummy_vector = vec![0.5f32; 384];
        let doc = VectorDocument {
            id: "test_doc_1".to_string(),
            content: "This is a native Rust vector database test.".to_string(),
            source: "/path/to/test.md".to_string(),
            filename: "test.md".to_string(),
            folder: "test".to_string(),
            metadata: r#"{"Header 1": "Test Section"}"#.to_string(),
            vector: dummy_vector.clone(),
        };

        db.add_documents(vec![doc])
            .await
            .expect("Failed to add document");

        // 3. Search for the inserted vector
        let search_results = db.query(dummy_vector, 5, None).await.expect("Query failed");
        assert!(
            !search_results.is_empty(),
            "Search results should not be empty"
        );
        assert_eq!(search_results[0].id, "test_doc_1");
        assert_eq!(
            search_results[0].content,
            "This is a native Rust vector database test."
        );

        // 4. Delete the document
        db.delete_documents("source = '/path/to/test.md'")
            .await
            .expect("Delete failed");

        // 5. Verify deletion
        let dummy_vector_2 = vec![0.5f32; 384];
        let search_results_after_delete = db
            .query(dummy_vector_2, 5, None)
            .await
            .expect("Query failed");
        assert!(
            search_results_after_delete.is_empty(),
            "Search results should be empty after deletion"
        );

        // Clean up
        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
