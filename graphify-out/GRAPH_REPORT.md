# Graph Report - LifeOs  (2026-05-09)

## Corpus Check
- 176 files · ~140,480 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1029 nodes · 2678 edges · 47 communities detected
- Extraction: 44% EXTRACTED · 56% INFERRED · 0% AMBIGUOUS · INFERRED: 1492 edges (avg confidence: 0.55)
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
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 107|Community 107]]

## God Nodes (most connected - your core abstractions)
1. `OkaService` - 128 edges
2. `ModelFactory` - 78 edges
3. `OkaQueueManager` - 69 edges
4. `VaultIndexer` - 68 edges
5. `AppSecrets` - 68 edges
6. `ChromaManager` - 65 edges
7. `ObsidianClient` - 62 edges
8. `RAGWatcherService` - 60 edges
9. `OkaValidator` - 52 edges
10. `LogicHealer` - 52 edges

## Surprising Connections (you probably didn't know these)
- `Self-healing engine for OKA notes. Fixes wikilinks, sanitizes LLM-speak,     and` --uses--> `OkaValidator`  [INFERRED]
  apps/api/src/domains/oka/healer.py → apps/api/src/domains/oka/validator.py
- `Fixes broken wikilinks by fuzzy matching against known titles in the current hub` --uses--> `OkaValidator`  [INFERRED]
  apps/api/src/domains/oka/healer.py → apps/api/src/domains/oka/validator.py
- `Enforces wikilink density: removes excess links beyond max, keeping the most con` --uses--> `OkaValidator`  [INFERRED]
  apps/api/src/domains/oka/healer.py → apps/api/src/domains/oka/validator.py
- `Violently removes LLM conversational filler and metatalk.` --uses--> `OkaValidator`  [INFERRED]
  apps/api/src/domains/oka/healer.py → apps/api/src/domains/oka/validator.py
- `Sandbox for verifying arithmetic.          DEPRECATED: Prompt-based 'Math Sovere` --uses--> `OkaValidator`  [INFERRED]
  apps/api/src/domains/oka/healer.py → apps/api/src/domains/oka/validator.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (143): get_model(), RateLimitTracker, ai_upload(), create_notion_page(), delete_notion_page(), delete_obsidian_item(), delete_practice_session(), _ensure_watcher_path() (+135 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (73): ModelFactory, Unified Model Factory to provide a consistent LangChain interface      across mu, ArchitectAgent, CriticAgent, EpistemicClassifierAgent, get_persona(), HubAgent, MetaScannerAgent (+65 more)

### Community 2 - "Community 2"
Cohesion: 0.04
Nodes (63): get_academics_dashboard(), get_note_data(), ProviderRateLimit, AppSecrets, get_app_secrets(), Extracts core secrets from request headers.     Supports 3-tier reasoning levels, _update_rag_status(), BaseModel (+55 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (25): NativeBackend, cn(), fetchImg(), if(), load(), MermaidWrapper(), fetchRows(), fetchTemplates() (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (44): Adaptive Pacing: Grants permits instantly under low load,         throttles inte, LogicHealer, Sandbox for verifying arithmetic.          DEPRECATED: Prompt-based 'Math Sovere, Parses the interactive-quiz JSON and heals internal math inconsistencies., Ensures all markdown tables have strict outer pipes.         Fixes lines like 'P, Fixes broken wikilinks by fuzzy matching against known titles in the current hub, Self-healing engine for OKA notes. Fixes wikilinks, sanitizes LLM-speak,     and, Enforces wikilink density: removes excess links beyond max, keeping the most con (+36 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (16): extractSection(), fetchFiles(), fetchStats(), formatValue(), handleBack(), handleDeleteFile(), handleForward(), handleSaveNote() (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (14): Writes (creates or updates) a specific note., _deep_clean_value(), Surgically deploys the unit hub., Resolves an anchored hub ID to an absolute path., Parses AI output and triggers batch deployment.         Hub and PQ notes are ALW, Surgically deploys one or more atomic notes., get_canonical_title(), Dumps YAML with correct Obsidian property types.                  KEY DISTINCTIO (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (12): cleanTitle(), handleScaffold(), handleUpdateProgram(), async(), handleSetStatus(), confidenceColorClass(), getVal(), gradeColorClass() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.1
Nodes (6): FileSystemEventHandler, _nuclear_wikilink_clean(), Asynchronously writes content to a file, ensuring parent directories exist., _strip_wikilink_quotes(), InboxHandler, VaultSyncHandler

### Community 9 - "Community 9"
Cohesion: 0.2
Nodes (18): calculateScore(), handleDeletePractice(), handleResumePractice(), handleSelectAnswer(), handleStartSession(), handleSubmitAnswer(), loadHubNotes(), loadHubs() (+10 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (12): canonicalize_unit(), deduplicate_plan(), purge_pedagogical_artifacts(), Rebuild the hub's ## Connections section from the actual deployed atomic notes., Deterministic content sanitizer for weak-LLM artifacts.      Fixes applied (in o, Scans all notes in unit_dir and removes wikilinks that don't point to      an ex, Deterministic cleanup of TikZ artifacts, walkthrough normalization,     and conv, Scan a deployed note for dead quiz stubs that slipped past validation.     Retur (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (9): Sheet(), SheetClose(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetPortal(), SheetTitle() (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (9): Select(), SelectGroup(), SelectItem(), SelectLabel(), SelectScrollDownButton(), SelectScrollUpButton(), SelectSeparator(), SelectTrigger() (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (6): finishQuiz(), handleSelectAnswer(), handleSelfGrade(), moveDown(), moveUp(), nextQuestion()

### Community 14 - "Community 14"
Cohesion: 0.25
Nodes (4): ThemeSwitch(), ThemeProvider(), useTheme(), Toaster()

### Community 15 - "Community 15"
Cohesion: 0.31
Nodes (4): getColor(), getNodeColor(), handleNodeCanvasObject(), updateDims()

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (2): fetchOptions(), handleCreateOption()

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (5): Captures rate limit information from LLM responses., Capture rate limits and usage stats from metadata., TrackingCallbackHandler, AsyncCallbackHandler, BaseCallbackHandler

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
Nodes (1): VaultEventBus

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (1): handleSendMessage()

### Community 25 - "Community 25"
Cohesion: 0.6
Nodes (3): CardDescription(), CardFooter(), cn()

### Community 28 - "Community 28"
Cohesion: 0.6
Nodes (3): getCookie(), removeCookie(), setCookie()

### Community 29 - "Community 29"
Cohesion: 0.6
Nodes (4): is_safe_to_normalize(), normalize(), Scan existing store and prepare for background watching., start_auto_sanitizer()

### Community 30 - "Community 30"
Cohesion: 0.5
Nodes (2): run(), main()

### Community 31 - "Community 31"
Cohesion: 0.67
Nodes (2): SearchProvider(), useSearch()

### Community 34 - "Community 34"
Cohesion: 0.67
Nodes (2): Popover(), PopoverTrigger()

### Community 36 - "Community 36"
Cohesion: 0.67
Nodes (2): ScrollArea(), ScrollBar()

### Community 37 - "Community 37"
Cohesion: 0.67
Nodes (2): RadioGroup(), RadioGroupItem()

### Community 40 - "Community 40"
Cohesion: 0.67
Nodes (2): cn(), getPageNumbers()

### Community 41 - "Community 41"
Cohesion: 0.67
Nodes (2): ConfigProvider(), useConfig()

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (2): isActive(), renderNode()

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (1): Label()

### Community 49 - "Community 49"
Cohesion: 0.67
Nodes (1): Badge()

### Community 50 - "Community 50"
Cohesion: 0.67
Nodes (1): cn()

### Community 51 - "Community 51"
Cohesion: 0.67
Nodes (1): Input()

### Community 99 - "Community 99"
Cohesion: 1.0
Nodes (1): Returns (is_valid, error_messages).         A note fails if it:           - Is m

### Community 100 - "Community 100"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.         Handles LaTeX backsla

### Community 101 - "Community 101"
Cohesion: 1.0
Nodes (1): Ensures a title is in canonical Title_Case_With_Underscores format.

### Community 102 - "Community 102"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 103 - "Community 103"
Cohesion: 1.0
Nodes (1): Recursively strips ALL quote forms from [[wikilink]] strings.

### Community 104 - "Community 104"
Cohesion: 1.0
Nodes (1): Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -

### Community 106 - "Community 106"
Cohesion: 1.0
Nodes (1): Instantiates and returns the appropriate LangChain ChatModel.

### Community 107 - "Community 107"
Cohesion: 1.0
Nodes (1): Safety check:          1. Must be a valid PDF.         2. Must be low resolution

## Knowledge Gaps
- **55 isolated node(s):** `Manages the local ChromaDB instance and the local embedding model.     Uses 'all`, `Embeds and adds documents to the vector store.`, `Queries the vector store for the most relevant chunks.`, `Deletes all chunks associated with a specific file path.         This is crucial`, `Nuclear-grade validation suite for OKA notes.     Checks structure, wikilink den` (+50 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 16`** (8 nodes): `EditableCell.tsx`, `ButtonCell()`, `fetchOptions()`, `getBadgeColor()`, `handleCreateOption()`, `renderInlineMarkdown()`, `RollupCell()`, `TypeIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (7 nodes): `command.tsx`, `command.tsx`, `cn()`, `CommandGroup()`, `CommandInput()`, `CommandItem()`, `CommandList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (7 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (6 nodes): `events.py`, `VaultEventBus`, `.__init__()`, `.publish()`, `.subscribe()`, `.unsubscribe()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (6 nodes): `AiSidecar.tsx`, `AiSidecar.tsx`, `handleAnswerQuiz()`, `handleInitialExplain()`, `handleSendMessage()`, `nextQuestion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (4 nodes): `lib.rs`, `main.rs`, `run()`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (4 nodes): `search-provider.tsx`, `search-provider.tsx`, `SearchProvider()`, `useSearch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (4 nodes): `popover.tsx`, `popover.tsx`, `Popover()`, `PopoverTrigger()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (4 nodes): `scroll-area.tsx`, `scroll-area.tsx`, `ScrollArea()`, `ScrollBar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (4 nodes): `radio-group.tsx`, `radio-group.tsx`, `RadioGroup()`, `RadioGroupItem()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (4 nodes): `utils.ts`, `utils.ts`, `cn()`, `getPageNumbers()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (4 nodes): `ConfigContext.tsx`, `ConfigContext.tsx`, `ConfigProvider()`, `useConfig()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (4 nodes): `NoteMetadata.tsx`, `getPropertyIcon()`, `isActive()`, `renderNode()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (3 nodes): `label.tsx`, `label.tsx`, `Label()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (3 nodes): `badge.tsx`, `badge.tsx`, `Badge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (3 nodes): `button.tsx`, `button.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (3 nodes): `input.tsx`, `input.tsx`, `Input()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 99`** (1 nodes): `Returns (is_valid, error_messages).         A note fails if it:           - Is m`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 100`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.         Handles LaTeX backsla`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 101`** (1 nodes): `Ensures a title is in canonical Title_Case_With_Underscores format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 102`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 103`** (1 nodes): `Recursively strips ALL quote forms from [[wikilink]] strings.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 104`** (1 nodes): `Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 106`** (1 nodes): `Instantiates and returns the appropriate LangChain ChatModel.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 107`** (1 nodes): `Safety check:          1. Must be a valid PDF.         2. Must be low resolution`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OkaService` connect `Community 0` to `Community 1`, `Community 2`, `Community 4`, `Community 6`, `Community 8`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `AppSecrets` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 93 inferred relationships involving `OkaService` (e.g. with `VaultManager` and `OkaDeployer`) actually correct?**
  _`OkaService` has 93 INFERRED edges - model-reasoned connections that need verification._
- **Are the 76 inferred relationships involving `ModelFactory` (e.g. with `OkaService` and `Main orchestrator for OKA.`) actually correct?**
  _`ModelFactory` has 76 INFERRED edges - model-reasoned connections that need verification._
- **Are the 52 inferred relationships involving `OkaQueueManager` (e.g. with `OkaService` and `Life OS - FastAPI Sidecar Entry Point  This process is spawned by Tauri on deskt`) actually correct?**
  _`OkaQueueManager` has 52 INFERRED edges - model-reasoned connections that need verification._
- **Are the 59 inferred relationships involving `VaultIndexer` (e.g. with `ChromaManager` and `VaultSyncHandler`) actually correct?**
  _`VaultIndexer` has 59 INFERRED edges - model-reasoned connections that need verification._
- **Are the 65 inferred relationships involving `AppSecrets` (e.g. with `ObsidianDumper` and `UpdateRowRequest`) actually correct?**
  _`AppSecrets` has 65 INFERRED edges - model-reasoned connections that need verification._