import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer

def mean_pooling(model_output, attention_mask):
    # First element of model_output contains all token embeddings (last_hidden_state)
    token_embeddings = model_output[0]  
    input_mask_expanded = np.expand_dims(attention_mask, -1).astype(float)
    sum_embeddings = np.sum(token_embeddings * input_mask_expanded, 1)
    sum_mask = np.clip(input_mask_expanded.sum(1), a_min=1e-9, a_max=None)
    return sum_embeddings / sum_mask

def main():
    model_dir = "onnx_model"
    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    
    # Load ONNX Session
    session = ort.InferenceSession(f"{model_dir}/model.onnx")
    
    # Tokenize input
    text = "test"
    encoded_input = tokenizer(text, padding=True, truncation=True, return_tensors="np")
    
    # Prepare inputs for ONNX
    onnx_inputs = {
        "input_ids": encoded_input["input_ids"].astype(np.int64),
        "attention_mask": encoded_input["attention_mask"].astype(np.int64),
        "token_type_ids": encoded_input["token_type_ids"].astype(np.int64)
    }
    
    # Run session
    outputs = session.run(None, onnx_inputs)
    
    # Apply mean pooling
    embeddings = mean_pooling(outputs, encoded_input["attention_mask"])
    
    print(f"Text: '{text}'")
    print(f"Embedding shape: {embeddings.shape}")
    print(f"First 5 values: {embeddings[0][:5]}")
    
    # Perform a sanity check on dimensions
    assert embeddings.shape == (1, 384), f"Expected shape (1, 384), got {embeddings.shape}"
    print("Sanity check passed! Model inference is correct.")

if __name__ == "__main__":
    main()
