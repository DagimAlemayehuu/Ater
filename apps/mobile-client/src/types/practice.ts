export interface AdvancedPracticeConfig {
  // 1. Context Mapping
  hubId: string;
  selectedAtomicNotes: string[]; // specific files, empty means all
  exclusionKeywords: string[]; // words the AI must not test
  timeBoundDays: number | null; // e.g., only notes from last 7 days
  prioritizeWeaknesses: boolean; // boolean to inject past low-score topics

  // 2. Modalities (Replaces generic 'Mixed' string)
  questionDistribution: {
    multipleChoice: number;
    trueFalse: number;
    shortAnswer: number;
    scenario: number;
    codeImplementation: number;
    clozeDeletion: number; // Fill in the blank
    findTheError: number; // Debugging
    matchingMatrix: number; // Drag and drop
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
  | "short_answer" 
  | "scenario" 
  | "code" 
  | "cloze" 
  | "find_error" 
  | "matching";

export interface BaseQuestion {
  id: number;
  type: QuestionType;
  difficulty: string;
  question: string;
  explanation: string;
  hints?: string[];
  confidenceWager?: "Low" | "Medium" | "High";
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

export interface ShortAnswerQuestion extends BaseQuestion {
  type: "short_answer";
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

export interface ClozeQuestion extends BaseQuestion {
  type: "cloze";
  textWithBlanks: string; // "The [[blank]] brown fox..."
  blanks: string[];
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

export type Question = 
  | MCQQuestion 
  | TrueFalseQuestion 
  | ShortAnswerQuestion 
  | ScenarioQuestion 
  | CodeQuestion 
  | ClozeQuestion 
  | FindErrorQuestion 
  | MatchingQuestion;
