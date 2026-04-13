<!--
[TEMPLATE: MASTER REQUIREMENTS SPECIFICATION]
Instructions for the User (Delete this block before use):
Use your Gemini Gem to fill out this highly detailed template. The Architect Agent requires absolute clarity to build the system blueprint. Be exhaustive. Do not leave ambiguity.
-->

# 1. Product Vision & Sovereign Value
## 1.1 The Sovereign Pitch
Life OS is a high-fidelity, local-first digital management system that transforms raw information into structured, pedagogical knowledge assets via the **OKA Sovereign Ingestion Engine**.

## 1.2 Target Audience
Students, engineers, and researchers who require an absolute bridge between their structured data (Notion) and their specialized reasoning (Obsidian).

# 2. Functional Requirements
## 2.1 Core Capabilities
*   **OKA Ingestion**: Multi-batch autonomous generation of pedagogical note clusters (Hubs, Units, Questions, Atomic Notes) from PDFs and text.
*   **Vault Mirroring**: Synchronized folder structures between Notion databases and Obsidian directories.
*   **High-Fidelity Reader**: Professional-grade Markdown viewing with integrated property visualization.
*   **Cluster Management**: Native Notion-style database views (Table, Board, Gallery) inside the desktop app.

# 3. Step-by-Step User Journeys
## 3.1 Knowledge Ingestion
1. User drops a PDF into the OKA Inbox.
2. OKA generates a Strategic Mapping Plan.
3. User confirms the plan, and OKA executes a multi-batch deployment loop.
4. Notes appear instantly in the dedicated Obsidian cluster.

## 3.2 Profile Alignment
1. User updates Academics/Financial/Fitness data in Notion.
2. User triggers "Vault Sync".
3. Local vault frontmatter and folder hierarchy update to match current ground truth.

# 4. Data Entities
*   **Knowledge Asset**: A folder containing pedagogical notes (Hub, Questions, Notes).
*   **Database Cluster**: A Notion-synchronized collection of notes with extensive metadata metadata (Status, Type, Confidence).
*   **Identity Profile**: A collection of domain-specific context (Personal, Academic, etc.) used to ground AI generations.

# 5. Technical Constraints
*   **Model Isolation**: Every generation step must be isolated to support diverse model tiers (L1-L3).
*   **Zero-Internet Sync**: Once tokens are fetched, core reading/navigation must strictly use local file caches.

