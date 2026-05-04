# Graph Report - LifeOs  (2026-05-04)

## Corpus Check
- 194 files · ~247,562 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1012 nodes · 2342 edges · 51 communities detected
- Extraction: 48% EXTRACTED · 52% INFERRED · 0% AMBIGUOUS · INFERRED: 1223 edges (avg confidence: 0.55)
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
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 118|Community 118]]
- [[_COMMUNITY_Community 119|Community 119]]
- [[_COMMUNITY_Community 120|Community 120]]
- [[_COMMUNITY_Community 121|Community 121]]
- [[_COMMUNITY_Community 123|Community 123]]
- [[_COMMUNITY_Community 124|Community 124]]
- [[_COMMUNITY_Community 139|Community 139]]
- [[_COMMUNITY_Community 140|Community 140]]
- [[_COMMUNITY_Community 141|Community 141]]
- [[_COMMUNITY_Community 142|Community 142]]
- [[_COMMUNITY_Community 143|Community 143]]

## God Nodes (most connected - your core abstractions)
1. `OkaService` - 118 edges
2. `ModelFactory` - 78 edges
3. `AppSecrets` - 67 edges
4. `VaultIndexer` - 65 edges
5. `OkaQueueManager` - 65 edges
6. `ChromaManager` - 62 edges
7. `ObsidianClient` - 59 edges
8. `RAGWatcherService` - 57 edges
9. `VaultManager` - 52 edges
10. `OkaDeployer` - 41 edges

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
Nodes (124): get_model(), ModelFactory, Unified Model Factory to provide a consistent LangChain interface      across mu, AppSecrets, get_app_secrets(), Extracts core secrets from request headers.     Supports 3-tier reasoning levels, ai_upload(), create_notion_page() (+116 more)

### Community 1 - "Community 1"
Cohesion: 0.03
Nodes (66): get_academics_dashboard(), get_note_data(), Captures rate limit information from LLM responses., Capture rate limits and usage stats from metadata., TrackingCallbackHandler, ProviderRateLimit, RateLimitTracker, _update_rag_status() (+58 more)

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (61): ArchitectAgent, CriticAgent, HubAgent, _parse_json(), PractitionerAgent, QuestionAgent, QuizAuditorAgent, Post-generation semantic quality gate. Checks all 5 failure categories. (+53 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (26): NativeBackend, cn(), fetchImg(), if(), load(), MermaidWrapper(), fetchRows(), fetchTemplates() (+18 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (22): FileSystemEventHandler, Writes (creates or updates) a specific note., _deep_clean_value(), Surgically deploys the unit hub., Resolves an anchored hub ID to an absolute path., Parses AI output and triggers batch deployment.         Hub and PQ notes are ALW, Surgically deploys one or more atomic notes., _has_math_domain_drift() (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (24): cn(), getPageNumbers(), sleep(), is_safe_to_normalize(), normalize(), PdfSanitizer, Scan existing store and prepare for background watching., Autonomously standardizes PDFs to a high-fidelity internal coordinate system. (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (26): async(), confirmDeployment(), fetchFiles(), fetchInbox(), fetchStats(), fetchStatus(), formatValue(), handleBack() (+18 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (12): cleanTitle(), handleScaffold(), handleUpdateProgram(), async(), handleSetStatus(), confidenceColorClass(), getVal(), gradeColorClass() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (14): calculateScore(), handleDeletePractice(), handleResumePractice(), handleSelectAnswer(), handleStartSession(), handleSubmitAnswer(), loadHubNotes(), loadHubs() (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (4): calculateScore(), handleDeletePractice(), loadPastPractices(), nextQuestion()

### Community 10 - "Community 10"
Cohesion: 0.22
Nodes (8): cleanLink(), cleanTitle(), fetchInbox(), fetchStatus(), handleHubSelect(), processSelectedFile(), resetOkaSession(), toggleAutoDeploy()

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (4): _is_rate_limit(), deduplicate_plan(), Rebuild the hub's ## Connections section from the actual deployed atomic notes., sync_hub_connections()

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
Cohesion: 0.36
Nodes (3): getColor(), handleNodeCanvasObject(), updateDims()

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (2): fetchOptions(), handleCreateOption()

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (3): LayoutProvider(), useLayout(), AuthenticatedLayoutContent()

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (2): cn(), CommandItem()

### Community 21 - "Community 21"
Cohesion: 0.48
Nodes (5): Dialog(), DialogClose(), DialogOverlay(), DialogPortal(), DialogTrigger()

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (1): handleSendMessage()

### Community 24 - "Community 24"
Cohesion: 0.33
Nodes (1): VaultEventBus

### Community 25 - "Community 25"
Cohesion: 0.7
Nodes (4): fix_assignments(), fix_exams(), fix_study_planner(), process_file()

### Community 26 - "Community 26"
Cohesion: 0.6
Nodes (3): fix_exams(), fix_study_planner(), process_file()

### Community 28 - "Community 28"
Cohesion: 0.6
Nodes (3): CardDescription(), CardFooter(), cn()

### Community 31 - "Community 31"
Cohesion: 0.6
Nodes (3): getCookie(), removeCookie(), setCookie()

### Community 32 - "Community 32"
Cohesion: 0.5
Nodes (2): run(), main()

### Community 33 - "Community 33"
Cohesion: 0.67
Nodes (2): SearchProvider(), useSearch()

### Community 39 - "Community 39"
Cohesion: 0.67
Nodes (2): ConfigProvider(), useConfig()

### Community 40 - "Community 40"
Cohesion: 0.67
Nodes (2): Popover(), PopoverTrigger()

### Community 41 - "Community 41"
Cohesion: 0.67
Nodes (2): ScrollArea(), ScrollBar()

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (2): RadioGroup(), RadioGroupItem()

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (2): isActive(), renderNode()

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (1): Label()

### Community 48 - "Community 48"
Cohesion: 0.67
Nodes (1): Badge()

### Community 49 - "Community 49"
Cohesion: 0.67
Nodes (1): cn()

### Community 50 - "Community 50"
Cohesion: 0.67
Nodes (1): Input()

### Community 117 - "Community 117"
Cohesion: 1.0
Nodes (1): Returns (is_valid, error_messages).         A note fails if it:           - Is m

### Community 118 - "Community 118"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.

### Community 119 - "Community 119"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 120 - "Community 120"
Cohesion: 1.0
Nodes (1): Recursively strips ALL quote forms from [[wikilink]] strings.

### Community 121 - "Community 121"
Cohesion: 1.0
Nodes (1): Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -

### Community 123 - "Community 123"
Cohesion: 1.0
Nodes (1): Instantiates and returns the appropriate LangChain ChatModel.

### Community 124 - "Community 124"
Cohesion: 1.0
Nodes (1): Safety check:          1. Must be a valid PDF.         2. Must be low resolution

### Community 139 - "Community 139"
Cohesion: 1.0
Nodes (1): Fault-tolerant JSON parser for weak model outputs.

### Community 140 - "Community 140"
Cohesion: 1.0
Nodes (1): Normalise all prerequisite titles to [[Underscore_Title_Case]] format.

### Community 141 - "Community 141"
Cohesion: 1.0
Nodes (1): Parses a note into frontmatter and body.

### Community 142 - "Community 142"
Cohesion: 1.0
Nodes (1): Standardizes and protects code blocks in content for Obsidian.

### Community 143 - "Community 143"
Cohesion: 1.0
Nodes (1): Scans the academic root and extracts YAML metadata from all notes.

## Knowledge Gaps
- **49 isolated node(s):** `Manages the local ChromaDB instance and the local embedding model.     Uses 'all`, `Embeds and adds documents to the vector store.`, `Queries the vector store for the most relevant chunks.`, `Deletes all chunks associated with a specific file path.         This is crucial`, `Nuclear-grade validation suite for OKA notes.     Checks structure, wikilink den` (+44 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 18`** (8 nodes): `EditableCell.tsx`, `ButtonCell()`, `fetchOptions()`, `getBadgeColor()`, `handleCreateOption()`, `renderInlineMarkdown()`, `RollupCell()`, `TypeIcon()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (7 nodes): `command.tsx`, `command.tsx`, `cn()`, `CommandGroup()`, `CommandInput()`, `CommandItem()`, `CommandList()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (7 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (6 nodes): `AiSidecar.tsx`, `AiSidecar.tsx`, `handleAnswerQuiz()`, `handleInitialExplain()`, `handleSendMessage()`, `nextQuestion()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (6 nodes): `events.py`, `VaultEventBus`, `.__init__()`, `.publish()`, `.subscribe()`, `.unsubscribe()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (4 nodes): `lib.rs`, `main.rs`, `run()`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (4 nodes): `search-provider.tsx`, `search-provider.tsx`, `SearchProvider()`, `useSearch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (4 nodes): `ConfigContext.tsx`, `ConfigContext.tsx`, `ConfigProvider()`, `useConfig()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (4 nodes): `popover.tsx`, `popover.tsx`, `Popover()`, `PopoverTrigger()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (4 nodes): `scroll-area.tsx`, `scroll-area.tsx`, `ScrollArea()`, `ScrollBar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (4 nodes): `radio-group.tsx`, `radio-group.tsx`, `RadioGroup()`, `RadioGroupItem()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (4 nodes): `NoteMetadata.tsx`, `getPropertyIcon()`, `isActive()`, `renderNode()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (3 nodes): `label.tsx`, `label.tsx`, `Label()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (3 nodes): `badge.tsx`, `badge.tsx`, `Badge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (3 nodes): `button.tsx`, `button.tsx`, `cn()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (3 nodes): `input.tsx`, `input.tsx`, `Input()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (1 nodes): `Returns (is_valid, error_messages).         A note fails if it:           - Is m`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 119`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 120`** (1 nodes): `Recursively strips ALL quote forms from [[wikilink]] strings.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 121`** (1 nodes): `Strips internal quote patterns from [[wikilinks]] inside the brackets: [["X"]] -`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 123`** (1 nodes): `Instantiates and returns the appropriate LangChain ChatModel.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 124`** (1 nodes): `Safety check:          1. Must be a valid PDF.         2. Must be low resolution`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 139`** (1 nodes): `Fault-tolerant JSON parser for weak model outputs.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 140`** (1 nodes): `Normalise all prerequisite titles to [[Underscore_Title_Case]] format.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 141`** (1 nodes): `Parses a note into frontmatter and body.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 142`** (1 nodes): `Standardizes and protects code blocks in content for Obsidian.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (1 nodes): `Scans the academic root and extracts YAML metadata from all notes.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OkaService` connect `Community 0` to `Community 2`, `Community 11`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `AppSecrets` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `ObsidianClient` connect `Community 0` to `Community 1`, `Community 4`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 86 inferred relationships involving `OkaService` (e.g. with `VaultManager` and `OkaDeployer`) actually correct?**
  _`OkaService` has 86 INFERRED edges - model-reasoned connections that need verification._
- **Are the 76 inferred relationships involving `ModelFactory` (e.g. with `OkaService` and `Main orchestrator for OKA.`) actually correct?**
  _`ModelFactory` has 76 INFERRED edges - model-reasoned connections that need verification._
- **Are the 64 inferred relationships involving `AppSecrets` (e.g. with `ObsidianDumper` and `UpdateRowRequest`) actually correct?**
  _`AppSecrets` has 64 INFERRED edges - model-reasoned connections that need verification._
- **Are the 56 inferred relationships involving `VaultIndexer` (e.g. with `ChromaManager` and `VaultSyncHandler`) actually correct?**
  _`VaultIndexer` has 56 INFERRED edges - model-reasoned connections that need verification._