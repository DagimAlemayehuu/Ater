# Graph Report - LifeOs  (2026-05-07)

## Corpus Check
- 195 files · ~208,417 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1108 nodes · 3024 edges · 66 communities detected
- Extraction: 38% EXTRACTED · 62% INFERRED · 0% AMBIGUOUS · INFERRED: 1878 edges (avg confidence: 0.53)
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
- [[_COMMUNITY_Community 15|Community 15]]
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
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 121|Community 121]]
- [[_COMMUNITY_Community 122|Community 122]]
- [[_COMMUNITY_Community 123|Community 123]]
- [[_COMMUNITY_Community 124|Community 124]]
- [[_COMMUNITY_Community 125|Community 125]]
- [[_COMMUNITY_Community 127|Community 127]]
- [[_COMMUNITY_Community 128|Community 128]]
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
- [[_COMMUNITY_Community 154|Community 154]]
- [[_COMMUNITY_Community 155|Community 155]]
- [[_COMMUNITY_Community 156|Community 156]]
- [[_COMMUNITY_Community 157|Community 157]]
- [[_COMMUNITY_Community 158|Community 158]]
- [[_COMMUNITY_Community 159|Community 159]]

## God Nodes (most connected - your core abstractions)
1. `OkaService` - 164 edges
2. `ModelFactory` - 133 edges
3. `AppSecrets` - 111 edges
4. `OkaQueueManager` - 104 edges
5. `VaultIndexer` - 103 edges
6. `ChromaManager` - 100 edges
7. `ObsidianClient` - 97 edges
8. `RAGWatcherService` - 95 edges
9. `VaultManager` - 69 edges
10. `OkaDeployer` - 58 edges

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
Nodes (165): get_model(), RateLimitTracker, ai_upload(), create_notion_page(), delete_notion_page(), delete_obsidian_item(), delete_practice_session(), _ensure_watcher_path() (+157 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (69): get_academics_dashboard(), get_note_data(), ProviderRateLimit, AppSecrets, get_app_secrets(), Extracts core secrets from request headers.     Supports 3-tier reasoning levels, _update_rag_status(), BaseModel (+61 more)

### Community 2 - "Community 2"
Cohesion: 0.23
Nodes (71): ModelFactory, Unified Model Factory to provide a consistent LangChain interface      across mu, ArchitectAgent, CriticAgent, HubAgent, PractitionerAgent, QuestionAgent, QuizAuditorAgent (+63 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (27): NativeBackend, cn(), fetchImg(), if(), load(), MermaidWrapper(), fetchRows(), fetchTemplates() (+19 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (26): async(), confirmDeployment(), fetchFiles(), fetchInbox(), fetchStats(), fetchStatus(), formatValue(), handleBack() (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (20): FileSystemEventHandler, is_safe_to_normalize(), normalize(), PdfSanitizer, Scan existing store and prepare for background watching., Autonomously standardizes PDFs to a high-fidelity internal coordinate system., start_auto_sanitizer(), InboxHandler (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (20): Writes (creates or updates) a specific note., _deep_clean_value(), Surgically deploys the unit hub., Resolves an anchored hub ID to an absolute path., Parses AI output and triggers batch deployment.         Hub and PQ notes are ALW, Surgically deploys one or more atomic notes., _has_math_domain_drift(), sanitize_prerequisites() (+12 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (19): cn(), getPageNumbers(), sleep(), get_domain_instruction(), get_professional_domain(), _is_rate_limit(), _parse_json(), Pseudo-randomly selects a professional domain based on title. (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (12): cleanTitle(), handleScaffold(), handleUpdateProgram(), async(), handleSetStatus(), confidenceColorClass(), getVal(), gradeColorClass() (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (14): calculateScore(), handleDeletePractice(), handleResumePractice(), handleSelectAnswer(), handleStartSession(), handleSubmitAnswer(), loadHubNotes(), loadHubs() (+6 more)

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (10): canonicalize_unit(), deduplicate_plan(), Rebuild the hub's ## Connections section from the actual deployed atomic notes., Deterministic content sanitizer for weak-LLM artifacts.      Fixes applied (in o, Scans all notes in unit_dir and removes wikilinks that don't point to      an ex, Scan a deployed note for dead quiz stubs that slipped past validation.     Retur, reconcile_broken_links(), sanitize_body() (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (4): calculateScore(), handleDeletePractice(), loadPastPractices(), nextQuestion()

### Community 12 - "Community 12"
Cohesion: 0.21
Nodes (9): cleanLink(), cleanTitle(), fetchInbox(), fetchStatus(), handleHubSelect(), poll(), processSelectedFile(), resetOkaSession() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (9): Sheet(), SheetClose(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetPortal(), SheetTitle() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (9): Select(), SelectGroup(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger() (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (6): finishQuiz(), handleSelectAnswer(), handleSelfGrade(), moveDown(), moveUp(), nextQuestion()

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (4): ThemeSwitch(), ThemeProvider(), useTheme(), Toaster()

### Community 18 - "Community 18"
Cohesion: 0.36
Nodes (3): getColor(), handleNodeCanvasObject(), updateDims()

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (2): fetchOptions(), handleCreateOption()

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (5): Captures rate limit information from LLM responses., Capture rate limits and usage stats from metadata., TrackingCallbackHandler, AsyncCallbackHandler, BaseCallbackHandler

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (3): LayoutProvider(), useLayout(), AuthenticatedLayoutContent()

### Community 22 - "Community 22"
Cohesion: 0.48
Nodes (5): Dialog(), DialogClose(), DialogOverlay(), DialogPortal(), DialogTrigger()

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (2): cn(), CommandItem()

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (1): handleSendMessage()

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (1): VaultEventBus

### Community 27 - "Community 27"
Cohesion: 0.7
Nodes (4): fix_assignments(), fix_exams(), fix_study_planner(), process_file()

### Community 28 - "Community 28"
Cohesion: 0.6
Nodes (3): fix_exams(), fix_study_planner(), process_file()

### Community 30 - "Community 30"
Cohesion: 0.6
Nodes (3): CardDescription(), CardFooter(), cn()

### Community 33 - "Community 33"
Cohesion: 0.6
Nodes (3): getCookie(), removeCookie(), setCookie()

### Community 34 - "Community 34"
Cohesion: 0.5
Nodes (2): run(), main()

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (2): SearchProvider(), useSearch()

### Community 38 - "Community 38"
Cohesion: 0.67
Nodes (2): Popover(), PopoverTrigger()

### Community 40 - "Community 40"
Cohesion: 0.67
Nodes (2): ScrollArea(), ScrollBar()

### Community 41 - "Community 41"
Cohesion: 0.67
Nodes (2): RadioGroup(), RadioGroupItem()

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (2): ConfigProvider(), useConfig()

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

### Community 121 - "Community 121"
Cohesion: 1.0
Nodes (1): Returns (is_valid, error_messages).         A note fails if it:           - Is m

### Community 122 - "Community 122"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.         Handles LaTeX backsla

### Community 123 - "Community 123"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 124 - "Community 124"
Cohesion: 1.0
Nodes (1): Recursively strips ALL quote forms from [[wikilink]] strings.

### Community 125 - "Community 125"
Cohesion: 1.0
Nodes (1): Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -

### Community 127 - "Community 127"
Cohesion: 1.0
Nodes (1): Instantiates and returns the appropriate LangChain ChatModel.

### Community 128 - "Community 128"
Cohesion: 1.0
Nodes (1): Safety check:          1. Must be a valid PDF.         2. Must be low resolution

### Community 143 - "Community 143"
Cohesion: 1.0
Nodes (1): Nuclear-grade validation suite for OKA notes.     Checks structure, wikilink den

### Community 144 - "Community 144"
Cohesion: 1.0
Nodes (1): Returns (is_valid, error_messages).         A note fails if it:           - Is m

### Community 145 - "Community 145"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.

### Community 146 - "Community 146"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 147 - "Community 147"
Cohesion: 1.0
Nodes (1): Rebuild the hub's ## Connections section from the actual deployed atomic notes.

### Community 148 - "Community 148"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 149 - "Community 149"
Cohesion: 1.0
Nodes (1): Proactively manages rate limits (Tokens Per Minute / Day) via SQLite to avoid br

### Community 150 - "Community 150"
Cohesion: 1.0
Nodes (1): Wait until we have enough capacity to proceed.

### Community 151 - "Community 151"
Cohesion: 1.0
Nodes (1): Parses a note into frontmatter and body.

### Community 152 - "Community 152"
Cohesion: 1.0
Nodes (1): Standardizes and protects code blocks in content for Obsidian.

### Community 153 - "Community 153"
Cohesion: 1.0
Nodes (1): Scans the academic root and extracts YAML metadata from all notes.

### Community 154 - "Community 154"
Cohesion: 1.0
Nodes (1): Serves a file directly from the vault (for PDFs, images, etc.)

### Community 155 - "Community 155"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.

### Community 156 - "Community 156"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 157 - "Community 157"
Cohesion: 1.0
Nodes (1): Parses a note into frontmatter and body.

### Community 158 - "Community 158"
Cohesion: 1.0
Nodes (1): Standardizes and protects code blocks in content for Obsidian.

### Community 159 - "Community 159"
Cohesion: 1.0
Nodes (1): Scans the academic root and extracts YAML metadata from all notes.

## Knowledge Gaps
- **74 isolated node(s):** `Manages the local ChromaDB instance and the local embedding model.     Uses 'all`, `Embeds and adds documents to the vector store.`, `Queries the vector store for the most relevant chunks.`, `Deletes all chunks associated with a specific file path.         This is crucial`, `Nuclear-grade validation suite for OKA notes.     Checks structure, wikilink den` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 19`** (8 nodes): `EditableCell.tsx`, `ButtonCell()`, `fetchOptions()`, `getBadgeColor()`, `handleCreateOption()`, `renderInlineMarkdown()`, `RollupCell()`, `TypeIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (7 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (7 nodes): `command.tsx`, `command.tsx`, `cn()`, `CommandGroup()`, `CommandInput()`, `CommandItem()`, `CommandList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (6 nodes): `AiSidecar.tsx`, `AiSidecar.tsx`, `handleAnswerQuiz()`, `handleInitialExplain()`, `handleSendMessage()`, `nextQuestion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (6 nodes): `events.py`, `VaultEventBus`, `.__init__()`, `.publish()`, `.subscribe()`, `.unsubscribe()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (4 nodes): `lib.rs`, `main.rs`, `run()`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (4 nodes): `search-provider.tsx`, `search-provider.tsx`, `SearchProvider()`, `useSearch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (4 nodes): `popover.tsx`, `popover.tsx`, `Popover()`, `PopoverTrigger()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (4 nodes): `scroll-area.tsx`, `scroll-area.tsx`, `ScrollArea()`, `ScrollBar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (4 nodes): `radio-group.tsx`, `radio-group.tsx`, `RadioGroup()`, `RadioGroupItem()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (4 nodes): `ConfigContext.tsx`, `ConfigContext.tsx`, `ConfigProvider()`, `useConfig()`
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
- **Thin community `Community 121`** (1 nodes): `Returns (is_valid, error_messages).         A note fails if it:           - Is m`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 122`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.         Handles LaTeX backsla`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 123`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (1 nodes): `Recursively strips ALL quote forms from [[wikilink]] strings.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 125`** (1 nodes): `Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (1 nodes): `Instantiates and returns the appropriate LangChain ChatModel.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (1 nodes): `Safety check:          1. Must be a valid PDF.         2. Must be low resolution`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (1 nodes): `Nuclear-grade validation suite for OKA notes.     Checks structure, wikilink den`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 144`** (1 nodes): `Returns (is_valid, error_messages).         A note fails if it:           - Is m`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 145`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 146`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 147`** (1 nodes): `Rebuild the hub's ## Connections section from the actual deployed atomic notes.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (1 nodes): `Proactively manages rate limits (Tokens Per Minute / Day) via SQLite to avoid br`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 150`** (1 nodes): `Wait until we have enough capacity to proceed.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 151`** (1 nodes): `Parses a note into frontmatter and body.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (1 nodes): `Standardizes and protects code blocks in content for Obsidian.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 153`** (1 nodes): `Scans the academic root and extracts YAML metadata from all notes.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 154`** (1 nodes): `Serves a file directly from the vault (for PDFs, images, etc.)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 156`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 157`** (1 nodes): `Parses a note into frontmatter and body.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 158`** (1 nodes): `Standardizes and protects code blocks in content for Obsidian.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 159`** (1 nodes): `Scans the academic root and extracts YAML metadata from all notes.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OkaService` connect `Community 0` to `Community 2`, `Community 5`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Why does `ModelFactory` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `AppSecrets` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Are the 131 inferred relationships involving `OkaService` (e.g. with `VaultManager` and `OkaDeployer`) actually correct?**
  _`OkaService` has 131 INFERRED edges - model-reasoned connections that need verification._
- **Are the 131 inferred relationships involving `ModelFactory` (e.g. with `OkaService` and `Main orchestrator for OKA.`) actually correct?**
  _`ModelFactory` has 131 INFERRED edges - model-reasoned connections that need verification._
- **Are the 108 inferred relationships involving `AppSecrets` (e.g. with `ObsidianDumper` and `UpdateRowRequest`) actually correct?**
  _`AppSecrets` has 108 INFERRED edges - model-reasoned connections that need verification._
- **Are the 87 inferred relationships involving `OkaQueueManager` (e.g. with `OkaService` and `Life OS - FastAPI Sidecar Entry Point  This process is spawned by Tauri on deskt`) actually correct?**
  _`OkaQueueManager` has 87 INFERRED edges - model-reasoned connections that need verification._