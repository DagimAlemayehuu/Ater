# Graph Report - LifeOs  (2026-05-03)

## Corpus Check
- 198 files · ~277,348 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1151 nodes · 3169 edges · 54 communities detected
- Extraction: 37% EXTRACTED · 63% INFERRED · 0% AMBIGUOUS · INFERRED: 2000 edges (avg confidence: 0.54)
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
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 126|Community 126]]
- [[_COMMUNITY_Community 127|Community 127]]
- [[_COMMUNITY_Community 128|Community 128]]
- [[_COMMUNITY_Community 129|Community 129]]
- [[_COMMUNITY_Community 130|Community 130]]
- [[_COMMUNITY_Community 132|Community 132]]
- [[_COMMUNITY_Community 133|Community 133]]
- [[_COMMUNITY_Community 148|Community 148]]
- [[_COMMUNITY_Community 149|Community 149]]
- [[_COMMUNITY_Community 150|Community 150]]

## God Nodes (most connected - your core abstractions)
1. `OkaService` - 175 edges
2. `NotionClient` - 159 edges
3. `AppSecrets` - 155 edges
4. `ModelFactory` - 153 edges
5. `VaultIndexer` - 131 edges
6. `OkaQueueManager` - 129 edges
7. `ChromaManager` - 128 edges
8. `ObsidianClient` - 125 edges
9. `NotionMirrorService` - 124 edges
10. `RAGWatcherService` - 123 edges

## Surprising Connections (you probably didn't know these)
- `fix_exams()` --calls--> `load()`  [INFERRED]
  scratch/standardize_db.py → apps/mobile-client/src/routes/ModuleView.tsx
- `fix_study_planner()` --calls--> `load()`  [INFERRED]
  scratch/standardize_db.py → apps/mobile-client/src/routes/ModuleView.tsx
- `fix_assignments()` --calls--> `load()`  [INFERRED]
  scratch/standardize_db.py → apps/mobile-client/src/routes/ModuleView.tsx
- `handleSync()` --calls--> `fetchDatabases()`  [INFERRED]
  scratch/academic_snapshot.tsx → apps/mobile-client/src/routes/VaultSync.tsx
- `main()` --calls--> `AppSecrets`  [INFERRED]
  scratch/test_detect.py → apps/api/src/api/deps.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (210): AppSecrets, ai_upload(), create_notion_page(), delete_notion_page(), delete_obsidian_item(), delete_practice_session(), _ensure_watcher_path(), generate_practice_session() (+202 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (72): ModelFactory, Unified Model Factory to provide a consistent LangChain interface      across mu, ArchitectAgent, 2-Pass content generator.      Pass 1 (Theorist)  — Sections 1-3: deep prose wit, Returns True if the body talks about things clearly unrelated to the title., Plans the curriculum.  Token-efficient: uses a compact prompt and     falls back, WriterAgent, OkaDeployer (+64 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (26): NativeBackend, fetchImg(), if(), InlineDatabaseResolver(), load(), MermaidWrapper(), fetchRows(), fetchTemplates() (+18 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (56): get_academics_dashboard(), get_note_data(), BaseModel, getAuthHeaders(), request(), create_property_option(), create_vault_row(), CreateDatabaseRequest (+48 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (29): handleBack(), handleForward(), async(), confirmDeployment(), fetchFiles(), fetchInbox(), fetchStats(), fetchStatus() (+21 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (33): Updates page content.      Simplification: Clears all current blocks and replace, update_notion_page_content(), NotionCacheService, Retrieves all cached pages for a database., Local SQLite caching layer for Notion data.     Provides 0ms latency for fronten, Retrieves a single cached page by ID., Lists all cached databases., Removes a page from the cache. (+25 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (25): cn(), getPageNumbers(), sleep(), is_safe_to_normalize(), normalize(), PdfSanitizer, Scan existing store and prepare for background watching., Autonomously standardizes PDFs to a high-fidelity internal coordinate system. (+17 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (10): FileSystemEventHandler, Writes (creates or updates) a specific note., _deep_clean_value(), sanitize_prerequisites(), _nuclear_wikilink_clean(), Dumps YAML with correct Obsidian property types.                  KEY DISTINCTIO, Asynchronously writes content to a file, ensuring parent directories exist., _strip_wikilink_quotes() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (12): get_model(), Captures rate limit information from LLM responses., Capture rate limits and usage stats from metadata., TrackingCallbackHandler, ProviderRateLimit, RateLimitTracker, get_rate_limits(), Returns the current captured rate limit state for all providers. (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.26
Nodes (12): calculateScore(), handleDeletePractice(), handleResumePractice(), handleSelectAnswer(), handleStartSession(), handleSubmitAnswer(), loadHubNotes(), loadHubs() (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (4): calculateScore(), handleDeletePractice(), loadPastPractices(), nextQuestion()

### Community 11 - "Community 11"
Cohesion: 0.2
Nodes (4): fetchInbox(), fetchStatus(), resetOkaSession(), toggleAutoDeploy()

### Community 12 - "Community 12"
Cohesion: 0.24
Nodes (6): confidenceColorClass(), getVal(), gradeColorClass(), priorityColorClass(), statusColorClass(), stripWL()

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (9): Sheet(), SheetClose(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetPortal(), SheetTitle() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (9): Select(), SelectGroup(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger() (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.25
Nodes (4): ThemeSwitch(), ThemeProvider(), useTheme(), Toaster()

### Community 17 - "Community 17"
Cohesion: 0.36
Nodes (3): getColor(), handleNodeCanvasObject(), updateDims()

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (3): LayoutProvider(), useLayout(), AuthenticatedLayoutContent()

### Community 19 - "Community 19"
Cohesion: 0.48
Nodes (5): Dialog(), DialogClose(), DialogOverlay(), DialogPortal(), DialogTrigger()

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (2): fetchOptions(), handleCreateOption()

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (2): cn(), CommandItem()

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (1): handleSendMessage()

### Community 24 - "Community 24"
Cohesion: 0.6
Nodes (4): cleanLabel(), cleanValue(), parseMarkdownToProfileData(), stripMarkdown()

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (1): VaultEventBus

### Community 27 - "Community 27"
Cohesion: 0.7
Nodes (4): fix_assignments(), fix_exams(), fix_study_planner(), process_file()

### Community 28 - "Community 28"
Cohesion: 0.6
Nodes (3): fix_exams(), fix_study_planner(), process_file()

### Community 31 - "Community 31"
Cohesion: 0.6
Nodes (3): CardDescription(), CardFooter(), cn()

### Community 35 - "Community 35"
Cohesion: 0.5
Nodes (2): handleKeyDown(), saveAndGo()

### Community 36 - "Community 36"
Cohesion: 0.6
Nodes (3): getCookie(), removeCookie(), setCookie()

### Community 37 - "Community 37"
Cohesion: 0.5
Nodes (2): run(), main()

### Community 38 - "Community 38"
Cohesion: 0.67
Nodes (2): SearchProvider(), useSearch()

### Community 41 - "Community 41"
Cohesion: 0.67
Nodes (2): Popover(), PopoverTrigger()

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (2): ScrollArea(), ScrollBar()

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (2): RadioGroup(), RadioGroupItem()

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (2): ConfigProvider(), useConfig()

### Community 49 - "Community 49"
Cohesion: 0.67
Nodes (2): isActive(), renderNode()

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (1): Label()

### Community 54 - "Community 54"
Cohesion: 0.67
Nodes (1): Badge()

### Community 55 - "Community 55"
Cohesion: 0.67
Nodes (1): cn()

### Community 56 - "Community 56"
Cohesion: 0.67
Nodes (1): Input()

### Community 62 - "Community 62"
Cohesion: 0.67
Nodes (2): get_app_secrets(), Extracts core secrets from request headers.     Supports 3-tier reasoning levels

### Community 63 - "Community 63"
Cohesion: 0.67
Nodes (3): Academic Profile, Computer Programming, OKA Protocol

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (1): Renames or moves a file or folder.

### Community 126 - "Community 126"
Cohesion: 1.0
Nodes (1): Returns (is_valid, error_messages).         A note fails if it:           - Is m

### Community 127 - "Community 127"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.

### Community 128 - "Community 128"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 129 - "Community 129"
Cohesion: 1.0
Nodes (1): Recursively strips ALL quote forms from [[wikilink]] strings.

### Community 130 - "Community 130"
Cohesion: 1.0
Nodes (1): Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -

### Community 132 - "Community 132"
Cohesion: 1.0
Nodes (1): Instantiates and returns the appropriate LangChain ChatModel.

### Community 133 - "Community 133"
Cohesion: 1.0
Nodes (1): Safety check:          1. Must be a valid PDF.         2. Must be low resolution

### Community 148 - "Community 148"
Cohesion: 1.0
Nodes (1): Serves a file directly from the vault (for PDFs, images, etc.)

### Community 149 - "Community 149"
Cohesion: 1.0
Nodes (1): Serves a file directly from the vault (for PDFs, images, etc.)

### Community 150 - "Community 150"
Cohesion: 1.0
Nodes (1): Statistics and Probability

## Knowledge Gaps
- **80 isolated node(s):** `Manages the local ChromaDB instance and the local embedding model.     Uses 'all`, `Embeds and adds documents to the vector store.`, `Queries the vector store for the most relevant chunks.`, `Deletes all chunks associated with a specific file path.         This is crucial`, `Life OS Notion API Client.     Synchronizes with the user's Notion workspace.` (+75 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 20`** (7 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (7 nodes): `EditableCell.tsx`, `compute()`, `fetchOptions()`, `getBadgeColor()`, `handleCreateOption()`, `renderInlineMarkdown()`, `TypeIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (7 nodes): `command.tsx`, `command.tsx`, `cn()`, `CommandGroup()`, `CommandInput()`, `CommandItem()`, `CommandList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (6 nodes): `AiSidecar.tsx`, `AiSidecar.tsx`, `handleAnswerQuiz()`, `handleInitialExplain()`, `handleSendMessage()`, `nextQuestion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (6 nodes): `events.py`, `VaultEventBus`, `.__init__()`, `.publish()`, `.subscribe()`, `.unsubscribe()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (5 nodes): `ProfileEditor.tsx`, `flattenSchema()`, `handleKeyDown()`, `normalize()`, `saveAndGo()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (4 nodes): `lib.rs`, `main.rs`, `run()`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (4 nodes): `search-provider.tsx`, `search-provider.tsx`, `SearchProvider()`, `useSearch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (4 nodes): `popover.tsx`, `popover.tsx`, `Popover()`, `PopoverTrigger()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (4 nodes): `scroll-area.tsx`, `scroll-area.tsx`, `ScrollArea()`, `ScrollBar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (4 nodes): `radio-group.tsx`, `radio-group.tsx`, `RadioGroup()`, `RadioGroupItem()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (4 nodes): `ConfigContext.tsx`, `ConfigContext.tsx`, `ConfigProvider()`, `useConfig()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (4 nodes): `NoteMetadata.tsx`, `getPropertyIcon()`, `isActive()`, `renderNode()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (3 nodes): `label.tsx`, `label.tsx`, `Label()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (3 nodes): `badge.tsx`, `badge.tsx`, `Badge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (3 nodes): `button.tsx`, `button.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (3 nodes): `input.tsx`, `input.tsx`, `Input()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (3 nodes): `get_app_secrets()`, `Extracts core secrets from request headers.     Supports 3-tier reasoning levels`, `deps.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (2 nodes): `.rename_item()`, `Renames or moves a file or folder.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `Returns (is_valid, error_messages).         A note fails if it:           - Is m`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (1 nodes): `Recursively strips ALL quote forms from [[wikilink]] strings.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (1 nodes): `Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (1 nodes): `Instantiates and returns the appropriate LangChain ChatModel.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 133`** (1 nodes): `Safety check:          1. Must be a valid PDF.         2. Must be low resolution`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (1 nodes): `Serves a file directly from the vault (for PDFs, images, etc.)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (1 nodes): `Serves a file directly from the vault (for PDFs, images, etc.)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 150`** (1 nodes): `Statistics and Probability`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OkaService` connect `Community 0` to `Community 1`, `Community 5`, `Community 6`, `Community 7`, `Community 8`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `NotionClient` connect `Community 0` to `Community 8`, `Community 5`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `AppSecrets` connect `Community 0` to `Community 8`, `Community 3`, `Community 5`, `Community 62`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Are the 143 inferred relationships involving `OkaService` (e.g. with `VaultManager` and `OkaDeployer`) actually correct?**
  _`OkaService` has 143 INFERRED edges - model-reasoned connections that need verification._
- **Are the 144 inferred relationships involving `NotionClient` (e.g. with `NotionMirrorService` and `Pulls structured data from Notion Databases and writes them as      individual M`) actually correct?**
  _`NotionClient` has 144 INFERRED edges - model-reasoned connections that need verification._
- **Are the 152 inferred relationships involving `AppSecrets` (e.g. with `Returns a list of all locally cached databases.` and `Returns the schema and rows for a specific database.     If not in cache or forc`) actually correct?**
  _`AppSecrets` has 152 INFERRED edges - model-reasoned connections that need verification._
- **Are the 151 inferred relationships involving `ModelFactory` (e.g. with `OkaService` and `Main orchestrator for OKA.`) actually correct?**
  _`ModelFactory` has 151 INFERRED edges - model-reasoned connections that need verification._