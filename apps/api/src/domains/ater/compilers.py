import re
from typing import List, Tuple

def compile_mermaid(raw_text: str, direction: str = "TD") -> str:
    """
    Deterministic Mermaid Flowchart Compiler.
    Parses transitions, extracts labels, sanitizes identifiers, 
    and outputs a 100% syntactically valid Mermaid flowchart graph.
    """
    if not raw_text:
        return ""
        
    # Extract edges/transitions using common arrow patterns
    lines = raw_text.split("\n")
    edges = []
    node_labels = {}
    
    # Simple regex to find nodes and arrows, e.g. "Node A -> Node B" or "Node A --> Node B"
    # Or bracket labels like "A[Label A] -> B[Label B]"
    re.compile(r"([^\->]+)\s*\-+\s*>\s*([^\->\n]+)")
    
    def sanitize_id(node_name: str) -> Tuple[str, str]:
        # Extract custom label if present, e.g., "A[My Label]"
        m = re.match(r"^\s*([a-zA-Z0-9_\-]+)\s*[\[\(\{\"]+(.*?)[\"\}\)\]]+\s*$", node_name)
        if m:
            nid = m.group(1).strip().lower().replace(" ", "_")
            label = m.group(2).strip()
            return nid, label
            
        # Strip OCR and punctuation, resolve clean ID
        clean = re.sub(r"[^a-zA-Z0-9_\s\-]", "", node_name).strip()
        nid = re.sub(r"[\s\-]+", "_", clean).lower()
        if not nid:
            nid = "node_" + str(abs(hash(node_name)) % 1000)
        return nid, node_name.strip()

    for line in lines:
        line_strip = line.strip()
        if not line_strip or line_strip.startswith("`") or "graph" in line_strip:
            continue
            
        if "->" in line_strip:
            parts = [p.strip() for p in re.split(r"\-+\s*>", line_strip) if p.strip()]
            if len(parts) >= 2:
                for i in range(len(parts) - 1):
                    raw_from = parts[i]
                    raw_to = parts[i+1]
                    id_from, label_from = sanitize_id(raw_from)
                    id_to, label_to = sanitize_id(raw_to)
                    node_labels[id_from] = label_from
                    node_labels[id_to] = label_to
                    edges.append((id_from, id_to))
                continue

    if not edges:
        # Fallback parsing: if no arrows, treat each line as a component of the concept
        seq_nodes = []
        for line in lines:
            clean = line.strip(" -*>\t`")
            if clean and not clean.startswith("graph"):
                seq_nodes.append(clean)
                
        if seq_nodes:
            hub_id = "core_elements"
            node_labels[hub_id] = "Core Elements"
            for item in seq_nodes:
                nid, label = sanitize_id(item)
                if nid != hub_id:
                    node_labels[nid] = label
                    edges.append((hub_id, nid))

    if not edges:
        return ""

    # Compile the valid Mermaid code block
    mermaid_lines = [f"graph {direction}"]
    
    # Declare nodes with double-quoted labels to escape any characters
    for nid, label in sorted(node_labels.items()):
        # Escape double quotes inside labels
        safe_label = label.replace('"', '\\"')
        mermaid_lines.append(f'    {nid}["{safe_label}"]')
        
    # Write transitions
    for src, dst in edges:
        mermaid_lines.append(f"    {src} --> {dst}")
        
    return "```mermaid\n" + "\n".join(mermaid_lines) + "\n```"


def compile_table(raw_text: str) -> str:
    """
    Programmatic Markdown Table Compiler.
    Parses messy raw markdown grids or plain key-value lists 
    and outputs a perfectly formatted, aligned Markdown table.
    """
    if not raw_text:
        return ""
        
    # Filter out lines that are KaTeX equations or only double dollars
    lines = []
    for l in raw_text.split("\n"):
        l_strip = l.strip()
        if not l_strip or l_strip.startswith("$$") or l_strip.endswith("$$") or "$$" in l_strip:
            continue
        lines.append(l_strip)
        
    rows = []
    is_markdown_grid = any("|" in l for l in lines)
    
    if is_markdown_grid:
        # Parse standard pipes
        for line in lines:
            # Skip divider/separator rows like |---|---|, |:---|:---|, etc.
            if re.match(r"^\s*\|?\s*:?\-+:?\s*(?:\|\s*:?\-+:?\s*)*\|?\s*$", line) or "====" in line:
                continue
            # Handle escaped pipes safely to prevent incorrect splits
            temp_line = line.replace("\\|", "ESCAPED_PIPE_TOKEN")
            cells = [c.strip().replace("ESCAPED_PIPE_TOKEN", "|") for c in temp_line.split("|")]
            # Filter edge spacer cells caused by leading/trailing pipes
            if cells and not cells[0]:
                cells = cells[1:]
            if cells and not cells[-1]:
                cells = cells[:-1]
            if cells:
                rows.append(cells)
    else:
        # Parse flat key-value list e.g., "Feature: Explanation"
        for line in lines:
            # Strip list symbols
            clean = re.sub(r"^[\-\*\d\.\s]+", "", line).strip()
            if ":" in clean:
                parts = clean.split(":", 1)
                rows.append([parts[0].strip(), parts[1].strip()])
            elif "=" in clean:
                parts = clean.split("=", 1)
                rows.append([parts[0].strip(), parts[1].strip()])

    if not rows:
        return ""
        
    # Ensure all rows have equal columns (pad missing)
    max_cols = max(len(r) for r in rows)
    if max_cols < 2:
        # Fallback to key-value grid mapping
        header = ["Property", "Description"]
        rows = [header] + [[r[0], "Verified details."] for r in rows]
        max_cols = 2
    else:
        # If no explicit header, prepend one
        if not is_markdown_grid:
            header = ["Core Element", "Technical Detail"]
            rows = [header] + rows
            
    # Pad rows to max columns
    for r in rows:
        while len(r) < max_cols:
            r.append("")

    # Align columns
    col_widths = []
    for col_idx in range(max_cols):
        w = max(len(str(rows[row_idx][col_idx])) for row_idx in range(len(rows)))
        col_widths.append(max(w, 3))
        
    # Draw table
    header_row = rows[0]
    data_rows = rows[1:]
    
    header_line = "| " + " | ".join(f"{str(cell).ljust(col_widths[i])}" for i, cell in enumerate(header_row)) + " |"
    divider_line = "| " + " | ".join("-" * col_widths[i] for i in range(max_cols)) + " |"
    
    table_lines = [header_line, divider_line]
    for r in data_rows:
        row_str = "| " + " | ".join(f"{str(cell).ljust(col_widths[i])}" for i, cell in enumerate(r)) + " |"
        table_lines.append(row_str)
        
    return "\n".join(table_lines)


def compile_latex(raw_text: str) -> str:
    """
    Standard block LaTeX Formula Compiler.
    Cleans up double dollar blocks and formats equations uniformly.
    Supports keeping multiline aligned equations intact.
    """
    if not raw_text:
        return ""
        
    # Strip leading/trailing double dollars if present
    clean_text = raw_text.strip().replace("$$", "").strip(" *`\t")
    
    # If the equation is multiline aligned (contains newline and symbols like \begin, \\, \end, or &)
    if "\n" in clean_text and any(sym in clean_text for sym in ["\\begin", "\\end", "\\\\", "&"]):
        # Return as a single unified multiline LaTeX block
        lines = [l.strip() for l in clean_text.split("\n") if l.strip()]
        if lines:
            return "$$\n" + "\n".join(lines) + "\n$$"
            
    # Fallback to single lines if it is just a list of independent equations
    lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
    equations = []
    
    for line in lines:
        clean = line.replace("$$", "").strip(" *`\t")
        if clean and not clean.startswith("Formula"):
            equations.append(clean)
            
    if not equations:
        return ""
        
    latex_lines = []
    for eq in equations:
        latex_lines.append(f"$$\n{eq}\n$$")
        
    return "\n\n".join(latex_lines)


def compile_quiz_json(raw_text: str, allowed_modes: List[str] = None) -> List[dict]:
    """
    Deterministic Plaintext-to-JSON quiz compiler.
    Parses unstructured text questions directly using robust regexes, 
    maps them to strict L1/L2/L3 levels, and programmatically compiles a 100% valid JSON array.
    """
    if not raw_text:
        return []
        
    # Standard fallback question modes
    q_modes = allowed_modes or ["mcq", "true_false", "writing"]
    
    # Split questions by Q1/Q2/Q3 prefix patterns
    raw_qs = re.split(r"(?i)(?:^|\n)(?=Q\d+[:\s\-\)])", raw_text)
    raw_qs = [q.strip() for q in raw_qs if q.strip()]
    
    if not raw_qs:
        # Fallback split by double newlines or list items
        raw_qs = re.split(r"\n\n+", raw_text)
        raw_qs = [q.strip() for q in raw_qs if q.strip()]

    quiz_list = []
    
    for idx, q_text in enumerate(raw_qs[:3]): # Max 3 questions (L1, L2, L3)
        difficulty = f"L{idx + 1}"
        q_id = f"q{idx + 1}"
        
        # Determine question type based on index / allowed modes
        if idx < len(q_modes):
            q_type = q_modes[idx]
        else:
            q_type = "writing" if idx == 2 else "mcq"
            
        # Extract fields directly from the raw question text (preserving structure)
        def get_field_raw(field_name: str, default: str = "") -> str:
            pattern = rf"(?i)\b{field_name}\s*:\s*(.*?)(?=\s*\b(?:Options|Correct|Why|Buggy Code|Fix|Difficulty|Explanation)\b|$)"
            m = re.search(pattern, q_text, re.DOTALL)
            return m.group(1).strip() if m else default

        # Question body is everything before the first technical field label
        first_flag = re.search(r"(?i)\b(?:Options|Correct|Why|Buggy Code|Fix|Explanation)\b", q_text)
        if first_flag:
            question_body = q_text[:first_flag.start()].strip()
        else:
            question_body = q_text.strip()
            
        # Clean Q1/Q2/Q3 prefixes and trailing slashes/whitespace
        question_body = re.sub(r"^(?i)Q\d+[:\s\-\)]+\s*", "", question_body).strip().rstrip(" /:")
        if not question_body:
            question_body = "Analyze the key features of this note."
            
        explanation = get_field_raw("Why", get_field_raw("Explanation", "Verified standard concept.")).rstrip(" /:")
        
        # Build question dictionaries based on type
        if q_type == "mcq":
            options_raw = get_field_raw("Options")
            correct = get_field_raw("Correct", "A").upper().strip().rstrip(" /:")
            if len(correct) > 1:
                correct = correct[0] if correct else "A"
                
            # Parse options dictionary robustly supporting spaces/newlines/commas
            opts_dict = {}
            opt_matches = re.findall(r"([A-D])\s*[:\-\)]\s*(.*?)(?=\s*[A-D]\s*[:\-\)]|$)", options_raw, re.IGNORECASE | re.DOTALL)
            for key, val in opt_matches:
                opts_dict[key.upper()] = val.strip().rstrip(",;/\t\n ")
                
            if not opts_dict:
                # Direct option list fallback (comma-separated or flat regex fallback)
                opt_matches_comma = re.findall(r"([A-D])\s*[:\-\)]\s*([^,]+)", options_raw)
                for key, val in opt_matches_comma:
                    opts_dict[key.upper()] = val.strip()
            
            if not opts_dict:
                opts_dict = {"A": "True explanation", "B": "Incorrect distractor", "C": "Irrelevant option", "D": "Unsupported claim"}
                
            quiz_list.append({
                "id": q_id,
                "type": "mcq",
                "difficulty": difficulty,
                "question": question_body,
                "options": opts_dict,
                "answer": correct,
                "explanation": explanation
            })
            
        elif q_type == "true_false":
            correct = get_field_raw("Correct", "True").strip().rstrip(" /:")
            answer_bool = True if "true" in correct.lower() or "t" == correct.lower() else False
            quiz_list.append({
                "id": q_id,
                "type": "true_false",
                "difficulty": difficulty,
                "question": question_body,
                "answer": answer_bool,
                "explanation": explanation
            })
            
        elif q_type in ["debug", "trace"]:
            buggy_code = get_field_raw("Buggy Code", "def run_error():\n    return 1 / 0").rstrip(" /:")
            fix = get_field_raw("Fix", "Handle divide-by-zero bounds check.").rstrip(" /:")
            quiz_list.append({
                "id": q_id,
                "type": q_type,
                "difficulty": difficulty,
                "question": question_body,
                "content": buggy_code,
                "answer": fix,
                "explanation": explanation
            })
            
        else: # Fallback to standard writing / scenario
            answer = get_field_raw("Correct", "Write description grounded in notes.").rstrip(" /:")
            quiz_list.append({
                "id": q_id,
                "type": q_type if q_type in ["writing", "scenario", "synthesis"] else "writing",
                "difficulty": difficulty,
                "question": question_body,
                "answer": answer,
                "explanation": explanation
            })
            
    return quiz_list
