#!/usr/bin/env python3
import sys
import os
from pathlib import Path

# Add current directory to path so we can import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from orchestrator import AterOrchestrator

def main():
    if len(sys.argv) < 2:
        # Fallback to reading from ai_batch_input.md in root
        input_file = Path("ai_batch_input.md")
        if not input_file.exists():
            print("Usage: python service.py <path_to_source_text_file>")
            print("OR: Place source text in 'ai_batch_input.md' in the project root.")
            return
        
        with open(input_file, "r") as f:
            source_text = f.read()
    else:
        source_path = Path(sys.argv[1])
        if not source_path.exists():
            print(f"Error: File {source_path} not found.")
            return
        with open(source_path, "r") as f:
            source_text = f.read()

    if not source_text.strip():
        print("Error: Source text is empty.")
        return

    print("🚀 Initializing Ater v10 Orchestrator...")
    orchestrator = AterOrchestrator()
    orchestrator.run_pipeline(source_text)

if __name__ == "__main__":
    main()
