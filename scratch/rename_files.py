import os

BASE_ACADEMIC = "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/2-Academic/Year II/Semester I"

def rename_to_spaces(root_dir):
    for root, dirs, files in os.walk(root_dir):
        # First rename files
        for file in files:
            if "_" in file and file.endswith(".md"):
                new_file = file.replace("_", " ")
                old_path = os.path.join(root, file)
                new_path = os.path.join(root, new_file)
                if not os.path.exists(new_path):
                    os.rename(old_path, new_path)
                    print(f"Renamed: {file} -> {new_file}")
        
if __name__ == "__main__":
    rename_to_spaces(BASE_ACADEMIC)
