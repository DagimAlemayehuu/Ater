# Graph Report - LifeOs  (2026-05-02)

## Corpus Check
- 191 files · ~295,689 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1084 nodes · 2751 edges · 57 communities detected
- Extraction: 41% EXTRACTED · 59% INFERRED · 0% AMBIGUOUS · INFERRED: 1612 edges (avg confidence: 0.54)
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
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 125|Community 125]]
- [[_COMMUNITY_Community 126|Community 126]]
- [[_COMMUNITY_Community 127|Community 127]]
- [[_COMMUNITY_Community 128|Community 128]]
- [[_COMMUNITY_Community 129|Community 129]]
- [[_COMMUNITY_Community 131|Community 131]]
- [[_COMMUNITY_Community 132|Community 132]]
- [[_COMMUNITY_Community 147|Community 147]]
- [[_COMMUNITY_Community 148|Community 148]]

## God Nodes (most connected - your core abstractions)
1. `OkaService` - 158 edges
2. `NotionClient` - 142 edges
3. `AppSecrets` - 131 edges
4. `ModelFactory` - 121 edges
5. `VaultIndexer` - 114 edges
6. `OkaQueueManager` - 112 edges
7. `ChromaManager` - 111 edges
8. `ObsidianClient` - 108 edges
9. `NotionMirrorService` - 107 edges
10. `RAGWatcherService` - 106 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `AppSecrets`  [INFERRED]
  scratch/test_detect.py → apps/api/src/api/deps.py
- `main()` --calls--> `OkaService`  [INFERRED]
  scratch/test_detect.py → apps/api/src/domains/oka/service.py
- `handleSync()` --calls--> `fetchDatabases()`  [INFERRED]
  scratch/academic_snapshot.tsx → apps/mobile-client/src/routes/VaultSync.tsx
- `ChromaManager` --uses--> `Loads mtimes from disk.`  [INFERRED]
  apps/api/src/domains/rag/vector_store.py → apps/api/src/domains/rag/indexer.py
- `ChromaManager` --uses--> `Clears the entire ChromaDB and resets local tracker.`  [INFERRED]
  apps/api/src/domains/rag/vector_store.py → apps/api/src/domains/rag/indexer.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (124): ModelFactory, Unified Model Factory to provide a consistent LangChain interface      across mu, AppSecrets, delete_obsidian_item(), rag_watcher_toggle(), Life OS - FastAPI Sidecar Entry Point  This process is spawned by Tauri on deskt, Generates a structured JSON quiz for the interactive sidebar., Generates a structured JSON quiz for the interactive sidebar. (+116 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (70): list_practice_sessions(), oka_confirm_plan(), oka_list_hubs(), oka_process_manual(), oka_resume_paused_session(), Writes (creates or updates) a specific note., ArchitectAgent, _count_wikilinks() (+62 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (54): get_academics_dashboard(), get_note_data(), oka_list_generated(), read_obsidian_file(), BaseModel, getAuthHeaders(), request(), Reads the content of a specific note and its frontmatter. (+46 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (23): NativeBackend, fetchImg(), load(), fetchRows(), fetchTemplates(), handleCreateRow(), handleSync(), fetchRows() (+15 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (47): get_model(), Captures rate limit information from LLM responses., Capture rate limits and usage stats from metadata., TrackingCallbackHandler, ProviderRateLimit, RateLimitTracker, delete_notion_page(), delete_practice_session() (+39 more)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (40): create_notion_page(), get_notion_page_content(), list_notion_databases(), query_notion_database(), update_notion_page(), NotionCacheService, Retrieves all cached pages for a database., Local SQLite caching layer for Notion data.     Provides 0ms latency for fronten (+32 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (30): if(), InlineDatabaseResolver(), MermaidWrapper(), handleBack(), handleForward(), confirmDeployment(), fetchFiles(), fetchInbox() (+22 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (23): ai_upload(), cn(), getPageNumbers(), sleep(), is_safe_to_normalize(), normalize(), PdfSanitizer, Scan existing store and prepare for background watching. (+15 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (6): FileSystemEventHandler, _deep_clean_value(), _nuclear_wikilink_clean(), Asynchronously writes content to a file, ensuring parent directories exist., _strip_wikilink_quotes(), InboxHandler

### Community 9 - "Community 9"
Cohesion: 0.26
Nodes (12): calculateScore(), handleDeletePractice(), handleResumePractice(), handleSelectAnswer(), handleStartSession(), handleSubmitAnswer(), loadHubNotes(), loadHubs() (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (4): calculateScore(), handleDeletePractice(), loadPastPractices(), nextQuestion()

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (8): ProgramTab(), confidenceColorClass(), deriveStatus(), getVal(), gradeColorClass(), priorityColorClass(), statusColorClass(), stripWL()

### Community 12 - "Community 12"
Cohesion: 0.2
Nodes (4): fetchInbox(), fetchStatus(), resetOkaSession(), toggleAutoDeploy()

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
Cohesion: 0.25
Nodes (5): update_notion_page_content(), Deletes a specific block., Appends blocks to a page or a block., Replaces the entire content of a page with the provided markdown text.         I, Retrieves all blocks (content) of a specific page using pagination.

### Community 18 - "Community 18"
Cohesion: 0.36
Nodes (3): getColor(), handleNodeCanvasObject(), updateDims()

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
Nodes (3): LayoutProvider(), useLayout(), AuthenticatedLayoutContent()

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (2): cn(), CommandItem()

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (1): handleSendMessage()

### Community 25 - "Community 25"
Cohesion: 0.6
Nodes (4): cleanLabel(), cleanValue(), parseMarkdownToProfileData(), stripMarkdown()

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (1): VaultEventBus

### Community 29 - "Community 29"
Cohesion: 0.6
Nodes (3): CardDescription(), CardFooter(), cn()

### Community 33 - "Community 33"
Cohesion: 0.5
Nodes (2): handleKeyDown(), saveAndGo()

### Community 34 - "Community 34"
Cohesion: 0.6
Nodes (3): getCookie(), removeCookie(), setCookie()

### Community 35 - "Community 35"
Cohesion: 0.5
Nodes (2): run(), main()

### Community 36 - "Community 36"
Cohesion: 0.67
Nodes (2): SearchProvider(), useSearch()

### Community 39 - "Community 39"
Cohesion: 0.67
Nodes (2): Popover(), PopoverTrigger()

### Community 41 - "Community 41"
Cohesion: 0.67
Nodes (2): ScrollArea(), ScrollBar()

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (2): RadioGroup(), RadioGroupItem()

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (2): isActive(), renderNode()

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (2): ConfigProvider(), useConfig()

### Community 50 - "Community 50"
Cohesion: 0.67
Nodes (1): Label()

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (1): Badge()

### Community 53 - "Community 53"
Cohesion: 0.67
Nodes (1): cn()

### Community 54 - "Community 54"
Cohesion: 0.67
Nodes (1): Input()

### Community 60 - "Community 60"
Cohesion: 0.67
Nodes (2): get_app_secrets(), Extracts core secrets from request headers.     Supports 3-tier reasoning levels

### Community 61 - "Community 61"
Cohesion: 0.67
Nodes (3): Academic Profile, Computer Programming, OKA Protocol

### Community 81 - "Community 81"
Cohesion: 1.0
Nodes (1): Queries the vector store for the most relevant chunks.

### Community 82 - "Community 82"
Cohesion: 1.0
Nodes (1): Updates the properties of a specific Notion page.

### Community 83 - "Community 83"
Cohesion: 1.0
Nodes (1): Retrieves a single Notion page.

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (1): Retrieves metadata/schema for a specific database.

### Community 85 - "Community 85"
Cohesion: 1.0
Nodes (1): Renames or moves a file or folder.

### Community 86 - "Community 86"
Cohesion: 1.0
Nodes (1): Creates a new folder.

### Community 125 - "Community 125"
Cohesion: 1.0
Nodes (1): Returns (is_valid, error_messages).         A note fails if it:           - Is m

### Community 126 - "Community 126"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.

### Community 127 - "Community 127"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 128 - "Community 128"
Cohesion: 1.0
Nodes (1): Recursively strips ALL quote forms from [[wikilink]] strings.

### Community 129 - "Community 129"
Cohesion: 1.0
Nodes (1): Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -

### Community 131 - "Community 131"
Cohesion: 1.0
Nodes (1): Instantiates and returns the appropriate LangChain ChatModel.

### Community 132 - "Community 132"
Cohesion: 1.0
Nodes (1): Safety check:          1. Must be a valid PDF.         2. Must be low resolution

### Community 147 - "Community 147"
Cohesion: 1.0
Nodes (1): Serves a file directly from the vault (for PDFs, images, etc.)

### Community 148 - "Community 148"
Cohesion: 1.0
Nodes (1): Statistics and Probability

## Knowledge Gaps
- **73 isolated node(s):** `Manages the local ChromaDB instance and the local embedding model.     Uses 'all`, `Embeds and adds documents to the vector store.`, `Queries the vector store for the most relevant chunks.`, `Deletes all chunks associated with a specific file path.         This is crucial`, `Life OS Notion API Client.     Synchronizes with the user's Notion workspace.` (+68 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 20`** (7 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (7 nodes): `EditableCell.tsx`, `compute()`, `fetchOptions()`, `getBadgeColor()`, `handleCreateOption()`, `renderInlineMarkdown()`, `TypeIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (7 nodes): `command.tsx`, `command.tsx`, `cn()`, `CommandGroup()`, `CommandInput()`, `CommandItem()`, `CommandList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (6 nodes): `AiSidecar.tsx`, `AiSidecar.tsx`, `handleAnswerQuiz()`, `handleInitialExplain()`, `handleSendMessage()`, `nextQuestion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (6 nodes): `events.py`, `VaultEventBus`, `.__init__()`, `.publish()`, `.subscribe()`, `.unsubscribe()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (5 nodes): `ProfileEditor.tsx`, `flattenSchema()`, `handleKeyDown()`, `normalize()`, `saveAndGo()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (4 nodes): `lib.rs`, `main.rs`, `run()`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (4 nodes): `search-provider.tsx`, `search-provider.tsx`, `SearchProvider()`, `useSearch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (4 nodes): `popover.tsx`, `popover.tsx`, `Popover()`, `PopoverTrigger()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (4 nodes): `scroll-area.tsx`, `scroll-area.tsx`, `ScrollArea()`, `ScrollBar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (4 nodes): `radio-group.tsx`, `radio-group.tsx`, `RadioGroup()`, `RadioGroupItem()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (4 nodes): `NoteMetadata.tsx`, `getPropertyIcon()`, `isActive()`, `renderNode()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (4 nodes): `ConfigContext.tsx`, `ConfigContext.tsx`, `ConfigProvider()`, `useConfig()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (3 nodes): `label.tsx`, `label.tsx`, `Label()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (3 nodes): `badge.tsx`, `badge.tsx`, `Badge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (3 nodes): `button.tsx`, `button.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (3 nodes): `input.tsx`, `input.tsx`, `Input()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (3 nodes): `get_app_secrets()`, `Extracts core secrets from request headers.     Supports 3-tier reasoning levels`, `deps.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 81`** (2 nodes): `.query()`, `Queries the vector store for the most relevant chunks.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 82`** (2 nodes): `.update_page_properties()`, `Updates the properties of a specific Notion page.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 83`** (2 nodes): `.get_page()`, `Retrieves a single Notion page.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (2 nodes): `.get_database()`, `Retrieves metadata/schema for a specific database.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (2 nodes): `.rename_item()`, `Renames or moves a file or folder.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 86`** (2 nodes): `.create_folder()`, `Creates a new folder.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 125`** (1 nodes): `Returns (is_valid, error_messages).         A note fails if it:           - Is m`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (1 nodes): `Recursively strips ALL quote forms from [[wikilink]] strings.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (1 nodes): `Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 131`** (1 nodes): `Instantiates and returns the appropriate LangChain ChatModel.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (1 nodes): `Safety check:          1. Must be a valid PDF.         2. Must be low resolution`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 147`** (1 nodes): `Serves a file directly from the vault (for PDFs, images, etc.)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (1 nodes): `Statistics and Probability`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OkaService` connect `Community 0` to `Community 1`, `Community 2`, `Community 4`, `Community 7`, `Community 8`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Why does `NotionClient` connect `Community 0` to `Community 4`, `Community 5`, `Community 17`, `Community 82`, `Community 83`, `Community 84`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `AppSecrets` connect `Community 0` to `Community 1`, `Community 2`, `Community 60`, `Community 5`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 126 inferred relationships involving `OkaService` (e.g. with `VaultManager` and `OkaDeployer`) actually correct?**
  _`OkaService` has 126 INFERRED edges - model-reasoned connections that need verification._
- **Are the 127 inferred relationships involving `NotionClient` (e.g. with `NotionMirrorService` and `Pulls structured data from Notion Databases and writes them as      individual M`) actually correct?**
  _`NotionClient` has 127 INFERRED edges - model-reasoned connections that need verification._
- **Are the 128 inferred relationships involving `AppSecrets` (e.g. with `Returns a list of all locally cached databases.` and `Returns the schema and rows for a specific database.     If not in cache or forc`) actually correct?**
  _`AppSecrets` has 128 INFERRED edges - model-reasoned connections that need verification._
- **Are the 119 inferred relationships involving `ModelFactory` (e.g. with `OkaService` and `Main orchestrator for OKA.`) actually correct?**
  _`ModelFactory` has 119 INFERRED edges - model-reasoned connections that need verification._