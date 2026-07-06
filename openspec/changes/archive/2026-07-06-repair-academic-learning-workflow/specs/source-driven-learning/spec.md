# Source Driven Learning Delta

## Modified Requirements

### Requirement: Source-driven progressive session
Source-driven academic learning SHALL use canonical academic Hub and Atomic Note paths for all user-visible learning state.

#### Scenario: Academic source job starts without visible SourceJobs notes
- **WHEN** an academic source job is started for semester `Winter2026`, course `Economics`, and unit `Chapter_3`
- **THEN** the tutor session hub path SHALL be under `database/study planner/Winter2026/Economics/Chapter_3`
- **AND** the current note path SHALL be under `Notes/academic/Winter2026/Economics/Chapter_3/01_Source_Roadmap`
- **AND** no visible `SourceJobs/<job_id>/*.md` Hub or Atomic Note SHALL be written for that academic job.

### Requirement: Source citations in progressive learning
Source-driven generated and degraded notes SHALL be useful, source-grounded Atomic Notes rather than generic placeholders.

#### Scenario: Degraded note still teaches from source excerpts
- **WHEN** AI note generation is unavailable or rejected for a source concept
- **THEN** the fallback Atomic Note SHALL explain the concept using source excerpts for that concept
- **AND** SHALL NOT use unrelated analogies, placeholder wording, or truncated arbitrary source snippets as the primary answer
- **AND** SHALL include source page metadata in frontmatter and quiz explanations.

### Requirement: Source-driven practice integration
The Active Recall Engine SHALL resolve nested academic Hubs created by the academic source-learning workflow.

#### Scenario: Practice generates from nested academic Hub
- **WHEN** the user selects `database/study planner/Winter2026/Economics/Chapter_3/Chapter_3_Hub`
- **THEN** the backend Practice generator SHALL find that Hub
- **AND** SHALL load Atomic Notes from the corresponding academic unit
- **AND** SHALL NOT return `Available hubs: []`.

### Requirement: Source-grounded tutor progression
Source-driven tutor sessions SHALL keep answer state, completed notes, active unlocks, and current note path aligned.

#### Scenario: Completed academic note advances or gives precise gate reason
- **WHEN** the learner answers the required recall questions for the current academic source note
- **THEN** advancing the tutor session SHALL either unlock the next canonical academic note
- **OR** return a precise mastery-gate reason such as missing transfer gate or failed recall question.
