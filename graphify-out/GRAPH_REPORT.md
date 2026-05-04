# Graph Report - LifeOs  (2026-05-04)

## Corpus Check
- 203 files · ~373,064 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1259 nodes · 3939 edges · 59 communities detected
- Extraction: 31% EXTRACTED · 69% INFERRED · 0% AMBIGUOUS · INFERRED: 2714 edges (avg confidence: 0.53)
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
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 129|Community 129]]
- [[_COMMUNITY_Community 130|Community 130]]
- [[_COMMUNITY_Community 131|Community 131]]
- [[_COMMUNITY_Community 132|Community 132]]
- [[_COMMUNITY_Community 133|Community 133]]
- [[_COMMUNITY_Community 135|Community 135]]
- [[_COMMUNITY_Community 136|Community 136]]
- [[_COMMUNITY_Community 151|Community 151]]
- [[_COMMUNITY_Community 152|Community 152]]
- [[_COMMUNITY_Community 153|Community 153]]
- [[_COMMUNITY_Community 154|Community 154]]
- [[_COMMUNITY_Community 155|Community 155]]
- [[_COMMUNITY_Community 156|Community 156]]
- [[_COMMUNITY_Community 157|Community 157]]

## God Nodes (most connected - your core abstractions)
1. `OkaService` - 210 edges
2. `ModelFactory` - 201 edges
3. `NotionClient` - 184 edges
4. `AppSecrets` - 180 edges
5. `VaultIndexer` - 156 edges
6. `OkaQueueManager` - 156 edges
7. `ChromaManager` - 153 edges
8. `ObsidianClient` - 150 edges
9. `NotionMirrorService` - 149 edges
10. `RAGWatcherService` - 148 edges

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
Cohesion: 0.04
Nodes (231): AppSecrets, get_app_secrets(), Extracts core secrets from request headers.     Supports 3-tier reasoning levels, ai_upload(), create_notion_page(), delete_notion_page(), delete_obsidian_item(), delete_practice_session() (+223 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (100): ModelFactory, Unified Model Factory to provide a consistent LangChain interface      across mu, ArchitectAgent, CriticAgent, ExaminerAgent, get_professional_domain(), HubAgent, _is_rate_limit() (+92 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (27): NativeBackend, cn(), fetchImg(), if(), InlineDatabaseResolver(), load(), MermaidWrapper(), fetchRows() (+19 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (56): get_academics_dashboard(), get_note_data(), BaseModel, getAuthHeaders(), request(), create_property_option(), create_vault_row(), CreateDatabaseRequest (+48 more)

### Community 4 - "Community 4"
Cohesion: 0.04
Nodes (28): Writes (creates or updates) a specific note., _deep_clean_value(), Surgically deploys the unit hub., Resolves an anchored hub ID to an absolute path., Parses AI output and triggers batch deployment.         Hub and PQ notes are ALW, Surgically deploys one or more atomic notes., deduplicate_plan(), Rebuild the hub's ## Connections section from the actual deployed atomic notes. (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (27): FileSystemEventHandler, cn(), getPageNumbers(), sleep(), is_safe_to_normalize(), normalize(), PdfSanitizer, Scan existing store and prepare for background watching. (+19 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (29): handleBack(), handleForward(), async(), confirmDeployment(), fetchFiles(), fetchInbox(), fetchStats(), fetchStatus() (+21 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (30): NotionCacheService, Retrieves all cached pages for a database., Local SQLite caching layer for Notion data.     Provides 0ms latency for fronten, Retrieves a single cached page by ID., Lists all cached databases., Removes a page from the cache., Initializes the SQLite tables., Saves or updates a database schema. (+22 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (14): get_model(), Captures rate limit information from LLM responses., Capture rate limits and usage stats from metadata., TrackingCallbackHandler, ProviderRateLimit, RateLimitTracker, get_rate_limits(), rag_sync_vault() (+6 more)

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
Cohesion: 0.32
Nodes (3): finishQuiz(), handleSelfGrade(), nextQuestion()

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
Cohesion: 0.6
Nodes (4): cleanLabel(), cleanValue(), parseMarkdownToProfileData(), stripMarkdown()

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (3): Deletes a specific block., Replaces the entire content of a page with the provided markdown text.         I, Retrieves all blocks (content) of a specific page using pagination.

### Community 27 - "Community 27"
Cohesion: 0.33
Nodes (1): VaultEventBus

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (1): handleSendMessage()

### Community 29 - "Community 29"
Cohesion: 0.7
Nodes (4): fix_assignments(), fix_exams(), fix_study_planner(), process_file()

### Community 30 - "Community 30"
Cohesion: 0.6
Nodes (3): fix_exams(), fix_study_planner(), process_file()

### Community 32 - "Community 32"
Cohesion: 0.6
Nodes (3): CardDescription(), CardFooter(), cn()

### Community 36 - "Community 36"
Cohesion: 0.5
Nodes (2): handleKeyDown(), saveAndGo()

### Community 37 - "Community 37"
Cohesion: 0.6
Nodes (3): getCookie(), removeCookie(), setCookie()

### Community 38 - "Community 38"
Cohesion: 0.5
Nodes (2): run(), main()

### Community 39 - "Community 39"
Cohesion: 0.67
Nodes (2): SearchProvider(), useSearch()

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
Cohesion: 0.33
Nodes (2): Renames or moves a file or folder., Creates a new folder.

### Community 50 - "Community 50"
Cohesion: 0.67
Nodes (2): Popover(), PopoverTrigger()

### Community 51 - "Community 51"
Cohesion: 0.67
Nodes (2): isActive(), renderNode()

### Community 54 - "Community 54"
Cohesion: 0.67
Nodes (1): Label()

### Community 56 - "Community 56"
Cohesion: 0.67
Nodes (1): Badge()

### Community 57 - "Community 57"
Cohesion: 0.67
Nodes (1): cn()

### Community 58 - "Community 58"
Cohesion: 0.67
Nodes (1): Input()

### Community 64 - "Community 64"
Cohesion: 0.67
Nodes (3): Academic Profile, Computer Programming, OKA Protocol

### Community 129 - "Community 129"
Cohesion: 1.0
Nodes (1): Returns (is_valid, error_messages).         A note fails if it:           - Is m

### Community 130 - "Community 130"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.

### Community 131 - "Community 131"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 132 - "Community 132"
Cohesion: 1.0
Nodes (1): Recursively strips ALL quote forms from [[wikilink]] strings.

### Community 133 - "Community 133"
Cohesion: 1.0
Nodes (1): Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -

### Community 135 - "Community 135"
Cohesion: 1.0
Nodes (1): Instantiates and returns the appropriate LangChain ChatModel.

### Community 136 - "Community 136"
Cohesion: 1.0
Nodes (1): Safety check:          1. Must be a valid PDF.         2. Must be low resolution

### Community 151 - "Community 151"
Cohesion: 1.0
Nodes (1): Rebuild the hub's ## Connections section from the actual deployed atomic notes.

### Community 152 - "Community 152"
Cohesion: 1.0
Nodes (1): Returns (is_valid, error_messages).         A note fails if it:           - Is m

### Community 153 - "Community 153"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.

### Community 154 - "Community 154"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 155 - "Community 155"
Cohesion: 1.0
Nodes (1): Serves a file directly from the vault (for PDFs, images, etc.)

### Community 156 - "Community 156"
Cohesion: 1.0
Nodes (1): Serves a file directly from the vault (for PDFs, images, etc.)

### Community 157 - "Community 157"
Cohesion: 1.0
Nodes (1): Statistics and Probability

## Knowledge Gaps
- **88 isolated node(s):** `Manages the local ChromaDB instance and the local embedding model.     Uses 'all`, `Embeds and adds documents to the vector store.`, `Queries the vector store for the most relevant chunks.`, `Deletes all chunks associated with a specific file path.         This is crucial`, `Life OS Notion API Client.     Synchronizes with the user's Notion workspace.` (+83 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 20`** (7 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (7 nodes): `EditableCell.tsx`, `compute()`, `fetchOptions()`, `getBadgeColor()`, `handleCreateOption()`, `renderInlineMarkdown()`, `TypeIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (7 nodes): `command.tsx`, `command.tsx`, `cn()`, `CommandGroup()`, `CommandInput()`, `CommandItem()`, `CommandList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (6 nodes): `events.py`, `VaultEventBus`, `.__init__()`, `.publish()`, `.subscribe()`, `.unsubscribe()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (6 nodes): `AiSidecar.tsx`, `AiSidecar.tsx`, `handleAnswerQuiz()`, `handleInitialExplain()`, `handleSendMessage()`, `nextQuestion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (5 nodes): `ProfileEditor.tsx`, `flattenSchema()`, `handleKeyDown()`, `normalize()`, `saveAndGo()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (4 nodes): `lib.rs`, `main.rs`, `run()`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (4 nodes): `search-provider.tsx`, `search-provider.tsx`, `SearchProvider()`, `useSearch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (4 nodes): `scroll-area.tsx`, `scroll-area.tsx`, `ScrollArea()`, `ScrollBar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (4 nodes): `radio-group.tsx`, `radio-group.tsx`, `RadioGroup()`, `RadioGroupItem()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (4 nodes): `ConfigContext.tsx`, `ConfigContext.tsx`, `ConfigProvider()`, `useConfig()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (4 nodes): `.create_folder()`, `.rename_item()`, `Renames or moves a file or folder.`, `Creates a new folder.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (4 nodes): `popover.tsx`, `popover.tsx`, `Popover()`, `PopoverTrigger()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (4 nodes): `NoteMetadata.tsx`, `getPropertyIcon()`, `isActive()`, `renderNode()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (3 nodes): `label.tsx`, `label.tsx`, `Label()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (3 nodes): `badge.tsx`, `badge.tsx`, `Badge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (3 nodes): `button.tsx`, `button.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (3 nodes): `input.tsx`, `input.tsx`, `Input()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (1 nodes): `Returns (is_valid, error_messages).         A note fails if it:           - Is m`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 131`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (1 nodes): `Recursively strips ALL quote forms from [[wikilink]] strings.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 133`** (1 nodes): `Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 135`** (1 nodes): `Instantiates and returns the appropriate LangChain ChatModel.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 136`** (1 nodes): `Safety check:          1. Must be a valid PDF.         2. Must be low resolution`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 151`** (1 nodes): `Rebuild the hub's ## Connections section from the actual deployed atomic notes.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (1 nodes): `Returns (is_valid, error_messages).         A note fails if it:           - Is m`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 153`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 154`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (1 nodes): `Serves a file directly from the vault (for PDFs, images, etc.)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 156`** (1 nodes): `Serves a file directly from the vault (for PDFs, images, etc.)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 157`** (1 nodes): `Statistics and Probability`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OkaService` connect `Community 0` to `Community 8`, `Community 1`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Why does `NotionClient` connect `Community 0` to `Community 8`, `Community 26`, `Community 7`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `AppSecrets` connect `Community 0` to `Community 8`, `Community 3`, `Community 7`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Are the 178 inferred relationships involving `OkaService` (e.g. with `VaultManager` and `OkaDeployer`) actually correct?**
  _`OkaService` has 178 INFERRED edges - model-reasoned connections that need verification._
- **Are the 199 inferred relationships involving `ModelFactory` (e.g. with `OkaService` and `Main orchestrator for OKA.`) actually correct?**
  _`ModelFactory` has 199 INFERRED edges - model-reasoned connections that need verification._
- **Are the 169 inferred relationships involving `NotionClient` (e.g. with `NotionMirrorService` and `Pulls structured data from Notion Databases and writes them as      individual M`) actually correct?**
  _`NotionClient` has 169 INFERRED edges - model-reasoned connections that need verification._
- **Are the 177 inferred relationships involving `AppSecrets` (e.g. with `Returns a list of all locally cached databases.` and `Returns the schema and rows for a specific database.     If not in cache or forc`) actually correct?**
  _`AppSecrets` has 177 INFERRED edges - model-reasoned connections that need verification._