/**
 * Ater_V2 Core Type Definitions & System Contracts
 * Cognitive Learning Engine & Socratic Tutor Architecture
 */

// ============================================================================
// 1. Living Curriculum & Roadmaps (TASK-001, TASK-003, TASK-007)
// ============================================================================

/**
 * Status states for a lesson in the living curriculum roadmap.
 */
export type LessonStatus = 'locked' | 'active' | 'mastered' | 'remediation';

/**
 * An atomic, single-concept lesson in the living curriculum roadmap DAG.
 * Enforces the Single-Concept Invariant (15-20 min pacing).
 */
export interface RoadmapLesson {
  id: string;
  order: number;
  title: string;
  slug: string;
  summary: string;
  description?: string;
  status: LessonStatus;
  estimatedMinutes: number;
  prerequisites: string[];
  conceptsCovered?: string[];
  isRemediation?: boolean;
  parentLessonId?: string;
}

/**
 * Top-level living curriculum container for a learning domain or topic.
 */
export interface CourseCurriculum {
  id: string;
  title?: string;
  topic: string;
  sourceType?: 'prompt' | 'pdf' | 'document';
  sourceName?: string;
  targetGoal?: string;
  learnerBaseline?: string;
  learnerLevel?: string;
  lessons: RoadmapLesson[];
  activeLessonId: string;
  teacherWalkthrough?: string;
  disableGate?: boolean;
  createdAt?: string;
  generatedAt?: string;
}

// ============================================================================
// 2. Dual Intake & Socratic Discovery (TASK-001, TASK-002, TASK-006)
// ============================================================================

/**
 * Diagnostic category classification for Socratic discovery questions.
 */
export type SocraticQuestionCategory = 'goal' | 'baseline' | 'depth' | 'style' | 'followup';

/**
 * Diagnostic question generated during Socratic discovery intake.
 */
export interface SocraticDiscoveryQuestion {
  id: string;
  question: string;
  spokenPrompt?: string;
  category?: SocraticQuestionCategory | string;
  conceptTarget?: string;
  difficulty?: 'L1' | 'L2' | 'L3' | string;
  options?: string[];
}

/**
 * Active multi-turn Socratic discovery interview session.
 */
export interface SocraticDiscoverySession {
  sessionId?: string;
  topic: string;
  questions: SocraticDiscoveryQuestion[];
  answers: Record<string, string>;
  isComplete?: boolean;
  status?: 'in_progress' | 'completed' | 'active' | string;
}

// ============================================================================
// 3. Midway Checkpoints & Dynamic Note Mutator (TASK-001, TASK-004, TASK-008)
// ============================================================================

/**
 * Automated evaluation result of a student's midway checkpoint response.
 */
export interface LessonCheckpointEvaluation {
  passed: boolean;
  score: number;
  feedback: string;
}

/**
 * Compatibility alias for checkpoint evaluation.
 */
export type CheckpointEvaluation = LessonCheckpointEvaluation;

/**
 * Interactive comprehension checkpoint embedded within a dynamic lesson note.
 */
export interface LessonCheckpoint {
  id: string;
  sectionIndex?: number;
  question: string;
  promptHint?: string;
  spokenPrompt?: string;
  expectedInsight?: string;
  studentAnswer?: string;
  learnerAnswer?: string;
  isAnswered?: boolean;
  evaluation?: LessonCheckpointEvaluation;
}

export type LessonQuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'matching' | 'short_answer';

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

/**
 * Mid-lesson interactive retrieval question embedded into note sections.
 * Supports Multiple Choice, True/False, Fill in Blank, Matching, and Short Answer.
 */
export interface LessonInlineQuestion {
  id: string;
  sectionIndex: number; // 1 to 4
  type?: LessonQuestionType; // default 'mcq'
  question: string;
  explanation: string;

  // Multiple Choice (type = 'mcq')
  options?: string[];
  correctOptionIndex?: number;
  userSelectedIndex?: number;

  // True / False (type = 'true_false')
  correctBoolean?: boolean;
  userSelectedBoolean?: boolean;

  // Fill in the Blank (type = 'fill_blank')
  // e.g. sentence: "In Raft, only the [blank] can issue AppendEntries RPCs."
  sentencePrefix?: string;
  sentenceSuffix?: string;
  acceptedAnswers?: string[]; // case-insensitive trimmed matches
  userTextAnswer?: string;

  // Matching (type = 'matching')
  matchingPairs?: MatchingPair[]; // original canonical pairs
  userMatches?: Record<string, string>; // leftId -> rightId

  // Short Answer (type = 'short_answer')
  sampleAnswer?: string;
  targetKeywords?: string[]; // key concepts expected in student's response

  isCorrect?: boolean;
}

/**
 * Backwards-compatibility alias for LessonInlineQuestion.
 */
export type LessonInlineMCQ = LessonInlineQuestion;

/**
 * Forbidden taboo words and prompt criteria for the oral Feynman Gate.
 */
export interface DynamicLessonNoteFeynmanCriteria {
  tabooWords: string[];
  challengeQuestion: string;
  spokenPrompt: string;
}

/**
 * 5-section pedagogical study note with embedded checkpoints, inline MCQs, and mutation blocks.
 * Sections 1, 2, and 3 must strictly adhere to the Zero-Bullet Invariant.
 */
export interface DynamicLessonNote {
  id?: string;
  lessonId: string;
  courseId?: string;
  title: string;

  // Section 1: Physical Analogy (ELI12) / Core Intuition
  mentalModel?: string;
  section1CoreIntuition?: string;

  // Section 2: Intuitive Purpose (Continuous analytical prose, zero bullets) / Formal Framework
  intuitivePurpose?: string;
  section2FormalFramework?: string;

  // Section 3: Operational Mechanism (Continuous analytical prose, zero bullets) / Concrete Case Study
  operationalMechanism?: string;
  section3ConcreteCaseStudy?: string;

  // Section 4: Boundary Traps & Architecture Artifact / Midway Checkpoint
  boundaryConditions?: string;
  artifactCode?: string;
  artifactLanguage?: string;
  checkpoints?: LessonCheckpoint[];
  section4MidwayCheckpoint?: LessonCheckpoint;

  // Section 5: Dynamic Mutations & Socratic Synthesis
  userNotes?: string[];
  mutations?: string[];
  section5SocraticSynthesis?: string;

  // Inline Multiple Choice Questions placed across sections
  inlineMCQs?: LessonInlineMCQ[];

  // Conversational teacher audio explanations (intuitive storytelling, zero verbatim reading)
  teacherExplanations?: {
    section1?: string;
    section2?: string;
    section3?: string;
    section4?: string;
    section5?: string;
  };

  // Proving grounds & Feynman Gate criteria
  provingGrounds?: AterQuizQuestion[];
  feynmanCriteria?: DynamicLessonNoteFeynmanCriteria;
}

export type SocraticTier = 'mini_lesson' | 'harder_probe' | 'refinement' | 'perfect_pass';

/**
 * A single question turn within the interactive Socratic Defense Gate.
 */
export interface GateQuestionTurn {
  id: string;
  index: number;
  isFollowUp?: boolean;
  parentQuestionId?: string;
  question: string;
  spokenPrompt: string;
  targetDimension: 'intuition' | 'mechanism' | 'boundary';
  studentAnswer?: string;
  score?: number;
  tier?: SocraticTier;
  miniLesson?: string;
  feedback?: string;
  misconceptions?: string[];
}

/**
 * Active interactive Socratic Defense Gate session.
 */
export interface SocraticGateSession {
  lessonId: string;
  lessonTitle: string;
  currentTurnIndex: number;
  turns: GateQuestionTurn[];
  status: 'in_progress' | 'passed' | 'failed';
  overallScore?: number;
  summaryFeedback?: string;
  remediationTopic?: string;
}

// ============================================================================
// 4. Socratic Feynman Gate (TASK-001, TASK-004, TASK-008)
// ============================================================================

/**
 * Oral or written Feynman Gate evaluation result.
 * Pass threshold is score >= 8; triggers micro-remediation if score < 8.
 */
export interface FeynmanEvaluation {
  score: number; // 1 to 10 scale
  passed: boolean; // score >= 8
  causalAccuracy: string;
  misconceptions: string[];
  spokenFeedback: string;
  feedback?: string;
  detectedMisconceptions?: string[];
  remediationNeeded?: boolean;
  remediationTopic?: string;
}

// ============================================================================
// 5. API Route Request & Response Contracts (TASK-002, TASK-003, TASK-004)
// ============================================================================

/**
 * POST /api/ingest/intake request payload.
 */
export interface IntakeRequest {
  type: 'prompt' | 'pdf';
  prompt?: string;
  pdfBase64?: string;
  fileName?: string;
}

/**
 * POST /api/ingest/intake response payload.
 */
export interface IntakeResponse {
  topic: string;
  initialSummary: string;
  coreConcepts?: string[];
  misconceptions?: string[];
  questions: SocraticDiscoveryQuestion[];
}

/**
 * POST /api/curriculum/generate request payload.
 */
export interface CurriculumGenerateRequest {
  topic: string;
  sourceType?: 'prompt' | 'pdf' | 'document';
  answers: Record<string, string>;
}

/**
 * POST /api/curriculum/generate response payload alias.
 */
export type CurriculumGenerateResponse = CourseCurriculum;

/**
 * POST /api/curriculum/remediate request payload.
 */
export interface CurriculumRemediateRequest {
  courseId: string;
  failedLessonId: string;
  misconceptions: string[];
  learnerExplanation?: string;
}

/**
 * POST /api/curriculum/remediate response payload.
 */
export interface CurriculumRemediateResponse {
  remediationLesson: RoadmapLesson;
  updatedLessons: RoadmapLesson[];
}

/**
 * POST /api/lesson/step request payload.
 */
export interface LessonStepRequest {
  lessonId: string;
  checkpointId: string;
  learnerInput: string;
  activeNoteContent?: Partial<DynamicLessonNote>;
}

/**
 * POST /api/lesson/step response payload.
 */
export interface LessonStepResponse {
  passed: boolean;
  spokenResponse: string;
  synthesizedNoteAddendum: string;
  nextSectionIndex?: number;
}

// ============================================================================
// 6. Legacy Domain Models (Preserved for backward compatibility)
// ============================================================================

/**
 * @deprecated Retained for ScholarXIV preprint search references and backward compatibility.
 */
export interface ScholarPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedDate: string;
  url?: string;
  doi?: string;
  citationCount?: number;
}

/**
 * @deprecated Quiz question structure used in legacy note proving grounds.
 */
export interface AterQuizQuestion {
  id: string;
  type: 'mcq' | 'writing' | 'trace' | 'scenario';
  difficulty: 'L1' | 'L2' | 'L3';
  question: string;
  options?: Record<string, string>;
  answer: string;
  explanation: string;
  requiredKeywords?: string[];
}

/**
 * @deprecated Use DynamicLessonNote for active cognitive learning engine workflows.
 */
export interface AterAtomicNote {
  title: string;
  sourcePaperId?: string;
  mentalModel: string;
  intuitivePurpose: string;
  operationalMechanism: string;
  boundaryConditions: string;
  artifactCode?: string;
  artifactLanguage?: string;
  provingGrounds: AterQuizQuestion[];
}

/**
 * Interactive Lab Artifact rendered inside the Canvas Lab (/lab).
 * Supports both legacy single-file HTML and advanced multi-file project workspaces.
 */
export interface LabArtifact {
  title: string;
  html: string;
  files?: Record<string, string>; // e.g. { 'index.html': '...', 'engine.js': '...', 'styles.css': '...' }
  entryPoint?: string; // default 'index.html'
  description?: string;
  timestamp?: string;
}

export * from './scholarxiv';

