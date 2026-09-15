import type { CourseCurriculum, DynamicLessonNote, RoadmapLesson, LessonInlineMCQ } from '@/types';

/**
 * Deterministically constructs the complete "Viewer Demo" Course Curriculum.
 */
export function getViewerDemoCurriculum(language: 'en' | 'am' = 'en'): CourseCurriculum {
  const isAm = language === 'am';

    const lessons: RoadmapLesson[] = isAm
    ? [
        {
          id: 'lesson-viewer-01',
          order: 1,
          title: '01 · የንድፍ እና ስዕላዊ መዋቅር ተመልካች (Mermaid)',
          slug: '01_mermaid_diagram_viewer',
          summary: 'ስዕላዊ የቅደም ተከተል እና የስርዓት ንድፎችን በ Mermaid ማሳያ መመልከት እና መረዳት።',
          description: 'የተሰራጩ ስርዓቶችን እና የመልእክት ዝውውሮችን በስዕላዊ ንድፍ ያሳያል።',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Mermaid', 'ስዕላዊ ንድፍ', 'የቅደም ተከተል ፍሰት'],
          isRemediation: false,
        },
        {
          id: 'lesson-viewer-02',
          order: 2,
          title: '02 · የኮድ እና የለውጥ ማነፃፀሪያ ተመልካች (Code & Diff)',
          slug: '02_code_and_diff_viewer',
          summary: 'ቀለም ያሸበረቀ የኮድ እና የጂት ልዩነት ማሳያ (Diff) መመልከቻ።',
          description: 'የኮድ ለውጦችን እና የስህተት ማስተካከያዎችን በግልጽ ያሳያል።',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Code Highlighting', 'Git Diff', 'የኮድ ማነፃፀሪያ'],
          isRemediation: false,
        },
        {
          id: 'lesson-viewer-03',
          order: 3,
          title: '03 · የሂሳብ ቀመሮች እና እኩልዮሾች ተመልካች (LaTeX Math)',
          slug: '03_latex_math_viewer',
          summary: 'ውስብስብ የሂሳብ ቀመሮችን እና ቀመራዊ ማረጋገጫዎችን በ LaTeX KaTeX ማሳያ መመልከት።',
          description: 'የአቴንሽን ቀመር እና የኮረም የሂሳብ እኩልዮሾችን ያሳያል።',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['LaTeX', 'KaTeX', 'የሂሳብ ቀመሮች'],
          isRemediation: false,
        },
        {
          id: 'lesson-viewer-04',
          order: 4,
          title: '04 · የሰንጠረዥ እና ንጽጽር ማትሪክስ ተመልካች (Table)',
          slug: '04_matrix_table_viewer',
          summary: 'የስርዓቶች እና አሰራሮች ንጽጽር ሰንጠረዥ ማሳያ።',
          description: 'የፓክሶስ እና ራፍት ስምምነት ስልተ-ቀመሮችን ንጽጽር ሰንጠረዥ ያሳያል።',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Tables', 'የንጽጽር ማትሪክስ', 'ሰንጠረዥ'],
          isRemediation: false,
        },
        {
          id: 'lesson-viewer-05',
          order: 5,
          title: '05 · የማስጠንቀቂያ እና ጥልቅ ማብራሪያ ተመልካች (Callouts)',
          slug: '05_callout_and_proof_viewer',
          summary: 'ማስጠንቀቂያዎች፣ ጠቃሚ ምክሮች እና ተዘርግተው የሚነበቡ ጥልቅ ማብራሪያዎች።',
          description: 'የአደጋ ማስጠንቀቂያዎች እና ተደብቀው የሚከፈቱ የሂሳብ ማረጋገጫዎችን ያሳያል።',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Callouts', 'ማስጠንቀቂያዎች', 'ተዘርጊ ካርዶች'],
          isRemediation: false,
        },
        {
          id: 'lesson-viewer-06',
          order: 6,
          title: '06 · የጊዜ ሰሌዳ እና ቅደም ተከተል ተመልካች (Timeline)',
          slug: '06_process_timeline_viewer',
          summary: 'ደረጃ በደረጃ የሚከናወኑ የአሰራር ዑደቶችን በቅደም ተከተል ማሳያ።',
          description: 'የ2-ደረጃ ስምምነት አሰራርን በጊዜ ሰሌዳ ያሳያል።',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Timeline', 'ደረጃዎች', 'የጊዜ ቅደም ተከተል'],
          isRemediation: false,
        },
        {
          id: 'lesson-viewer-07',
          order: 7,
          title: '07 · ተለዋዋጭ እና በይነተገናኝ የማስመሰያ ተመልካች (Interactive)',
          slug: '07_interactive_simulation_viewer',
          summary: 'በእጅ እየነኩ የሚሞክሩት የቀጥታ የኮምፒውተር ክላስተር ማስመሰያ።',
          description: 'የ3 ሰርቨሮች ክላስተር የአውታረ መረብ መቆራረጥን በእጅ እንዲሞክሩ ያስችላል።',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Interactive Sandbox', 'የቀጥታ ሙከራ', 'ክላስተር'],
          isRemediation: false,
        },
        {
          id: 'lesson-viewer-08',
          order: 8,
          title: '08 · የሶቅራጥስ የቃል ምዘና መከላከያ እና በይነተገናኝ ጥያቄዎች (Socratic Gate)',
          slug: '08_socratic_defense_gate',
          summary: 'በእያንዳንዱ ክፍል ውስጥ የቀረቡ በይነተገናኝ ጥያቄዎች እና በመጨረሻ የሚካሄድ የሶቅራጥስ የቃል መከላከያ ምዘና።',
          description: 'የፅንሰ-ሀሳብ፣ የአሰራር ሂደት እና የድንበር ወጥመዶች የቃል መከላከያ እና የማካካሻ ትምህርት ፍሰትን ያሳያል።',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Inline MCQ', 'Socratic Gate', 'Oral Defense', 'Adaptive Remediation'],
          isRemediation: false,
        },
      ]
    : [
        {
          id: 'lesson-viewer-01',
          order: 1,
          title: '01 · Mermaid & Architecture Diagrams',
          slug: '01_mermaid_diagram_viewer',
          summary: 'Interactive architectural diagrams and sequence message flows rendered with Mermaid.',
          description: 'Visualizes distributed message sequences and leader-follower handshakes.',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Mermaid', 'Sequence Diagrams', 'Visual Architecture'],
          isRemediation: false,
        },
        {
          id: 'lesson-viewer-02',
          order: 2,
          title: '02 · Syntax-Highlighted Code & Git Diffs',
          slug: '02_code_and_diff_viewer',
          summary: 'Syntax-highlighted code blocks and color-coded git diff patch comparisons.',
          description: 'Examines concurrency bug fixes and atomic mutex implementations.',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Code Syntax', 'Git Diffs', 'Concurrency Patches'],
          isRemediation: false,
        },
        {
          id: 'lesson-viewer-03',
          order: 3,
          title: '03 · LaTeX Math & Formal Equations',
          slug: '03_latex_math_viewer',
          summary: 'High-precision mathematical equations, matrix operations, and proofs via KaTeX.',
          description: 'Renders the Transformer Self-Attention formula and quorum inequality theorems.',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['LaTeX', 'KaTeX', 'Attention Math'],
          isRemediation: false,
        },
        {
          id: 'lesson-viewer-04',
          order: 4,
          title: '04 · Rich Tables & Comparison Matrices',
          slug: '04_matrix_table_viewer',
          summary: 'Structured matrix tables comparing protocol trade-offs and performance characteristics.',
          description: 'Side-by-side comparison of Paxos, Raft, and Multi-Paxos consensus models.',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Tables', 'Comparison Matrices', 'Trade-offs'],
          isRemediation: false,
        },
        {
          id: 'lesson-viewer-05',
          order: 5,
          title: '05 · Callouts & Expandable Deep-Dives',
          slug: '05_callout_and_proof_viewer',
          summary: 'GitHub-style alert callouts and collapsible accordion cards for optional proofs.',
          description: 'Demonstrates critical safety warnings and expandable mathematical proofs.',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Callouts', 'Collapsible Cards', 'Safety Warnings'],
          isRemediation: false,
        },
        {
          id: 'lesson-viewer-06',
          order: 6,
          title: '06 · Process Timelines & Execution Steps',
          slug: '06_process_timeline_viewer',
          summary: 'Chronological step-by-step trace cards for multi-phase distributed protocols.',
          description: 'Walks through the four execution phases of Two-Phase Commit.',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Timelines', 'Execution Traces', 'Two-Phase Commit'],
          isRemediation: false,
        },
        {
          id: 'lesson-viewer-07',
          order: 7,
          title: '07 · Interactive Sandboxed Visual Simulations',
          slug: '07_interactive_simulation_viewer',
          summary: 'Live interactive HTML/Canvas simulation allowing hands-on experimentation.',
          description: 'Interactive three-node cluster simulator for testing partition tolerance.',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Interactive Canvas', 'Consensus Sandbox', 'Live Partitioning'],
          isRemediation: false,
        },
        {
          id: 'lesson-viewer-08',
          order: 8,
          title: '08 · Socratic Defense Gate & Questioning Architecture',
          slug: '08_socratic_defense_gate',
          summary: 'Interspersed inline section MCQs with immediate feedback, followed by a multi-turn Socratic oral/written defense gate.',
          description: 'Demonstrates active retrieval practice via inline checks and a rigorous 3-stage Socratic defense with remediation loop.',
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Inline MCQ', 'Socratic Gate', 'Oral Defense', 'Adaptive Remediation'],
          isRemediation: false,
        },
      ];

  return {
    id: 'course-viewer-demo',
    title: isAm ? 'የተመልካቾች ማሳያ ሙሉ ትምህርት' : 'Viewer Demo: Multi-Modal Cognitive Studio',
    topic: isAm ? 'የተመልካቾች ማሳያ (Viewer Demo)' : 'Viewer Demo',
    sourceType: 'prompt',
    targetGoal: isAm
      ? 'በአተር ውስጥ የተገነቡትን ሁሉንም ስዕላዊ እና በይነተገናኝ ማሳያዎች መመልከት እና መረዳት'
      : 'Master all seven rich multi-modal visual viewers built inside Ater',
    learnerBaseline: isAm
      ? 'የስርዓት ንድፍ እና የተመልካቾችን አሰራር መረዳት የሚፈልግ ተማሪ'
      : 'Learner exploring interactive visual renderers',
    lessons,
    activeLessonId: 'lesson-viewer-01',
    createdAt: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Returns the deterministic rich note for a given lesson in the Viewer Demo course.
 */
function getViewerDemoLessonNoteRaw(
  lessonId: string,
  language: 'en' | 'am' = 'en'
): DynamicLessonNote {
  const isAm = language === 'am';

  // 1. MERMAID DIAGRAM LESSON
  if (lessonId === 'lesson-viewer-01') {
    const mermaidCode = `sequenceDiagram
  autonumber
  actor Client as Client App
  participant Leader as Node 1 (Leader)
  participant FollowerA as Node 2 (Follower)
  participant FollowerB as Node 3 (Follower)
  participant StateMachine as Local State

  Client->>Leader: 1. WriteCommand(key="balance", val=500)
  Leader->>Leader: Append to Local Log (Term 2)
  par Broadcast to Followers
    Leader->>FollowerA: AppendEntries(Term 2, Index 4)
    Leader->>FollowerB: AppendEntries(Term 2, Index 4)
  end
  FollowerA-->>Leader: Ack Success (Quorum 2/3)
  Leader->>StateMachine: Apply Commit(Index 4)
  Leader-->>Client: Success HTTP 200`;

    return {
      id: 'note-lesson-viewer-01',
      lessonId: 'lesson-viewer-01',
      courseId: 'course-viewer-demo',
      title: isAm ? 'የንድፍ እና ስዕላዊ መዋቅር ተመልካች' : 'Mermaid & Architecture Diagrams',
      mentalModel: isAm
        ? `በስክሪኑ ላይ የቀረበውን ስዕላዊ የቅደም ተከተል ንድፍ ይመልከቱ።
\`\`\`mermaid
${mermaidCode}
\`\`\`
ይህ ስዕላዊ ማሳያ በተሰራጩ ኮምፒውተሮች መካከል የሚደረገውን የመልእክት ዝውውር በግልጽ ያሳያል። ደንበኛው መረጃ ሲልክ፣ መሪው ሰርቨር ለተከታዮቹ አዳርሶ አብላጫ ድምፅ ሲያገኝ በቋሚነት ያጸድቀዋል።`
        : `Examine the interactive sequence diagram rendered directly on your screen.
\`\`\`mermaid
${mermaidCode}
\`\`\`
Visual diagrams turn complex asynchronous message flows into spatial mental models. Notice how the leader coordinates concurrent broadcasts and awaits majority quorum before committing mutations to disk.`,
      intuitivePurpose: isAm
        ? 'ስዕላዊ ንድፎች ረቂቅ የሆኑ የአውታረ መረብ ግንኙነቶችን እና የስቴት ሽግግሮችን በአንድ እይታ ግልጽ ያደርጋሉ።'
        : 'Architecture diagrams provide an unambiguous spatial map of system boundaries, message timelines, and state machine transitions.',
      operationalMechanism: isAm
        ? 'መሪው ሰርቨር መልእክቶችን በትይዩ ልኮ ከአብላጫዎቹ ተከታዮች ደረሰኝ ሲሰበስብ የስቴት ለውጡን በሃርድ ድራይቭ ላይ ያጸድቃል።'
        : 'The leader broadcasts candidate log entries concurrently, aggregates quorum confirmations, and writes the committed entry to non-volatile storage.',
      boundaryConditions: isAm
        ? 'አንድ ተከታይ ሰርቨር ቢጠፋ እንኳ፣ ሁለቱ ክፍሎች አብላጫ ድምፅ ስለሚሰጡ ስርዓቱ ያለመቆራረጥ ስራውን ይቀጥላል።'
        : 'Even if one replica is partitioned away, the remaining two nodes satisfy majority quorum and maintain forward progress.',
      artifactCode: mermaidCode,
      artifactLanguage: 'mermaid',
      teacherExplanations: {
        section1: isAm
          ? `በስክሪንዎ ላይ የቀረበውን ስዕላዊ የቅደም ተከተል ንድፍ በጥንቃቄ ይመልከቱ። በዚህ ትምህርት ውስጥ በአተር ውስጥ የተገነባውን የ Mermaid ስዕላዊ መዋቅር ማሳያ እንመለከታለን። በንድፉ ላይ እንደምትመለከቱት፣ ደንበኛው የመጻፍ ጥያቄ ሲያቀርብ፣ መሪው ሰርቨር መረጃውን ወደ ሌሎች ተከታይ ሰርቨሮች በአንድ ጊዜ ይልካል። ሁለተኛው ተከታይ ሰርቨር መልእክቱን አረጋግጦ ደረሰኝ ሲመልስ፣ የአብላጫ ኮረም ስለተሟላ መሪው መረጃውን በስቴት ማሽኑ ላይ በቋሚነት ያጸድቀዋል። ስዕላዊ ንድፎችን በቀጥታ በትምህርታችን ውስጥ ማካተታችን ረቂቅ የሆኑ የተሰራጩ ስርዓቶች አሰራርን በቀላሉ በአእምሮዎ እንዲስሉ ይረዳዎታል።`
          : `Look closely at the architectural diagram on your screen. In this lesson, we are demonstrating our dynamic Mermaid diagram viewer. Notice how the visual sequence diagram maps the exact message passing between the active leader and replica nodes. When the client submits a write command, the leader appends it locally and broadcasts AppendEntries to both followers concurrently. As soon as Follower A replies with an acknowledgment, majority quorum is satisfied, and the leader commits the transaction. Having live interactive diagrams directly inside your lessons transforms abstract distributed protocols into clear mental models.`,
      },
    };
  }

  // 2. CODE & DIFF VIEWER LESSON
  if (lessonId === 'lesson-viewer-02') {
    const diffCode = `--- a/src/cluster/state_machine.ts
+++ b/src/cluster/state_machine.ts
@@ -14,6 +14,8 @@ export class ClusterStateMachine {
   private log: LogEntry[] = [];
-  private balances: Map<string, number> = new Map();
+  private balances: Map<string, number> = new Map();
+  private rwMutex: RWMutex = new RWMutex();

   public async apply(entry: LogEntry): Promise<void> {
-    this.balances.set(entry.key, entry.value);
+    await this.rwMutex.withLock(async () => {
+      this.balances.set(entry.key, entry.value);
+    });
   }`;

    return {
      id: 'note-lesson-viewer-02',
      lessonId: 'lesson-viewer-02',
      courseId: 'course-viewer-demo',
      title: isAm ? 'የኮድ እና የለውጥ ማነፃፀሪያ ተመልካች' : 'Syntax-Highlighted Code & Git Diffs',
      mentalModel: isAm
        ? `በስክሪኑ ላይ የቀረበውን የኮድ ማነፃፀሪያ (Diff) ይመልከቱ።
\`\`\`diff
${diffCode}
\`\`\`
ቀይ እና አረንጓዴ መስመሮቹ በኮዱ ላይ የተደረገውን የደህንነት ማሻሻያ በግልጽ ያሳያሉ። የውሂብ መጋጨትን ለመከላከል የ Mutex መቆለፊያ ተጨምሯል።`
        : `Examine the syntax-highlighted code and git diff patch below.
\`\`\`diff
${diffCode}
\`\`\`
Notice the color-coded addition and deletion lines highlighting the insertion of a read-write mutex lock to protect shared state machines from concurrent write race conditions.`,
      intuitivePurpose: isAm
        ? 'የኮድ እና ልዩነት ማሳያ መሃንዲሶች የኮድ ለውጦችን እና ስልተ-ቀመሮችን ያለምንም መደናገር እንዲረዱ ያስችላቸዋል።'
        : 'Code syntax highlighting and diff viewers expose exact implementation mechanics with line numbers and patch visualization.',
      operationalMechanism: isAm
        ? 'በአንድ ጊዜ የሚመጡ ጥያቄዎች እንዳይጋጩ የስቴት ማሽኑ በመቆለፊያ ጥበቃ ይደረግለታል።'
        : 'Write operations obtain exclusive lock access, preventing data race corruption on shared in-memory maps.',
      boundaryConditions: isAm
        ? 'ያለ መቆለፊያ ጥበቃ ሁለት ተፎካካሪ ክሮች መረጃ ቢጽፉ የሂሳብ ሚዛን መዛባት ይፈጠር ነበር።'
        : 'Without mutex synchronization, concurrent goroutines would cause race conditions and corrupted ledger balances.',
      artifactCode: diffCode,
      artifactLanguage: 'diff',
      teacherExplanations: {
        section1: isAm
          ? `በስክሪንዎ ላይ የቀረበውን የኮድ እና የለውጥ ማነፃፀሪያ ማሳያ ይመልከቱ። በዚህ ትምህርት ውስጥ የቀረበው የኮድ ተመልካች የኮድ አገባብ ቀለሞችን እና የጂት ልዩነት ለውጦችን በግልጽ ያሳያል። በአረንጓዴ እና ቀይ የተመለከቱትን መስመሮች ስታስተውሉ፣ ያለ ምንም መቆለፊያ በቀጥታ መረጃ ይጽፍ የነበረውን ኮድ በማስወገድ፣ የውሂብ መጋጨትን የሚከላከል የ Mutex መቆለፊያ እንዴት እንደተጨመረ ታያላችሁ። ይህ የማሳያ ክፍል ውስብስብ የሶፍትዌር ለውጦችን በአጭር ጊዜ ውስጥ እንድትመረምሩ ይረዳችኋል።`
          : `Examine the code viewer on your screen, which displays both syntax-highlighted code and git diff patches. Notice the green and red highlights indicating how we replaced unsynchronized map access with an atomic read-write mutex lock. Clean syntax highlighting, line numbers, and diff comparisons allow you to inspect exact implementation mechanics without cognitive friction.`,
      },
    };
  }

  // 3. LATEX MATH VIEWER LESSON
  if (lessonId === 'lesson-viewer-03') {
    const mathFormula = `\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V`;
    const quorumFormula = `|Q_1 \\cap Q_2| \\ge 1 \\quad \\text{where} \\quad |Q_i| > \\frac{N}{2}`;

    return {
      id: 'note-lesson-viewer-03',
      lessonId: 'lesson-viewer-03',
      courseId: 'course-viewer-demo',
      title: isAm ? 'የሂሳብ ቀመሮች እና እኩልዮሾች ተመልካች' : 'LaTeX Math & Formal Equations',
      mentalModel: isAm
        ? `በስክሪኑ ላይ የቀረበውን የትራንስፎርመር አቴንሽን የሂሳብ ቀመር ይመልከቱ።
$$ ${mathFormula} $$
እንዲሁም የአብላጫ ኮረም መደራረብን የሚያረጋግጠው የሂሳብ እኩልዮሽ፡
$$ ${quorumFormula} $$
ይህ የ LaTeX ማሳያ የትኛውንም ውስብስብ የሂሳብ ቀመር እና ፅንሰ-ሀሳብ በውብ እና ግልጽ በሆነ የሂሳብ ፊደላት ያቀርባል።`
        : `Examine the Transformer Self-Attention formula and quorum inequality rendered below via LaTeX.
$$ ${mathFormula} $$
And the foundational quorum intersection theorem:
$$ ${quorumFormula} $$
LaTeX KaTeX rendering allows rigorous formal equations, matrix operations, and mathematical proofs to be displayed cleanly inside lesson notes.`,
      intuitivePurpose: isAm
        ? 'የሂሳብ ቀመሮች ረቂቅ ፅንሰ-ሀሳቦችን ወደ ትክክለኛ የሂሳብ ማረጋገጫ ይቀይራሉ።'
        : 'Mathematical formalization replaces imprecise verbal descriptions with exact mathematical guarantees.',
      operationalMechanism: isAm
        ? 'የመጠይቅ እና የቁልፍ ቬክተሮች ተባዝተው በስኩዌር ሩት ሲካፈሉ የግራዲየንት መጥፋትን ይከላከላሉ።'
        : 'Query and key dot products are scaled by dimension roots to maintain variance before softmax probability normalization.',
      boundaryConditions: isAm
        ? 'የልኬቱ መጠን በጣም ትልቅ በሚሆንበት ጊዜ የማካፈያው ዋጋ ውጤቱ ወደ ጽንፍ እንዳይሄድ ያረጋጋዋል።'
        : 'As key dimension grows large, magnitude scales up, making softmax gradients small without scale normalization.',
      artifactCode: mathFormula,
      artifactLanguage: 'math',
      teacherExplanations: {
        section1: isAm
          ? `በስክሪንዎ ላይ የቀረበውን የሂሳብ ቀመር ይመልከቱ። በዚህ ትምህርት ውስጥ በአተር ውስጥ የተገነባውን የ LaTeX KaTeX የሂሳብ ማሳያ እንመለከታለን። በስክሪኑ ላይ የሚታየው የታዋቂው የትራንስፎርመር ሞዴል አቴንሽን ቀመር ነው። የመጠይቅ እና የቁልፍ ቬክተሮች ተባዝተው ለምን በስኩዌር ሩት እንደተካፈሉ፣ በመቀጠልም በሶፍትማክስ ተሰልተው ከቫልዩ ቬክተር ጋር እንደተባዙ በግልጽ ያሳያል። ከታች ደግሞ የአብላጫ ኮረም መደራረብ የሂሳብ ቀመር ቀርቧል። ማንኛውንም ውስብስብ የሂሳብ እና የፊዚክስ ቀመር በዚህ መልኩ በግልጽ መመልከት የትምህርት ጥራትን እጅግ የላቀ ያደርገዋል።`
          : `Let's explore the mathematical formulas rendered on your screen using our LaTeX KaTeX viewer. We are examining the foundational scaled dot-product attention equation. Notice how query and key vectors are multiplied, divided by the square root of key dimensionality to prevent vanishing gradients, passed through softmax normalization, and multiplied by value vectors. Below it, the quorum intersection inequality formalizes why two majorities must overlap. Rendering crisp mathematical notation makes studying formal proofs and machine learning architectures effortless.`,
      },
    };
  }

  // 4. TABLE VIEWER LESSON
  if (lessonId === 'lesson-viewer-04') {
    const tableContent = `| Consensus Protocol | Leader Invariant | Network Latency (RTT) | Partition Recovery |
| :--- | :--- | :--- | :--- |
| **Classical Paxos** | Symmetric Proposers | 2 RTT (Prepare + Accept) | Requires new ballot round |
| **Multi-Paxos** | Stable Elected Leader | 1 RTT (Steady-state Accept) | Leader reelection phase |
| **Raft Protocol** | Strong Append Leader | 1 RTT (AppendEntries RPC) | Randomized election timeout |
| **Viewstamped (VR)** | Primary / Backup View | 1 RTT (Normal processing) | Explicit View-Change protocol |`;

    return {
      id: 'note-lesson-viewer-04',
      lessonId: 'lesson-viewer-04',
      courseId: 'course-viewer-demo',
      title: isAm ? 'የሰንጠረዥ እና ንጽጽር ማትሪክስ ተመልካች' : 'Rich Tables & Comparison Matrices',
      mentalModel: isAm
        ? `የተለያዩ የስምምነት ስልተ-ቀመሮችን ንጽጽር የሚያሳየውን ሰንጠረዥ ይመልከቱ።
${tableContent}
ሰንጠረዦች የተወሳሰቡ የስርዓት ንጽጽሮችን እና የምህንድስና ሚዛኖችን በአንድ እይታ ግልጽ ያደርጋሉ።`
        : `Review the comparative protocol matrix table below.
${tableContent}
Structured matrix tables organize multi-dimensional trade-offs, message latencies, and fault tolerance behaviors into concise, high-density comparisons.`,
      intuitivePurpose: isAm
        ? 'ሰንጠረዦች የምህንድስና ውሳኔዎችን እና የተፎካካሪ ቴክኖሎጂዎችን ሚዛን ለመመዘን ተመራጭ ናቸው።'
        : 'Comparative tables enable instant side-by-side evaluation of design trade-offs across competing protocols.',
      operationalMechanism: isAm
        ? 'ራፍት እና መልቲ-ፓክሶስ መደበኛውን የስራ ዑደት ወደ 1 RTT በማውረድ ፍጥነትን ይጨምራሉ።'
        : 'Steady-state single round trip latency is achieved by maintaining an established leader lease across transactions.',
      boundaryConditions: isAm
        ? 'መሪው ሰርቨር ሲጠፋ ብቻ አዲስ ዙር ምርጫ ስለሚካሄድ ተጨማሪ ጊዜ ይወስዳል።'
        : 'When a leader fails, failover latency is bounded by the election timeout configuration.',
      artifactCode: tableContent,
      artifactLanguage: 'table',
      teacherExplanations: {
        section1: isAm
          ? `በስክሪንዎ ላይ የቀረበውን የንጽጽር ሰንጠረዥ ይመልከቱ። ይህ የሰንጠረዥ ማሳያ የተለያዩ የስምምነት ስልተ-ቀመሮችን የአሰራር ልዩነት፣ የፍጥነት መጠን እና የመልሶ ማገገሚያ ዘዴን ጎን ለጎን ያነፃፅራል። ራፍት እና መልቲ-ፓክሶስ አንድ ወጥ መሪ በመምረጥ ፍጥነታቸውን ወደ አንድ ዙር እንዴት እንደሚያወርዱት፣ ነገር ግን መሪው ሲጠፋ በምን ያህል ፍጥነት እንደሚተኩ በሰንጠረዡ ላይ በግልጽ ተቀምጧል። እንደዚህ ያሉ የንጽጽር ሰንጠረዦች ትክክለኛ የምህንድስና ውሳኔዎችን እንድትወስኑ ትልቅ እገዛ ያደርጋሉ።`
          : `Take a look at the structured comparison matrix on your screen. This table viewer organizes complex multidimensional trade-offs across consensus protocols. Notice how Raft and Multi-Paxos optimize steady-state writes down to a single network round-trip, whereas classical Paxos requires two round-trips for every uncoordinated write. Tables allow you to evaluate architectural trade-offs at a single glance.`,
      },
    };
  }

  // 5. CALLOUT & DEEP DIVE VIEWER LESSON
  if (lessonId === 'lesson-viewer-05') {
    const calloutContent = `> [!WARNING]
> In any distributed consensus cluster, never allow two disjoint network partitions to both accept writes simultaneously. Doing so produces irreversible split-brain state divergence.

> [!TIP]
> Always configure an odd number of voting nodes (3, 5, or 7) to avoid split votes and maximize fault tolerance efficiency.

<details>
<summary>Formal Quorum Intersection Proof</summary>
Let cluster size be $N$. Any valid majority quorum $Q$ satisfies $|Q| \ge \lfloor N/2 \rfloor + 1$.
For any two quorums $Q_1$ and $Q_2$:
$$ |Q_1 \cap Q_2| = |Q_1| + |Q_2| - |Q_1 \cup Q_2| $$
Since $|Q_1 \cup Q_2| \le N$ and $|Q_1| + |Q_2| \ge 2(\lfloor N/2 \rfloor + 1) \ge N + 1$:
$$ |Q_1 \cap Q_2| \ge N + 1 - N = 1 $$
Thus, $Q_1 \cap Q_2 \neq \emptyset$, guaranteeing at least one overlapping node witness across terms.
</details>`;

    return {
      id: 'note-lesson-viewer-05',
      lessonId: 'lesson-viewer-05',
      courseId: 'course-viewer-demo',
      title: isAm ? 'የማስጠንቀቂያ እና ጥልቅ ማብራሪያ ተመልካች' : 'Callouts & Expandable Deep-Dives',
      mentalModel: isAm
        ? `በስክሪኑ ላይ የቀረቡትን የማስጠንቀቂያ እና የተዘርጊ ካርዶች ማሳያ ይመልከቱ።
${calloutContent}
ማስጠንቀቂያዎች ቁልፍ አደጋዎችን የሚያጎሉ ሲሆን፣ ተዘርጊው ካርድ ደግሞ የሂሳብ ማረጋገጫውን ሳይደባለቅ በውስጡ ይይዛል።`
        : `Review the styled alert callouts and expandable deep-dive proof below.
${calloutContent}
Callouts highlight critical safety warnings, while collapsible accordions keep advanced mathematical proofs organized without cluttering the main reading flow.`,
      intuitivePurpose: isAm
        ? 'የተዘረጉ ካርዶች ተማሪው በራሱ ፍላጎት ተጨማሪ ጥልቅ መረጃዎችን እንዲከፍት ያስችሉታል።'
        : 'Callouts emphasize high-risk failure modes, while accordions support progressive disclosure of mathematical proofs.',
      operationalMechanism: isAm
        ? 'የአብላጫ ቡድኖች የጋራ አባል መኖር በጊዜ ሂደት የቀደሙ መረጃዎች እንዳይጠፉ ያደርጋል።'
        : 'Quorum intersection guarantees that any new leader必然 overlaps with at least one node containing the most up-to-date log.',
      boundaryConditions: isAm
        ? 'ከአናሳ በላይ የሆኑ ሰርቨሮች ከተበላሹ ስርዓቱ ደህንነቱን ለመጠበቅ ሲል ስራውን ያቆማል።'
        : 'If partition isolation exceeds fault tolerance thresholds, writes halt to avoid state corruption.',
      artifactCode: calloutContent,
      artifactLanguage: 'markdown',
      teacherExplanations: {
        section1: isAm
          ? `በስክሪንዎ ላይ የቀረቡትን የማስጠንቀቂያ ሳጥኖች እና ተዘርግተው የሚከፈቱ ካርዶችን ይመልከቱ። ይህ የማሳያ ክፍል ጠቃሚ ምክሮችን፣ አደገኛ ማስጠንቀቂያዎችን እና ተደብቀው የሚቀመጡ ጥልቅ የሂሳብ ማረጋገጫዎችን እንዴት በውብ መልክ እንደሚያቀርብ ያሳያል። የማስጠንቀቂያ ሳጥኑ የስርዓት መከፈል አደጋን የሚያጎላ ሲሆን፣ ከስሩ ያለውን ካርድ በመጫን ደግሞ የአብላጫ ኮረም መደራረብን የሚያረጋግጠውን ሙሉ የሂሳብ ማረጋገጫ መመልከት ትችላላችሁ። ይህ አሰራር ዋናውን የንባብ ሂደት ሳያጨናንቅ ለሚፈልጉት ጥልቅ እውቀት ይሰጣል።`
          : `Notice the warning callout and expandable deep-dive card on your screen. Callout viewers draw immediate visual attention to dangerous edge cases, while collapsible cards let you tuck away deep mathematical proofs without cluttering your primary reading flow. You can expand the proof at any time to verify the pigeonhole principle behind quorum intersection.`,
      },
    };
  }

  // 6. PROCESS TIMELINE VIEWER LESSON
  if (lessonId === 'lesson-viewer-06') {
    const timelineContent = `\`\`\`timeline
1. Phase 1: Prepare Broadcast - Coordinator assigns globally unique transaction ID and broadcasts prepare RPC to all participants.
2. Phase 2: Voting & Quorum Wait - Participants verify local constraints, acquire locks, write intention to undo log, and reply YES.
3. Phase 3: Global Commit Order - Upon receiving unanimous YES votes, coordinator writes commit to durable storage and broadcasts commit.
4. Phase 4: Acknowledgment & Cleanup - Participants apply state mutations locally, release acquired locks, and acknowledge completion.
\`\`\``;

    return {
      id: 'note-lesson-viewer-06',
      lessonId: 'lesson-viewer-06',
      courseId: 'course-viewer-demo',
      title: isAm ? 'የጊዜ ሰሌዳ እና ቅደም ተከተል ተመልካች' : 'Process Timelines & Execution Steps',
      mentalModel: isAm
        ? `የ2-ደረጃ ስምምነት አሰራርን ደረጃ በደረጃ የሚያሳየውን የጊዜ ሰሌዳ ይመልከቱ።
${timelineContent}
ይህ የጊዜ ሰሌዳ ማሳያ ውስብስብ የሆኑ የአሰራር ዑደቶችን በቅደም ተከተል በቁጥር በመደርደር ግልጽ ያደርጋል።`
        : `Trace through the multi-stage transaction timeline below.
${timelineContent}
Timeline viewers organize sequential protocol executions, trace milestones, and chronological phases with visual step indicators.`,
      intuitivePurpose: isAm
        ? 'የጊዜ ሰሌዳ ማሳያ የአሰራር ሂደቶችን ቅደም ተከተል እና ወሳኝ የውሳኔ ነጥቦችን በግልጽ ያሳያል።'
        : 'Timelines clarify causal execution order and recovery checkpoints across asynchronous workflows.',
      operationalMechanism: isAm
        ? 'አስተባባሪው ክፍል ከሁሉም ተሳታፊዎች ሙሉ ድምፅ ሲያገኝ ብቻ የመጨረሻውን ማጽደቂያ ይሰጣል።'
        : 'Transactions only progress to commit when unanimous vote confirmations are logged durably.',
      boundaryConditions: isAm
        ? 'አንድ ተሳታፊ እንኳ ድምፅ ካልሰጠ አስተባባሪው ሙሉውን ሂደት ይሰርዘዋል።'
        : 'If any single node votes NO or times out, the transaction coordinator aborts the entire transaction.',
      artifactCode: timelineContent,
      artifactLanguage: 'timeline',
      teacherExplanations: {
        section1: isAm
          ? `በስክሪንዎ ላይ የቀረበውን የደረጃ በደረጃ የጊዜ ሰሌዳ ማሳያ ይመልከቱ። በዚህ ትምህርት ውስጥ የቀረበው የጊዜ ሰሌዳ ተመልካች ባለብዙ ደረጃ የአሰራር ዑደቶችን በቅደም ተከተል ያሳያል። በስክሪኑ ላይ የሚታየው የታዋቂው የ2-ደረጃ ስምምነት አሰራር ሲሆን፣ ከመጀመሪያው የዝግጅት ጥያቄ ጀምሮ፣ የድምፅ አሰጣጥ፣ የመጨረሻ ውሳኔ ማጽደቅ እና ማጠቃለያ ድረስ ያለውን ሂደት በግልጽ በቁጥር አስቀምጦታል። እንደዚህ ያሉ የጊዜ ሰሌዳዎች የስራውን ቅደም ተከተል በአእምሮዎ ውስጥ በቀላሉ እንዲያዋህዱ ያግዛሉ።`
          : `Follow the sequential process timeline rendered on your screen. This timeline viewer breaks multi-stage algorithms into distinct milestone phases. Notice the chronological progression from the initial prepare broadcast, through voting and quorum accumulation, up to the final commit command. Stepping through algorithms chronologically anchors the order of causal events.`,
      },
    };
  }

  // 7. INTERACTIVE SIMULATION VIEWER LESSON
  if (lessonId === 'lesson-viewer-07') {
    const interactiveContent = `\`\`\`interactive
preset: consensus-simulator
\`\`\``;

    return {
      id: 'note-lesson-viewer-07',
      lessonId: 'lesson-viewer-07',
      courseId: 'course-viewer-demo',
      title: isAm ? 'ተለዋዋጭ እና በይነተገናኝ የማስመሰያ ተመልካች' : 'Interactive Sandboxed Visual Simulations',
      mentalModel: isAm
        ? `በስክሪኑ ላይ የቀረበውን የቀጥታ የኮምፒውተር ክላስተር ማስመሰያ ይሞክሩ።
${interactiveContent}
ይህ የቀጥታ ማስመሰያ በክላስተሩ ውስጥ የሚገኙ ሰርቨሮችን በመነጠል የአብላጫ ኮረም አሰራርን በእጅዎ እንዲሞክሩ ያስችልዎታል።`
        : `Experiment with the live interactive consensus cluster simulator below.
${interactiveContent}
Interactive visual sandboxes allow you to test node partitions, trigger message broadcasts, and directly observe quorum preservation in real time.`,
      intuitivePurpose: isAm
        ? 'በይነተገናኝ ማስመሰያዎች ተማሪው በእጁ እየሞከረ የንድፈ-ሀሳብ እውቀቱን በተግባር እንዲያረጋግጥ ያደርጋሉ።'
        : 'Interactive simulations transform passive conceptual reading into active experiential mastery.',
      operationalMechanism: isAm
        ? 'ሰርቨር 3 ሲነጠል፣ የቀሩት ሁለቱ ሰርቨሮች አብላጫ ድምፅ ስላላቸው መሪ መርጠው ስራቸውን ይቀጥላሉ።'
        : 'When Node 3 is partitioned, Nodes 1 and 2 maintain 2/3 quorum, incrementing terms and safely logging entries.',
      boundaryConditions: isAm
        ? 'ሁለት ሰርቨሮች ከተነጠሉ ኮረም ስለሚጠፋ ክላስተሩ ስራውን ያቆማል።'
        : 'If two nodes are partitioned simultaneously, quorum is lost (1/3) and the cluster halts mutations safely.',
      artifactCode: interactiveContent,
      artifactLanguage: 'interactive',
      teacherExplanations: {
        section1: isAm
          ? `አሁን ደግሞ በስክሪንዎ ላይ የቀረበውን የቀጥታ በይነተገናኝ ማስመሰያ ይሞክሩ። ይህ ማሳያ በቀጥታ በትምህርትዎ ውስጥ የሚሰራ የ3 ሰርቨሮች ክላስተር ነው። በስክሪኑ ላይ ያለውን ቁልፍ በመጫን ሰርቨር 3ን ነጥለው ይሞክሩ። ሰርቨር 3 ሲነጠል የቀሩት ሁለቱ ሰርቨሮች አብላጫ ድምፅ ስላላቸው መሪ መርጠው መረጃ መመዝገብ እንዴት እንደሚቀጥሉ በቀጥታ ትመለከታላችሁ። እንደዚህ ያሉ የቀጥታ ሙከራዎች ፅንሰ-ሀሳቡን በጥልቀት እንድትረዱ እና በልበ ሙሉነት እንድትቆጣጠሩት ያደርጋሉ።`
          : `Now experience our interactive sandbox viewer. This live simulation runs directly inside your lesson. Try clicking the button to isolate Node 3, and observe how Node 1 and Node 2 maintain active quorum to elect a leader and continue logging without split-brain corruption. Live interactive simulations turn passive reading into active experiential mastery.`,
      },
    };
  }

  // 8. SOCRATIC DEFENSE GATE & QUESTIONING ARCHITECTURE
  if (lessonId === 'lesson-viewer-08') {
    const socraticFlowChart = `\`\`\`mermaid
graph TD
    A[Lesson Section 1: Intuition] -->|Inline MCQ 1| B[Immediate Feedback & Reveal]
    B --> C[Lesson Section 3: Mechanism]
    C -->|Inline MCQ 2| D[Immediate Feedback & Reveal]
    D --> E[Lesson Section 5: Terminal Gate]
    E --> F[Open Socratic Defense Modal]
    F --> G[Battery Q1: Core Intuition]
    G --> H{Score 5-7?}
    H -->|Yes| I[Adaptive Follow-Up Probe]
    H -->|No| J[Battery Q2: Causal Mechanism]
    I --> J
    J --> K[Battery Q3: Boundary Traps]
    K --> L{Average >= 8.0?}
    L -->|Pass| M[Mastered & Roadmap Unlocked]
    L -->|Fail| N[Dynamic Micro-Remediation Spliced]
\`\`\``;

    return {
      id: 'note-lesson-viewer-08',
      lessonId: 'lesson-viewer-08',
      courseId: 'course-viewer-demo',
      title: isAm ? 'የሶቅራጥስ የቃል ምዘና መከላከያ እና በይነተገናኝ ጥያቄዎች' : 'Socratic Defense Gate & Questioning Architecture',
      mentalModel: isAm
        ? `የአተር አዲሱ የበይነተገናኝ ጥያቄዎች እና የቃል መከላከያ ምዘና ፍሰት።
${socraticFlowChart}
ትምህርቱን በሚያነቡበት ጊዜ የሚቀርቡ ፈጣን ጥያቄዎች (Inline MCQs) እና በትምህርቱ ማብቂያ ላይ የሚደረገው ጥልቅ የቃል መከላከያ (Socratic Defense Gate) የተማሪውን እውነተኛ ግንዛቤ ያረጋግጣሉ።`
        : `Ater's closed-loop questioning and Socratic oral defense architecture.
${socraticFlowChart}
Interspersed inline checks force active recall during reading, while the terminal Socratic Gate subjects the student to a rigorous 3-dimensional defense (Intuition, Mechanism, Boundary) with adaptive follow-ups and automated micro-remediation.`,
      intuitivePurpose: isAm
        ? 'ተማሪው ፅንሰ-ሀሳቡን በውሸት ተረድቻለሁ ብሎ እንዳያልፍ፣ ፈጣን ጥያቄዎችን እና የቃል ማብራሪያ መከላከያን በማጣመር እውነተኛ ብቃትን ማረጋገጥ ነው።'
        : 'Eliminates passive reading illusions by coupling immediate tactile retrieval checks with an unforgiving 3-stage oral/written defense interrogation.',
      operationalMechanism: isAm
        ? 'ክፍል 1 እና 3 ላይ የቀረቡትን ፈጣን ጥያቄዎች ይመልሱ። ክፍል 5 ላይ ሲደርሱ "የሶቅራጥስ የቃል ምዘና መከላከያ ጀምር" የሚለውን ይጫኑ። ስርዓቱ 3 ጥያቄዎችን ያቀርባል፤ ምላሽዎ ያልተሟላ ከሆነ ተጨማሪ ማጣሪያ ይጠይቃል፤ አማካይ ውጤትዎ ከ8 በታች ከሆነ ደግሞ የማካካሻ ትምህርት በራስ-ሰር ያዘጋጃል።'
        : 'Answer the inline multiple-choice cards in Section 1 and Section 3 for instant validation. At Section 5, click "Launch Socratic Defense Gate". The defense engine interrogates your mental model across 3 dimensions, fires a targeted follow-up probe if your mechanism is fuzzy (score 5-7), and dynamically splices a micro-remediation sub-lesson if average mastery falls below 8.0/10.',
      boundaryConditions: isAm
        ? 'የተማሪው ምላሽ ከ15 ቃላት በታች ወይም ግልጽ ያልሆነ ከሆነ ጥያቄው እንደወደቀ ይቆጠራል። የማጣሪያ ጥያቄዎች ተማሪውን ላለማድከም በአንድ ጥያቄ ቢበዛ አንድ ጊዜ ብቻ ይከሰታሉ።'
        : 'Answers shorter than 15 characters fail automatically. Adaptive follow-up probes are strictly bounded to at most 1 turn to prevent fatigue. Master status requires >= 8.0/10 with zero scores below 4.',
      artifactCode: socraticFlowChart,
      artifactLanguage: 'mermaid',
      teacherExplanations: {
        section1: isAm
          ? `እንኳን ወደ የሶቅራጥስ የቃል ምዘና እና በይነተገናኝ ጥያቄዎች ማሳያ ትምህርት በደህና መጡ! በዚህ ትምህርት ውስጥ ሁለት አይነት ምዘናዎችን ያገኛሉ። የመጀመሪያው በትምህርቱ ውስጥ የሚቀርቡ ፈጣን ጥያቄዎች ሲሆኑ፣ ወዲያውኑ መልስዎን እንዲያረጋግጡ ያስችሉዎታል። ሁለተኛው በትምህርቱ መጨረሻ ላይ የሚቀርበው የሶቅራጥስ የቃል ምዘና ሲሆን፣ በራስዎ ቃላት በድምፅ ወይም በጽሑፍ እንድትከላከሉ ይጠይቃችኋል። አሁን ከታች ያለውን የመጀመሪያውን ጥያቄ በመመለስ ይጀምሩ!`
          : `Welcome to the Socratic Defense Gate and Questioning Architecture walkthrough. In this lesson, you will experience our two-tiered assessment system: tactical inline checks in Sections 1 and 3 that give you immediate feedback, and the terminal Socratic Defense Gate in Section 5 where you defend your knowledge across Core Intuition, Causal Mechanism, and Boundary Traps. Try answering the inline question right below to begin!`,
      },
    };
  }

  // 9. DYNAMIC REMEDIATION LESSON
  if (lessonId.includes('remediation') || lessonId.endsWith('b')) {
    const remediationFlow = `\`\`\`mermaid
graph TD
    A[Diagnosed Misconception] --> B[Deconstruct Causal Invariant]
    B --> C[Concrete Analogical Mapping]
    C --> D[Re-Verify Before Gate Re-Entry]
\`\`\``;

    return {
      id: `note-${lessonId}`,
      lessonId,
      courseId: 'course-viewer-demo',
      title: isAm ? 'የማካካሻ ትምህርት፡ የሶቅራጥስ ምዘና ክፍተቶች ማስተካከያ' : 'Remediation: Socratic Defense Causal Alignment',
      mentalModel: isAm
        ? `በሶቅራጥስ የቃል ምዘና ወቅት የታዩትን ክፍተቶች ለማስተካከል የተዘጋጀ ፈጣን የማካካሻ ትምህርት።
${remediationFlow}
ይህ ማካካሻ የምክንያትና ውጤት ሂደቱን ከስረ-መሰረቱ በማብራራት ወደ ዋናው ምዘና ለመመለስ ያዘጋጅዎታል!`
        : `Targeted micro-remediation repairing the causal invariants diagnosed during your defense.
${remediationFlow}
Deconstructs the causal chain into intuitive steps before you return to re-attempt the gate.`,
      intuitivePurpose: isAm
        ? 'የተማሪውን ግንዛቤ በማጠናከር ወደ ዋናው ትምህርት ለመመለስ የሚያስችል ዝግጅት ማድረግ ነው።'
        : 'Aligns the foundational mental model so the student can explain the mechanism with high causal accuracy.',
      operationalMechanism: isAm
        ? 'ደረጃ በደረጃ የምክንያትና ውጤት ትስስሮችን መመልከት እና ወሳኝ ጥያቄዎችን መመለስ።'
        : 'Walk through the causal sequence step-by-step to solidify the underlying invariant before gate re-entry.',
      boundaryConditions: isAm
        ? 'ይህ ትምህርት ሲጠናቀቅ ዋናው የቃል መከላከያ ምዘና እንደገና ይከፈታል።'
        : 'Completing this remediation prepares you to re-enter the Socratic Gate and prove mastery.',
      artifactCode: remediationFlow,
      artifactLanguage: 'mermaid',
      teacherExplanations: {
        section1: isAm
          ? 'እንኳን ወደ ማካካሻ ትምህርቱ በደህና መጡ። በቃል ምዘናው ወቅት የታዩትን ክፍተቶች አብረን እንፈታለን።'
          : 'Welcome to your remediation lesson. Let us address the causal gaps diagnosed during your gate defense.',
      },
    };
  }

  // Fallback
  return getViewerDemoLessonNoteRaw('lesson-viewer-01', language);
}

/**
 * Returns the rich lesson note for the Viewer Demo course, enriched with inline MCQs.
 */
export function getViewerDemoLessonNote(
  lessonId: string,
  language: 'en' | 'am' = 'en'
): DynamicLessonNote {
  const note = getViewerDemoLessonNoteRaw(lessonId, language);
  const isAm = language === 'am';

  const defaultMCQs: LessonInlineMCQ[] = isAm
    ? [
        {
          id: `mcq-${lessonId}-s1`,
          sectionIndex: 1,
          question: 'በዚህ ትምህርት ውስጥ የቀረበው ዋናው ስዕላዊ ወይም በይነተገናኝ ማሳያ ዋና ጥቅም ምንድን ነው?',
          options: [
            'ውስብስብ የአሰራር ሂደቶችን በቀላሉ በዓይነ-ህሊና ለመረዳት ያስችላል',
            'የኮምፒውተሩን ባትሪ በፍጥነት ለመጨረስ',
            'ስክሪኑን በሙሉ በጨለማ ለመሸፈን',
            'የተጠቃሚውን ድምፅ ለመቅዳት ብቻ',
          ],
          correctOptionIndex: 0,
          explanation: 'ስዕላዊ ማሳያዎች ውስብስብ የምህንድስና ሂደቶችን በግልጽ እንድንመለከት እና እንድንረዳ ያግዛሉ።',
        },
        {
          id: `mcq-${lessonId}-s3`,
          sectionIndex: 3,
          question: 'በአሰራር ሂደቱ ውስጥ የደህንነት እና ትክክለኛነት ወሰኖች ለምን ያስፈልጋሉ?',
          options: [
            'ስርዓቱ በድንበር እና በችግር ወቅት እንዳይበላሽ ለመከላከል',
            'የሰርቨሮችን ዋጋ ለመጨመር',
            'የኮዱን ርዝመት ለማሳጠር',
            'የበይነመረብ ፍጥነትን ለመገደብ',
          ],
          correctOptionIndex: 0,
          explanation: 'የደህንነት ወሰኖች ስርዓቱ በማንኛውም ያልተጠበቀ ብልሽት ወቅት እንዳይበላሽ ዋስትና ይሰጣሉ።',
        },
      ]
    : [
        {
          id: `mcq-${lessonId}-s1`,
          sectionIndex: 1,
          question: 'What is the primary pedagogical benefit of this rich visual viewer?',
          options: [
            'Visualizes multi-component dynamics and state transitions clearly',
            'Consumes background GPU cycles for crypto mining',
            'Forces the screen to render in low contrast mode',
            'Eliminates the need for any text content',
          ],
          correctOptionIndex: 0,
          explanation: 'Rich viewers ground abstract mental models into concrete visual structures, eliminating ambiguity.',
        },
        {
          id: `mcq-${lessonId}-s3`,
          sectionIndex: 3,
          question: 'Why must operational mechanisms verify boundary conditions and invariants?',
          options: [
            'To guarantee consistency and safety when components fail or network splits occur',
            'To satisfy cosmetic linting rules',
            'To artificially increase compilation times',
            'To avoid using local variables',
          ],
          correctOptionIndex: 0,
          explanation: 'Verifying invariants guarantees system correctness and prevents corrupted states under stress.',
        },
      ];

  if (lessonId === 'lesson-viewer-08') {
    const socraticMCQs: LessonInlineMCQ[] = isAm
      ? [
          {
            id: 'mcq-lesson-viewer-08-s1',
            sectionIndex: 1,
            question: 'በዚህ አዲስ አሰራር ውስጥ በትምህርቱ መሃል የሚቀርቡ ፈጣን ጥያቄዎች (Inline MCQs) ዋና አላማ ምንድን ነው?',
            options: [
              'ተማሪው ንባቡን ገና ሲያጠናቅቅ ወዲያውኑ በማስታወስ እውነተኛ ግንዛቤውን እንዲያረጋግጥ ለማድረግ',
              'ተጠቃሚው ኮምፒውተሩን እንዲዘጋ ለማስገደድ',
              'የጽሑፉን ቅርጸ-ቁምፊ ለመቀየር',
              'ማስታወቂያዎችን ለማሳየት',
            ],
            correctOptionIndex: 0,
            explanation: 'ፈጣን ጥያቄዎች ንቁ የማስታወስ ሂደትን (Active Recall) በማበረታታት ተማሪው በስህተት ተረድቻለሁ ብሎ እንዳያልፍ ያደርጋሉ።',
          },
          {
            id: 'mcq-lesson-viewer-08-s3',
            sectionIndex: 3,
            question: 'በሶቅራጥስ የቃል ምዘና ወቅት ተማሪው የሰጠው ማብራሪያ ያልተሟላ ወይም መካከለኛ (5-7) ቢሆን ምን ይከሰታል?',
            options: [
              'ስርዓቱ ተጨማሪ አነቃቂ ጥያቄ (Adaptive Follow-Up Probe) በመጠየቅ ግንዛቤውን ያጣራል',
              'ትምህርቱ ወዲያውኑ ይሰረዛል',
              'ምንም ሳያብራራ ተማሪው ወዲያውኑ ያልፋል',
              'ስርዓቱ ወደ ኋላ ይመለሳል',
            ],
            correctOptionIndex: 0,
            explanation: 'ውጤቱ መካከለኛ (5-7) ሲሆን፣ ሞተሩ በትክክል መረዳትህን ለመፈተሽ አንድ ተጨማሪ አነቃቂ ጥያቄ ያቀርባል።',
          },
        ]
      : [
          {
            id: 'mcq-lesson-viewer-08-s1',
            sectionIndex: 1,
            question: 'Why are inline multiple-choice checks placed directly inside the lesson sections?',
            options: [
              'They trigger active retrieval immediately after ingestion, defeating the illusion of competence',
              'To artificially increase scrolling distance',
              'To mine cryptocurrency in the background',
              'To replace the need for any lesson text',
            ],
            correctOptionIndex: 0,
            explanation: 'Interspersed checks prevent passive reading and force immediate retrieval practice right when mental models are forming.',
          },
          {
            id: 'mcq-lesson-viewer-08-s3',
            sectionIndex: 3,
            question: 'What happens during the Socratic Gate defense if a student gives a borderline or vague explanation (score 5-7)?',
            options: [
              'The engine issues a targeted adaptive follow-up probe to test depth of understanding',
              'The course is deleted immediately',
              'The student automatically passes without explanation',
              'The lesson resets to blank',
            ],
            correctOptionIndex: 0,
            explanation: 'Borderline causal answers trigger an adaptive follow-up question (bounded to max 1) to inspect underlying reasoning.',
          },
        ];

    return {
      ...note,
      inlineMCQs: socraticMCQs,
    };
  }

  return {
    ...note,
    inlineMCQs: defaultMCQs,
  };
}
