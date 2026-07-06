## ADDED Requirements

### Requirement: Prompt-first teacher E2E
The E2E verification suite SHALL cover prompt-first learning through the unified teacher runtime.

#### Scenario: Consumer behavior prompt E2E
- **WHEN** a test user asks "teach me consumer behavior"
- **THEN** the test SHALL verify prompt job creation, diagnostic assumptions, synthetic source pack, `ECON-MICRO` concept graph, dynamic profiles, first note compilation, tutor launch, answer handling, remediation, coverage updates, and restart restore

#### Scenario: Weak-model prompt E2E
- **WHEN** AI planning and note generation are mocked to fail or return malformed output
- **THEN** prompt-first learning SHALL preserve a usable degraded job, fallback graph/note state, warnings, and no false completion

#### Scenario: Desktop prompt regression
- **WHEN** desktop tests exercise prompt-first Start Learning
- **THEN** the UI SHALL render roadmap and workspace from durable prompt job/tutor state rather than old in-memory cache

