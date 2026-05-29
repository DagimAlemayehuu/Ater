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
*   `/academic` - **Academic Dashboard**: High-fidelity bento box view with program tracking, courses, study planners, assignments, exams, recall practice module, and unified calendar.
*   `/agents` - **Ater Dashboard**: Central registry for automated ingestion pipelines, MetaScanner, and token concurrency monitoring.
*   `/settings` - **System Settings**: Global configuration for Storage Folders, AI Providers & API Keys, Pomodoro timers, and usage statistics.

## 3. Page Specifications
### Page: `/obsidian` (Knowledge Base)
*   **Sidebar**: Nested vault tree explorer.
*   **Main**: Single-pane Markdown reader with professional typography and vertical list alignment.

### Page: `/academic` (Academic Dashboard)
*   **Header**: Sync controls and calendar view trigger.
*   **Navigation**: Bento box top bar navigation to switch between categories (Program, Courses, Planner, Assignments, Exams, Practice, Calendar).
*   **Main Views**:
    *   *Program*: Roadmap view showing course status and degree scaffolding.
    *   *Courses*: Detailed grid of enrolled courses and credits.
    *   *Planner*: Study sessions, schedules, and active workflows.
    *   *Assignments & Exams*: Critical timelines, grades, and task statuses.
    *   *Practice*: Adaptive flashcard-style recall testing of concepts in note titles.

### Page: `/agents` (Ater Dashboard)
*   **Pipeline Control**: Inbox for raw PDF/text documents, status tracking for generation plans.
*   **Action Hub**: Concept planning visualization and batch execution controls.

### Page: `/settings` (System Settings)
*   **Navigation**: Radix tabs layout (General, AI & Keys, Focus Timer, Usage Tracker).
*   **General**: Storage folders selection (Obsidian vault, Inbox, Notes folder), update checker, and user profile name configuration.
*   **AI & Keys**: Choice of provider (Google, OpenAI, Anthropic, Groq, OpenRouter, Custom), API keys vault, and model limits (TPM/RPM limits and concurrency).
*   **Focus Timer**: Pomodoro durations (Work, Short Break, Long Break, Session Count).
*   **Usage Tracker**: Token tracker panel displaying consumption and cost metrics.

