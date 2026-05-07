# Graph Report - LifeOs  (2026-05-07)

## Corpus Check
- 194 files · ~218,328 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1084 nodes · 2840 edges · 61 communities detected
- Extraction: 40% EXTRACTED · 60% INFERRED · 0% AMBIGUOUS · INFERRED: 1703 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 120|Community 120]]
- [[_COMMUNITY_Community 121|Community 121]]
- [[_COMMUNITY_Community 122|Community 122]]
- [[_COMMUNITY_Community 123|Community 123]]
- [[_COMMUNITY_Community 124|Community 124]]
- [[_COMMUNITY_Community 126|Community 126]]
- [[_COMMUNITY_Community 127|Community 127]]
- [[_COMMUNITY_Community 142|Community 142]]
- [[_COMMUNITY_Community 143|Community 143]]
- [[_COMMUNITY_Community 144|Community 144]]
- [[_COMMUNITY_Community 145|Community 145]]
- [[_COMMUNITY_Community 146|Community 146]]
- [[_COMMUNITY_Community 147|Community 147]]
- [[_COMMUNITY_Community 148|Community 148]]
- [[_COMMUNITY_Community 149|Community 149]]
- [[_COMMUNITY_Community 150|Community 150]]
- [[_COMMUNITY_Community 151|Community 151]]
- [[_COMMUNITY_Community 152|Community 152]]
- [[_COMMUNITY_Community 153|Community 153]]

## God Nodes (most connected - your core abstractions)
1. `OkaService` - 164 edges
2. `ModelFactory` - 124 edges
3. `AppSecrets` - 111 edges
4. `OkaQueueManager` - 104 edges
5. `VaultIndexer` - 103 edges
6. `ChromaManager` - 100 edges
7. `ObsidianClient` - 97 edges
8. `RAGWatcherService` - 95 edges
9. `VaultManager` - 60 edges
10. `OkaDeployer` - 49 edges

## Surprising Connections (you probably didn't know these)
- `fix_exams()` --calls--> `load()`  [INFERRED]
  scratch/standardize_db.py → apps/mobile-client/src/routes/ModuleView.tsx
- `fix_study_planner()` --calls--> `load()`  [INFERRED]
  scratch/standardize_db.py → apps/mobile-client/src/routes/ModuleView.tsx
- `fix_assignments()` --calls--> `load()`  [INFERRED]
  scratch/standardize_db.py → apps/mobile-client/src/routes/ModuleView.tsx
- `main()` --calls--> `AppSecrets`  [INFERRED]
  scratch/test_detect.py → apps/api/src/api/deps.py
- `main()` --calls--> `AppSecrets`  [INFERRED]
  scratch/test_generate.py → apps/api/src/api/deps.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (167): ai_upload(), create_notion_page(), delete_notion_page(), delete_obsidian_item(), delete_practice_session(), _ensure_watcher_path(), generate_practice_session(), get_notion_page_content() (+159 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (75): ModelFactory, Unified Model Factory to provide a consistent LangChain interface      across mu, ArchitectAgent, CriticAgent, HubAgent, PractitionerAgent, QuestionAgent, QuizAuditorAgent (+67 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (66): get_academics_dashboard(), get_note_data(), AppSecrets, get_app_secrets(), Extracts core secrets from request headers.     Supports 3-tier reasoning levels, BaseModel, getAuthHeaders(), request() (+58 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (26): NativeBackend, cn(), fetchImg(), if(), load(), MermaidWrapper(), fetchRows(), fetchTemplates() (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (27): FileSystemEventHandler, is_safe_to_normalize(), normalize(), PdfSanitizer, Scan existing store and prepare for background watching., Autonomously standardizes PDFs to a high-fidelity internal coordinate system., start_auto_sanitizer(), _deep_clean_value() (+19 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (26): async(), confirmDeployment(), fetchFiles(), fetchInbox(), fetchStats(), fetchStatus(), formatValue(), handleBack() (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (12): cleanTitle(), handleScaffold(), handleUpdateProgram(), async(), handleSetStatus(), confidenceColorClass(), getVal(), gradeColorClass() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.1
Nodes (8): cn(), getPageNumbers(), sleep(), get_domain_instruction(), get_professional_domain(), _is_rate_limit(), _parse_json(), Wait until we have enough capacity to proceed based on RPM and TPM.

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (12): get_model(), Captures rate limit information from LLM responses., Capture rate limits and usage stats from metadata., TrackingCallbackHandler, ProviderRateLimit, RateLimitTracker, get_rate_limits(), Returns the current captured rate limit state for all providers. (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (14): calculateScore(), handleDeletePractice(), handleResumePractice(), handleSelectAnswer(), handleStartSession(), handleSubmitAnswer(), loadHubNotes(), loadHubs() (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (4): calculateScore(), handleDeletePractice(), loadPastPractices(), nextQuestion()

### Community 11 - "Community 11"
Cohesion: 0.21
Nodes (9): cleanLink(), cleanTitle(), fetchInbox(), fetchStatus(), handleHubSelect(), poll(), processSelectedFile(), resetOkaSession() (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (9): Sheet(), SheetClose(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetPortal(), SheetTitle() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (9): Select(), SelectGroup(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (6): finishQuiz(), handleSelectAnswer(), handleSelfGrade(), moveDown(), moveUp(), nextQuestion()

### Community 16 - "Community 16"
Cohesion: 0.25
Nodes (4): ThemeSwitch(), ThemeProvider(), useTheme(), Toaster()

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (3): deduplicate_plan(), Rebuild the hub's ## Connections section from the actual deployed atomic notes., sync_hub_connections()

### Community 18 - "Community 18"
Cohesion: 0.36
Nodes (3): getColor(), handleNodeCanvasObject(), updateDims()

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (2): fetchOptions(), handleCreateOption()

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (3): LayoutProvider(), useLayout(), AuthenticatedLayoutContent()

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (2): cn(), CommandItem()

### Community 22 - "Community 22"
Cohesion: 0.48
Nodes (5): Dialog(), DialogClose(), DialogOverlay(), DialogPortal(), DialogTrigger()

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (1): VaultEventBus

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (1): handleSendMessage()

### Community 26 - "Community 26"
Cohesion: 0.7
Nodes (4): fix_assignments(), fix_exams(), fix_study_planner(), process_file()

### Community 27 - "Community 27"
Cohesion: 0.6
Nodes (3): fix_exams(), fix_study_planner(), process_file()

### Community 29 - "Community 29"
Cohesion: 0.6
Nodes (3): CardDescription(), CardFooter(), cn()

### Community 32 - "Community 32"
Cohesion: 0.6
Nodes (3): getCookie(), removeCookie(), setCookie()

### Community 33 - "Community 33"
Cohesion: 0.3
Nodes (3): Recursively unwrap nested lists and strip all bracket/quote artifacts., test_vault_manager_dump_obsidian_yaml(), test_vault_manager_process_code_blocks()

### Community 34 - "Community 34"
Cohesion: 0.5
Nodes (2): run(), main()

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (2): SearchProvider(), useSearch()

### Community 39 - "Community 39"
Cohesion: 0.67
Nodes (2): ScrollArea(), ScrollBar()

### Community 40 - "Community 40"
Cohesion: 0.67
Nodes (2): RadioGroup(), RadioGroupItem()

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (2): ConfigProvider(), useConfig()

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (2): Popover(), PopoverTrigger()

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (2): isActive(), renderNode()

### Community 48 - "Community 48"
Cohesion: 0.67
Nodes (1): Label()

### Community 50 - "Community 50"
Cohesion: 0.67
Nodes (1): Badge()

### Community 51 - "Community 51"
Cohesion: 0.67
Nodes (1): cn()

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (1): Input()

### Community 71 - "Community 71"
Cohesion: 1.0
Nodes (1): Scans the academic root and extracts YAML metadata from all notes.

### Community 120 - "Community 120"
Cohesion: 1.0
Nodes (1): Returns (is_valid, error_messages).         A note fails if it:           - Is m

### Community 121 - "Community 121"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.

### Community 122 - "Community 122"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 123 - "Community 123"
Cohesion: 1.0
Nodes (1): Recursively strips ALL quote forms from [[wikilink]] strings.

### Community 124 - "Community 124"
Cohesion: 1.0
Nodes (1): Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -

### Community 126 - "Community 126"
Cohesion: 1.0
Nodes (1): Instantiates and returns the appropriate LangChain ChatModel.

### Community 127 - "Community 127"
Cohesion: 1.0
Nodes (1): Safety check:          1. Must be a valid PDF.         2. Must be low resolution

### Community 142 - "Community 142"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 143 - "Community 143"
Cohesion: 1.0
Nodes (1): Proactively manages rate limits (Tokens Per Minute / Day) via SQLite to avoid br

### Community 144 - "Community 144"
Cohesion: 1.0
Nodes (1): Wait until we have enough capacity to proceed.

### Community 145 - "Community 145"
Cohesion: 1.0
Nodes (1): Parses a note into frontmatter and body.

### Community 146 - "Community 146"
Cohesion: 1.0
Nodes (1): Standardizes and protects code blocks in content for Obsidian.

### Community 147 - "Community 147"
Cohesion: 1.0
Nodes (1): Scans the academic root and extracts YAML metadata from all notes.

### Community 148 - "Community 148"
Cohesion: 1.0
Nodes (1): Serves a file directly from the vault (for PDFs, images, etc.)

### Community 149 - "Community 149"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.

### Community 150 - "Community 150"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 151 - "Community 151"
Cohesion: 1.0
Nodes (1): Parses a note into frontmatter and body.

### Community 152 - "Community 152"
Cohesion: 1.0
Nodes (1): Standardizes and protects code blocks in content for Obsidian.

### Community 153 - "Community 153"
Cohesion: 1.0
Nodes (1): Scans the academic root and extracts YAML metadata from all notes.

## Knowledge Gaps
- **64 isolated node(s):** `Manages the local ChromaDB instance and the local embedding model.     Uses 'all`, `Embeds and adds documents to the vector store.`, `Queries the vector store for the most relevant chunks.`, `Deletes all chunks associated with a specific file path.         This is crucial`, `Nuclear-grade validation suite for OKA notes.     Checks structure, wikilink den` (+59 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 19`** (8 nodes): `EditableCell.tsx`, `ButtonCell()`, `fetchOptions()`, `getBadgeColor()`, `handleCreateOption()`, `renderInlineMarkdown()`, `RollupCell()`, `TypeIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (7 nodes): `command.tsx`, `command.tsx`, `cn()`, `CommandGroup()`, `CommandInput()`, `CommandItem()`, `CommandList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (7 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (6 nodes): `events.py`, `VaultEventBus`, `.__init__()`, `.publish()`, `.subscribe()`, `.unsubscribe()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (6 nodes): `AiSidecar.tsx`, `AiSidecar.tsx`, `handleAnswerQuiz()`, `handleInitialExplain()`, `handleSendMessage()`, `nextQuestion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (4 nodes): `lib.rs`, `main.rs`, `run()`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (4 nodes): `search-provider.tsx`, `search-provider.tsx`, `SearchProvider()`, `useSearch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (4 nodes): `scroll-area.tsx`, `scroll-area.tsx`, `ScrollArea()`, `ScrollBar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (4 nodes): `radio-group.tsx`, `radio-group.tsx`, `RadioGroup()`, `RadioGroupItem()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (4 nodes): `ConfigContext.tsx`, `ConfigContext.tsx`, `ConfigProvider()`, `useConfig()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (4 nodes): `popover.tsx`, `popover.tsx`, `Popover()`, `PopoverTrigger()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (4 nodes): `NoteMetadata.tsx`, `getPropertyIcon()`, `isActive()`, `renderNode()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (3 nodes): `label.tsx`, `label.tsx`, `Label()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (3 nodes): `badge.tsx`, `badge.tsx`, `Badge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (3 nodes): `button.tsx`, `button.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (3 nodes): `input.tsx`, `input.tsx`, `Input()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 71`** (2 nodes): `Scans the academic root and extracts YAML metadata from all notes.`, `.load_metadata()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (1 nodes): `Returns (is_valid, error_messages).         A note fails if it:           - Is m`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 121`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 122`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 123`** (1 nodes): `Recursively strips ALL quote forms from [[wikilink]] strings.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (1 nodes): `Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `Instantiates and returns the appropriate LangChain ChatModel.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (1 nodes): `Safety check:          1. Must be a valid PDF.         2. Must be low resolution`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 142`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (1 nodes): `Proactively manages rate limits (Tokens Per Minute / Day) via SQLite to avoid br`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 144`** (1 nodes): `Wait until we have enough capacity to proceed.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 145`** (1 nodes): `Parses a note into frontmatter and body.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 146`** (1 nodes): `Standardizes and protects code blocks in content for Obsidian.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 147`** (1 nodes): `Scans the academic root and extracts YAML metadata from all notes.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (1 nodes): `Serves a file directly from the vault (for PDFs, images, etc.)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 150`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 151`** (1 nodes): `Parses a note into frontmatter and body.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (1 nodes): `Standardizes and protects code blocks in content for Obsidian.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 153`** (1 nodes): `Scans the academic root and extracts YAML metadata from all notes.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OkaService` connect `Community 0` to `Community 8`, `Community 1`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `AppSecrets` connect `Community 2` to `Community 0`, `Community 8`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `ModelFactory` connect `Community 1` to `Community 8`, `Community 0`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 131 inferred relationships involving `OkaService` (e.g. with `VaultManager` and `OkaDeployer`) actually correct?**
  _`OkaService` has 131 INFERRED edges - model-reasoned connections that need verification._
- **Are the 122 inferred relationships involving `ModelFactory` (e.g. with `OkaService` and `Main orchestrator for OKA.`) actually correct?**
  _`ModelFactory` has 122 INFERRED edges - model-reasoned connections that need verification._
- **Are the 108 inferred relationships involving `AppSecrets` (e.g. with `ObsidianDumper` and `UpdateRowRequest`) actually correct?**
  _`AppSecrets` has 108 INFERRED edges - model-reasoned connections that need verification._
- **Are the 87 inferred relationships involving `OkaQueueManager` (e.g. with `OkaService` and `Life OS - FastAPI Sidecar Entry Point  This process is spawned by Tauri on deskt`) actually correct?**
  _`OkaQueueManager` has 87 INFERRED edges - model-reasoned connections that need verification._