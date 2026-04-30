# Graph Report - .  (2026-04-30)

## Corpus Check
- Large corpus: 400 files · ~278,128 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 952 nodes · 2191 edges · 47 communities detected
- Extraction: 49% EXTRACTED · 51% INFERRED · 0% AMBIGUOUS · INFERRED: 1123 edges (avg confidence: 0.56)
- Token cost: 1,000 input · 200 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Core AI Logic|Core AI Logic]]
- [[_COMMUNITY_Notion Sync|Notion Sync]]
- [[_COMMUNITY_OKA Workflows|OKA Workflows]]
- [[_COMMUNITY_Agent Architecture|Agent Architecture]]
- [[_COMMUNITY_Auth & Secrets|Auth & Secrets]]
- [[_COMMUNITY_Native Bridges|Native Bridges]]
- [[_COMMUNITY_UI Orchestration|UI Orchestration]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Form Components (Sheets)|Form Components (Sheets)]]
- [[_COMMUNITY_Selection UI|Selection UI]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_AI Sidecar Chat|AI Sidecar Chat]]
- [[_COMMUNITY_Profile Mapping|Profile Mapping]]
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
- [[_COMMUNITY_Obsidian Vault Structure|Obsidian Vault Structure]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 109|Community 109]]
- [[_COMMUNITY_Community 110|Community 110]]
- [[_COMMUNITY_Community 112|Community 112]]
- [[_COMMUNITY_Community 113|Community 113]]
- [[_COMMUNITY_Community 128|Community 128]]

## God Nodes (most connected - your core abstractions)
1. `OkaService` - 111 edges
2. `NotionClient` - 95 edges
3. `ModelFactory` - 74 edges
4. `AppSecrets` - 73 edges
5. `VaultIndexer` - 67 edges
6. `OkaQueueManager` - 65 edges
7. `ChromaManager` - 64 edges
8. `ObsidianClient` - 61 edges
9. `NotionMirrorService` - 60 edges
10. `RAGWatcherService` - 59 edges

## Surprising Connections (you probably didn't know these)
- `LifeOS Mobile (Scriptable)` --provides_interface_for--> `Computer Programming`  [INFERRED]
  LifeOs_Mobile.js → Obsidian_Vault/3-Database/07 - Courses/Computer Programming.md
- `main()` --calls--> `AppSecrets`  [INFERRED]
  scratch/test_detect.py → apps/api/src/api/deps.py
- `main()` --calls--> `OkaService`  [INFERRED]
  scratch/test_detect.py → apps/api/src/domains/oka/service.py
- `Watches the Inbox, maintains a queue, and processes files autonomously if enable` --uses--> `OkaService`  [INFERRED]
  apps/api/src/domains/oka/watcher.py → apps/api/src/domains/oka/service.py
- `Scans the inbox for existing files, adds them to the database, and resets errors` --uses--> `OkaService`  [INFERRED]
  apps/api/src/domains/oka/watcher.py → apps/api/src/domains/oka/service.py

## Communities

### Community 0 - "Core AI Logic"
Cohesion: 0.04
Nodes (107): get_model(), RateLimitTracker, ai_upload(), delete_obsidian_item(), delete_practice_session(), _ensure_watcher_path(), get_practice_session(), get_rag_sync_status() (+99 more)

### Community 1 - "Notion Sync"
Cohesion: 0.04
Nodes (64): create_notion_page(), delete_notion_page(), get_notion_page_content(), list_notion_databases(), list_notion_pages(), query_notion_database(), Updates properties for a specific Notion page.     Expects JSON body like: {"pro, Creates a new page in a Notion database.     Expects JSON body with 'properties' (+56 more)

### Community 2 - "OKA Workflows"
Cohesion: 0.05
Nodes (27): generate_practice_session(), oka_generate_plan(), oka_get_paused_sessions(), oka_process_manual(), oka_resume_paused_session(), Phase 1: Pure Detection. No AI usage., Phase 2: AI Planning with locked curriculum., Returns all sessions that were paused due to a rate limit and have saved progres (+19 more)

### Community 3 - "Agent Architecture"
Cohesion: 0.05
Nodes (47): AppSecrets, get_app_secrets(), Extracts core secrets from request headers.     Supports 3-tier reasoning levels, BaseModel, getAuthHeaders(), request(), create_property_option(), create_vault_row() (+39 more)

### Community 4 - "Auth & Secrets"
Cohesion: 0.18
Nodes (52): ModelFactory, Unified Model Factory to provide a consistent LangChain interface      across mu, ArchitectAgent, 2-Pass content generator.      Pass 1 (Theorist)  — Sections 1-3: deep prose wit, Returns True if the body talks about things clearly unrelated to the title., Plans the curriculum.  Token-efficient: uses a compact prompt and     falls back, WriterAgent, OkaDeployer (+44 more)

### Community 5 - "Native Bridges"
Cohesion: 0.08
Nodes (15): NativeBackend, fetchImg(), load(), fetchRows(), fetchTemplates(), handleCreateRow(), fetchRows(), fetchTemplates() (+7 more)

### Community 6 - "UI Orchestration"
Cohesion: 0.06
Nodes (31): InlineDatabaseResolver(), MermaidWrapper(), confirmDeployment(), fetchFiles(), fetchHubConnections(), fetchInbox(), fetchStats(), fetchStatus() (+23 more)

### Community 7 - "Community 7"
Cohesion: 0.18
Nodes (5): FileSystemEventHandler, InboxHandler, Listens for file changes in the Obsidian Vault and triggers the indexer.     Inc, Simple debounce to prevent spamming the indexer on rapid saves., VaultSyncHandler

### Community 8 - "Community 8"
Cohesion: 0.26
Nodes (12): calculateScore(), handleDeletePractice(), handleResumePractice(), handleSelectAnswer(), handleStartSession(), handleSubmitAnswer(), loadHubNotes(), loadHubs() (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.2
Nodes (4): fetchInbox(), fetchStatus(), resetOkaSession(), toggleAutoDeploy()

### Community 10 - "Community 10"
Cohesion: 0.26
Nodes (7): cn(), getPageNumbers(), sleep(), _count_wikilinks(), _has_domain_drift(), _is_rate_limit(), _parse_json()

### Community 11 - "Form Components (Sheets)"
Cohesion: 0.33
Nodes (9): Sheet(), SheetClose(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetPortal(), SheetTitle() (+1 more)

### Community 12 - "Selection UI"
Cohesion: 0.33
Nodes (9): Select(), SelectGroup(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.2
Nodes (6): Captures rate limit information from LLM responses., Capture rate limits and usage stats from metadata., TrackingCallbackHandler, ProviderRateLimit, AsyncCallbackHandler, BaseCallbackHandler

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

### Community 22 - "AI Sidecar Chat"
Cohesion: 0.33
Nodes (1): handleSendMessage()

### Community 24 - "Profile Mapping"
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

### Community 46 - "Obsidian Vault Structure"
Cohesion: 0.5
Nodes (4): Academic Profile, Computer Programming, LifeOS Mobile (Scriptable), OKA Protocol

### Community 49 - "Community 49"
Cohesion: 0.67
Nodes (1): Label()

### Community 51 - "Community 51"
Cohesion: 0.67
Nodes (1): Badge()

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (1): cn()

### Community 53 - "Community 53"
Cohesion: 0.67
Nodes (1): Input()

### Community 106 - "Community 106"
Cohesion: 1.0
Nodes (1): Returns (is_valid, error_messages).         A note fails if it:           - Is m

### Community 107 - "Community 107"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.

### Community 108 - "Community 108"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 109 - "Community 109"
Cohesion: 1.0
Nodes (1): Recursively strips ALL quote forms from [[wikilink]] strings.

### Community 110 - "Community 110"
Cohesion: 1.0
Nodes (1): Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -

### Community 112 - "Community 112"
Cohesion: 1.0
Nodes (1): Instantiates and returns the appropriate LangChain ChatModel.

### Community 113 - "Community 113"
Cohesion: 1.0
Nodes (1): Safety check:          1. Must be a valid PDF.         2. Must be low resolution

### Community 128 - "Community 128"
Cohesion: 1.0
Nodes (1): Statistics and Probability

## Knowledge Gaps
- **65 isolated node(s):** `Manages the local ChromaDB instance and the local embedding model.     Uses 'all`, `Embeds and adds documents to the vector store.`, `Queries the vector store for the most relevant chunks.`, `Deletes all chunks associated with a specific file path.         This is crucial`, `Life OS Notion API Client.     Synchronizes with the user's Notion workspace.` (+60 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 18`** (7 nodes): `command.tsx`, `command.tsx`, `cn()`, `CommandGroup()`, `CommandInput()`, `CommandItem()`, `CommandList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (7 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (7 nodes): `EditableCell.tsx`, `compute()`, `fetchOptions()`, `getBadgeColor()`, `handleCreateOption()`, `renderInlineMarkdown()`, `TypeIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AI Sidecar Chat`** (6 nodes): `AiSidecar.tsx`, `AiSidecar.tsx`, `handleAnswerQuiz()`, `handleInitialExplain()`, `handleSendMessage()`, `nextQuestion()`
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
- **Thin community `Community 49`** (3 nodes): `label.tsx`, `label.tsx`, `Label()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (3 nodes): `badge.tsx`, `badge.tsx`, `Badge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (3 nodes): `button.tsx`, `button.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (3 nodes): `input.tsx`, `input.tsx`, `Input()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 106`** (1 nodes): `Returns (is_valid, error_messages).         A note fails if it:           - Is m`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 107`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 108`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 109`** (1 nodes): `Recursively strips ALL quote forms from [[wikilink]] strings.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 110`** (1 nodes): `Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 112`** (1 nodes): `Instantiates and returns the appropriate LangChain ChatModel.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 113`** (1 nodes): `Safety check:          1. Must be a valid PDF.         2. Must be low resolution`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (1 nodes): `Statistics and Probability`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OkaService` connect `OKA Workflows` to `Core AI Logic`, `Notion Sync`, `Auth & Secrets`, `Community 7`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `NotionClient` connect `Notion Sync` to `Core AI Logic`, `OKA Workflows`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `AppSecrets` connect `Agent Architecture` to `Core AI Logic`, `Notion Sync`, `OKA Workflows`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Are the 79 inferred relationships involving `OkaService` (e.g. with `VaultManager` and `OkaDeployer`) actually correct?**
  _`OkaService` has 79 INFERRED edges - model-reasoned connections that need verification._
- **Are the 80 inferred relationships involving `NotionClient` (e.g. with `NotionMirrorService` and `Pulls structured data from Notion Databases and writes them as      individual M`) actually correct?**
  _`NotionClient` has 80 INFERRED edges - model-reasoned connections that need verification._
- **Are the 72 inferred relationships involving `ModelFactory` (e.g. with `OkaService` and `Main orchestrator for OKA.`) actually correct?**
  _`ModelFactory` has 72 INFERRED edges - model-reasoned connections that need verification._
- **Are the 70 inferred relationships involving `AppSecrets` (e.g. with `Returns a list of all locally cached databases.` and `Returns the schema and rows for a specific database.     If not in cache or forc`) actually correct?**
  _`AppSecrets` has 70 INFERRED edges - model-reasoned connections that need verification._