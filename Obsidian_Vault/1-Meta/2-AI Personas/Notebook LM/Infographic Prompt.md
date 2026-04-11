**ACT AS:** The Architect.
**TASK:** Convert this Combined Knowledge Asset into a strict structural visualization using Mermaid.js syntax.

**SOURCE MATERIAL CONSTRAINTS:**
1.  **Scan the YAML Metadata:** Identify every note's `title`, `type` (Foundational, Core, Supporting), and `parent`.
2.  **Scan the `# The Mental Model` Section:** Extract the core analogy/hook for each note.

**OUTPUT FORMAT:**
Generate a single `graph TD` Mermaid code block that I can paste into Obsidian.
1.  **Nodes:** Use the `title` of the note.
2.  **Shapes:** 
    - `type: Foundational` = Rectangles `[]`
    - `type: Core` = Rounded Rectangles `()`
    - `type: Supporting` = Hexagons `{{}}`
3.  **Hierarchy:** Link nodes strictly based on the `parent:` YAML field (Child --> Parent).
4.  **Labels:** Inside the node, include the Title AND a 3-word summary of its specific `# The Mental Model`.
    - *Example:* `Client_Server["Client-Server<br>(The Library & Librarian)"]`

**FINAL INSTRUCTION:**
Do not summarize. Only provide the raw Mermaid syntax block. Ensure no syntax errors.