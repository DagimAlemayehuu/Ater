import os
import subprocess
import sys
from pathlib import Path

def main():
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    output_dir = Path(__file__).parent / "onnx_model"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Exporting model '{model_name}' to '{output_dir}'...")
    
    try:
        # Run optimum export using python module interface
        cmd = [
            sys.executable,
            "-m", "optimum.exporters.onnx",
            "--model", model_name,
            "--task", "feature-extraction",
            "--library-name", "transformers",
            str(output_dir)
        ]
        print(f"Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print("ONNX export command stdout:")
        print(result.stdout)
        print("ONNX model exported successfully!")
    except subprocess.CalledProcessError as e:
        print("Error exporting model to ONNX:", file=sys.stderr)
        print("STDOUT:", e.stdout, file=sys.stderr)
        print("STDERR:", e.stderr, file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
