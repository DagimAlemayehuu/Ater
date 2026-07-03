## ADDED Requirements

### Requirement: Canonical source learning job lifecycle
The system SHALL create and persist a canonical source learning job for every user-facing source-to-learning entrypoint.

#### Scenario: Desktop PDF attachment creates source job
- **WHEN** the user attaches `Chapter 3 2024-1.pdf` from the Ater desktop chat source flow
- **THEN** the backend SHALL create one source learning job with a stable job ID
- **THEN** the job SHALL reference the copied Inbox file path and the originating conversation when available
- **THEN** the desktop client SHALL NOT independently orchestrate the legacy detect-plan-confirm pipeline as a second source of truth

#### Scenario: Chat attachment promotion creates source job
- **WHEN** the user promotes an existing PDF chat attachment into a learning source
- **THEN** the backend SHALL create or reuse a source learning job for that attachment
- **THEN** the job SHALL preserve the attachment ID, conversation ID, source file path, and extracted attachment metadata

#### Scenario: Inbox watcher creates source job
- **WHEN** the Inbox watcher detects a PDF that should be learned from
- **THEN** it SHALL create or resume a source learning job using the same lifecycle as desktop attachment
- **THEN** it SHALL NOT use a separate incompatible queue state for learning coverage

#### Scenario: Rerun resumes existing job
- **WHEN** the same source file is submitted again without source content changes
- **THEN** the system SHALL resume the existing job or create an explicit new version
- **THEN** it SHALL NOT duplicate vault notes, tutor sessions, or coverage rows silently

### Requirement: Source extraction audit
The system SHALL audit source extraction before planning or teaching from a PDF.

#### Scenario: Golden PDF extraction audit
- **WHEN** the system audits repository-root `Chapter 3 2024-1.pdf`
- **THEN** the audit SHALL record 48 pages
- **THEN** the audit SHALL record the title metadata `Chapter 3` when available
- **THEN** the audit SHALL record per-page text lengths and extraction warnings
- **THEN** the audit SHALL preserve page 2 text containing the chapter objectives

#### Scenario: Low-text pages are warnings
- **WHEN** one or more PDF pages contain no extractable text or text below the configured threshold
- **THEN** the audit SHALL mark those pages as weak extraction pages
- **THEN** the source job SHALL expose a warning that diagrams, graphs, scans, or slide visuals may require manual review or augmentation

#### Scenario: Extraction audit blocks false completion
- **WHEN** a source job has high-severity extraction warnings
- **THEN** the system SHALL NOT mark source coverage complete solely because notes were generated
- **THEN** the coverage matrix SHALL retain an unresolved extraction warning until explicitly resolved or waived

### Requirement: Source map and objective map
The system SHALL build a source map that identifies chapter title, objectives, page sections, and required coverage targets.

#### Scenario: Extract consumer behavior objectives
- **WHEN** the system builds a source map for `Chapter 3 2024-1.pdf`
- **THEN** it SHALL identify the topic as `Theory of Consumer Behavior` or an equivalent normalized title
- **THEN** it SHALL extract required objectives covering consumer preferences and utility, cardinal and ordinal utility, indifference curves and properties, budget line, and consumer equilibrium

#### Scenario: Objectives become coverage targets
- **WHEN** objectives are extracted from a source
- **THEN** each objective SHALL become a required coverage target in the source job
- **THEN** the job SHALL track whether each objective is mapped to at least one source-grounded concept

#### Scenario: Page sections retain citations
- **WHEN** source pages are grouped into source-map sections
- **THEN** each section SHALL retain source file name and page-number citations
- **THEN** downstream concept graph nodes SHALL be able to reference those citations

### Requirement: Source-grounded concept graph
The system SHALL build a concept graph from source content before compiling notes or launching the tutor session.

#### Scenario: Golden PDF concept graph contains required concepts
- **WHEN** the system builds a concept graph for `Chapter 3 2024-1.pdf`
- **THEN** the graph SHALL include source-grounded concepts covering consumption bundles, consumer preferences, utility, cardinal versus ordinal utility, indifference curves, budget line, and consumer equilibrium
- **THEN** each required objective SHALL map to at least one graph concept

#### Scenario: Graph nodes have source evidence
- **WHEN** a concept graph node is accepted
- **THEN** it SHALL include at least one source page citation or an explicit unresolved-source warning
- **THEN** ungrounded concepts SHALL NOT count toward objective coverage

#### Scenario: Graph is prerequisite ordered
- **WHEN** the graph is finalized
- **THEN** it SHALL be acyclic
- **THEN** prerequisite concepts SHALL appear before dependent concepts in the recommended teaching order
- **THEN** the first recommended concept for the golden PDF SHALL be foundational to consumer preferences, consumption bundles, or utility

#### Scenario: Domain drift is rejected
- **WHEN** a graph concept for the golden PDF introduces macroeconomics, central banking, exchange rates, programming, or unrelated biology content without source evidence
- **THEN** the system SHALL reject or flag the concept as domain drift
- **THEN** the concept SHALL NOT be compiled into a mastered learning item without correction

### Requirement: Dynamic teaching profile per concept
The system SHALL select a deterministic teaching profile for each source-grounded concept using domain, modality, and source context.

#### Scenario: Microeconomics profile for golden PDF
- **WHEN** the system profiles concepts from `Chapter 3 2024-1.pdf`
- **THEN** the chapter-level domain SHALL route to `ECON-MICRO`
- **THEN** each concept SHALL receive a modality such as `Qualitative/Definitional`, `Quantitative`, `Procedural`, `Comparative`, or `Causal/Historical`
- **THEN** each teaching profile SHALL include persona, headings, artifact type, question modes, sanity checks, L3 law, and prohibitions

#### Scenario: Budget line is quantitative
- **WHEN** the concept title or source context centers on budget line, equation, slope, income, price, intercepts, or consumer equilibrium calculations
- **THEN** the teaching profile SHALL use an `ECON-MICRO` quantitative profile
- **THEN** the artifact constraints SHALL allow LaTeX, Markdown tables, or ASCII graphs
- **THEN** the artifact constraints SHALL forbid Python, R, or programming code unless the source explicitly teaches programming

#### Scenario: Cardinal versus ordinal utility is comparative
- **WHEN** the concept compares cardinal utility and ordinal utility
- **THEN** the teaching profile SHALL use an `ECON-MICRO` comparative profile
- **THEN** the note and assessment plan SHALL emphasize contrast, decision criteria, and common confusion points

#### Scenario: Cross-domain profiles remain distinct
- **WHEN** a biology source concept is profiled in tests
- **THEN** the profile SHALL use biology-specific persona/artifact/question constraints
- **THEN** it SHALL NOT reuse economics curve, market, price, or utility assumptions

### Requirement: AI-minimized source compiler contract
The system SHALL compile Atomic Notes from source graph nodes using deterministic structure and bounded AI payload generation.

#### Scenario: Code owns note shape
- **WHEN** an Atomic Note is compiled from a source graph node
- **THEN** deterministic code SHALL provide the title, frontmatter, source citations, section headings, expected artifact type, quiz schema, and validation rules
- **THEN** the AI SHALL NOT be responsible for inventing the note structure

#### Scenario: AI writes constrained content only
- **WHEN** the compiler calls an AI model
- **THEN** the prompt SHALL include source excerpts, source pages, teaching profile, required section purposes, prohibited content, and output schema
- **THEN** the AI output SHALL be treated as replaceable content inside deterministic containers

#### Scenario: Weak model fallback compiles valid note
- **WHEN** AI generation fails, times out, exceeds rate limits, or returns malformed output
- **THEN** the compiler SHALL produce a structurally valid source-grounded fallback note when enough source text exists
- **THEN** the note SHALL be marked with fallback metadata
- **THEN** coverage SHALL record the degraded generation state honestly

#### Scenario: Compiler rejects invalid citations
- **WHEN** generated content cites pages that do not exist in the source audit
- **THEN** validation SHALL reject or repair the citations
- **THEN** the note SHALL NOT count as source-grounded until citations are valid

### Requirement: Coverage matrix
The system SHALL maintain a durable coverage matrix for each source learning job.

#### Scenario: Coverage row per objective and concept
- **WHEN** a source job has extracted objectives and concept graph nodes
- **THEN** the system SHALL persist coverage rows for each objective and each concept
- **THEN** each row SHALL expose source extraction, objective mapping, note compilation, taught state, recall state, transfer state, remediation state, practice scheduling state, and vault deployment state as applicable

#### Scenario: Coverage updates after tutor answer
- **WHEN** the user answers a tutor question for a source-grounded concept
- **THEN** the tutor runtime SHALL update the corresponding coverage row
- **THEN** the source job status SHALL reflect the updated recall, transfer, remediation, or mastery state

#### Scenario: Report remaining work
- **WHEN** the client requests source job status
- **THEN** the response SHALL include a user-inspectable list of objectives or concepts that remain untaught, untested, unmastered, unscheduled, undeployed, or blocked by warnings

#### Scenario: Cannot complete with uncovered objective
- **WHEN** any required objective is not mapped, taught, and mastered or explicitly waived
- **THEN** the source job SHALL NOT report complete

### Requirement: Tutor session launch from source job
The system SHALL launch or resume tutor sessions from compiled source learning jobs.

#### Scenario: Start learning from roadmap
- **WHEN** the user starts learning from a source job roadmap
- **THEN** the backend SHALL compile or reuse the first teachable Atomic Note
- **THEN** it SHALL create or resume a tutor session linked to the source job
- **THEN** it SHALL return current note, roadmap, coverage state, and tutor session ID

#### Scenario: Tutor teaches through mastery loop
- **WHEN** a tutor session is linked to a source job
- **THEN** the runtime SHALL support explain, ask, grade, remediate, transfer, mark mastery, schedule practice, and unlock next concept
- **THEN** each transition SHALL update source job coverage

#### Scenario: Resume after app restart
- **WHEN** Ater restarts during an active source-grounded tutor session
- **THEN** the source job, tutor session, current note, completed concepts, locked concepts, warnings, and coverage matrix SHALL restore from durable backend state
- **THEN** the desktop client SHALL NOT rely on localStorage-only state for source learning progress

### Requirement: Vault deployment and idempotency
The system SHALL deploy source-grounded learning objects to the vault idempotently.

#### Scenario: Deploy generated source learning objects
- **WHEN** the compiler deploys learning objects for a source job
- **THEN** it SHALL write or update the Hub, Chapter files, Atomic Notes, lesson artifacts, and source metadata according to existing vault conventions
- **THEN** each generated Atomic Note SHALL include source file and page metadata

#### Scenario: Rerun does not duplicate notes
- **WHEN** the same source job is rerun after one or more notes were deployed
- **THEN** the deployer SHALL reuse, update, or skip existing notes according to deterministic idempotency rules
- **THEN** it SHALL NOT create duplicate notes with conflicting titles for the same source concept

#### Scenario: Existing user notes are protected
- **WHEN** a target note path already exists and was not generated by the source job
- **THEN** the deployer SHALL preserve user-authored content
- **THEN** it SHALL record a collision requiring user review or safe merge

### Requirement: Source job APIs
The system SHALL expose backend APIs for creating, inspecting, starting, and resuming source learning jobs.

#### Scenario: Create source job API
- **WHEN** the client submits a PDF path, attachment ID, or Inbox file reference to the source job API
- **THEN** the API SHALL create or resume a source learning job
- **THEN** it SHALL return job ID, status, audit summary, warnings, and next action

#### Scenario: Start source lesson API
- **WHEN** the client requests to start learning from a source job
- **THEN** the API SHALL return a tutor session link and current learning workspace payload
- **THEN** it SHALL not require the client to call legacy process, plan, and confirm endpoints in sequence

#### Scenario: Source job status API
- **WHEN** the client requests source job status
- **THEN** the API SHALL return source audit, source map, roadmap, graph summary, coverage matrix summary, warnings, current tutor state, and recoverable errors

### Requirement: Desktop source learning experience
The desktop client SHALL present source learning as one coherent teacher flow.

#### Scenario: Attach source shows audit and roadmap
- **WHEN** the user attaches `Chapter 3 2024-1.pdf`
- **THEN** the UI SHALL show source audit and roadmap state from the source job
- **THEN** the UI SHALL display warnings for weak extraction or unresolved coverage
- **THEN** the UI SHALL show a clear `Start Learning` action

#### Scenario: Start learning opens teacher workspace
- **WHEN** the user starts learning from the source roadmap
- **THEN** the LearningWorkspace SHALL open with the current lesson, tutor session, roadmap, and coverage/mastery state
- **THEN** the UI SHALL not show raw queue batch logs as the primary learning experience

#### Scenario: Coverage panel is user inspectable
- **WHEN** the source job has objectives and concepts
- **THEN** the desktop client SHALL expose which objectives/concepts are taught, tested, mastered, blocked, or remaining

### Requirement: Golden fixture verification
The system SHALL include automated and manual verification around `Chapter 3 2024-1.pdf`.

#### Scenario: Golden backend fixture test
- **WHEN** backend fixture tests run with `Chapter 3 2024-1.pdf` available
- **THEN** tests SHALL verify 48-page extraction, page 2 objective visibility, `ECON-MICRO` routing, required concept coverage, valid concept graph, teaching profiles, and coverage matrix creation

#### Scenario: Golden weak-model fixture test
- **WHEN** tests run with AI calls mocked to fail or return malformed output
- **THEN** the source job SHALL still produce audit data, warnings, deterministic graph fallback where possible, valid fallback notes where requested, and honest incomplete/degraded coverage state

#### Scenario: Manual desktop fixture checklist
- **WHEN** final manual verification is performed
- **THEN** the checklist SHALL include attaching `Chapter 3 2024-1.pdf`, confirming 48 pages, confirming consumer behavior objectives, inspecting roadmap concepts, starting the tutor, answering one question correctly, answering one incorrectly, inspecting remediation, verifying vault notes, and verifying coverage state

