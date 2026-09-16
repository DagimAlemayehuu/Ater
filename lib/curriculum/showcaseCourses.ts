import type { CourseCurriculum, DynamicLessonNote, RoadmapLesson, LessonInlineMCQ } from '@/types';

/**
 * ============================================================================
 * COURSE 1: COMPREHENSIVE ARTIFACTS SHOWCASE (No Gate)
 * One dedicated lesson for every artifact type, featuring rich multiple sections,
 * and deep variations (e.g. sequence, state, git-graph, and architecture in Mermaid).
 * ============================================================================
 */
export function getArtifactsShowcaseCurriculum(language: 'en' | 'am' = 'en'): CourseCurriculum {
  const isAm = language === 'am';

  const lessons: RoadmapLesson[] = isAm
    ? [
        {
          id: 'art-lesson-01',
          order: 1,
          title: 'Mermaid ዲያግራሞች ሙሉ ማሳያ (Sequence, State, Git & Architecture)',
          slug: '01_mermaid_diagrams_showcase',
          summary: 'ሁሉንም የMermaid ዲያግራም አይነቶች፡ የቅደም ተከተል፣ የስቴት ማሽን፣ የጂት ቅርንጫፍ እና የስርዓት ፍሰት በዝርዝር መመልከት።',
          status: 'active',
          estimatedMinutes: 20,
          prerequisites: [],
          conceptsCovered: ['Sequence Diagram', 'State Diagram', 'Git Graph', 'Architecture Flow'],
        },
        {
          id: 'art-lesson-02',
          order: 2,
          title: 'የኮድ አገባብ እና የጂት ልዩነት ተመልካች (Syntax Highlighting & Diff Patch)',
          slug: '02_code_syntax_and_diff_showcase',
          summary: 'ባለብዙ ቋንቋ የኮድ ማሳያ እና የቀይ/አረንጓዴ የጂት ልዩነት (Git Diff) ማነፃፀሪያ።',
          status: 'active',
          estimatedMinutes: 18,
          prerequisites: [],
          conceptsCovered: ['TypeScript Highlighting', 'Git Diff', 'Race Condition Fix'],
        },
        {
          id: 'art-lesson-03',
          order: 3,
          title: 'ውስብስብ LaTeX KaTeX የሂሳብ ቀመሮች እና ማትሪክሶች',
          slug: '03_latex_katex_math_showcase',
          summary: 'ባለብዙ መስመር የሂሳብ ቀመሮች፣ ማትሪክሶች፣ የተቆራረጡ የኮረም እኩልዮሾች እና የመስክ ማረጋገጫዎች።',
          status: 'active',
          estimatedMinutes: 20,
          prerequisites: [],
          conceptsCovered: ['KaTeX Display Math', 'Matrix Notation', 'Attention Proofs'],
        },
        {
          id: 'art-lesson-04',
          order: 4,
          title: 'የንጽጽር ሰንጠረዦች እና ባለብዙ አምድ ማትሪክስ (Rich Table)',
          slug: '04_rich_table_matrices_showcase',
          summary: 'ውስብስብ የምህንድስና ንጽጽሮችን በከፍተኛ ጥራት የሚያቀርብ ባለብዙ አምድ ሰንጠረዥ።',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Comparative Matrices', 'Latency Analysis', 'Protocol Trade-offs'],
        },
        {
          id: 'art-lesson-05',
          order: 5,
          title: 'የጊዜ ሰሌዳ እና ቅደም ተከተል ተመልካች (Multi-Stage Timeline)',
          slug: '05_process_timeline_showcase',
          summary: 'ባለብዙ ደረጃ የተከፋፈሉ የግብይት እና የስራ ፍሰት የጊዜ ሰሌዳ ደረጃዎች።',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Execution Trace', 'Two-Phase Commit', 'Milestone Steps'],
        },
        {
          id: 'art-lesson-06',
          order: 6,
          title: 'በይነተገናኝ ባለ 3D የሩቢክስ ኪዩብ ሳንድቦክስ (Interactive 3D Rubik\'s Cube)',
          slug: '06_interactive_simulation_showcase',
          summary: 'በቀጥታ በስክሪኑ ላይ በ3D የሚሽከረከር፣ የንብርብር ማዞሪያ ቁልፎች እና የመደባለቂያ አማራጮች ያሉት በይነተገናኝ የሩቢክስ ኪዩብ ማሳያ።',
          status: 'active',
          estimatedMinutes: 20,
          prerequisites: [],
          conceptsCovered: ['3D Spatial Canvas', 'Permutation Groups', 'Layer Rotation Mechanics', 'Pointer Orbiting'],
        },
        {
          id: 'art-lesson-07',
          order: 7,
          title: 'የማስጠንቀቂያ፣ ጥልቅ ማብራሪያ እና የውጤት ካርዶች (Callouts & Deep-Dives)',
          slug: '07_callouts_and_accordions_showcase',
          summary: 'የGitHub ማስጠንቀቂያ ሳጥኖች፣ ጠቃሚ ምክሮች እና ተዘርግተው የሚነበቡ የንድፈ-ሀሳብ ማረጋገጫዎች።',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Warning Callouts', 'Collapsible Proofs', 'Pedagogical Alerts'],
        },
      ]
    : [
        {
          id: 'art-lesson-01',
          order: 1,
          title: 'Mermaid Mastery: Sequence, State, Git & Architecture',
          slug: '01_mermaid_diagrams_showcase',
          summary: 'Deep-dive into all major Mermaid diagram modalities: Sequence workflows, state machines, git graphs, and distributed architecture maps.',
          status: 'active',
          estimatedMinutes: 20,
          prerequisites: [],
          conceptsCovered: ['Sequence Diagram', 'State Diagram', 'Git Graph', 'Architecture Flow'],
        },
        {
          id: 'art-lesson-02',
          order: 2,
          title: 'Code Syntax Highlighting & Unified Git Diffs',
          slug: '02_code_syntax_and_diff_showcase',
          summary: 'High-fidelity multi-language code blocks paired with side-by-side git patch diff visualizations.',
          status: 'active',
          estimatedMinutes: 18,
          prerequisites: [],
          conceptsCovered: ['TypeScript Highlighting', 'Git Diff', 'Race Condition Fix'],
        },
        {
          id: 'art-lesson-03',
          order: 3,
          title: 'High-Precision KaTeX Math & Formal Proofs',
          slug: '03_latex_katex_math_showcase',
          summary: 'Display-mode mathematical equations, multi-dimensional tensor contractions, and formal quorum proofs.',
          status: 'active',
          estimatedMinutes: 20,
          prerequisites: [],
          conceptsCovered: ['KaTeX Display Math', 'Matrix Notation', 'Attention Proofs'],
        },
        {
          id: 'art-lesson-04',
          order: 4,
          title: 'Dense Comparison Tables & Engineering Matrices',
          slug: '04_rich_table_matrices_showcase',
          summary: 'Exhaustive comparative tables structuring trade-offs, network latencies, and operational invariants.',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Comparative Matrices', 'Latency Analysis', 'Protocol Trade-offs'],
        },
        {
          id: 'art-lesson-05',
          order: 5,
          title: 'Chronological Timelines & Event Sequences',
          slug: '05_process_timeline_showcase',
          summary: 'Trace multi-phase distributed transactions with ordered visual execution milestones.',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Execution Trace', 'Two-Phase Commit', 'Milestone Steps'],
        },
        {
          id: 'art-lesson-06',
          order: 6,
          title: '3D Interactive Rubik\'s Cube Visual Sandbox',
          slug: '06_interactive_simulation_showcase',
          summary: 'Full-featured 3D interactive Rubik\'s cube simulator with 360-degree pointer orbiting, layer turn notation, and scramble mechanics.',
          status: 'active',
          estimatedMinutes: 20,
          prerequisites: [],
          conceptsCovered: ['3D Spatial Canvas', 'Permutation Groups', 'Layer Rotation Mechanics', 'Pointer Orbiting'],
        },
        {
          id: 'art-lesson-07',
          order: 7,
          title: 'Pedagogy Callouts & Collapsible Proof Accordions',
          slug: '07_callouts_and_accordions_showcase',
          summary: 'GitHub-style alert badges, danger callouts, and collapsible mathematical proofs for progressive disclosure.',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Warning Callouts', 'Collapsible Proofs', 'Pedagogical Alerts'],
        },
      ];

  return {
    id: 'course-artifacts-showcase',
    title: isAm ? 'የአርቲፋክት ተመልካቾች ሙሉ ማሳያ ኮርስ' : 'Visual Artifacts Masterclass',
    topic: isAm ? 'የአርቲፋክት ተመልካቾች ማሳያ' : 'Artifacts Showcase',
    sourceType: 'prompt',
    targetGoal: isAm
      ? 'ሁሉንም የአተር ስዕላዊ እና በይነተገናኝ ማሳያዎች በዝርዝር መመርመር እና መረዳት'
      : 'Master every visual and interactive artifact viewer supported in Ater without testing gate restrictions.',
    learnerBaseline: isAm ? 'ስዕላዊ አሰራሮችን ማየት የሚፈልግ መሃንዲስ' : 'Engineer exploring rich multi-modal pedagogical renderers',
    lessons,
    activeLessonId: 'art-lesson-01',
    disableGate: true,
    createdAt: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * ============================================================================
 * COURSE 2: QUESTION & ASSESSMENT ARCHITECTURE (No Gate)
 * Detailed exploration of every question paradigm:
 * 1. Inline Active-Recall MCQs
 * 2. Midway Socratic Causal Checkpoints
 * 3. Proving Grounds Flashcard Question Banks
 * 4. Multi-Turn Socratic Diagnostic Intake Interviews
 * 5. Free-Form Side Question Modal & Follow-ups
 * ============================================================================
 */
export function getQuestionsShowcaseCurriculum(language: 'en' | 'am' = 'en'): CourseCurriculum {
  const isAm = language === 'am';

  const lessons: RoadmapLesson[] = isAm
    ? [
        {
          id: 'quest-lesson-01',
          order: 1,
          title: 'ባለብዙ ምርጫ ፈጣን የማረጋገጫ ጥያቄዎች (Multiple Choice MCQs)',
          slug: '01_multiple_choice_architecture',
          summary: 'በትምህርቱ ክፍል 1 እና 3 ውስጥ ተካተው ትክክለኛውን ምርጫ እና የተሳሳቱትን አማራጮች ማብራሪያ ወዲያውኑ የሚሰጡ ፈጣን ጥያቄዎች።',
          status: 'active',
          estimatedMinutes: 12,
          prerequisites: [],
          conceptsCovered: ['Multiple Choice', 'Active Recall', 'Distractor Design'],
        },
        {
          id: 'quest-lesson-02',
          order: 2,
          title: 'የእውነት ወይም ሐሰት ፈጣን ማረጋገጫ (True / False Checkpoints)',
          slug: '02_true_false_axioms',
          summary: 'መሰረታዊ ህጎችን እና እውነታዎችን በቅጽበት በሁለት ካርዶች አማካኝነት ለመፈተሽ የሚያስችሉ ጥያቄዎች።',
          status: 'active',
          estimatedMinutes: 10,
          prerequisites: [],
          conceptsCovered: ['True/False Verification', 'Axiomatic Rules', 'Instant Validation'],
        },
        {
          id: 'quest-lesson-03',
          order: 3,
          title: 'ክፍት ቦታ ሙላ ፈጣን ጥያቄዎች (Fill in the Blank)',
          slug: '03_fill_in_the_blank',
          summary: 'በዓረፍተ-ነገሩ መሃል ያሉ ቁልፍ ቃላትን እና ፎርሙላዎችን በጽሑፍ በማስገባት ትክክለኛውን እውቀት መፈተሽ።',
          status: 'active',
          estimatedMinutes: 12,
          prerequisites: [],
          conceptsCovered: ['Active Vocabulary', 'Inline Inputs', 'Exact Matching'],
        },
        {
          id: 'quest-lesson-04',
          order: 4,
          title: 'ተዛማጅ ማገናኘት ፈጣን ጥያቄዎች (Relational Matching)',
          slug: '04_relational_matching',
          summary: 'ፅንሰ-ሀሳቦችን እና ተዛማጅ ትርጉሞቻቸውን ከግራ ወደ ቀኝ በማገናኘት የስርዓቶችን ቁርኝት መረዳት።',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Relational Mapping', 'Pairing Logic', 'Structural Understanding'],
        },
        {
          id: 'quest-lesson-05',
          order: 5,
          title: 'የአጭር መልስ ፈጣን ጥያቄዎች (Short Answer Articulation)',
          slug: '05_short_answer_articulation',
          summary: 'በራስዎ አባባል በአጭሩ የ1-2 ዓረፍተ-ነገር ትንተና በማስገባት ጥልቅ ግንዛቤን ማረጋገጥ።',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Short Answer', 'Conceptual Synthesis', 'Keyword Verification'],
        },
      ]
    : [
        {
          id: 'quest-lesson-01',
          order: 1,
          title: 'Multiple Choice Checkpoint Architecture',
          slug: '01_multiple_choice_architecture',
          summary: 'Embedded directly inside sections to test active recall with selective options, instant locking, and feedback insights.',
          status: 'active',
          estimatedMinutes: 12,
          prerequisites: [],
          conceptsCovered: ['Multiple Choice', 'Active Recall', 'Distractor Design'],
        },
        {
          id: 'quest-lesson-02',
          order: 2,
          title: 'True / False Axiomatic Verification',
          slug: '02_true_false_axioms',
          summary: 'High-speed binary verification testing fundamental axioms, invariants, and common edge-case fallacies.',
          status: 'active',
          estimatedMinutes: 10,
          prerequisites: [],
          conceptsCovered: ['True/False Verification', 'Axiomatic Rules', 'Instant Validation'],
        },
        {
          id: 'quest-lesson-03',
          order: 3,
          title: 'Fill in the Blank Recall & Precision',
          slug: '03_fill_in_the_blank',
          summary: 'Inline sentence blanks that prompt active keyword recall without option hints, testing exact terminology mastery.',
          status: 'active',
          estimatedMinutes: 12,
          prerequisites: [],
          conceptsCovered: ['Active Vocabulary', 'Inline Inputs', 'Exact Matching'],
        },
        {
          id: 'quest-lesson-04',
          order: 4,
          title: 'Relational Matching & Concept Mapping',
          slug: '04_relational_matching',
          summary: 'Interactive two-column pairing linking protocol primitives, mathematical properties, and system invariants.',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Relational Mapping', 'Pairing Logic', 'Structural Understanding'],
        },
        {
          id: 'quest-lesson-05',
          order: 5,
          title: 'Short Answer Direct Articulation',
          slug: '05_short_answer_articulation',
          summary: 'Concise 1-2 sentence articulation in your own words, validating first-principles comprehension without multiple choices.',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Short Answer', 'Conceptual Synthesis', 'Keyword Verification'],
        },
      ];

  return {
    id: 'course-questions-showcase',
    title: isAm ? 'የጥያቄዎች እና ምዘናዎች ሙሉ ማሳያ ኮርስ' : 'Question & Assessment Architecture',
    topic: isAm ? 'የጥያቄዎች እና ምዘናዎች ማሳያ' : 'Question Paradigms',
    sourceType: 'prompt',
    targetGoal: isAm
      ? 'ሁሉንም የአተር የጥያቄ አይነቶች፣ ፈጣን ማረጋገጫዎች እና የሶቅራጥስ ምዘናዎችን በዝርዝር መረዳት'
      : 'Explore the full spectrum of qualitative and quantitative assessment mechanisms designed inside Ater without gate blocking.',
    learnerBaseline: isAm ? 'የፈተና እና የትምህርት አሰጣጥ ዘዴዎችን ማጥናት የሚፈልግ መሃንዲስ' : 'Engineer exploring cognitive evaluation and active retrieval architectures',
    lessons,
    activeLessonId: 'quest-lesson-01',
    disableGate: true,
    createdAt: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Deterministic generator for notes belonging to the two showcase courses.
 */
export function getShowcaseLessonNote(lessonId: string, language: 'en' | 'am' = 'en'): DynamicLessonNote | null {
  const isAm = language === 'am';

  // ==========================================================================
  // COURSE 1: ARTIFACTS SHOWCASE LESSON NOTES
  // ==========================================================================

  if (lessonId === 'art-lesson-01') {
    // MERMAID COMPREHENSIVE: Sequence, State, GitGraph, Architecture Flow
    const multiMermaidCode = `sequenceDiagram
  autonumber
  actor Client as Distributed Client
  participant Gateway as API Gateway (Envoy)
  participant RaftLeader as Node 1 [Leader / Term 4]
  participant ReplicaA as Node 2 [Follower]
  participant ReplicaB as Node 3 [Follower]
  participant WAL as Non-Volatile Write-Ahead Log

  Note over Client,Gateway: 1. Client Submits Mutating Transaction
  Client->>Gateway: POST /v1/ledger/transfer {from: "Alice", to: "Bob", amount: 150}
  Gateway->>RaftLeader: Forward Command to Active Leader

  Note over RaftLeader,WAL: 2. Local Uncommitted Append
  RaftLeader->>WAL: Append LogEntry(Index 102, Term 4, Transfer)

  Note over RaftLeader,ReplicaB: 3. Parallel AppendEntries RPC Broadcast
  par Broadcast to Quorum Peers
    RaftLeader->>ReplicaA: AppendEntries(Term 4, Index 102, PrevTerm 4)
    RaftLeader->>ReplicaB: AppendEntries(Term 4, Index 102, PrevTerm 4)
  end

  ReplicaA-->>RaftLeader: AppendSuccess(Index 102) [Quorum Witness 2/3]
  Note over RaftLeader: Majority Satisfied (2/3 Nodes Acknowledged)
  RaftLeader->>WAL: Mark CommitIndex = 102
  RaftLeader-->>Gateway: HTTP 200 OK (Committed State)
  Gateway-->>Client: Transaction Finalized (TxHash: 0x9f82...)

  ReplicaB-->>RaftLeader: AppendSuccess(Index 102) [Delayed Ack Catchup]`;

    return {
      id: 'note-art-lesson-01',
      lessonId: 'art-lesson-01',
      courseId: 'course-artifacts-showcase',
      title: isAm ? 'Mermaid ዲያግራሞች ሙሉ ማሳያ (Sequence, State, Git & Flow)' : 'Mermaid Mastery: Sequence, State, Git & Architecture',
      mentalModel: isAm
        ? `በስክሪኑ ላይ የቀረበውን የተሟላ የMermaid የቅደም ተከተል ዲያግራም ይመልከቱ።
\`\`\`mermaid
${multiMermaidCode}
\`\`\`
የMermaid ዲያግራሞች በአተር ውስጥ የተለያዩ የስርዓት አሰራሮችን በግልጽ ያሳያሉ፡
1. የቅደም ተከተል ፍሰት (Sequence Diagrams)፡ ክፍሎች በመልእክት የሚለዋወጡበትን ቅደም ተከተል በቁጥር ያሳያል።
2. የስቴት ማሽን (State Diagrams)፡ ስርዓቱ ከአንድ ሁኔታ ወደ ሌላ የሚሸጋገርበትን ሂደት ያሳያል።
3. የጂት ቅርንጫፍ (Git Graph)፡ የኮድ ለውጦች እና ቅንጅቶች እንዴት እንደሚከናወኑ በስዕል ይገልጻል።`
        : `Examine the full-fidelity multi-participant sequence diagram rendered below.
\`\`\`mermaid
${multiMermaidCode}
\`\`\`
Mermaid transforms complex asynchronous topologies into spatial mental models:
1. Sequence Diagrams map chronological inter-node RPC broadcasts and quorum confirmations.
2. State Diagrams formalize finite state transitions between Candidate, Leader, and Follower roles.
3. Git Graphs depict commit DAG lineages, branching, and rebasing mechanics without cognitive friction.`,
      intuitivePurpose: isAm
        ? 'የተለያዩ የMermaid ዲያግራም አይነቶች መሃንዲሶች ውስብስብ የስርዓት አሰራሮችን ያለ ምንም ቃላት ውዥንብር በአይነ-ህሊናቸው እንዲስሉ ያስችላቸዋል።'
        : 'Mermaid diagrams eliminate verbal ambiguity by mapping temporal message passing and state transitions into crisp vector diagrams.',
      operationalMechanism: isAm
        ? 'በክፍል 1 የቀረበው የቅደም ተከተል ዲያግራም መሪው ሰርቨር መረጃውን ወደ ተከታዮቹ በትይዩ ልኮ 2/3 ኮረም ሲያገኝ ግብይቱን እንዴት እንደሚያጸድቅ ያሳያል።'
        : 'The leader appends log entries locally, broadcasts AppendEntries RPCs in parallel, and finalizes commits immediately upon receiving majority quorum acknowledgments.',
      boundaryConditions: isAm
        ? 'አንድ ተከታይ ሰርቨር ቢዘገይ እንኳ፣ የቀሩት ሁለት ክፍሎች አብላጫ ድምፅ ስለሚሰጡ ደንበኛው ያለምንም መቆራረጥ ምላሽ ያገኛል።'
        : 'Even if Replica B experiences transient network latency, the 2-out-of-3 quorum established by Node 1 and Node 2 guarantees safe progress.',
      artifactCode: multiMermaidCode,
      artifactLanguage: 'mermaid',
      teacherExplanations: {
        section1: isAm
          ? 'በዚህ ትምህርት ውስጥ የMermaid ዲያግራሞችን ልዩ ልዩ አይነቶች እንመለከታለን። በስክሪኑ ላይ የሚታየው የተሟላ የቅደም ተከተል ዲያግራም ደንበኛው፣ የመግቢያ በር፣ መሪው ሰርቨር እና ተከታዮቹ እንዴት በትይዩ እንደሚነጋገሩ በግልጽ ያሳያል።'
          : 'Welcome to the Mermaid Mastery deep-dive. On your screen is a comprehensive multi-tier sequence diagram tracking an end-to-end ledger mutation across client, gateway, raft leader, and replicated storage peers.',
      },
      inlineMCQs: [
        {
          id: 'mcq-art-01-s1',
          sectionIndex: 1,
          question: isAm ? 'በቅደም ተከተል ዲያግራሞች (Sequence Diagrams) ውስጥ የ "par" ብሎክ ዋና ጥቅም ምንድን ነው?' : 'In Mermaid sequence diagrams, what does the "par" block represent?',
          options: isAm
            ? ['መልእክቶችን ወደ ብዙ ክፍሎች በትይዩ (Parallel) መላክን ያሳያል', 'የኮምፒውተር ፕሮግራሙን ያቋርጣል', 'ስክሪኑን ያጠፋል', 'ሁሉንም ዳታቤዝ ይሰርዛል']
            : ['Concurrent, parallel message dispatch to multiple participants', 'A sequential loop that blocks until completion', 'A terminating fatal error handler', 'A local disk write without network I/O'],
          correctOptionIndex: 0,
          explanation: isAm
            ? 'የ "par" ብሎክ መሪው ሰርቨር መልእክቶችን ወደ ተከታዮቹ በአንድ ጊዜ በትይዩ እንደሚልክ ያሳያል።'
            : 'The par construct models concurrent asynchronous broadcasts dispatched simultaneously across peer nodes.',
        },
        {
          id: 'mcq-art-01-s3',
          sectionIndex: 3,
          question: isAm ? 'መሪው ሰርቨር ለምን የተከታይ 2ን ምላሽ ሳይጠብቅ ግብይቱን ለደንበኛው አጸደቀ?' : 'Why did the leader acknowledge success to the client before Replica B replied?',
          options: isAm
            ? ['2/3 አብላጫ ድምፅ (Quorum) ስለተሟላ የተከታይ 2 ምላሽ ባይደርስም ስርዓቱ ደህንነቱ የተጠበቀ ነው', 'ተከታይ 2 ስለተሰበረ', 'ደንበኛው ስለቸኮለ', 'የመረጃው መጠን አነስተኛ ስለሆነ']
            : ['Majority quorum (2 out of 3 nodes) was already satisfied by Replica A', 'Replica B was permanently decommissioned', 'The leader ignores all follower acknowledgments', 'The write was non-durable and held only in cache'],
          correctOptionIndex: 0,
          explanation: isAm
            ? 'የአብላጫ ኮረም መርህ 2/3 ክፍሎች ሲያጸድቁ ስርዓቱ ያለማመንታት ስራውን እንዲቀጥል ያስችላል።'
            : 'Distributed quorum systems proceed as soon as a strict majority confirms, shielding throughput from straggling nodes.',
        },
      ],
    };
  }

  if (lessonId === 'art-lesson-02') {
    // CODE & DIFF VIEWER
    const fullDiffCode = `--- a/src/concurrency/concurrent_hash_map.ts
+++ b/src/concurrency/concurrent_hash_map.ts
@@ -24,12 +24,18 @@ export class StripedConcurrentMap<K, V> {
   private readonly stripes: number;
   private readonly buckets: Map<K, V>[];
-  // Critical flaw: Unsynchronized read-modify-write causes lost updates under load
 
   constructor(stripes = 16) {
     this.stripes = stripes;
     this.buckets = Array.from({ length: stripes }, () => new Map());
   }
 
   public set(key: K, value: V): void {
     const stripeIdx = this.hash(key) % this.stripes;
-    this.buckets[stripeIdx].set(key, value);
+    const lock = this.locks[stripeIdx];
+    lock.acquireWriteLock();
+    try {
+      this.buckets[stripeIdx].set(key, value);
+    } finally {
+      lock.releaseWriteLock();
+    }
   }`;

    return {
      id: 'note-art-lesson-02',
      lessonId: 'art-lesson-02',
      courseId: 'course-artifacts-showcase',
      title: isAm ? 'የኮድ አገባብ እና የጂት ልዩነት ተመልካች' : 'Code Syntax Highlighting & Unified Git Diffs',
      mentalModel: isAm
        ? `በስክሪኑ ላይ የቀረበውን የኮድ ማነፃፀሪያ (Unified Git Diff) ይመልከቱ።
\`\`\`diff
${fullDiffCode}
\`\`\`
ይህ ማሳያ የቀይ መስመሮች (የተወገዱ ስህተቶች) እና አረንጓዴ መስመሮች (የተጨመሩ የደህንነት መቆለፊያዎች) እንዴት የውሂብ መጋጨትን እንደሚፈቱ በግልጽ ያሳያል።`
        : `Examine the unified git diff patch rendered with color-coded syntax highlights below.
\`\`\`diff
${fullDiffCode}
\`\`\`
Diff viewers allow learners to inspect the exact anatomy of concurrency bug fixes. Notice how stripped locks protect individual bucket partitions without introducing global lock contention.`,
      intuitivePurpose: isAm
        ? 'የኮድ ልዩነት ማሳያ የተስተካከሉ የደህንነት ክፍተቶችን እና የስራ መመሪያዎችን በግልጽ እንድንመለከት ያደርጋል።'
        : 'Diff highlighting isolates structural changes, allowing engineers to audit concurrency bug fixes line by line.',
      operationalMechanism: isAm
        ? 'በአንድ ባኬት ላይ መረጃ ሲጻፍ የፃፍ መቆለፊያው (Write Lock) ብቻውን ስራውን ያጠናቅቃል።'
        : 'Striped lock acquisition serializes mutations on matching hash buckets while permitting parallel writes on disjoint buckets.',
      boundaryConditions: isAm
        ? 'መቆለፊያ በ try/finally ውስጥ ካልተለቀቀ፣ ስህተት ሲፈጠር ስርዓቱ ሙሉ በሙሉ ሊቆም (Deadlock) ይችል ነበር።'
        : 'Releasing locks within a guaranteed finally block ensures locks are never leaked even if an unhandled exception occurs.',
      artifactCode: fullDiffCode,
      artifactLanguage: 'diff',
      teacherExplanations: {
        section1: isAm
          ? 'በዚህ ትምህርት ውስጥ የኮድ ማነፃፀሪያ (Diff) ተመልካችን እንመለከታለን። አረንጓዴ እና ቀይ መስመሮቹ በከፍተኛ ፍጥነት የሚሰሩ የመረጃ አያያዝ ዘዴዎች ላይ የተጨመሩ የደህንነት መቆለፊያዎችን በግልጽ ያሳያሉ።'
          : 'Notice the crisp diff highlighting on your screen. Red lines indicate vulnerable unsynchronized code, while green lines introduce resilient lock striping.',
      },
    };
  }

  if (lessonId === 'art-lesson-03') {
    // LATEX MATH
    const fullMath = `\\begin{aligned}
\\text{MultiHead}(Q, K, V) &= \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_h) W^O \\\\
\\text{where} \\quad \\text{head}_i &= \\text{Attention}(Q W_i^Q, K W_i^K, V W_i^V) \\\\
\\text{Attention}(Q', K', V') &= \\text{softmax}\\left( \\frac{Q' (K')^T}{\\sqrt{d_k}} \\right) V'
\\end{aligned}`;

    return {
      id: 'note-art-lesson-03',
      lessonId: 'art-lesson-03',
      courseId: 'course-artifacts-showcase',
      title: isAm ? 'ውስብስብ LaTeX KaTeX የሂሳብ ቀመሮች እና ማትሪክሶች' : 'High-Precision KaTeX Math & Formal Proofs',
      mentalModel: isAm
        ? `በስክሪኑ ላይ የቀረበውን የታዋቂውን የትራንስፎርመር Multi-Head Attention የሂሳብ እኩልዮሽ ይመልከቱ፡
$$
${fullMath}
$$
የKaTeX ማሳያ ማንኛውንም ውስብስብ የሂሳብ ቀመሮች፣ ማትሪክሶች እና የቴንሰር እኩልዮሾች በከፍተኛ ጥራት ያቀርባል።`
        : `Inspect the multi-line tensor contraction equations for Multi-Head Attention rendered via LaTeX KaTeX below:
$$
${fullMath}
$$
KaTeX rendering supports display equations, aligned systems of equations, matrix operations, and rigorous formal theorems directly inside the study note.`,
      intuitivePurpose: isAm
        ? 'የሂሳብ ቀመሮች ረቂቅ ንድፈ-ሀሳቦችን ወደ ትክክለኛ የቁጥር እና የማትሪክስ ማረጋገጫዎች ይቀይራሉ።'
        : 'Formal KaTeX expressions eliminate fuzzy descriptions by expressing neural attention mechanisms as deterministic matrix contractions.',
      operationalMechanism: isAm
        ? 'የመጠይቅ (Q) እና የቁልፍ (K) ማትሪክሶች ተባዝተው በስኩዌር ሩት ሲካፈሉ የግራዲየንት መጥፋትን ይከላከላሉ።'
        : 'Query and transposed key matrices are multiplied, scaled by the square root of key dimensionality to preserve variance, and passed through row-wise softmax normalization.',
      boundaryConditions: isAm
        ? 'የቬክተር ልኬቱ (dk) ሲያድግ የማካፈያው ዋጋ ውጤቱ ወደ ጽንፍ እንዳይሄድ ያረጋጋዋል።'
        : 'Without the square-root scaling factor, dot products grow exponentially in magnitude, pushing softmax functions into regions with vanishingly small gradients.',
      artifactCode: fullMath,
      artifactLanguage: 'math',
      teacherExplanations: {
        section1: isAm
          ? 'በዚህ ትምህርት ውስጥ የLaTeX KaTeX የሂሳብ ቀመር ተመልካችን እንመረምራለን። በስክሪኑ ላይ የሚታየው የትራንስፎርመር ባለብዙ ራስ አቴንሽን ቀመር ሲሆን፣ ቬክተሮች እንዴት በማትሪክስ እንደሚባዙ በውብ የሂሳብ ፊደላት ያቀርባል።'
          : 'Welcome to the formal mathematics showcase. On your screen is the multi-line Multi-Head Attention tensor equation, displaying full matrix alignment and scaling factors.',
      },
    };
  }

  if (lessonId === 'art-lesson-04') {
    // RICH TABLES
    const fullTable = `| Consensus Metric | Raft Protocol | Multi-Paxos | Byzantine Fault Tolerant (PBFT) |
| :--- | :--- | :--- | :--- |
| **Leader Model** | Single Strong Leader | Stable Proposer Lease | Primary with 3-phase commit |
| **Fault Tolerance Threshold** | $f < \\frac{N}{2}$ (Crash faults) | $f < \\frac{N}{2}$ (Crash faults) | $f < \\frac{N}{3}$ (Malicious / Byzantine) |
| **Normal Path Latency** | 1 RTT (AppendEntries) | 1 RTT (Phase 2 Accept) | 2 RTT (Pre-prepare, Prepare, Commit) |
| **Message Complexity** | $O(N)$ per log entry | $O(N)$ per log entry | $O(N^2)$ cross-node gossip |
| **Log Discrepancy Resolution** | Leader forces overwrites | Proposer executes fixup rounds | Cryptographic threshold signature validation |`;

    return {
      id: 'note-art-lesson-04',
      lessonId: 'art-lesson-04',
      courseId: 'course-artifacts-showcase',
      title: isAm ? 'የንጽጽር ሰንጠረዦች እና ባለብዙ አምድ ማትሪክስ' : 'Dense Comparison Tables & Engineering Matrices',
      mentalModel: isAm
        ? `የተለያዩ የስምምነት ስልተ-ቀመሮችን ንጽጽር የሚያሳየውን ዝርዝር ሰንጠረዥ ይመልከቱ፡
${fullTable}
ሰንጠረዦች የምህንድስና ሚዛኖችን እና የስርዓት ባህሪያትን በአንድ እይታ በግልጽ ያቀርባሉ።`
        : `Review the comparative distributed consensus matrix below:
${fullTable}
High-density markdown tables structure multi-dimensional engineering trade-offs, message complexity metrics, and recovery models into clear comparative columns.`,
      intuitivePurpose: isAm
        ? 'ሰንጠረዦች የተለያዩ ቴክኖሎጂዎችን ጥንካሬ እና ድክመት ጎን ለጎን ለማነፃፀር እጅግ ተመራጭ ናቸው።'
        : 'Comparative tables enable rapid comparative evaluation between crash-fault tolerant models and cryptographic Byzantine models.',
      operationalMechanism: isAm
        ? 'ራፍት እና መልቲ-ፓክሶስ የፍጥነት መጠናቸውን ወደ 1 RTT ሲያወርዱ፣ ፒቢኤፍቲ ደግሞ የክህደት አደጋዎችን ለመከላከል 2 RTT ይወስዳል።'
        : 'Crash fault models achieve O(N) message complexity by trusting honest nodes, while PBFT incurs O(N^2) cross-replica validation to guard against adversarial lies.',
      boundaryConditions: isAm
        ? 'የአደጋ መቋቋም አቅሙ ከ1/3 በላይ በሚሆንበት ጊዜ ፒቢኤፍቲ ደህንነቱን ለመጠበቅ ሲል ስራውን ያቆማል።'
        : 'If more than 1/3 of the cluster nodes act maliciously, Byzantine fault tolerance guarantees collapse.',
      artifactCode: fullTable,
      artifactLanguage: 'table',
      teacherExplanations: {
        section1: isAm
          ? 'በዚህ ትምህርት ውስጥ የንጽጽር ሰንጠረዦች ተመልካችን እንመረምራለን። ሰንጠረዡ የራፍት፣ መልቲ-ፓክሶስ እና ፒቢኤፍቲ ስልተ-ቀመሮችን የፍጥነት እና የደህንነት ልዩነቶች ጎን ለጎን ያነፃፅራል።'
          : 'Inspect the dense comparison matrix on your screen. Notice how comparative tables contrast message complexity, network round trips, and failure thresholds across protocols.',
      },
    };
  }

  if (lessonId === 'art-lesson-05') {
    // TIMELINE
    const timelineData = `\`\`\`timeline
1. Phase 1: Initiation & Prepare Broadcast - The distributed coordinator assigns a globally unique 128-bit transaction ID (TxID: 0x4a9e) and issues PREPARE RPCs to all participant databases.
2. Phase 2: Local Locking & Invariant Check - Each participant acquires row-level locks, writes intentions to persistent Undo/Redo logs, and transmits unanimous VOTE_COMMIT confirmations.
3. Phase 3: Durable Decision Point - The coordinator guarantees atomic irreversibility by writing a COMMIT log entry to non-volatile disk before contacting participants.
4. Phase 4: Parallel Commit Distribution - The coordinator broadcasts GLOBAL_COMMIT messages concurrently to all participants, triggering local database mutations.
5. Phase 5: Acknowledgment & Resource Release - Each participant applies changes, releases acquired mutexes, and returns ACK to complete the distributed transaction.
\`\`\``;

    return {
      id: 'note-art-lesson-05',
      lessonId: 'art-lesson-05',
      courseId: 'course-artifacts-showcase',
      title: isAm ? 'የጊዜ ሰሌዳ እና ቅደም ተከተል ተመልካች' : 'Chronological Timelines & Event Sequences',
      mentalModel: isAm
        ? `የ2-ደረጃ ስምምነት አሰራርን ደረጃ በደረጃ የሚያሳየውን የጊዜ ሰሌዳ ይመልከቱ፡
${timelineData}
ይህ ማሳያ ውስብስብ የሆኑ የአሰራር ዑደቶችን በቅደም ተከተል በቁጥር በመደርደር የስራውን ፍሰት ግልጽ ያደርጋል።`
        : `Trace the 5-stage distributed transaction timeline below:
${timelineData}
Timeline viewers organize sequential executions, state transitions, and milestone phases with clear chronological step counters.`,
      intuitivePurpose: isAm
        ? 'የጊዜ ሰሌዳ ማሳያ በስርዓቱ ውስጥ ምን ከምን እንደሚቀድም እና ወሳኝ የውሳኔ ነጥቦች የት እንደሚገኙ ያሳያል።'
        : 'Timelines clarify causal execution order and recovery checkpoints across asynchronous distributed workflows.',
      operationalMechanism: isAm
        ? 'አስተባባሪው ክፍል ከሁሉም ተሳታፊዎች ሙሉ ድምፅ ሲያገኝ ብቻ የመጨረሻውን ማጽደቂያ ይሰጣል።'
        : 'Transactions only progress to global commit when unanimous vote confirmations are logged durably in Phase 3.',
      boundaryConditions: isAm
        ? 'አንድ ተሳታፊ እንኳ ድምፅ ካልሰጠ አስተባባሪው ሙሉውን ሂደት ይሰርዘዋል።'
        : 'If any single node votes NO or times out, the transaction coordinator aborts the entire transaction across all nodes.',
      artifactCode: timelineData,
      artifactLanguage: 'timeline',
      teacherExplanations: {
        section1: isAm
          ? 'በዚህ ትምህርት ውስጥ የጊዜ ሰሌዳ ተመልካችን እንመረምራለን። የ2-ደረጃ ስምምነት አሰራርን ከመጀመሪያው የዝግጅት ጥያቄ እስከ መጨረሻው የሀብት መልቀቂያ ድረስ በቅደም ተከተል ያሳያል።'
          : 'Follow the chronological process timeline on your screen. Timelines break multi-stage algorithms into distinct milestone phases.',
      },
    };
  }

  if (lessonId === 'art-lesson-06') {
    // 3D INTERACTIVE RUBIK'S CUBE CANVAS
    const interactiveCode = `\`\`\`interactive
preset: rubiks-cube
\`\`\``;

    return {
      id: 'note-art-lesson-06',
      lessonId: 'art-lesson-06',
      courseId: 'course-artifacts-showcase',
      title: isAm ? 'በይነተገናኝ ባለ 3D የሩቢክስ ኪዩብ ሳንድቦክስ' : '3D Interactive Rubik\'s Cube Visual Sandbox',
      mentalModel: isAm
        ? `የሩቢክስ ኪዩብ 26 ውጫዊ ትናንሽ ክፍሎችን (Cubies) የያዘ ባለ 3D የቦታ አስተሳሰብ እና የፐርሙቴሽን ቡድን ንድፈ-ሀሳብ (Group Theory) ማሳያ ነው።

**የእርስዎ ተግባር**፡ ከታች የቀረበውን ባለ 3D ኪዩብ ማውስዎን ወይም ጣትዎን በስክሪኑ ላይ በማንቀሳቀስ በ360 ዲግሪ ያሽከርክሩት። እያንዳንዱን ገጽታ (ነጭ፣ ቢጫ፣ አረንጓዴ፣ ሰማያዊ፣ ቀይ እና ብርቱካን) ይመርምሩ።

${interactiveCode}`
        : `A standard 3x3x3 Rubik's Cube comprises 26 external cubies (8 corners, 12 edges, 6 centers) governed by permutation group theory. The core centers stay spatially fixed while the corners and edges move through space.

**Interactive Exercise**: Click and drag inside the 3D viewport below to orbit the camera 360 degrees around the cube. Inspect the 6 colored faces (White top, Yellow bottom, Green front, Blue rear, Red right, Orange left).

${interactiveCode}`,
      intuitivePurpose: isAm
        ? `እያንዳንዱ የሩቢክስ ኪዩብ ንብርብር በዓለም አቀፍ የሲንግማስተር (Singmaster) የፊደል ቅደም ተከተል ይመራል፡
1. **U (Up)**፡ የላይኛውን ነጭ ንብርብር በሰዓት አቅጣጫ ያዞራል።
2. **D (Down)**፡ የታችኛውን ቢጫ ንብርብር ያዞራል።
3. **F (Front)**፡ የፊት ለፊቱን አረንጓዴ ገጽታ ያዞራል።
4. **B (Back)**፡ የጀርባውን ሰማያዊ ገጽታ ያዞራል።
5. **R (Right)**፡ የቀኙን ቀይ ገጽታ ያዞራል።
6. **L (Left)**፡ የግራውን ብርቱካን ገጽታ ያዞራል።
የፕራይም ምልክት (**'**) ያላቸው ቁልፎች (U', D', F', B', R', L') ንብርብሩን በተቃራኒ አቅጣጫ ያዞራሉ።

**የእርስዎ ተግባር**፡ ከታች ያለውን የ **R (Right)** ቁልፍ አንድ ጊዜ፣ ከዚያም የ **U (Top)** ቁልፍን አንድ ጊዜ ይጫኑ። የቀለሞቹን ለውጥ ከተመለከቱ በኋላ **Random Scramble** የሚለውን በመጫን ኪዩቡ በ15 እርምጃዎች ሲደባለቅ ይመልከቱ።

${interactiveCode}`
        : `Layer mechanics follow official Singmaster notation. Each button targets one of the six 3x3 planar slices:
1. **U (Up)**: Rotates the top white face 90 degrees clockwise.
2. **D (Down)**: Rotates the bottom yellow face clockwise.
3. **F (Front)**: Rotates the front green face clockwise.
4. **B (Back)**: Rotates the rear blue face clockwise.
5. **R (Right)**: Rotates the right red face clockwise.
6. **L (Left)**: Rotates the left orange face clockwise.
The Prime buttons (**'**) execute the exact inverse 90-degree counter-clockwise rotation.

**Interactive Exercise**: Press **R (Right)** once, then press **U (Top)** once. Observe which stickers change positions. Then click **Random Scramble (15 Moves)** to watch algorithmic perturbation in action.

${interactiveCode}`,
      operationalMechanism: isAm
        ? `እያንዳንዱ የ90 ዲግሪ የንብርብር ሽክርክር በ8 ውጫዊ ክፍሎች ላይ የሂሳብ ፐርሙቴሽን ማትሪክስ ይተገብራል። ማዕከላዊዎቹ 6 ክፍሎች ግን ምንጊዜም ቋሚ ሆነው የገጾቹን ትክክለኛ ቀለሞች ይወስናሉ።

**የእርስዎ ተግባር**፡ ከታች የቀረበውን የተደባለቀ ኪዩብ የንብርብር ቁልፎችን በመጫን ይሞክሩ። ከዚያም **Solve & Reset** የሚለውን በመጫን ኪዩቡ ወዲያውኑ ወደ ተፈታው የመጀመሪያ ሁኔታ ሲመለስ ይመልከቱ።

${interactiveCode}`
        : `Every 90-degree turn operates as a discrete cycle permutation across 8 cubies (4 corners, 4 edges). A single face turn consists of two disjoint 4-cycles: one permutation among the 4 corners, and one independent permutation among the 4 edges.

**Interactive Exercise**: Try executing **R**, **U**, **R'**, **U'** (the famous Sexy Move algorithm). Notice how repeating this 6 times restores the cube to its solved state. Click **Solve & Reset** at any time to return to baseline.

${interactiveCode}`,
      boundaryConditions: isAm
        ? `የሩቢክስ ኪዩብ ሊደርስባቸው የሚችሉ 43 ኩዊንቲሊየን (43 x 10^18) የተለያዩ ሁኔታዎች አሉ። ነገር ግን በኬይሊ ግራፍ (Cayley Graph) የሂሳብ ማረጋገጫ መሰረት፣ ማንኛውም ህጋዊ የሩቢክስ ኪዩብ ሁኔታ ቢፈጠር በከፍተኛው በ20 እርምጃዎች (God's Number) ብቻ ሊፈታ ይችላል።

**የእርስዎ ተግባር**፡ ኪዩቡን አደባልቀው የተለያዩ አቅጣጫዎችን በ3D በማየት የድንበር ሁኔታዎችን ይመርምሩ።

${interactiveCode}`
        : `The Rubik's cube permutation group order is exactly 43,252,003,274,489,856,000 states. Any single physical disassembly (like swapping two edge stickers) creates an impossible parity state that can never be solved. In contrast, every mathematically reachable state can be solved in 20 moves or fewer (God's Number).

**Interactive Exercise**: Experiment with complex scrambles, test corner twists mentally, and use **Solve & Reset** to verify group boundary invariants.

${interactiveCode}`,
      artifactCode: interactiveCode,
      artifactLanguage: 'interactive',
      teacherExplanations: {
        section1: isAm
          ? 'እንኳን ወደ ባለ 3D በይነተገናኝ የሩቢክስ ኪዩብ ትምህርት በደህና መጡ። በማስታወሻው ስር ያለውን ኪዩብ ማውስዎን በመጎተት በ360 ዲግሪ ያሽከርክሩት እና 6ቱን ገጾች ይመልከቱ።'
          : 'Welcome to the 3D interactive Rubik\'s Cube lesson. Notice how the interactive canvas sits directly beneath your lesson note. Start by clicking and dragging across the viewport to orbit the cube in 3D space.',
        section2: isAm
          ? 'አሁን የንብርብር ማዞሪያ ቁልፎችን እንሞክር። R እና U ቁልፎችን ይጫኑ፤ ከዚያም ኪዩቡን ለማደባለቅ Random Scramble የሚለውን ይጫኑ።'
          : 'Now let\'s test the layer rotation buttons. Try clicking R then U to rotate the right and top layers. Then click Random Scramble to see automated 15-move perturbation in action.',
        section3: isAm
          ? 'በክፍል 3 የፐርሙቴሽን ዑደቶችን እንመለከታለን። R፣ U፣ R ፕራይም እና U ፕራይም ቅደም ተከተልን ይሞክሩ። ለመመለስ Solve and Reset ን ይጫኑ።'
          : 'In this section, we study permutation cycles. Try executing R, U, R\', U\' in sequence. When you\'re ready, click Solve and Reset to restore the cube.',
        section4: isAm
          ? 'በመጨረሻም የ43 ኩዊንቲሊየን ሁኔታዎችን እና የ20 እርምጃዎችን የጋድስ ነበር (God\'s Number) ገደብ እንመረምራለን።'
          : 'Notice the boundary limits: with over 43 quintillion reachable permutations, any configuration can still be solved in 20 moves or fewer.',
        section5: isAm
          ? 'በጣም ጥሩ! አሁን የሩቢክስ ኪዩብን ባለ 3D አሰራር እና የንብርብር ህጎችን በሚገባ ተረድተዋል።'
          : 'Outstanding work. You have mastered the 3D spatial mechanics, layer move notation, and group theory invariants of the Rubik\'s cube.',
      },
    };
  }

  if (lessonId === 'art-lesson-07') {
    // CALLOUTS & ACCORDIONS
    const calloutMarkdown = `> [!WARNING]
> **Zero-Split-Brain Invariant**: Never permit two disjoint network partitions to accept mutating writes concurrently. State convergence after uncoordinated writes is mathematically impossible without data loss.

> [!IMPORTANT]
> **Leader Lease Safety**: A leader must verify its lease through monotonic clock ticks before returning linearizable local reads without running full round-trip consensus.

> [!TIP]
> Always configure cluster sizes with an odd cardinality (3, 5, or 7 nodes) to eliminate split votes and minimize quorum overhead.

<details>
<summary>View Formal Pigeonhole Quorum Proof</summary>
Let cluster size be $N$. Any valid majority quorum $Q$ satisfies:
$$ |Q| \\ge \\left\\lfloor \\frac{N}{2} \\right\\rfloor + 1 $$
For any two quorums $Q_1$ and $Q_2$:
$$ |Q_1 \\cap Q_2| = |Q_1| + |Q_2| - |Q_1 \\cup Q_2| $$
Since $|Q_1 \\cup Q_2| \\le N$ and $|Q_1| + |Q_2| \\ge 2\\left(\\left\\lfloor \\frac{N}{2} \\right\\rfloor + 1\\right) \\ge N + 1$:
$$ |Q_1 \\cap Q_2| \\ge N + 1 - N = 1 $$
Therefore, $Q_1 \\cap Q_2 \\neq \\emptyset$, proving every consecutive quorum overlaps by at least one witness node.
</details>`;

    return {
      id: 'note-art-lesson-07',
      lessonId: 'art-lesson-07',
      courseId: 'course-artifacts-showcase',
      title: isAm ? 'የማስጠንቀቂያ፣ ጥልቅ ማብራሪያ እና የውጤት ካርዶች' : 'Pedagogy Callouts & Collapsible Proof Accordions',
      mentalModel: isAm
        ? `በስክሪኑ ላይ የቀረቡትን የማስጠንቀቂያ እና የተዘርጊ ካርዶች ማሳያ ይመልከቱ፡
${calloutMarkdown}
ማስጠንቀቂያዎች ቁልፍ አደጋዎችን የሚያጎሉ ሲሆን፣ ተዘርጊው ካርድ ደግሞ የሂሳብ ማረጋገጫውን ሳይደባለቅ በውስጡ ይይዛል።`
        : `Review the styled alert callouts and expandable deep-dive proof below:
${calloutMarkdown}
Callouts highlight critical safety warnings, while collapsible accordions keep advanced mathematical proofs organized without cluttering the main reading flow.`,
      intuitivePurpose: isAm
        ? 'የተዘረጉ ካርዶች ተማሪው በራሱ ፍላጎት ተጨማሪ ጥልቅ መረጃዎችን እንዲከፍት ያስችሉታል።'
        : 'Callouts emphasize high-risk failure modes, while accordions support progressive disclosure of mathematical proofs.',
      operationalMechanism: isAm
        ? 'የአብላጫ ቡድኖች የጋራ አባል መኖር በጊዜ ሂደት የቀደሙ መረጃዎች እንዳይጠፉ ያደርጋል።'
        : 'Quorum intersection guarantees that any new leader overlaps with at least one node containing the most up-to-date log.',
      boundaryConditions: isAm
        ? 'ከአናሳ በላይ የሆኑ ሰርቨሮች ከተበላሹ ስርዓቱ ደህንነቱን ለመጠበቅ ሲል ስራውን ያቆማል።'
        : 'If partition isolation exceeds fault tolerance thresholds, writes halt to avoid state corruption.',
      artifactCode: calloutMarkdown,
      artifactLanguage: 'markdown',
      teacherExplanations: {
        section1: isAm
          ? 'በዚህ ትምህርት ውስጥ የማስጠንቀቂያ ሳጥኖች እና ተዘርግተው የሚከፈቱ ካርዶችን እንመረምራለን።'
          : 'Notice the warning callouts and expandable deep-dive card on your screen. Callouts draw visual attention to dangerous failure modes.',
      },
    };
  }

  // ==========================================================================
  // COURSE 2: QUESTIONS & ASSESSMENTS SHOWCASE LESSON NOTES
  // ==========================================================================

  if (lessonId === 'quest-lesson-01') {
    // INLINE MCQs
    const mcqIntuition = isAm
      ? 'በትምህርት ወቅት ንቁ የማስታወስ (Active Recall) ሂደት በየክፍሉ መካተቱ የተማሪውን እውነተኛ ግንዛቤ በቅጽበት ያረጋግጣል።'
      : 'Interspersing inline multiple-choice questions throughout the study text defeats the illusion of competence by forcing immediate active retrieval.';

    return {
      id: 'note-quest-lesson-01',
      lessonId: 'quest-lesson-01',
      courseId: 'course-questions-showcase',
      title: isAm ? 'ባለብዙ ምርጫ ፈጣን ጥያቄዎች (Multiple Choice)' : 'Multiple Choice Practice',
      mentalModel: mcqIntuition,
      intuitivePurpose: isAm
        ? 'ተማሪዎች ጽሑፉን አንብበው ሲጨርሱ በቅጽበት እራሳቸውን እንዲፈትሹ ማድረግ ነው።'
        : 'Quick check questions help you test your memory right after reading, so you know if you understood the main point.',
      operationalMechanism: isAm
        ? 'አንዱን አማራጭ ሲመርጡ ትክክለኛው በአረንጓዴ፣ የተሳሳተው ደግሞ በቀይ መስመር ይታያል።'
        : 'Click an answer choice. The borders show if you were right (green) or wrong (red), with a short explanation.',
      boundaryConditions: isAm
        ? 'አንድ ጊዜ መልስ ከመረጡ በኋላ ምርጫው ይቆለፋል።'
        : 'Once you pick an answer, choices lock so you can focus on the explanation.',
      artifactCode: `graph LR
  Read[Read Text] --> Question[Click an Option]
  Question --> Check{Correct?}
  Check -->|Yes| GreenBorder[Green Border + Short Explanation]
  Check -->|No| RedBorder[Red Border + Correct Answer]`,
      artifactLanguage: 'mermaid',
      teacherExplanations: {
        section1: isAm
          ? 'በዚህ ትምህርት ውስጥ ባለብዙ ምርጫ ጥያቄዎችን እንመለከታለን። ከታች ያለውን ጥያቄ ጠቅ በማድረግ ይሞክሩት!'
          : 'Welcome to Multiple Choice practice. Click an answer below to test what you learned.',
      },
      inlineMCQs: [
        {
          id: 'mcq-quest-01-s1',
          sectionIndex: 1,
          question: isAm ? 'ጥያቄዎችን በንባብ መሃል መመለስ ለምን ይጠቅማል?' : 'Why is answering quick questions while reading more helpful than just re-reading?',
          options: isAm
            ? ['አእምሮ መረጃውን እንዲያስታውስ ስለሚያስገድድ', 'ገጹን ረዘም ያለ ለማድረግ', 'የንባብ ፍጥነትን ለመቀነስ', 'ኮምፒውተሩ እረፍት እንዲያገኝ']
            : ['It forces your brain to recall what you just read', 'It makes the webpage longer', 'It slows down your reading', 'It gives the computer a break'],
          correctOptionIndex: 0,
          explanation: isAm
            ? 'መረጃውን ከአእምሮ ማውጣት እውቀቱ እንዳይረሳ ያደርጋል።'
            : 'Testing yourself forces your brain to retrieve knowledge, which makes memory stronger.',
        },
        {
          id: 'mcq-quest-01-s3',
          sectionIndex: 3,
          question: isAm ? 'መልስ ከመረጡ በኋላ ካርዱ ለምን ይቆለፋል?' : 'Why do answer choices lock after you click?',
          options: isAm
            ? ['እውነተኛ እውቀትዎን ለመፈተሽ እና በግምት እንዳይሞክሩ', 'ኮምፒውተሩ ስለሚዘገይ', 'ገጹን እንደገና ለማስጀመር', 'ኢንተርኔት እንዳይቋረጥ']
            : ['To test what you actually know instead of random guessing', 'Because the computer froze', 'To force a page reload', 'To save internet data'],
          correctOptionIndex: 0,
          explanation: isAm
            ? 'አማራጮች መዘጋታቸው በጥንቃቄ እንዲያስቡ እና ማብራሪያውን እንዲያነቡ ያደርጋል።'
            : 'Locking the choice stops random clicking and helps you read the explanation.',
        },
      ],
    };
  }

  if (lessonId === 'quest-lesson-02') {
    // LESSON 2: TRUE / FALSE
    return {
      id: 'note-quest-lesson-02',
      lessonId: 'quest-lesson-02',
      courseId: 'course-questions-showcase',
      title: isAm ? 'የእውነት ወይም ሐሰት ጥያቄዎች (True / False)' : 'True / False Practice',
      mentalModel: isAm
        ? 'የእውነት ወይም ሐሰት ጥያቄዎች መሰረታዊ ህጎችን በፍጥነት ለመፈተሽ ያገለግላሉ።'
        : 'True / False questions let you quickly test whether a statement is true or false.',
      intuitivePurpose: isAm
        ? 'የተሳሳቱ አመለካከቶችን በፍጥነት ለመለየት ይረዳል።'
        : 'Helps you catch common misconceptions and verify basic rules quickly.',
      operationalMechanism: isAm
        ? 'እውነት ወይም ሐሰት ሲመርጡ ትክክለኛው በአረንጓዴ፣ የተሳሳተው በቀይ መስመር ይታያል።'
        : 'Pick True or False. The card turns green if you are right or red if you are wrong, showing a simple reason.',
      boundaryConditions: isAm
        ? 'መልስ ከመረጡ በኋላ ካርዱ ይቆለፋል።'
        : 'Once you choose, the cards lock so you can see why the answer is true or false.',
      artifactCode: `graph LR
  Statement[Read Statement] --> Pick[Pick True or False]
  Pick --> Result{Right or Wrong?}
  Result -->|Right| Green[Green Border + Reason]
  Result -->|Wrong| Red[Red Border + Correct Fact]`,
      artifactLanguage: 'mermaid',
      teacherExplanations: {
        section1: isAm
          ? 'በዚህ ትምህርት ውስጥ የእውነት ወይም ሐሰት ጥያቄዎችን እንመለከታለን። ከታች ያለውን ይሞክሩት!'
          : 'Welcome to True / False practice. Choose True or False on the question below to test yourself.',
      },
      inlineMCQs: [
        {
          id: 'tf-quest-02-s1',
          sectionIndex: 1,
          type: 'true_false',
          question: isAm
            ? 'በኮምፒውተር ክላስተር ውስጥ ማንኛውም ሁለት አብላጫ ቡድኖች (Majorities) ቢያንስ በአንድ የጋራ ኮምፒውተር ይደራረባሉ?'
            : 'In any cluster of computers, do any two majorities always share at least one computer in common?',
          correctBoolean: true,
          explanation: isAm
            ? 'እውነት ነው። ከግማሽ በላይ የሆኑ ሁለት ቡድኖች የግድ ቢያንስ አንድ የጋራ አባል ይኖራቸዋል።'
            : 'True. Any two groups with more than half of the computers must overlap by at least one computer.',
        },
        {
          id: 'tf-quest-02-s3',
          sectionIndex: 3,
          type: 'true_false',
          question: isAm
            ? 'በራፍት (Raft) ውስጥ ተከታዮች ያለ መሪው ፈቃድ አዲስ መረጃ ለብቻቸው ማጽደቅ ይችላሉ?'
            : 'In Raft, can follower computers save and approve new data without the leader?',
          correctBoolean: false,
          explanation: isAm
            ? 'ሐሰት ነው። መሪው ብቻ ነው አዳዲስ መረጃዎችን ተቀብሎ ለሁሉም የሚያጸድቀው።'
            : 'False. Only the leader is allowed to approve and save new data.',
        },
      ],
    };
  }

  if (lessonId === 'quest-lesson-03') {
    // LESSON 3: FILL IN THE BLANK
    return {
      id: 'note-quest-lesson-03',
      lessonId: 'quest-lesson-03',
      courseId: 'course-questions-showcase',
      title: isAm ? 'ክፍት ቦታ ሙላ ጥያቄዎች (Fill in the Blank)' : 'Fill in the Blank Practice',
      mentalModel: isAm
        ? 'ክፍት ቦታ ሙላ ጥያቄዎች ቁልፍ ቃላትን በራስዎ ትውስታ እንዲተይቡ በማድረግ ትክክለኛውን ቃል ያረጋግጣሉ።'
        : 'Fill in the Blank questions test if you can remember the exact word without looking at multiple-choice options.',
      intuitivePurpose: isAm
        ? 'አማራጮችን ሳይመለከቱ ቃሉን ከአእምሮ ማውጣትን ያበረታታል።'
        : 'Helps you recall words directly from memory rather than just recognizing choices.',
      operationalMechanism: isAm
        ? 'ቃሉን ጽፈው አረጋግጥ ሲሉ፣ ትክክል ከሆነ በአረንጓዴ፣ የተሳሳተ ከሆነ በቀይ ይታያል።'
        : 'Type the missing word and click Check. The border turns green if correct or red if wrong.',
      boundaryConditions: isAm
        ? 'የፊደላት ትልቅ እና ትንሽ መሆን ችግር የለውም።'
        : 'Capital and small letters both work.',
      artifactCode: `graph LR
  Sentence[Read Sentence with Blank] --> Type[Type Missing Word]
  Type --> Check[Click Check]
  Check --> Done[Green or Red Border Feedback]`,
      artifactLanguage: 'mermaid',
      teacherExplanations: {
        section1: isAm
          ? 'በዚህ ትምህርት ውስጥ ክፍት ቦታ ሙላ ጥያቄዎችን እንመለከታለን። ቃሉን ጽፈው አረጋግጥ የሚለውን ይጫኑ!'
          : 'Welcome to Fill in the Blank practice. Type the missing word into the box and click Check.',
      },
      inlineMCQs: [
        {
          id: 'fib-quest-03-s1',
          sectionIndex: 1,
          type: 'fill_blank',
          question: isAm ? 'ዓረፍተ-ነገሩን በትክክለኛው ቃል ያሟሉ፡' : 'Fill in the missing word:',
          sentencePrefix: isAm ? 'ውሳኔ ለማጽደቅ የሚያስፈልገው ከግማሽ በላይ የሆነ አብላጫ ድምፅ ' : 'The strict majority of servers needed to approve a decision is called a ',
          sentenceSuffix: isAm ? ' ይባላል።' : '.',
          acceptedAnswers: isAm ? ['ኮረም', 'quorum', 'majority'] : ['quorum', 'majority'],
          explanation: isAm
            ? 'አብላጫ ድምፅ (Quorum) የተሰራጩ ስርዓቶች ተቃራኒ ውሳኔዎች እንዳይወስኑ ያደርጋል።'
            : 'A quorum means more than half the group, which prevents conflicting decisions.',
        },
        {
          id: 'fib-quest-03-s3',
          sectionIndex: 3,
          type: 'fill_blank',
          question: isAm ? 'የምርጫ ዙር ቃል ያሟሉ፡' : 'Fill in the missing word:',
          sentencePrefix: isAm ? 'በራፍት ውስጥ እያንዳንዱ የምርጫ ዙር ' : 'In Raft, each numbered election period is called a ',
          sentenceSuffix: isAm ? ' ይባላል።' : '.',
          acceptedAnswers: isAm ? ['term', 'ተርም'] : ['term', 'terms'],
          explanation: isAm
            ? 'ተርም (Term) ጊዜው ያለፈባቸውን መሪዎች ለመለየት ይረዳል።'
            : 'A term is a round of leadership that helps nodes tell old leaders from new ones.',
        },
      ],
    };
  }

  if (lessonId === 'quest-lesson-04') {
    // LESSON 4: RELATIONAL MATCHING
    const matchingPairsSection1 = isAm
      ? [
          { id: 'pair-1', left: 'መሪ (Leader)', right: 'ትዕዛዞችን ተቀብሎ ለሁሉም ማዳረስ' },
          { id: 'pair-2', left: 'ተከታይ (Follower)', right: 'ትዕዛዞችን ተቀብሎ መመዝገብ' },
          { id: 'pair-3', left: 'እጩ (Candidate)', right: 'በምርጫ ወቅት ድምፅ መጠየቅ' },
        ]
      : [
          { id: 'pair-1', left: 'Leader', right: 'Receives and sends writes to everyone' },
          { id: 'pair-2', left: 'Follower', right: 'Passively saves what the leader sends' },
          { id: 'pair-3', left: 'Candidate', right: 'Asks others for votes during an election' },
        ];

    const matchingPairsSection3 = isAm
      ? [
          { id: 'pair-m1', left: 'AppendEntries', right: 'መረጃዎችን ለመላክ እና የልብ ምት' },
          { id: 'pair-m2', left: 'RequestVote', right: 'በምርጫ ወቅት ድምፅ ለመጠየቅ' },
          { id: 'pair-m3', left: 'CommitIndex', right: 'በአብላጫ የጸደቀው የመጨረሻ መረጃ' },
        ]
      : [
          { id: 'pair-m1', left: 'AppendEntries', right: 'Sends data updates and heartbeats' },
          { id: 'pair-m2', left: 'RequestVote', right: 'Asks for votes during elections' },
          { id: 'pair-m3', left: 'CommitIndex', right: 'Highest entry approved by a majority' },
        ];

    return {
      id: 'note-quest-lesson-04',
      lessonId: 'quest-lesson-04',
      courseId: 'course-questions-showcase',
      title: isAm ? 'ተዛማጅ ማገናኘት ጥያቄዎች (Matching)' : 'Matching Practice',
      mentalModel: isAm
        ? 'ተዛማጅ ማገናኘት ጥያቄዎች በግራ እና በቀኝ ያሉ ነገሮችን በማጣመር ግንኙነታቸውን ይፈትሻሉ።'
        : 'Matching questions let you connect items on the left with their pairs on the right.',
      intuitivePurpose: isAm
        ? 'እያንዳንዱ አካል የሚያከናውነውን ተግባር በትክክል ለማዛመድ ነው።'
        : 'Helps you connect terms to what they actually do.',
      operationalMechanism: isAm
        ? 'ከግራ አንዱን ይምረጡ፣ ከዚያ ከቀኝ የሚስማማውን ይጫኑ፤ በመጨረሻም አረጋግጥ የሚለውን ይጫኑ።'
        : 'Click an item on the left, click its match on the right, and click Check.',
      boundaryConditions: isAm
        ? 'ሁሉንም ካገናኙ በኋላ መልሱን ያረጋግጣል።'
        : 'You can pair all items and click Check to see green or red borders.',
      artifactCode: `graph LR
  LeftItem[Click Left Item] --> RightItem[Click Matching Right Item]
  RightItem --> Verify[Click Check to Verify]`,
      artifactLanguage: 'mermaid',
      teacherExplanations: {
        section1: isAm
          ? 'በዚህ ትምህርት ውስጥ ተዛማጅ ማገናኘትን እንመለከታለን። ከግራ አንዱን መርጠው ከቀኝ ጋር ያጣምሩ!'
          : 'Welcome to Matching practice. Click a term on the left, then click its match on the right.',
      },
      inlineMCQs: [
        {
          id: 'mat-quest-04-s1',
          sectionIndex: 1,
          type: 'matching',
          question: isAm ? 'እያንዳንዱን ሚና ከተግባሩ ጋር ያዛምዱ፡' : 'Match each role with what it does:',
          matchingPairs: matchingPairsSection1,
          explanation: isAm
            ? 'መሪው ያደራጃል፤ ተከታዩ ይመዘግባል፤ እጩው ደግሞ በምርጫ ወቅት ድምፅ ይጠይቃል።'
            : 'The leader handles writes, followers save data, and candidates run in elections.',
        },
        {
          id: 'mat-quest-04-s3',
          sectionIndex: 3,
          type: 'matching',
          question: isAm ? 'መልዕክቶችን ከተግባራቸው ጋር ያዛምዱ፡' : 'Match each message with its job:',
          matchingPairs: matchingPairsSection3,
          explanation: isAm
            ? 'AppendEntries መረጃ ይልካል፤ RequestVote ድምፅ ይጠይቃል፤ CommitIndex ደግሞ የጸደቀውን ወሰን ያሳያል።'
            : 'AppendEntries sends updates, RequestVote asks for votes, and CommitIndex marks saved data.',
        },
      ],
    };
  }

  if (lessonId === 'quest-lesson-05') {
    // LESSON 5: SHORT ANSWER
    return {
      id: 'note-quest-lesson-05',
      lessonId: 'quest-lesson-05',
      courseId: 'course-questions-showcase',
      title: isAm ? 'የአጭር መልስ ጥያቄዎች (Short Answer)' : 'Short Answer Practice',
      mentalModel: isAm
        ? 'የአጭር መልስ ጥያቄዎች በራስዎ አባባል በአጭሩ ዋናውን ምክንያት እንዲያብራሩ ያደርጋሉ።'
        : 'Short Answer questions let you explain the main idea in your own words.',
      intuitivePurpose: isAm
        ? 'አማራጮችን ሳይመለከቱ በራስዎ ቋንቋ ማብራራት መቻልዎን ለመፈተሽ ነው።'
        : 'Tests if you can explain the reason simply without relying on choices.',
      operationalMechanism: isAm
        ? 'መልስዎን ጽፈው አቅርብ ሲሉ ስርዓቱ ይመረምራል፤ ምሳሌ መልስም ያሳያል።'
        : 'Type your explanation and submit. A model answer appears so you can compare.',
      boundaryConditions: isAm
        ? 'መልሱ አጭር (1 ወይም 2 ዓረፍተ-ነገር) መሆን አለበት።'
        : 'Keep your answer short and focused (1-2 sentences).',
      artifactCode: `graph LR
  ReadPrompt[Read Question] --> TypeAnswer[Type 1-2 Sentences]
  TypeAnswer --> Submit[Submit]
  Submit --> Compare[Compare with Example Answer]`,
      artifactLanguage: 'mermaid',
      teacherExplanations: {
        section1: isAm
          ? 'በዚህ ትምህርት ውስጥ የአጭር መልስ ጥያቄዎችን እንመለከታለን። በ1 ዓረፍተ-ነገር በራስዎ አባባል ያብራሩ!'
          : 'Welcome to Short Answer practice. Type a short explanation in your own words and submit.',
      },
      inlineMCQs: [
        {
          id: 'sa-quest-05-s1',
          sectionIndex: 1,
          type: 'short_answer',
          question: isAm
            ? 'ስርዓቶች ለውጥ ከማጽደቃቸው በፊት ለምን አብላጫ (Majority) ድምፅ ማረጋገጥ አለባቸው?'
            : 'Why must computers agree on a majority before saving new data?',
          targetKeywords: isAm
            ? ['መደራረብ', 'ስህተት', 'መከላከል', 'ሁለት']
            : ['majority', 'agree', 'split', 'conflict', 'overlap', 'two'],
          sampleAnswer: isAm
            ? 'ሁለት ተቃራኒ ውሳኔዎች እንዳይወሰኑ እና ስርዓቱ እንዳይከፈል ለመከላከል ነው።'
            : 'To make sure two different groups cannot approve conflicting data at the same time.',
          explanation: isAm
            ? 'ከግማሽ በላይ ድምፅ መኖሩ ሁልጊዜ አንድ የጋራ ኮምፒውተር እንዲኖር ስለሚያደርግ ግጭትን ይከላከላል።'
            : 'Requiring more than half ensures any two groups share at least one computer, stopping conflicts.',
        },
        {
          id: 'sa-quest-05-s3',
          sectionIndex: 3,
          type: 'short_answer',
          question: isAm
            ? 'መሪው ኮምፒውተር ያለማቋረጥ የልብ ምት (Heartbeat) ለምን ይልካል?'
            : 'Why does the leader continuously send heartbeats to followers?',
          targetKeywords: isAm
            ? ['ምርጫ', 'መከላከል', 'ልብ ምት', 'መሪ']
            : ['alive', 'election', 'timeout', 'leader', 'timer'],
          sampleAnswer: isAm
            ? 'ተከታዮች መሪው በህይወት እንዳለ አውቀው አዲስ ምርጫ እንዳይጀምሩ ነው።'
            : 'To let followers know the leader is still alive so they do not start a new election.',
          explanation: isAm
            ? 'የልብ ምት መቋረጥ ተከታዮች መሪው ተበላሽቷል ብለው እንዲያስቡ እና አዲስ ምርጫ እንዲጀምሩ ያደርጋል።'
            : 'Without regular heartbeats, followers think the leader crashed and try to elect a new one.',
        },
      ],
    };
  }

  return null;
}
