# Ater Desktop Application Surface Map

This document serves as the Comprehensive Application Surface Map of the Ater desktop app. It details every top-level page, route, view state, component inventory, interactive behavior, and backend sidecar (Rust/Tauri) integration. It is organized by the core User Journey: **Onboarding** $\rightarrow$ **Configuration** $\rightarrow$ **Knowledge Ingestion** $\rightarrow$ **Active Learning**.

---

## Journey 1: Onboarding & Account Registration

This journey takes place before the user enters the main application workspace. It establishes user identity, verifies access rights, selects local vault directories, scaffolds initial files, and configures external API keys.

### 1.1 Activation/Login Screen
* **Route:** `/login` (Treated as the app root if not yet activated)
* **Purpose:** Verify user eligibility (waitlist approval) and establish initial credentials.
* **Visual Inventory:**
  - `Ater` header title in sharp uppercase branding.
  - Form Fields: `Email` (text input), `Password` (password input), and `Activation Code` (mono-spaced tracking code input).
  - Validation banner (renders validation failures such as invalid credentials or missing waitlist code).
  - `Activate` submit button.
  - `ThemeSwitch` component (top-right corner).
* **Interactivity Map:**
  - **Click/Input Fields:** Users enter credentials and click the `Activate` button.
  - **Immediate Result:** Forms trigger a state update (`localLoading = true`). Activates the auth context flow.
  - **State Transition:** On success, transitions user state to authenticated. Router redirects to `/onboarding`.
* **Backend Dependency:**
  - Calls `useAuth().activate()` which communicates with the Supabase auth instance (`realSupabase.auth.signInWithPassword`).
* **Critical Path for Walkthrough:**
  - Access code entering (validating access to the system).

---

### 1.2 Interactive Onboarding Wizard
* **Route:** `/onboarding`
* **Purpose:** Multi-step wizard directing the user through profile setup, local storage directory selection, AI credentialing, course scaffolding, and pomodoro preferences.
* **Visual Inventory:**
  - Progress tracker showing Step 1 to 6 (represented by inline dots).
  - Wizard containers with sliding panel transitions.
  - Navigation buttons: `Back`, `Continue`, `Skip`, or `Finalize`.
  - Step-Specific panels:
    - **Step 1: Profile:** Name input field.
    - **Step 2: Vault Selection:** Large folder selection button showing the path preview or a browse indicator.
    - **Step 3: Connect API Keys:** Saved API keys list cards, "Add API Key" form fields (provider selector, model name input, key value input, advanced settings toggler), and a connection check status box.
    - **Step 4: Academic Program:** Preset dropdowns (Custom, Computer Science, Data Science, Business Administration), program name input, duration selectors, and current year button filters.
    - **Step 5: Focus Timer:** Duration fields for work, short breaks, long breaks, and target focus sessions before break.
    - **Step 6: Confirm Setup:** Configuration summary table, "Start with Guided Walkthrough Tour" checkbox (bypasses immediate AI key requirements), and `Finalize` action button.
  - **Auto-Detection Modal:** An overlay that pops up if an existing `database/user_profile.md` is detected in the chosen vault path. Renders "Fast-Track Launch" or "Review & Edit" options.

* **Interactivity Map:**
  - **Step 2 Select Vault:** Clicking "Choose Folder" triggers Tauri dialog file explorer. Choosing a valid directory updates `vaultPath`. Resolves write permissions with a probe file (`database/.write_test`). Renders error toast if directory is read-only.
  - **Step 3 Add Key:** Users toggle advanced settings (limits for TPM/RPM/TPD/RPD/Concurrency). Clicking "Save Key" updates `savedApiKeys` in config context. Clicking "Check if Key Works" fires connection test request.
  - **Step 4 Program Preset:** Selecting preset (e.g. `cs` B.S.) automatically pre-fills program name, level (undergraduate), duration (4 years), current year, and pre-populates courses/semesters.
  - **Step 6 Finalize:** Clicking "Finalize" starts packaging configuration. If "Start with Guided Walkthrough Tour" is checked, sets `isDemoMode = true`.
  - **Auto-Detection Modal Actions:** Clicking "Fast-Track Launch" bypasses Steps 3–6, loads file parameters, initializes the database, and boots directly to `/obsidian`.

* **Backend Dependency:**
  - `@tauri-apps/plugin-dialog` (`open`) for vault directory picker.
  - `sidecarApi.createObsidianFolder` / `createObsidianFile` / `deleteObsidianItem` for vault permission testing.
  - `sidecarApi.testAiConnection` for testing API credentials.
  - `sidecarApi.initializeVault` to scaffold default directories (`Inbox`, `Notes`, `database`).
  - `sidecarApi.academicsSyncProfile` to synchronize database schemas.
  - `sidecarApi.createVaultRow` / `updateVaultRow` to populate the `years`, `semesters`, and `courses` database tables.
  - Renders metadata into `database/user_profile.md` file inside the vault.
  - Updates Supabase remote user profile `is_configured = true`.

* **Critical Path for Walkthrough:**
  - Selecting local Obsidian Vault directory (defines the workspace root).
  - Scaffold preset course option (demonstrates Ater's data mapping structure).
  - Toggling the "Start with Guided Walkthrough Tour" box to allow testing the UI without requiring an AI key.

---

## Journey 2: App Shell & Configuration

The primary desktop layout, control hubs, and settings views that persist throughout the app.

### 2.1 Settings Hub
* **Route:** `/settings`
* **Purpose:** Central control panel for storage locations, AI model selections, pomodoro values, API key vaults, and app lifecycle commands.
* **Visual Inventory:**
  - RADIX-UI Tab Bar: `General`, `AI Configuration`, `Timer Settings`, and `Token Tracker`.
  - **General Tab:**
    - Storage Folders cards (Obsidian directory path, Inbox path, Notes subdirectory, auto-scan toggle).
    - Update controller (renders current version, check-for-update buttons, and installation states).
    - User profile card (display name editor).
    - Diagnostics card (export logs command).
    - Account Info (renders Supabase email, unique Machine Device ID, and Logout link).
    - Danger Zone panel (Reset All Settings, Clear Study History, Factory Reset / Delete App data buttons).
  - **AI Configuration Tab:**
    - Active key indicators.
    - Saved keys list with "Delete" buttons.
    - Add New API Key builder (Google, OpenAI, Anthropic, Groq, OpenRouter, or Custom API providers, with advanced RPM/TPM/Concurrency settings).
    - "Test active key" status panel.
  - **Timer Settings Tab:**
    - Focus inputs (work duration, break durations, sessions).
  - **Token Tracker Tab:**
    - AI Usage charts, active key usage, and all-keys usage indicators.

* **Interactivity Map:**
  - **Folder Settings Edit:** Clicking Edit reveals directory path select options. Modifying the Obsidian vault path fires a folder update command, resetting RAG file watchers. Clicking Save triggers a reload.
  - **Updater:** Clicking "Check for Updates" triggers Tauri's updater plugin. If an update exists, it launches the update package download modal.
  - **Key Management:** Saving new API keys pushes them into the Tauri config store. Activating a key switches the active configuration model parameters.
  - **Troubleshooting:** Clicking "Save Logs" copies the native logging file output directory.
  - **Danger Zone Buttons:** Each button displays a confirmation dialog. Confirming triggers the respective data purge:
    - **Reset All Settings:** Wipes Tauri configuration settings, forces reload to `/onboarding`.
    - **Clear Study History:** Invokes study history deletion and clears Zustand local state.
    - **Factory Reset:** Wipes Obsidian local structures, resets config context parameters, logs user out of Supabase, and restarts the Tauri app process.

* **Backend Dependency:**
  - `@tauri-apps/plugin-updater` for updates checking.
  - `sidecarApi.exportLogs` to write system logs to a text file.
  - `sidecarApi.updateVaultPath` to re-orient database watch routes.
  - `sidecarApi.testAiConnection` for active model testing.
  - `sidecarApi.clearStudyHistory` to wipe telemetry tracking data.
  - `sidecarApi.factoryReset` to purge native databases and settings directories.
  - `@tauri-apps/plugin-process` (`relaunch`) to force-restart the application on factory reset.

* **Critical Path for Walkthrough:**
  - General tab Storage configuration (adjusting workspace directories).
  - AI tab model switching.
  - Danger zone controls (understanding data storage privacy/purging).

---

## Journey 3: Knowledge Ingestion Pipeline

Ingesting unorganized, complex academic PDFs or text files, processing them using LLMs, and creating a structured, RAG-indexed curriculum tree.

### 3.1 AI Agents & Ingestion Dashboard
* **Route:** `/agents` (or search parameters `?tab=pipeline`)
* **Purpose:** Track file parsing status, design study plans, and execute notes generation.
* **Visual Inventory:**
  - Auto-Ingest status card (Toggle switch, Refresh trigger).
  - CPU/AI pressure bar with throttle warnings.
  - Left Panel: Inbox files list (renders PDF/TXT files uploaded or copied to the Inbox directory).
  - Central Ingestion Workflow:
    - **Step 1: Detection:** Target Hub drop-down selectors and detected curriculum fields (Course, Semester, Unit, Hub Title).
    - **Step 2: Planning:** Multi-column generated plan preview showing the target Hub note name, the practice exam note name, and the hierarchical outline of planned atomic notes (level index, file titles, processing modes, source pages, and study descriptions).
    - **Step 3: Deployment:** Real-time batch progression logs, progress bars, and the **Batch Tree View** listing every planned note. Completed files are struck through with a check icon, and the currently processing file is highlighted with a "Now" tag.
  - Right Panel: Completed/Processed notes checklist tracker.

* **Interactivity Map:**
  - **File Selection:** Clicking an Inbox file opens the Ingestion setup dashboard. Clicking "Process File" sends it to the detection engine.
  - **Curriculum Setup:** The user can adjust fields or select an existing Hub from the dropdown. Changing options updates the target metadata. Clicking "Generate Plan" requests a structured study syllabus from the LLM.
  - **Plan Confirmation:** The plan is displayed as visual cards. The user can review the outline and click "Confirm Setup & Deploy".
  - **Deployment Monitor:** Displays real-time progress. The user can watch notes being created step-by-step. Clicking "Confirm" manually advances batches if strict step-by-step confirmation is configured. Clicking "Abort" stops the deployment loop.
  - **Auto-Ingest Toggle:** Clicking the toggle updates the `autoDeploy` preference in the Tauri config file, activating/deactivating native file watchers.

* **Backend Dependency:**
  - `sidecarApi.aterListInbox` / `aterListGenerated` to query files.
  - `sidecarApi.aterProcess` to analyze file layout, map to standard curriculum structures, and fetch existing hubs.
  - `sidecarApi.aterGeneratePlan` to generate structured markdown notes outlines.
  - `sidecarApi.aterConfirm` to run sequential generation runs, writing files directly into the vault.
  - `sidecarApi.aterWatcherToggle` to update folder event tracking.
  - Telemetry store listener tracking active batch status.

* **Critical Path for Walkthrough:**
  - Selecting a PDF from the Inbox list.
  - Reviewing the AI-generated study plan outline.
  - Initiating deployment and watching notes get created in the Batch Tree.

---

## Journey 4: Pedagogical Interface & Knowledge Integration

The primary workspace where the user interacts with notes, reads source files, navigates the semantic graph, and updates study tracking data.

### 4.1 Knowledge / Obsidian Route
* **Route:** `/obsidian`
* **Purpose:** Core workspace combining markdown editing, PDF document viewing, graphical network mappings, backlink trackers, and active study session timers.
* **Visual Inventory:**
  - **Left Sidebar:** Tab buttons (`explorer` folder tree, `hubs` connection outlines, `pdfs` list), directory search input, folder/file hierarchy list with inline Action buttons (Add File, Add Folder, Rename, Delete).
  - **Main Panel (Split Screen or Fullscreen):**
    - **Markdown Editor/Viewer:** Displays note content.
      - *Viewer Mode:* Renders formatted markdown, bullet points, headers, interactive backlinks, and checklists. Includes an inline `Explain` dialog overlay.
      - *Editor Mode:* Simple markdown editing area.
    - **Note Properties Bar:** Top component displaying active Frontmatter metadata keys (`Hub`, `Course`, `Semester`, `Read`, `SRS Date`) with input fields and dropdowns.
    - **PDF Viewer:** Renders PDF pages. Features waypoint indicators, zoom/rotation controls, and navigation buttons.
    - **Graph View Overlay:** Interactive visual canvas showing note nodes and link connections.
  - **Right Connections Panel:** Renders the `HubConnectionsNav` tree outlining the study roadmap.
  - **Bottom Footer:** Spaced repetition system (SRS) rating buttons (Hard, Medium, Easy, Good).

* **Interactivity Map:**
  - **Sidebar Actions:** Resizes the sidebar width by dragging the margin handles. Clicking file nodes loads the note into the viewer. Hovering files reveals add/rename/delete buttons. Dragging and dropping nodes shifts their disk folders.
  - **Markdown Viewer Actions:** Clicking `[[WikiLinks]]` navigates to that page. Checking checkbox lists inside a note synchronizes their state across notes (e.g. checking a topic task inside a Hub note automatically updates the `read` property in the topic note itself).
  - **PDF Navigation:** Dragging selection boxes inside the PDF opens the AI explain overlay. Clicking waypoints jumps to specific pages.
  - **Graph Toggle:** Clicking "Graph" overlay icon rendering vault connections. Hovering nodes shows file names, clicking transitions viewer path.
  - **Spaced Repetition Rating:** Clicking SRS rating buttons updates metadata frontmatter (`read`, `srs`, `due_date`) and calculates the next review intervals.

* **Backend Dependency:**
  - `sidecarApi.listObsidianFiles` to retrieve file system trees.
  - `sidecarApi.readObsidianNote` / `updateObsidianNote` for markdown notes reading and updates.
  - `sidecarApi.createObsidianFile` / `createObsidianFolder` / `deleteObsidianItem` / `moveObsidianItem` to handle folder system operations.
  - `sidecarApi.getVaultGraph` for vector coordinates mapping vault nodes.
  - `sidecarApi.findVaultPage` to resolve links to physical file paths.
  - `sidecarApi.srsReview` to update spaced repetition intervals.

* **Critical Path for Walkthrough:**
  - Navigating notes using the Folder Explorer.
  - Viewing notes in Viewer Mode with split-screen PDF waypoints.
  - Synchronizing checklist items between Hub and Topic notes.
  - Reviewing notes using Spaced Repetition (SRS) ratings.

---

## Journey 5: Active Learning & Recall Practice

A high-fidelity quiz engine utilizing active recall and spaced repetition concepts to test user understanding.

### 5.1 Practice Dashboard
* **Route:** `/practice` (or inside `/academic` under the `PRACTICE` tab)
* **Purpose:** Configure, launch, and score active recall practice tests based on vault notes.
* **Visual Inventory:**
  - Sub-Navigation: `Dashboard`, `History`, and `Reference Vault` toggle tabs.
  - Action buttons: `Review Due` and `Custom Session`.
  - Statistics: Average score indicator, total sessions count, stability, score history line chart, and cognitive modalities distribution bars.
  - Past Sessions: List of completed practice records with scores, dates, and delete buttons.

* **Interactivity Map:**
  - **Review Due:** Clicking "Review Due" runs a query for cards due for review and launches a targeted practice session.
  - **History List:** Clicking a card in the history list resumes that test or opens the results view.

---

### 5.2 Practice Configurator
* **Route:** `/practice` (search parameter `?view=configuring`)
* **Purpose:** Custom settings configuration before starting a test.
* **Visual Inventory:**
  - Hub selector and Atomic Notes checklists.
  - Preset Buttons: Balanced, MCQ Blitz, Deep Write, Math Mode, Recall, Hard Mode, Exam Sim.
  - Mode Settings: Sliders for question types (MCQ, True/False, Writing, Fill-in, Matching, Order, Debug, Synthesis, Trace, Calculation, Data Analysis, Scenario, Code).
  - Advanced settings (Strictness, Difficulty, Trick Answers, Hints, Time Limits, Confidence Wager).

* **Interactivity Map:**
  - **Applying Presets:** Clicking a preset button adjusts the question sliders. Clicking "Randomize" generates random configurations.
  - **Note Selection:** Selecting or deselecting notes filters the source files used to generate the quiz.
  - **Launch Quiz:** Clicking "Start Practice" starts the generation process, transitioning to the loading view.

---

### 5.3 Interactive Practice Session
* **Route:** `/practice` (search parameter `?view=session`)
* **Purpose:** Formatted quiz UI supporting diverse active recall modalities.
* **Visual Inventory:**
  - Progress bar and question countdown.
  - Question Panel: Displays the formatted markdown question text.
  - Answer Interface (updates based on the question type):
    - **MCQ / True-False:** List of clickable radio options.
    - **Fill-in-the-blanks:** Inputs inside text fields.
    - **Matching:** Dropdowns to pair left/right items.
    - **Order Sorting:** Drag-and-drop handles to rearrange items.
    - **Writing / Feynman Method:** Detailed text input area with keyword guidelines.
  - Wager Panel: Slider to specify confidence (0% to 100%).
  - Action buttons: `Submit Answer`, `Next Question`, `Hint`, `Explain More`.

* **Interactivity Map:**
  - **Submit Answer:** Submits the answer, locks inputs, and highlights correct/incorrect answers with detailed feedback.
  - **Feynman Validation:** For writing questions, user submits text. The AI evaluates correctness based on required keywords, returning a grading score and feedback.
  - **Explain More:** Clicking this opens the Socratic explain overlay, showing similar references from the vault.
  - **Navigation:** Clicking "Next Question" moves to the next card or finishes the quiz, opening the results screen.

---

### 5.4 Results Screen
* **Route:** `/practice` (search parameter `?view=results`)
* **Purpose:** Score summary and telemetry logging.
* **Visual Inventory:**
  - Large Trophy icon with total score percentages.
  - Detailed breakdown of correct/incorrect questions.
  - Spaced Repetition (SRS) check indicators.
  - Performance analytics (elapsed time, wagers, stability metrics).
  - `Finish Session` button.

* **Interactivity Map:**
  - **Save Attempt:** Clicking "Finish Session" writes the practice session attempt data, updates local statistics, and redirects to the Practice Dashboard.

* **Backend Dependency:**
  - `sidecarApi.listHubs` / `listHubNotes` to configure sources.
  - `sidecarApi.generatePractice` to compile questions.
  - `sidecarApi.getPracticeStatus` to poll generation progress.
  - `sidecarApi.srsDue` to fetch due cards.
  - `sidecarApi.recordPerformance` to log telemetry.
  - `sidecarApi.srsFeynmanValidate` to evaluate written answers.
  - `sidecarApi.logPracticeResult` to save results in the database.

* **Critical Path for Walkthrough:**
  - Custom practice setup using presets.
  - Answering an MCQ question.
  - Submitting a Feynman explanation.
  - Reviewing the final score on the Results screen.
