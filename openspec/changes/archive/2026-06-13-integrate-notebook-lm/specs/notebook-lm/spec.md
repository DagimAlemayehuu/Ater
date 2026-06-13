## ADDED Requirements

### Requirement: Google Account Authentication
The system SHALL initiate Google authentication via a system browser redirect and expose connection status polling endpoints.

#### Scenario: Trigger Authentication Redirect
- **WHEN** user clicks "Connect Account" on the settings integration page
- **THEN** system sends POST to FastAPI "/api/notebooklm/auth/login", which launches "nlm login" in a subprocess and opens the browser, returning a polling session token

### Requirement: Retrieve Notebooks
The system SHALL fetch and display a list of all notebooks from Google NotebookLM via the backend.

#### Scenario: Display Notebook List
- **WHEN** user navigates to the NotebookLM page
- **THEN** system sends GET to FastAPI "/api/notebooklm/notebooks", which executes "nlm notebook list --json" and returns the notebook list to render in the sidebar

### Requirement: Ingest Sources
The system SHALL support adding text, URLs, local files, and Google Drive files to a notebook.

#### Scenario: Upload Local File Source
- **WHEN** user drops a file onto the source uploader
- **THEN** system posts the file to FastAPI "/api/notebooklm/notebooks/{id}/sources/file", which executes "nlm source add" and displays a processing indicator

### Requirement: Generate Studio Assets
The system SHALL support generating audio, video, slides, reports, quizzes, and flashcards.

#### Scenario: Create Audio Overview
- **WHEN** user clicks "Generate Audio Overview"
- **THEN** system posts to "/api/notebooklm/notebooks/{id}/studio/audio", which runs "nlm audio create --confirm", polls for completion, and returns the status

### Requirement: Sync Study Materials
The system SHALL automatically parse generated quizzes and flashcards and import them into Ater's local SQLite database.

#### Scenario: SQLite Active Recall Sync
- **WHEN** a quiz generation task completes in the background
- **THEN** system downloads the JSON, parses the questions, and inserts them into the SQLite database under the active study hub

### Requirement: Oracle Agent Integration
The Ater Oracle chat assistant SHALL call NotebookLM tools to execute query, research, and generation commands on behalf of the user.

#### Scenario: Query via Chat Agent
- **WHEN** user inputs a question referencing their notebook in the main chat screen
- **THEN** Ater Oracle calls the local "notebooklm_query" LangChain tool, which executes "nlm notebook query --json", and returns the answer with source citations
