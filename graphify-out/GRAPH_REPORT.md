# Graph Report - LifeOs  (2026-05-03)

## Corpus Check
- 203 files · ~302,291 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1253 nodes · 3928 edges · 59 communities detected
- Extraction: 31% EXTRACTED · 69% INFERRED · 0% AMBIGUOUS · INFERRED: 2708 edges (avg confidence: 0.53)
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
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 131|Community 131]]
- [[_COMMUNITY_Community 132|Community 132]]
- [[_COMMUNITY_Community 133|Community 133]]
- [[_COMMUNITY_Community 134|Community 134]]
- [[_COMMUNITY_Community 135|Community 135]]
- [[_COMMUNITY_Community 137|Community 137]]
- [[_COMMUNITY_Community 138|Community 138]]
- [[_COMMUNITY_Community 153|Community 153]]
- [[_COMMUNITY_Community 154|Community 154]]
- [[_COMMUNITY_Community 155|Community 155]]
- [[_COMMUNITY_Community 156|Community 156]]
- [[_COMMUNITY_Community 157|Community 157]]
- [[_COMMUNITY_Community 158|Community 158]]

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
- `main()` --calls--> `AppSecrets`  [INFERRED]
  scratch/test_detect.py → apps/api/src/api/deps.py
- `main()` --calls--> `OkaService`  [INFERRED]
  scratch/test_detect.py → apps/api/src/domains/oka/service.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (235): AppSecrets, ai_upload(), create_notion_page(), delete_notion_page(), delete_obsidian_item(), delete_practice_session(), _ensure_watcher_path(), generate_practice_session() (+227 more)

### Community 1 - "Community 1"
Cohesion: 0.12
Nodes (98): ModelFactory, Unified Model Factory to provide a consistent LangChain interface      across mu, ArchitectAgent, CriticAgent, ExaminerAgent, get_professional_domain(), HubAgent, _is_rate_limit() (+90 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (68): get_academics_dashboard(), get_note_data(), get_model(), Captures rate limit information from LLM responses., Capture rate limits and usage stats from metadata., TrackingCallbackHandler, ProviderRateLimit, RateLimitTracker (+60 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (33): list_practice_sessions(), oka_generate_plan(), Phase 2: AI Planning with locked curriculum., Lists all stored practice sessions by scanning the vault directly., Writes (creates or updates) a specific note., _deep_clean_value(), Surgically deploys the unit hub., Resolves an anchored hub ID to an absolute path. (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (27): NativeBackend, cn(), fetchImg(), if(), InlineDatabaseResolver(), load(), MermaidWrapper(), fetchRows() (+19 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (29): handleBack(), handleForward(), async(), confirmDeployment(), fetchFiles(), fetchInbox(), fetchStats(), fetchStatus() (+21 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (24): FileSystemEventHandler, cn(), getPageNumbers(), sleep(), is_safe_to_normalize(), normalize(), PdfSanitizer, Scan existing store and prepare for background watching. (+16 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (23): NotionCacheService, Retrieves all cached pages for a database., Local SQLite caching layer for Notion data.     Provides 0ms latency for fronten, Retrieves a single cached page by ID., Lists all cached databases., Removes a page from the cache., Initializes the SQLite tables., Saves or updates a database schema. (+15 more)

### Community 8 - "Community 8"
Cohesion: 0.26
Nodes (12): calculateScore(), handleDeletePractice(), handleResumePractice(), handleSelectAnswer(), handleStartSession(), handleSubmitAnswer(), loadHubNotes(), loadHubs() (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (4): calculateScore(), handleDeletePractice(), loadPastPractices(), nextQuestion()

### Community 10 - "Community 10"
Cohesion: 0.2
Nodes (4): fetchInbox(), fetchStatus(), resetOkaSession(), toggleAutoDeploy()

### Community 11 - "Community 11"
Cohesion: 0.24
Nodes (6): confidenceColorClass(), getVal(), gradeColorClass(), priorityColorClass(), statusColorClass(), stripWL()

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (9): Sheet(), SheetClose(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetPortal(), SheetTitle() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (9): Select(), SelectGroup(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger() (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.25
Nodes (4): ThemeSwitch(), ThemeProvider(), useTheme(), Toaster()

### Community 16 - "Community 16"
Cohesion: 0.36
Nodes (3): getColor(), handleNodeCanvasObject(), updateDims()

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (3): LayoutProvider(), useLayout(), AuthenticatedLayoutContent()

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (2): cn(), CommandItem()

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
Cohesion: 0.6
Nodes (4): cleanLabel(), cleanValue(), parseMarkdownToProfileData(), stripMarkdown()

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (3): Appends blocks to a page or a block., Replaces the entire content of a page with the provided markdown text.         I, Retrieves all blocks (content) of a specific page using pagination.

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (1): VaultEventBus

### Community 26 - "Community 26"
Cohesion: 0.33
Nodes (1): handleSendMessage()

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

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (2): ScrollArea(), ScrollBar()

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (2): RadioGroup(), RadioGroupItem()

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (2): ConfigProvider(), useConfig()

### Community 48 - "Community 48"
Cohesion: 0.67
Nodes (2): Popover(), PopoverTrigger()

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

### Community 83 - "Community 83"
Cohesion: 1.0
Nodes (1): Queries the vector store for the most relevant chunks.

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (1): Updates the properties of a specific Notion page.

### Community 85 - "Community 85"
Cohesion: 1.0
Nodes (1): Renames or moves a file or folder.

### Community 131 - "Community 131"
Cohesion: 1.0
Nodes (1): Returns (is_valid, error_messages).         A note fails if it:           - Is m

### Community 132 - "Community 132"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.

### Community 133 - "Community 133"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 134 - "Community 134"
Cohesion: 1.0
Nodes (1): Recursively strips ALL quote forms from [[wikilink]] strings.

### Community 135 - "Community 135"
Cohesion: 1.0
Nodes (1): Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -

### Community 137 - "Community 137"
Cohesion: 1.0
Nodes (1): Instantiates and returns the appropriate LangChain ChatModel.

### Community 138 - "Community 138"
Cohesion: 1.0
Nodes (1): Safety check:          1. Must be a valid PDF.         2. Must be low resolution

### Community 153 - "Community 153"
Cohesion: 1.0
Nodes (1): Returns (is_valid, error_messages).         A note fails if it:           - Is m

### Community 154 - "Community 154"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.

### Community 155 - "Community 155"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 156 - "Community 156"
Cohesion: 1.0
Nodes (1): Serves a file directly from the vault (for PDFs, images, etc.)

### Community 157 - "Community 157"
Cohesion: 1.0
Nodes (1): Serves a file directly from the vault (for PDFs, images, etc.)

### Community 158 - "Community 158"
Cohesion: 1.0
Nodes (1): Statistics and Probability

## Knowledge Gaps
- **87 isolated node(s):** `Manages the local ChromaDB instance and the local embedding model.     Uses 'all`, `Embeds and adds documents to the vector store.`, `Queries the vector store for the most relevant chunks.`, `Deletes all chunks associated with a specific file path.         This is crucial`, `Life OS Notion API Client.     Synchronizes with the user's Notion workspace.` (+82 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 18`** (7 nodes): `command.tsx`, `command.tsx`, `cn()`, `CommandGroup()`, `CommandInput()`, `CommandItem()`, `CommandList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (7 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (7 nodes): `EditableCell.tsx`, `compute()`, `fetchOptions()`, `getBadgeColor()`, `handleCreateOption()`, `renderInlineMarkdown()`, `TypeIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (6 nodes): `events.py`, `VaultEventBus`, `.__init__()`, `.publish()`, `.subscribe()`, `.unsubscribe()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (6 nodes): `AiSidecar.tsx`, `AiSidecar.tsx`, `handleAnswerQuiz()`, `handleInitialExplain()`, `handleSendMessage()`, `nextQuestion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (5 nodes): `ProfileEditor.tsx`, `flattenSchema()`, `handleKeyDown()`, `normalize()`, `saveAndGo()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (4 nodes): `lib.rs`, `main.rs`, `run()`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (4 nodes): `search-provider.tsx`, `search-provider.tsx`, `SearchProvider()`, `useSearch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (4 nodes): `scroll-area.tsx`, `scroll-area.tsx`, `ScrollArea()`, `ScrollBar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (4 nodes): `radio-group.tsx`, `radio-group.tsx`, `RadioGroup()`, `RadioGroupItem()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (4 nodes): `ConfigContext.tsx`, `ConfigContext.tsx`, `ConfigProvider()`, `useConfig()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (4 nodes): `popover.tsx`, `popover.tsx`, `Popover()`, `PopoverTrigger()`
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
- **Thin community `Community 83`** (2 nodes): `.query()`, `Queries the vector store for the most relevant chunks.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (2 nodes): `.update_page_properties()`, `Updates the properties of a specific Notion page.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 85`** (2 nodes): `.rename_item()`, `Renames or moves a file or folder.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 131`** (1 nodes): `Returns (is_valid, error_messages).         A note fails if it:           - Is m`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 133`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 134`** (1 nodes): `Recursively strips ALL quote forms from [[wikilink]] strings.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 135`** (1 nodes): `Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 137`** (1 nodes): `Instantiates and returns the appropriate LangChain ChatModel.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 138`** (1 nodes): `Safety check:          1. Must be a valid PDF.         2. Must be low resolution`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 153`** (1 nodes): `Returns (is_valid, error_messages).         A note fails if it:           - Is m`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 154`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 156`** (1 nodes): `Serves a file directly from the vault (for PDFs, images, etc.)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 157`** (1 nodes): `Serves a file directly from the vault (for PDFs, images, etc.)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 158`** (1 nodes): `Statistics and Probability`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OkaService` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 6`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `NotionClient` connect `Community 0` to `Community 2`, `Community 3`, `Community 7`, `Community 84`, `Community 24`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `AppSecrets` connect `Community 0` to `Community 2`, `Community 3`, `Community 62`, `Community 7`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 178 inferred relationships involving `OkaService` (e.g. with `VaultManager` and `OkaDeployer`) actually correct?**
  _`OkaService` has 178 INFERRED edges - model-reasoned connections that need verification._
- **Are the 199 inferred relationships involving `ModelFactory` (e.g. with `OkaService` and `Main orchestrator for OKA.`) actually correct?**
  _`ModelFactory` has 199 INFERRED edges - model-reasoned connections that need verification._
- **Are the 169 inferred relationships involving `NotionClient` (e.g. with `NotionMirrorService` and `Pulls structured data from Notion Databases and writes them as      individual M`) actually correct?**
  _`NotionClient` has 169 INFERRED edges - model-reasoned connections that need verification._
- **Are the 177 inferred relationships involving `AppSecrets` (e.g. with `Returns a list of all locally cached databases.` and `Returns the schema and rows for a specific database.     If not in cache or forc`) actually correct?**
  _`AppSecrets` has 177 INFERRED edges - model-reasoned connections that need verification._