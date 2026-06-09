use ort::session::Session;
use ort::value::Tensor;
use std::path::Path;
use tokenizers::Tokenizer;

pub struct ModelEngine {
    session: Session,
    tokenizer: Tokenizer,
}

impl ModelEngine {
    /// Initializes the ONNX model session and tokenizer from the specified directory.
    pub fn init(model_dir: &Path) -> Result<Self, String> {
        let model_path = model_dir.join("model.onnx");
        let tokenizer_path = model_dir.join("tokenizer.json");

        if !model_path.exists() {
            return Err(format!("model.onnx does not exist at {:?}", model_path));
        }
        if !tokenizer_path.exists() {
            return Err(format!(
                "tokenizer.json does not exist at {:?}",
                tokenizer_path
            ));
        }

        let mut tokenizer = Tokenizer::from_file(&tokenizer_path)
            .map_err(|e| format!("Failed to load tokenizer: {}", e))?;

        if let Some(params) = tokenizer.get_truncation() {
            let mut new_params = params.clone();
            new_params.max_length = 512;
            tokenizer
                .with_truncation(Some(new_params))
                .map_err(|e| format!("Failed to configure tokenizer truncation: {}", e))?;
        } else {
            tokenizer
                .with_truncation(Some(tokenizers::utils::truncation::TruncationParams {
                    max_length: 512,
                    ..Default::default()
                }))
                .map_err(|e| format!("Failed to configure tokenizer truncation: {}", e))?;
        }

        let session = Session::builder()
            .map_err(|e| format!("Failed to create session builder: {}", e))?
            .commit_from_file(&model_path)
            .map_err(|e| format!("Failed to load ONNX model: {}", e))?;

        Ok(Self { session, tokenizer })
    }

    /// Tokenizes the input text, runs inference on the model, and performs mean pooling on the output embeddings.
    pub fn get_embedding(&mut self, text: &str) -> Result<Vec<f32>, String> {
        let encoding = self
            .tokenizer
            .encode(text, true)
            .map_err(|e| format!("Failed to tokenize text: {}", e))?;

        let ids = encoding.get_ids();
        let mask = encoding.get_attention_mask();
        let type_ids = encoding.get_type_ids();

        let seq_len = ids.len();

        let input_ids_vec: Vec<i64> = ids.iter().map(|&x| x as i64).collect();
        let attention_mask_vec: Vec<i64> = mask.iter().map(|&x| x as i64).collect();
        let token_type_ids_vec: Vec<i64> = type_ids.iter().map(|&x| x as i64).collect();

        let input_ids = ndarray::Array2::from_shape_vec((1, seq_len), input_ids_vec)
            .map_err(|e| format!("Failed to construct input_ids ndarray: {}", e))?;
        let attention_mask = ndarray::Array2::from_shape_vec((1, seq_len), attention_mask_vec)
            .map_err(|e| format!("Failed to construct attention_mask ndarray: {}", e))?;
        let token_type_ids = ndarray::Array2::from_shape_vec((1, seq_len), token_type_ids_vec)
            .map_err(|e| format!("Failed to construct token_type_ids ndarray: {}", e))?;

        let input_ids_tensor = Tensor::from_array(input_ids)
            .map_err(|e| format!("Failed to create input_ids tensor: {}", e))?;
        let attention_mask_tensor = Tensor::from_array(attention_mask)
            .map_err(|e| format!("Failed to create attention_mask tensor: {}", e))?;
        let token_type_ids_tensor = Tensor::from_array(token_type_ids)
            .map_err(|e| format!("Failed to create token_type_ids tensor: {}", e))?;

        // Run inference
        let outputs = self
            .session
            .run(ort::inputs![
                "input_ids" => input_ids_tensor,
                "attention_mask" => attention_mask_tensor,
                "token_type_ids" => token_type_ids_tensor
            ])
            .map_err(|e| format!("ONNX execution failed: {}", e))?;

        // Extract outputs
        let output_tensor = outputs[0]
            .try_extract_array::<f32>()
            .map_err(|e| format!("Failed to extract model output array: {}", e))?;

        let view = output_tensor
            .into_dimensionality::<ndarray::Ix3>()
            .map_err(|e| format!("Output tensor dimensional mismatch (expected 3D): {}", e))?;

        let (batch_size, sequence_length, hidden_size) = view.dim();
        if batch_size != 1 {
            return Err(format!("Expected batch size 1, got {}", batch_size));
        }

        // Apply mean pooling
        let mut pooled = vec![0.0f32; hidden_size];
        let mut sum_mask = 0.0f32;

        for token_idx in 0..sequence_length {
            let mask_val = mask[token_idx] as f32;
            sum_mask += mask_val;
            for feature_idx in 0..hidden_size {
                pooled[feature_idx] += view[[0, token_idx, feature_idx]] * mask_val;
            }
        }

        if sum_mask > 1e-9 {
            for item in pooled.iter_mut().take(hidden_size) {
                *item /= sum_mask;
            }
        }

        Ok(pooled)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_ml_inference() {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let model_dir = PathBuf::from(manifest_dir).join("../../../apps/api/onnx_model");

        println!("Initializing ModelEngine from {:?}", model_dir);
        let mut engine =
            ModelEngine::init(&model_dir).expect("Failed to initialize ModelEngine for testing");

        let text = "test inference";
        let embedding = engine
            .get_embedding(text)
            .expect("Failed to generate embedding");

        println!(
            "Successfully generated embedding of length {}",
            embedding.len()
        );
        assert_eq!(embedding.len(), 384, "Embedding size should be 384");

        // Assert that the values are not all NaN or all zero
        let sum: f32 = embedding.iter().sum();
        assert!(sum.abs() > 1e-5, "Embedding should not be zeroed out");
        assert!(!sum.is_nan(), "Embedding should not contain NaNs");
    }

    #[test]
    fn test_ml_edge_cases() {
        let manifest_dir = env!("CARGO_MANIFEST_DIR");
        let model_dir = PathBuf::from(manifest_dir).join("../../../apps/api/onnx_model");
        let mut engine =
            ModelEngine::init(&model_dir).expect("Failed to initialize ModelEngine for testing");

        // 1. Empty string input
        let empty_embedding = engine
            .get_embedding("")
            .expect("Failed to handle empty string");
        assert_eq!(empty_embedding.len(), 384);

        // 2. Massive text input
        let massive_text = "test ".repeat(10000);
        let massive_embedding = engine
            .get_embedding(&massive_text)
            .expect("Failed to handle massive text input");
        assert_eq!(massive_embedding.len(), 384);
    }
}
