# Graph Report - LifeOs  (2026-05-02)

## Corpus Check
- 179 files · ~289,879 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1060 nodes · 2741 edges · 49 communities detected
- Extraction: 41% EXTRACTED · 59% INFERRED · 0% AMBIGUOUS · INFERRED: 1611 edges (avg confidence: 0.55)
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
- [[_COMMUNITY_Community 15|Community 15]]
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
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 32|Community 32]]
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
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 109|Community 109]]
- [[_COMMUNITY_Community 110|Community 110]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 112|Community 112]]
- [[_COMMUNITY_Community 114|Community 114]]
- [[_COMMUNITY_Community 115|Community 115]]
- [[_COMMUNITY_Community 130|Community 130]]

## God Nodes (most connected - your core abstractions)
1. `OkaService` - 158 edges
2. `NotionClient` - 142 edges
3. `AppSecrets` - 125 edges
4. `ModelFactory` - 121 edges
5. `VaultIndexer` - 114 edges
6. `OkaQueueManager` - 112 edges
7. `ChromaManager` - 111 edges
8. `ObsidianClient` - 108 edges
9. `NotionMirrorService` - 107 edges
10. `RAGWatcherService` - 106 edges

## Surprising Connections (you probably didn't know these)
- `handleSync()` --calls--> `fetchDatabases()`  [INFERRED]
  scratch/academic_snapshot.tsx → apps/mobile-client/src/routes/VaultSync.tsx
- `main()` --calls--> `AppSecrets`  [INFERRED]
  scratch/test_detect.py → apps/api/src/api/deps.py
- `main()` --calls--> `OkaService`  [INFERRED]
  scratch/test_detect.py → apps/api/src/domains/oka/service.py
- `ChromaManager` --uses--> `Loads mtimes from disk.`  [INFERRED]
  apps/api/src/domains/rag/vector_store.py → apps/api/src/domains/rag/indexer.py
- `ChromaManager` --uses--> `Clears the entire ChromaDB and resets local tracker.`  [INFERRED]
  apps/api/src/domains/rag/vector_store.py → apps/api/src/domains/rag/indexer.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (185): AppSecrets, ai_upload(), create_notion_page(), delete_notion_page(), delete_obsidian_item(), delete_practice_session(), _ensure_watcher_path(), generate_practice_session() (+177 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (35): NativeBackend, fetchImg(), if(), InlineDatabaseResolver(), load(), MermaidWrapper(), fetchRows(), fetchTemplates() (+27 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (64): ModelFactory, Unified Model Factory to provide a consistent LangChain interface      across mu, Writes (creates or updates) a specific note., ArchitectAgent, _count_wikilinks(), _has_domain_drift(), _is_rate_limit(), _parse_json() (+56 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (37): get_academics_dashboard(), get_note_data(), get_model(), Captures rate limit information from LLM responses., Capture rate limits and usage stats from metadata., TrackingCallbackHandler, ProviderRateLimit, RateLimitTracker (+29 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (33): cn(), getPageNumbers(), sleep(), NotionCacheService, Retrieves all cached pages for a database., Local SQLite caching layer for Notion data.     Provides 0ms latency for fronten, Retrieves a single cached page by ID., Lists all cached databases. (+25 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (27): handleBack(), handleForward(), confirmDeployment(), fetchFiles(), fetchHubConnections(), fetchInbox(), fetchStats(), fetchStatus() (+19 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (18): is_safe_to_normalize(), normalize(), PdfSanitizer, Scan existing store and prepare for background watching., Autonomously standardizes PDFs to a high-fidelity internal coordinate system., start_auto_sanitizer(), Public method to force save the mtimes to disk., Removes a file's chunks from the vector store and tracking when deleted. (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (9): FileSystemEventHandler, _deep_clean_value(), resolve_si_path(), _nuclear_wikilink_clean(), Asynchronously writes content to a file, ensuring parent directories exist., _strip_wikilink_quotes(), InboxHandler, Scans the inbox for existing files, adds them to the database, and resets errors (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (17): BaseQuestion, BatchSchema, CodeQuestion, DebugQuestion, FillInQuestion, FindErrorQuestion, MatchingPair, MatchingQuestion (+9 more)

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
Cohesion: 0.33
Nodes (9): Sheet(), SheetClose(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetPortal(), SheetTitle() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (9): Select(), SelectGroup(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger() (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.22
Nodes (6): Updates page content.      Simplification: Clears all current blocks and replace, update_notion_page_content(), Deletes a specific block., Appends blocks to a page or a block., Replaces the entire content of a page with the provided markdown text.         I, Retrieves all blocks (content) of a specific page using pagination.

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
Cohesion: 0.33
Nodes (2): cn(), CommandItem()

### Community 20 - "Community 20"
Cohesion: 0.48
Nodes (5): Dialog(), DialogClose(), DialogOverlay(), DialogPortal(), DialogTrigger()

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (2): fetchOptions(), handleCreateOption()

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (1): handleSendMessage()

### Community 24 - "Community 24"
Cohesion: 0.6
Nodes (4): cleanLabel(), cleanValue(), parseMarkdownToProfileData(), stripMarkdown()

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (1): VaultEventBus

### Community 28 - "Community 28"
Cohesion: 0.6
Nodes (3): CardDescription(), CardFooter(), cn()

### Community 32 - "Community 32"
Cohesion: 0.5
Nodes (2): handleKeyDown(), saveAndGo()

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

### Community 55 - "Community 55"
Cohesion: 0.67
Nodes (2): get_app_secrets(), Extracts core secrets from request headers.     Supports 3-tier reasoning levels

### Community 56 - "Community 56"
Cohesion: 0.67
Nodes (3): Academic Profile, Computer Programming, OKA Protocol

### Community 108 - "Community 108"
Cohesion: 1.0
Nodes (1): Returns (is_valid, error_messages).         A note fails if it:           - Is m

### Community 109 - "Community 109"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.

### Community 110 - "Community 110"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 111 - "Community 111"
Cohesion: 1.0
Nodes (1): Recursively strips ALL quote forms from [[wikilink]] strings.

### Community 112 - "Community 112"
Cohesion: 1.0
Nodes (1): Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -

### Community 114 - "Community 114"
Cohesion: 1.0
Nodes (1): Instantiates and returns the appropriate LangChain ChatModel.

### Community 115 - "Community 115"
Cohesion: 1.0
Nodes (1): Safety check:          1. Must be a valid PDF.         2. Must be low resolution

### Community 130 - "Community 130"
Cohesion: 1.0
Nodes (1): Statistics and Probability

## Knowledge Gaps
- **66 isolated node(s):** `Manages the local ChromaDB instance and the local embedding model.     Uses 'all`, `Embeds and adds documents to the vector store.`, `Queries the vector store for the most relevant chunks.`, `Deletes all chunks associated with a specific file path.         This is crucial`, `Life OS Notion API Client.     Synchronizes with the user's Notion workspace.` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 19`** (7 nodes): `command.tsx`, `command.tsx`, `cn()`, `CommandGroup()`, `CommandInput()`, `CommandItem()`, `CommandList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (7 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (7 nodes): `EditableCell.tsx`, `compute()`, `fetchOptions()`, `getBadgeColor()`, `handleCreateOption()`, `renderInlineMarkdown()`, `TypeIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (6 nodes): `AiSidecar.tsx`, `AiSidecar.tsx`, `handleAnswerQuiz()`, `handleInitialExplain()`, `handleSendMessage()`, `nextQuestion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (6 nodes): `events.py`, `VaultEventBus`, `.__init__()`, `.publish()`, `.subscribe()`, `.unsubscribe()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (5 nodes): `ProfileEditor.tsx`, `flattenSchema()`, `handleKeyDown()`, `normalize()`, `saveAndGo()`
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
- **Thin community `Community 55`** (3 nodes): `get_app_secrets()`, `Extracts core secrets from request headers.     Supports 3-tier reasoning levels`, `deps.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 108`** (1 nodes): `Returns (is_valid, error_messages).         A note fails if it:           - Is m`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 109`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 110`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 111`** (1 nodes): `Recursively strips ALL quote forms from [[wikilink]] strings.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (1 nodes): `Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 114`** (1 nodes): `Instantiates and returns the appropriate LangChain ChatModel.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 115`** (1 nodes): `Safety check:          1. Must be a valid PDF.         2. Must be low resolution`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (1 nodes): `Statistics and Probability`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OkaService` connect `Community 0` to `Community 2`, `Community 3`, `Community 4`, `Community 7`, `Community 15`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `NotionClient` connect `Community 0` to `Community 3`, `Community 4`, `Community 15`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `AppSecrets` connect `Community 0` to `Community 3`, `Community 4`, `Community 15`, `Community 55`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 126 inferred relationships involving `OkaService` (e.g. with `VaultManager` and `OkaDeployer`) actually correct?**
  _`OkaService` has 126 INFERRED edges - model-reasoned connections that need verification._
- **Are the 127 inferred relationships involving `NotionClient` (e.g. with `NotionMirrorService` and `Pulls structured data from Notion Databases and writes them as      individual M`) actually correct?**
  _`NotionClient` has 127 INFERRED edges - model-reasoned connections that need verification._
- **Are the 122 inferred relationships involving `AppSecrets` (e.g. with `Returns a list of all locally cached databases.` and `Returns the schema and rows for a specific database.     If not in cache or forc`) actually correct?**
  _`AppSecrets` has 122 INFERRED edges - model-reasoned connections that need verification._
- **Are the 119 inferred relationships involving `ModelFactory` (e.g. with `OkaService` and `Main orchestrator for OKA.`) actually correct?**
  _`ModelFactory` has 119 INFERRED edges - model-reasoned connections that need verification._