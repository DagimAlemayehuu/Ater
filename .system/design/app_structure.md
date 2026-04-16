<!--
[TEMPLATE: APPLICATION STRUCTURE & ROUTING MAP]
Instructions for the User (Delete this block before use):
Use your Gemini Gem to fill out this template based on `prompt.md` and `architecture.md`.
The Frontend Agent will read this to generate every page and component.
Define the structure, content, and interactive states in extremely high detail.
-->

# Application Map & Component Specifications
## 1. Global Navigation & Layout
*   **Sidebar (AppSidebar)**: The primary navigation anchor. Grouped by "Main" items and "System" settings at the bottom.
*   **AuthenticatedLayout**: Wraps all core pages, providing the sidebar and a search-enabled header with Profile dropdown.

## 2. Route Map (The Pages)
*   `/obsidian` - **Knowledge Base**: The primary vault explorer and markdown reader.
*   `/vault-sync` - **Vault Sync**: Management of knowledge clusters and database views.
*   `/agents` - **Intelligence Hub**: Central registry for the OKA dashboard.
*   `/settings` - **System Settings**: Global configuration for Appearance, Identity Profiles, and LLM Intelligence.

## 3. Page Specifications
### Page: `/obsidian` (Knowledge Base)
*   **Sidebar**: Nested vault tree.
*   **Main**: High-fidelity markdown renderer with integrated property card for YAML frontmatter extraction.

### Page: `/vault-sync` (Vault Sync)
*   **Header**: Cluster selection (e.g., Study Planner, Reading List).
*   **View Switcher**: Tabs for Table, Board, Gallery, and Calendar views.
*   **Data Grid**: Interactive records tracking confidence, status, and unit alignment.
*   **Persistence**: View states (filters, sorts, columns) persist via LocalStorage per-database.


### Page: `/agents` (OKA Dashboard)
*   **Pipeline Control**: Inbox for raw documents, status tracking for generation plans.
*   **Action Hub**: Plan visualization in card-view, batch execution controls.

### Page: `/settings` (System Settings)
*   **Navigation**: Inner sidebar with "General", "Profiles", and "Intelligence".
*   **General**: Theme toggle (Light/Dark) and Gemini API / LLM provider configuration.
*   **Profiles**: Management of LifeOS domains (Personal, Academic, Financial, Fitness).
*   **Intelligence**: RAG engine management and vault synchronization trigger.

