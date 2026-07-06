## ADDED Requirements

### Requirement: Prompt teacher job lifecycle
The system SHALL create a durable prompt teacher job for prompt-first learning requests.

#### Scenario: Vague prompt creates durable job
- **WHEN** the user asks Ater to teach a topic without attaching a source
- **THEN** the backend SHALL create or resume a prompt teacher job
- **THEN** the job SHALL persist prompt, topic, assumptions, diagnostic state, synthetic source pack, roadmap, coverage, tutor link, and status

#### Scenario: Resume prompt job from chat
- **WHEN** the user reopens a conversation containing a prompt teacher job
- **THEN** the desktop client SHALL restore roadmap, current lesson, tutor state, and coverage from backend state
- **THEN** it SHALL NOT depend on in-process planner cache or localStorage-only progress

### Requirement: Diagnostic intake
The system SHALL collect or infer a diagnostic intake before finalizing a prompt-first curriculum.

#### Scenario: Infer safe defaults
- **WHEN** the user asks "teach me consumer behavior"
- **THEN** the system SHALL infer a beginner/intermediate default when no level is provided
- **THEN** it SHALL record assumptions on the job
- **THEN** it SHALL proceed without blocking on unnecessary questions

#### Scenario: Ask when ambiguity blocks correctness
- **WHEN** the prompt is too ambiguous to choose domain, scope, or learning target safely
- **THEN** the assistant SHALL ask one concise clarification question
- **THEN** the job SHALL remain in an awaiting-clarification state

#### Scenario: Exam goal changes plan
- **WHEN** the user says they need to learn a topic for an exam by a deadline
- **THEN** the diagnostic intake SHALL record exam target and timeframe
- **THEN** the roadmap SHALL prioritize high-yield concepts, practice, and transfer gates

### Requirement: Synthetic source pack
The system SHALL create an auditable synthetic source pack before entering the teacher runtime.

#### Scenario: Create synthetic source pack
- **WHEN** diagnostic intake is sufficient
- **THEN** the system SHALL create a synthetic source pack with topic, scope, assumptions, provenance, confidence, outline, source snippets, and warnings
- **THEN** downstream concept graph nodes SHALL cite the synthetic source pack sections

#### Scenario: Prefer local vault evidence
- **WHEN** local vault notes, hubs, or source jobs match the prompt topic
- **THEN** the synthetic source pack SHALL include those local references as higher-confidence evidence
- **THEN** generated model material SHALL be marked separately from local evidence

#### Scenario: Weak source confidence is visible
- **WHEN** the synthetic source pack relies mostly on model-generated material
- **THEN** the job SHALL expose a provenance/confidence warning
- **THEN** the coverage matrix SHALL not pretend the topic is externally source-verified

### Requirement: Prompt concept graph
The system SHALL build a concept graph for prompt-first learning using the same graph invariants as source-grounded learning.

#### Scenario: Prompt graph has prerequisites
- **WHEN** the system plans a prompt-first topic
- **THEN** the graph SHALL include ordered concepts, prerequisites, source-pack citations, coverage targets, and teaching sequence

#### Scenario: Graph validation rejects generic filler
- **WHEN** generated concepts are vague filler, duplicates, off-topic, or unsupported by the synthetic source pack
- **THEN** graph validation SHALL reject, merge, or flag them before compilation

### Requirement: Prompt mode reuses teacher runtime
Prompt-first teaching SHALL reuse the source-grounded teacher runtime after synthetic source-pack creation.

#### Scenario: Start prompt lesson
- **WHEN** the user starts learning from a prompt roadmap
- **THEN** the system SHALL compile or reuse the first Atomic Note through the AI-minimized compiler
- **THEN** it SHALL create or resume a tutor session with coverage and mastery state

#### Scenario: Mastery updates coverage
- **WHEN** the user answers, fails, remediates, transfers, or masters a prompt-first concept
- **THEN** the tutor runtime SHALL update prompt job coverage using the same state model as source learning

### Requirement: Dynamic profiles for prompt concepts
The system SHALL select dynamic teaching profiles for prompt-first concepts using domain and modality.

#### Scenario: Economics prompt profile
- **WHEN** the user asks to learn consumer behavior without a PDF
- **THEN** concepts like budget line and consumer equilibrium SHALL route to `ECON-MICRO` profiles
- **THEN** quantitative artifacts SHALL prefer LaTeX, tables, or ASCII graphs and forbid programming artifacts

#### Scenario: Biology prompt profile
- **WHEN** the user asks to learn cellular respiration
- **THEN** concepts SHALL route to biology-appropriate profiles
- **THEN** artifacts and questions SHALL focus on pathways, mechanisms, and biological feedback rather than economics or CS examples

### Requirement: Weak-model fallback
The system SHALL degrade safely when prompt-first AI planning or generation fails.

#### Scenario: Planner AI fails
- **WHEN** AI planning fails or returns malformed JSON
- **THEN** deterministic fallback SHALL create a starter synthetic source pack and concept graph from topic keywords, local vault matches, and domain roadmaps
- **THEN** the job SHALL expose degraded confidence and incomplete coverage warnings

#### Scenario: Note AI fails
- **WHEN** note generation fails for a prompt concept
- **THEN** the compiler SHALL produce a valid fallback note from synthetic source pack snippets when possible
- **THEN** the tutor SHALL remain functional with honest degraded state

### Requirement: Prompt teacher APIs
The system SHALL expose APIs for prompt teacher jobs.

#### Scenario: Create prompt job API
- **WHEN** the client submits a learning prompt
- **THEN** the API SHALL create or resume a prompt teacher job
- **THEN** it SHALL return job ID, diagnostic state, assumptions, warnings, roadmap, and next action

#### Scenario: Start prompt job API
- **WHEN** the client starts a prompt teacher job
- **THEN** the API SHALL return tutor session/workspace payload
- **THEN** it SHALL not require the client to rely on old in-process curriculum cache

### Requirement: Desktop prompt teacher experience
The desktop client SHALL render prompt-first teaching through the same learning workspace patterns as source learning.

#### Scenario: Chat roadmap uses prompt job state
- **WHEN** the assistant shows a prompt-first learning roadmap
- **THEN** the roadmap SHALL come from durable prompt job state
- **THEN** it SHALL show assumptions, warnings, coverage summary, and Start Learning action

#### Scenario: Prompt tutor opens workspace
- **WHEN** the user starts a prompt-first lesson
- **THEN** the LearningWorkspace SHALL open from backend tutor/job state
- **THEN** progress SHALL survive reload or restart

