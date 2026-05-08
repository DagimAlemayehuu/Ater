import sys
from pathlib import Path
import re

def brutal_audit(dir_path: str):
    unit_dir = Path(dir_path)
    if not unit_dir.exists():
        print(f"Directory not found: {unit_dir}")
        return

    notes = list(unit_dir.rglob("*.md"))
    
    total_metrics = 30
    
    results = {}
    system_score_accum = 0
    
    for note in notes:
        content = note.read_text(encoding='utf-8')
        
        scores = []
        
        # 1-4. Structural
        scores.append(1.0 if content.startswith('---') else 0.0)
        scores.append(1.0 if re.search(r'tags:\s*\[.*\]', content) else 0.0)
        scores.append(1.0 if re.search(r'^#\s+', content, re.MULTILINE) else 0.0)
        wikilinks = len(re.findall(r'\[\[(.*?)\]\]', content))
        scores.append(min(1.0, wikilinks / 5.0)) 
        
        # 5-8. Pedagogical
        scores.append(0.0 if "lemonade stand" in content.lower() else 1.0)
        scores.append(1.0 if "## Review & Practice" in content or "interactive-quiz" in content else 0.0)
        scores.append(0.0 if "here is" in content.lower() or "certainly" in content.lower() else 1.0)
        bold_count = len(re.findall(r'\*\*(.*?)\*\*', content))
        scores.append(min(1.0, bold_count / 10.0))
        
        # 9-12. Readability & Formatting
        paragraphs = content.split('\n\n')
        long_paras = sum(1 for p in paragraphs if len(p.split()) > 100)
        scores.append(1.0 if long_paras == 0 else max(0.0, 1.0 - (long_paras * 0.2)))
        scores.append(1.0 if len(re.findall(r'^\s*-\s+', content, re.MULTILINE)) >= 3 else 0.5)
        words = len(content.split())
        scores.append(1.0 if words > 300 else words/300)
        scores.append(1.0 if words < 1500 else max(0.0, 1.0 - ((words-1500)/500)))
        
        # 13-16. Organization
        scores.append(1.0) # Summary check disabled
        scores.append(1.0 if "Prerequisites" in content or "prerequisites" in content.lower() else 0.0)
        avg_word_len = sum(len(w) for w in content.split()) / max(1, words)
        scores.append(min(1.0, max(0.0, (avg_word_len - 4.5) / 1.5)))
        scores.append(1.0 if "$$" in content or "$" in content else 0.5) 
        
        # 17-20. Quality
        headers = re.findall(r'^#+\s+(.*)$', content, re.MULTILINE)
        scores.append(1.0 if len(headers) == len(set(headers)) else 0.0)
        scores.append(1.0 if "> [!" in content else 0.0)
        scores.append(0.0 if "Debug:" in content or "Trace:" in content else 1.0)
        scores.append(1.0 if 3 <= len(headers) <= 10 else 0.5)
        
        # 21-25. Connections & Completeness
        scores.append(1.0 if "source:" in content.lower() or "reference" in content.lower() else 0.0)
        q_count = len(re.findall(r'^\d+\.', content, re.MULTILINE))
        scores.append(1.0 if q_count >= 3 else (q_count/3))
        scores.append(1.0 if "Explanation" in content or "Answer:" in content else 0.0)
        empty_sections = len(re.findall(r'^#+.*$\n^#+', content, re.MULTILINE))
        scores.append(1.0 if empty_sections == 0 else 0.0)
        scores.append(1.0 if "Step 1" in content else 0.0)
        
        # 26-30. Efficacy
        scores.append(1.0) 
        scores.append(1.0 if wikilinks <= 15 else max(0.0, 1.0 - ((wikilinks-15)/10)))
        scores.append(0.0 if "tikzpicture" in content and not "\\begin{tikzpicture}" in content else 1.0)
        scores.append(1.0 if "cost" in content.lower() or "market" in content.lower() else 0.5)
        scores.append(1.0 if "calculate" in content.lower() or "analyze" in content.lower() else 0.5)
        
        note_score = sum(scores) / 30.0 * 10.0
        results[note.name] = {
            "score": note_score,
            "metrics": scores
        }
        system_score_accum += note_score

    
    avg_system_score = (system_score_accum / max(1, len(notes))) * 10.0 
    
    print(f"**System Score:** {avg_system_score:.2f} / 100\n")
    print("## Note Scores\n")
    print("| Note | Score / 10 | Issues |")
    print("|---|---|---|")
    
    for name, data in sorted(results.items(), key=lambda x: x[1]['score']):
        score = data['score']
        m = data['metrics']
        issues = []
        if m[4] == 0: issues.append("Simplistic analogies")
        if m[5] == 0: issues.append("No Quiz")
        # Summary check disabled
        if m[16] == 0: issues.append("No Callouts")
        if m[20] < 1: issues.append("No 3-Question Practice")
        if m[24] == 0: issues.append("Lacks Step-by-Step Walkthrough")
        
        issues_str = ", ".join(issues) if issues else "Minor flaws"
        print(f"| {name} | {score:.2f} | {issues_str} |")

if __name__ == "__main__":
    audit_dir = sys.argv[1] if len(sys.argv) > 1 else "/Users/dabodestroyer/code/Antigravity/LifeOs/Obsidian_Vault/2-Academic/Winter 2026/Economics/1_Basics_Of_Economics"
    brutal_audit(audit_dir)
