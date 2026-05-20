export interface AdvancedPracticeConfig {
  // 1. Context Mapping
  hubId: string;
  selectedAtomicNotes: string[]; // specific files, empty means all
  timeBoundDays: number | null; // e.g., only notes from last 7 days
  prioritizeWeaknesses: boolean; // boolean to inject past low-score topics

  // 2. Modalities (Replaces generic 'Mixed' string)
  questionDistribution: {
    mcq: number;
    true_false: number;
    writing: number;
    fill_in: number;
    matching: number;
    order: number;
    debug: number;
    synthesis: number;
    trace: number;
    calculation: number;
    data_analysis: number;
    scenario: number;
    code: number;
  };

  // 3. Cognitive Constraints
  difficulty: "L0" | "L1" | "L2" | "L3" | "L4" | "Mixed"; 
  distractorPlausibility: "Low" | "Medium" | "High"; // For MCQs
  injectTrickAnswers: boolean; // Randomly add "None of the above"

  // 4. Temporal Dynamics
  globalTimeLimitMinutes: number | null; // Sprint mode
  perQuestionTimeLimitSeconds: number | null; // Pressure mode
  progressionGatekeeper: boolean; // Must get right to advance

  // 5. AI Behaviors
  gradingStrictness: "Lenient" | "Strict";
  enableProgressiveHints: boolean;
  requireConfidenceWager: boolean; // Metacognition rating before answer
}

export type QuestionType = 
  | "mcq" 
  | "true_false" 
  | "writing" 
  | "fill_in"
  | "matching"
  | "order"
  | "debug"
  | "synthesis"
  | "trace"
  | "scenario"
  | "code"
  | "calculation"
  | "data_analysis"
  | "find_error";

export interface BaseQuestion {
  id: number;
  note_id?: string;
  type: QuestionType;
  difficulty: string;
  question: string;
  explanation: string;
  hints?: string[];
  confidenceWager?: "Low" | "Medium" | "High";
  required_keywords?: string[];
  answer?: string | string[] | boolean | Record<string, string>;
  options?: Record<string, string>;
  steps?: string[];
  content?: string;
  codeSnippet?: string;
  language?: string;
  textWithBlanks?: string;
  text_with_blanks?: string;
  pairs?: Array<{ left: string; right: string }>;
  buggyCode?: string;
}

export interface MCQQuestion extends BaseQuestion {
  type: "mcq";
  options: Record<string, string>;
  answer: string;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: "true_false";
  answer: string;
}

export interface WritingQuestion extends BaseQuestion {
  type: "writing";
  answer: string;
}

export interface ScenarioQuestion extends BaseQuestion {
  type: "scenario";
  answer: string;
}

export interface CodeQuestion extends BaseQuestion {
  type: "code";
  codeSnippet: string;
  answer: string;
  language: string;
}

export interface FillInQuestion extends BaseQuestion {
  type: "fill_in";
  textWithBlanks: string;
  answer: string[];
}

export interface FindErrorQuestion extends BaseQuestion {
  type: "find_error";
  buggyCode: string;
  answer: string;
}

export interface MatchingQuestion extends BaseQuestion {
  type: "matching";
  pairs: Array<{ left: string; right: string }>;
}

export interface OrderQuestion extends BaseQuestion {
  type: "order";
  steps: string[];
  answer: string[]; // The correct order of steps
}

export interface DebugQuestion extends BaseQuestion {
  type: "debug";
  content: string; // The buggy snippet
  answer: string;
}

export interface SynthesisQuestion extends BaseQuestion {
  type: "synthesis";
  answer: string;
}

export interface TraceQuestion extends BaseQuestion {
  type: "trace";
  answer: string;
}

export interface CalculationQuestion extends BaseQuestion {
  type: "calculation";
  content: string;
  answer: string;
}

export interface DataAnalysisQuestion extends BaseQuestion {
  type: "data_analysis";
  content: string;
  answer: string;
}

export type Question = 
  | MCQQuestion 
  | TrueFalseQuestion 
  | WritingQuestion 
  | FillInQuestion
  | MatchingQuestion
  | OrderQuestion
  | DebugQuestion
  | SynthesisQuestion
  | ScenarioQuestion
  | CodeQuestion
  | FindErrorQuestion
  | TraceQuestion
  | CalculationQuestion
  | DataAnalysisQuestion;
