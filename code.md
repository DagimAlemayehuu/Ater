# Perfect Obsidian Vault Replica - Stitch Prompt

Copy and paste this exact prompt into Stitch to force it to generate the dense, functional Obsidian text editor instead of a generic marketing dashboard.

---

**PROMPT TO PASTE INTO STITCH:**

Build a pixel-perfect, highly complex replica of a dual-pane Obsidian markdown desktop application. 
CRITICAL RULE: DO NOT BUILD A DASHBOARD. NO METRIC CARDS. NO CHARTS. NO ABSTRACT GRAPHICS. NO SAAS LANDING PAGE ELEMENTS. You are building a complex, dense markdown code/text editor specifically focused on high information density.

**DESIGN SYSTEM (REQUIRED KEY-VALUES):**
- **Platform:** Web application designed to look like a native Desktop App.
- **Theme:** Utilitarian, Ultra-Minimalist, "Digital Architect" vibe.
- **Background:** Main editor is Pure White (#ffffff). The left file explorer is very light gray (#fafafa).
- **Surface Details:** Replace all shadows with sharp, sub-pixel 1px borders (#e5e5e5). NO DROP SHADOWS anywhere. 
- **Active Accents:** Pure Solid Black (#000000) for the currently selected file `bg-black`. Text on active file must be white.
- **Typography:** Inter. Focus on compact sizing. Editor body text must be 15px with optimal reading line-height. Small labels must be 10px, bold, uppercase tracking.
- **Information Density:** Extremely high. List items in the sidebar should have only 4px vertical padding.

**PAGE STRUCTURE (LITERAL LAYOUT):**

**1. Left Ribbon (Icon Bar - 64px width)**
- Pin to the far left. White background, 1px right border.
- Top section: A vertical column of 3 minimalist icons (FileText [active], Search, Users). Active icon has a light gray rounded square behind it.
- Bottom section: Settings icon.

**2. Left File Explorer Pane (280px width)**
- Background: #fafafa with 1px right border.
- Top: An ultra-thin search bar with a magnifying glass icon. No heavy shading.
- Body: A deeply nested, highly dense vertical list of folders and `.md` files. Use chevron icons for folders and document icons for files.
- **Crucial Detail:** Show a file named "3_Conceputual_Database..." as the currently active selected state. It must have a pure black background and white text with tightly rounded corners (rounded-md) to match the "Digital Architect" law.

**3. Main Editor Workspace (100% Remaining Width)**
- Background: Pure White (#ffffff).
- **Top Tab Bar:** A row of editor tabs at the very top. One active tab reading "3_Conceputual_Database...". Sub-pixel bottom border separating tabs from the editor.
- **Properties/Metadata Block (Top of Document):** At the top of the actual writing area, place a collapsible light gray (`#f9f9f9`) metadata container with a 1px border. Render a dense grid of key-value properties:
  - `Course`: Database Systems
  - `Semester`: Autumn 2025
  - `Unit`: 3
  - `Hub`: null
  - `Confidence`: null
- **Markdown Document Area:** Below the metadata. A centered reading column (max width 750px) filled with specific text.
- **EXACT TEXT TO RENDER:**
  - Standard H1: "3_Conceputual_Database..."
  - Standard H2: "The Elite Crucible"
  - Highlighted text: Render `[[Database_Development_Methodology]]` and `[[Phases_of_Database_Design]]` wrapped in a subtle blue or gray link indicator.
  - Body Text paragraph: "The Challenge: What is the Database Development Life Cycle (DDLC), and how does it relate to the overall Information System (IS) development process?"
  - Standard H2: "Unit Synthesis"
  - Body Text paragraph: "Integrated Scenario: Conceptual Database Design for a University. The Setup: The university wants to design a database to manage information about students, courses, and faculty members."

**FINAL ENFORCEMENT:** If you generate a dashboard or marketing site components for this screen, you have failed. Render a native-feeling text editor.
