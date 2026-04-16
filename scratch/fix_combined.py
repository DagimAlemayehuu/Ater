import os
import shutil

BASE_DIR = "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/2-Academic/Year II/Semester I"
GENERAL_COMBINED = os.path.join(BASE_DIR, "General", "_Combined")

mapping = {
    "Programming": "Computer Programming",
    "C++": "Computer Programming",
    "Control_Structure": "Computer Programming",
    "Arrays": "Computer Programming",
    "Modular": "Computer Programming",
    "User_Defined": "Computer Programming",
    "File_Management": "Computer Programming",
    "Database": "Database Systems",
    "DBMS": "Database Systems",
    "Conceptual": "Database Systems",
    "Logical": "Database Systems",
    "Physical": "Database Systems",
    "SQL": "Database Systems",
    "Relational": "Database Systems",
    "Math": "Discrete Mathematics",
    "Counting": "Discrete Mathematics",
    "Recurrence": "Discrete Mathematics",
    "Graph_Theory": "Discrete Mathematics",
    "Directed_Graphs": "Discrete Mathematics",
    "Weighted_Graphs": "Discrete Mathematics",
    "Inclusive": "Inclusiveness",
    "Disability": "Inclusiveness",
    "Vulnerability": "Inclusiveness",
    "Impact": "Inclusiveness",
    "Culture": "Inclusiveness",
    "Peace": "Inclusiveness",
    "Policy": "Inclusiveness",
    "Resource_Management": "Inclusiveness",
    "Stakeholders": "Inclusiveness",
    "Statistics": "Statistics And Probability",
    "Probability": "Statistics And Probability",
    "Statistical_Data": "Statistics And Probability",
    "Central_Tendency": "Statistics And Probability",
    "Variations": "Statistics And Probability",
    "Correlation": "Statistics And Probability",
}

def fix_combined():
    if not os.path.exists(GENERAL_COMBINED):
        return
    
    for file in os.listdir(GENERAL_COMBINED):
        if not file.endswith(".md"):
            continue
        
        target_course = "General"
        for key, course in mapping.items():
            if key in file:
                target_course = course
                break
        
        if target_course != "General":
            target_dir = os.path.join(BASE_DIR, target_course, "_Combined")
            os.makedirs(target_dir, exist_ok=True)
            shutil.move(os.path.join(GENERAL_COMBINED, file), os.path.join(target_dir, file))
            print(f"Moved {file} to {target_course}")

if __name__ == "__main__":
    fix_combined()
    # Cleanup empty General folder if needed
    if os.path.exists(GENERAL_COMBINED) and not os.listdir(GENERAL_COMBINED):
        os.rmdir(GENERAL_COMBINED)
    general_dir = os.path.join(BASE_DIR, "General")
    if os.path.exists(general_dir) and not os.listdir(general_dir):
        os.rmdir(general_dir)
