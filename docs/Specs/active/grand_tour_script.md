# The Grand Tour Script: An Exhaustive, Choreographed Experience

This document is the absolute source of truth for Phase 2: The Grand Tour. It covers every single feature, tab, and button from the application surface map in a choreographed, interactive simulation flow.

**Design Philosophy:**
- **No 'Next' Buttons:** The tour advances only when the user performs the target action.
- **Surgical Focus:** Every step must use a high-contrast backdrop blur to isolate the target element.
- **Simple English:** Direct, high-agency instructions.
- **The 'Wow' Loop:** High-value moments triggered by simple actions, strictly grounded in existing features.

---

## Chapter 1: The Welcome

### Step 1.1: The Theme Switcher
- **Chapter:** Chapter 1: The Welcome
- **Target Element:** `[data-tour="theme-switch"]` (Top-right corner)
- **Instruction Text:** "Let's set the mood. Toggle the theme."
- **The Action:** Click the ThemeSwitch button.
- **Success Trigger:** `theme` state toggles between 'light' and 'dark'.
- **The 'Aha!' Moment:** The application updates its color scheme.

### Step 1.2: Enter Email
- **Chapter:** Chapter 1: The Welcome
- **Target Element:** `input[name="email"]`
- **Instruction Text:** "Enter your access email."
- **The Action:** Type an email address.
- **Success Trigger:** `email` state variable updates to a non-empty string.
- **The 'Aha!' Moment:** The email input is accepted.

### Step 1.3: Enter Password
- **Chapter:** Chapter 1: The Welcome
- **Target Element:** `input[name="password"]`
- **Instruction Text:** "Secure your access. Type your password."
- **The Action:** Type a password.
- **Success Trigger:** `password` state variable updates to a non-empty string.
- **The 'Aha!' Moment:** The password input is accepted.

### Step 1.4: Enter Activation Code
- **Chapter:** Chapter 1: The Welcome
- **Target Element:** `input[name="activation-code"]`
- **Instruction Text:** "Provide your waitlist activation code."
- **The Action:** Type the activation code.
- **Success Trigger:** `code` state variable updates to a non-empty string.
- **The 'Aha!' Moment:** The code input is accepted.

### Step 1.5: Activation
- **Chapter:** Chapter 1: The Welcome
- **Target Element:** `button[type="submit"]` (Login button)
- **Instruction Text:** "Initialize the system."
- **The Action:** Click the login button.
- **Success Trigger:** `localLoading` sets to true, followed by successful auth.
- **The 'Aha!' Moment:** The system authenticates and routes to the main application view.

### Step 1.6: Simulation Entry
- **Chapter:** Chapter 1: The Welcome
- **Target Element:** `[data-tour="simulation-entry"]` (Auto-Detection Modal)
- **Instruction Text:** "Start the guided walkthrough tour."
- **The Action:** Select the option to run the interactive tour.
- **Success Trigger:** `isDemoMode === true` in configuration.
- **The 'Aha!' Moment:** The workspace loads with sample data to safely explore the UI.

---

## Chapter 2: The Command Center

### Step 2.1: Open Settings
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="nav-settings"]`
- **Instruction Text:** "Welcome to your Command Center. Open Settings."
- **The Action:** Click the Settings navigation icon.
- **Success Trigger:** Router navigates to `/settings`.
- **The 'Aha!' Moment:** The settings dashboard appears.

### Step 2.2: General Settings - Obsidian Path
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="settings-obsidian-path"]`
- **Instruction Text:** "We organize your files locally. Set your vault path."
- **The Action:** Click the "Select" button next to the Obsidian Folder.
- **Success Trigger:** `vaultEdit.vaultPath` updates to a selected directory.
- **The 'Aha!' Moment:** A local folder path is saved, anchoring data to the local filesystem.

### Step 2.3: General Settings - Inbox Path
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="settings-inbox-path"]`
- **Instruction Text:** "Select where incoming PDFs will drop."
- **The Action:** Click the Inbox path "Select" button.
- **Success Trigger:** `vaultEdit.inboxPath` updates to a selected directory.
- **The 'Aha!' Moment:** The folder for the ingestion engine is configured.

### Step 2.4: General Settings - Auto-Scan Toggle
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="settings-auto-scan"]`
- **Instruction Text:** "Enable automatic file detection."
- **The Action:** Click the Auto-Scan Folder toggle button.
- **Success Trigger:** `vaultEdit.autoDeploy === true`.
- **The 'Aha!' Moment:** The system is set to automatically monitor the folder for new files.

### Step 2.5: General Settings - Updater
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="settings-update-check"]`
- **Instruction Text:** "Check for the latest intelligence."
- **The Action:** Click "Check for Updates".
- **Success Trigger:** `isCheckingUpdate === true`, resolving to `updateStatus === 'up-to-date'` or `'available'`.
- **The 'Aha!' Moment:** The system queries for updates and returns a status badge.

### Step 2.6: General Settings - Profile
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="settings-profile-edit"]`
- **Instruction Text:** "Personalize your profile."
- **The Action:** Click the profile display name 'Edit' button.
- **Success Trigger:** `editingKey === 'profile'`.
- **The 'Aha!' Moment:** The name field becomes an editable text input.

### Step 2.7: General Settings - Diagnostics
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="settings-export-logs"]`
- **Instruction Text:** "Export system telemetry."
- **The Action:** Click "Save Logs".
- **Success Trigger:** Call to `sidecarApi.exportLogs()` initiates.
- **The 'Aha!' Moment:** The log path is copied to the clipboard and displayed in a toast notification.

### Step 2.8: General Settings - Danger Zone (Reset All)
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="settings-danger-reset"]`
- **Instruction Text:** "You can reset everything here. (Just click to see the warning)."
- **The Action:** Click "Reset All Settings".
- **Success Trigger:** `confirmAction === 'clear_config'`.
- **The 'Aha!' Moment:** A warning modal appears, asking for confirmation.

### Step 2.9: General Settings - Danger Zone (Clear History)
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="settings-danger-clear-history"]`
- **Instruction Text:** "Need a fresh start on your metrics? Click Clear Study History."
- **The Action:** Click "Clear Study History".
- **Success Trigger:** `confirmAction === 'clear_history'`.
- **The 'Aha!' Moment:** A confirmation dialog appears.

### Step 2.10: General Settings - Danger Zone (Factory Reset)
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="settings-danger-factory"]`
- **Instruction Text:** "The nuclear option. Factory Reset."
- **The Action:** Click "Delete Everything & Reset App".
- **Success Trigger:** `confirmAction === 'factory_reset'`.
- **The 'Aha!' Moment:** A final warning dialog appears to prevent accidental data destruction.

### Step 2.11: AI Configuration Tab
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="tab-ai-config"]`
- **Instruction Text:** "Configure your intelligence. Open AI Provider & Keys."
- **The Action:** Click the AI settings tab or scroll to the AI Provider & Keys section.
- **Success Trigger:** The AI Configuration panel is visible.
- **The 'Aha!' Moment:** The API key managers and model selectors are exposed.

### Step 2.12: Add API Key
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="ai-add-key"]`
- **Instruction Text:** "Let's add a Mock Key."
- **The Action:** Click "Add New API Key".
- **Success Trigger:** `isAddingKey === true`.
- **The 'Aha!' Moment:** The form expands to input a new API key, provider, and rate limits.

### Step 2.13: Test Active Key
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="ai-test-key"]`
- **Instruction Text:** "Ensure your connection is live."
- **The Action:** Click "Test active key".
- **Success Trigger:** `testStatus.loading === true`, resolving to `testStatus.success === true`.
- **The 'Aha!' Moment:** The system tests the connection and returns a success message.

### Step 2.14: Timer Settings Tab
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="tab-timer"]`
- **Instruction Text:** "Configure your deep work cycles."
- **The Action:** Click the Focus Settings tab or navigate to Timer Settings.
- **Success Trigger:** The Timer Settings panel is visible.
- **The 'Aha!' Moment:** The work and break duration sliders are exposed.

### Step 2.15: Adjust Work Duration
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="timer-work-duration"]`
- **Instruction Text:** "Set your focus time to 25 minutes."
- **The Action:** Drag or input 25 on the work duration slider.
- **Success Trigger:** `pomodoroEdit.work === 25`.
- **The 'Aha!' Moment:** The configured duration updates in local state.

### Step 2.16: Token Tracker Tab
- **Chapter:** Chapter 2: The Command Center
- **Target Element:** `[data-tour="tab-token-tracker"]`
- **Instruction Text:** "Monitor your AI spend locally."
- **The Action:** Navigate to the Token Tracker section.
- **Success Trigger:** The TokenTracker component renders.
- **The 'Aha!' Moment:** Charts and metrics render displaying local token usage across models.

---

## Chapter 3: The Ingestion Engine

### Step 3.1: Open Agents Dashboard
- **Chapter:** Chapter 3: The Ingestion Engine
- **Target Element:** `[data-tour="nav-agents"]`
- **Instruction Text:** "Let's turn documents into knowledge. Go to the Agents tab."
- **The Action:** Click the Agents navigation icon.
- **Success Trigger:** Router navigates to `/agents`.
- **The 'Aha!' Moment:** The Agent Operations interface loads.

### Step 3.2: Select Inbox File
- **Chapter:** Chapter 3: The Ingestion Engine
- **Target Element:** `[data-tour="inbox-file-item"]`
- **Instruction Text:** "Select a file from your Inbox."
- **The Action:** Click a specific file in the queue.
- **Success Trigger:** A file is selected in the local state.
- **The 'Aha!' Moment:** The file details are loaded for processing.

### Step 3.3: Process File
- **Chapter:** Chapter 3: The Ingestion Engine
- **Target Element:** `[data-tour="btn-process-file"]`
- **Instruction Text:** "Start processing the document."
- **The Action:** Click the process or convert button.
- **Success Trigger:** Status updates from queued to processing.
- **The 'Aha!' Moment:** The system initiates the conversion pipeline, showing progress.

---

## Chapter 4: The Knowledge Base

### Step 4.1: Open Obsidian / Knowledge View
- **Chapter:** Chapter 4: The Knowledge Base
- **Target Element:** `[data-tour="nav-obsidian"]`
- **Instruction Text:** "Explore what the AI built."
- **The Action:** Click the Knowledge/Reference Vault navigation icon.
- **Success Trigger:** Router navigates to `/obsidian`.
- **The 'Aha!' Moment:** The workspace opens showing the file tree and document viewer.

### Step 4.2: Folder Explorer Navigation
- **Chapter:** Chapter 4: The Knowledge Base
- **Target Element:** `[data-tour="explorer-file-node"]`
- **Instruction Text:** "Open a generated note."
- **The Action:** Click a file in the file tree sidebar.
- **Success Trigger:** `selectedPath` state is updated.
- **The 'Aha!' Moment:** The markdown note is rendered in the main panel.

### Step 4.3: Note Properties Bar
- **Chapter:** Chapter 4: The Knowledge Base
- **Target Element:** `[data-tour="note-property-read"]`
- **Instruction Text:** "Mark this concept as 'Read'."
- **The Action:** Toggle the read status in the document viewer.
- **Success Trigger:** The UI updates the read status.
- **The 'Aha!' Moment:** The state is saved to the local markdown frontmatter.

### Step 4.4: AI Explain Dialog
- **Chapter:** Chapter 4: The Knowledge Base
- **Target Element:** `[data-tour="btn-ai-explain"]`
- **Instruction Text:** "Need more context? Ask the AI to explain."
- **The Action:** Trigger the Explain Dialog on a selected concept.
- **Success Trigger:** The `AterExplainDialog` component opens.
- **The 'Aha!' Moment:** A dialog appears, streaming an AI explanation of the topic.

### Step 4.5: SRS Rating
- **Chapter:** Chapter 4: The Knowledge Base
- **Target Element:** `[data-tour="srs-btn-good"]`
- **Instruction Text:** "Rate your memory of this topic."
- **The Action:** Click the 'Good' button in the SRS footer.
- **Success Trigger:** `handleSRSRating` is called.
- **The 'Aha!' Moment:** The SRS progress is saved via the sidecar API and a success toast appears.

---

## Chapter 5: The Learning Loop

### Step 5.1: Open Practice Dashboard
- **Chapter:** Chapter 5: The Learning Loop
- **Target Element:** `[data-tour="nav-practice"]`
- **Instruction Text:** "Let's test your knowledge."
- **The Action:** Click the Practice navigation icon.
- **Success Trigger:** Router navigates to `/practice`.
- **The 'Aha!' Moment:** The Practice configuration view loads.

### Step 5.2: Launch Quiz
- **Chapter:** Chapter 5: The Learning Loop
- **Target Element:** `[data-tour="btn-start-practice"]`
- **Instruction Text:** "Begin the simulation."
- **The Action:** Click the button to start the practice session.
- **Success Trigger:** `view` state transitions to `'session'`.
- **The 'Aha!' Moment:** The interface loads the first practice question.

### Step 5.3: Select Answer
- **Chapter:** Chapter 5: The Learning Loop
- **Target Element:** `[data-tour="mcq-option"]`
- **Instruction Text:** "Select an option."
- **The Action:** Click one of the multiple-choice or True/False options.
- **Success Trigger:** A value is recorded in `currentAnswers[currentQuestion.id]`.
- **The 'Aha!' Moment:** The selected option is visually highlighted.

### Step 5.4: Submit Answer
- **Chapter:** Chapter 5: The Learning Loop
- **Target Element:** `[data-tour="btn-submit-answer"]`
- **Instruction Text:** "Lock it in."
- **The Action:** Click "Submit Answer" or "Correct".
- **Success Trigger:** `session.submitAnswer` is called.
- **The 'Aha!' Moment:** The UI records the score and enables proceeding to the next question.

### Step 5.5: Next Question (Writing Response)
- **Chapter:** Chapter 5: The Learning Loop
- **Target Element:** `[data-tour="btn-next-question"]`
- **Instruction Text:** "Move to the next question."
- **The Action:** Click "Next".
- **Success Trigger:** `currentQuestionIndex` increments.
- **The 'Aha!' Moment:** The UI loads a new question type, such as a written response or code trace.

### Step 5.6: Keyword Validation
- **Chapter:** Chapter 5: The Learning Loop
- **Target Element:** `textarea[name="written-response"]`
- **Instruction Text:** "Write out your explanation."
- **The Action:** Type text that includes the required keywords.
- **Success Trigger:** `keywordChecks[kw]` becomes true for all required keywords.
- **The 'Aha!' Moment:** The UI dynamically checks off the required keywords and enables the Correct button.

### Step 5.7: Finish Session & Results
- **Chapter:** Chapter 5: The Learning Loop
- **Target Element:** `[data-tour="finish-session-btn"]`
- **Instruction Text:** "Finish the test and view your results."
- **The Action:** Complete the last question and view the results.
- **Success Trigger:** `view` state transitions to `'results'`.
- **The 'Aha!' Moment:** A large percentage score renders showing your performance, alongside a visual breakdown by question type.

### Step 5.8: Return to Dashboard
- **Chapter:** Chapter 5: The Learning Loop
- **Target Element:** `[data-tour="finish-session-btn"]`
- **Instruction Text:** "Log this session to your local database."
- **The Action:** Click "Finish Session" from the results view.
- **Success Trigger:** `view` state transitions to `'dashboard'`.
- **The 'Aha!' Moment:** The practice session resets and returns to the initial configurator view.

---

## Chapter 6: The Conversion

### Step 6.1: The Final Hook
- **Chapter:** Chapter 6: The Conversion
- **Target Element:** `[data-tour="modal-conversion"]`
- **Instruction Text:** "You've seen the power of your own intelligence, augmented. Ready to build your own vault?"
- **The Action:** Click the action to finish the tour.
- **Success Trigger:** `isDemoMode` toggles to `false`.
- **The 'Aha!' Moment:** The interactive tour completes, returning control to the user.
