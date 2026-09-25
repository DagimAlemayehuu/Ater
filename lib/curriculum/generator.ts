import type {
  CourseCurriculum,
  RoadmapLesson,
  PlannedSection,
  GroundedSource,
  UploadedDoc,
  CurriculumGenerateRequest,
  CurriculumRemediateRequest,
  CurriculumRemediateResponse,
} from '@/types';
import { extractJsonFromResponse } from '@/lib/ai/gemini';
import { cleanContinuousProse, stripEmojis } from './intake';
import { getViewerDemoCurriculum } from './viewerDemo';
import { gatherGroundedSources } from './sources';

/**
 * Generates meaningful, topic-derived planned sections and artifacts for a lesson.
 * Enforces 3 to 4 sections:
 * - Section 1: Real-world analogy / intuition (ELI12)
 * - Sections 2-3: The dynamic middle (concepts, mechanisms, code/diagrams)
 * - Final section: Failure modes, edge cases, and boundary checkpoint
 */
export function generateDefaultLessonSections(
  lessonId: string,
  lessonTitle: string,
  lessonOrder: number,
  isAm: boolean
): PlannedSection[] {
  if (isAm) {
    if (lessonOrder === 1) {
      return [
        {
          id: `${lessonId}-s1`,
          order: 1,
          title: 'ተጨባጭ ምሳሌ እና የመጀመሪያ ግንዛቤ',
          summary: `ስለ ${lessonTitle} መሰረታዊ ፅንሰ-ሀሳብ ቀላል እና ግልጽ የሆነ የእለት ተእለት ምሳሌ።`,
          artifactTypes: ['callout'],
        },
        {
          id: `${lessonId}-s2`,
          order: 2,
          title: 'መሰረታዊ መርሆች እና ቁልፍ ማዕቀፍ',
          summary: `የ ${lessonTitle} ቁልፍ ማዕቀፎች እና የንድፈ-ሀሳብ መሰረቶች።`,
          artifactTypes: ['table', 'code'],
        },
        {
          id: `${lessonId}-s3`,
          order: 3,
          title: 'የስርዓት ወሰን እና የመጀመሪያ ምዘና',
          summary: `የመሰረታዊ ግንዛቤ ማረጋገጫ እና የስርዓቱ ወሰኖች ትንተና።`,
          artifactTypes: ['mermaid'],
        },
      ];
    }
    if (lessonOrder === 2) {
      return [
        {
          id: `${lessonId}-s1`,
          order: 1,
          title: 'የስራ ፍሰት እና የሂደት ቅደም ተከተል',
          summary: `በ ${lessonTitle} ውስጥ የሚከናወኑ የዑደት ደረጃዎች እና የተግባር ፍሰት።`,
          artifactTypes: ['mermaid', 'timeline'],
        },
        {
          id: `${lessonId}-s2`,
          order: 2,
          title: 'የስቴት ሽግግር እና የውስጥ አሰራር',
          summary: `የ ${lessonTitle} ዝርዝር የአሰራር ሂደት እና የውስጥ ዳታ ለውጦች።`,
          artifactTypes: ['code', 'table'],
        },
        {
          id: `${lessonId}-s3`,
          order: 3,
          title: 'የአፈጻጸም ሚዛን እና ስሌቶች',
          summary: `የፍጥነት፣ የማህደረ-ትውስታ እና የስራ አፈጻጸም ትንተና።`,
          artifactTypes: ['math', 'callout'],
        },
      ];
    }
    if (lessonOrder === 3) {
      return [
        {
          id: `${lessonId}-s1`,
          order: 1,
          title: 'አስቸጋሪ የስህተት ሁኔታዎች እና ወጥመዶች',
          summary: `በ ${lessonTitle} ወቅት ሊያጋጥሙ የሚችሉ የተለመዱ ስህተቶች እና ጥንቃቄዎች።`,
          artifactTypes: ['callout', 'code'],
        },
        {
          id: `${lessonId}-s2`,
          order: 2,
          title: 'የደህንነት ዋስትናዎች እና የስርዓት ጥበቃ',
          summary: `ስርዓቱ ሳይበላሽ እንዲቀጥል የሚረዱ የጥበቃ መርሆች እና ህጎች።`,
          artifactTypes: ['code', 'table'],
        },
        {
          id: `${lessonId}-s3`,
          order: 3,
          title: 'የድንበር ፈተና እና የማረጋገጫ ነጥብ',
          summary: `በአስቸጋሪ ሁኔታዎች ወቅት ስርዓቱ የሚሰጠውን ምላሽ መፈተሽ።`,
          artifactTypes: ['mermaid'],
        },
      ];
    }
    return [
      {
        id: `${lessonId}-s1`,
        order: 1,
        title: 'የስራ ላይ አተገባበር እና ውህደት',
        summary: `የ ${lessonTitle}ን እውቀት በተግባራዊ የስራ ስርዓቶች ላይ ማዋል የሚያስችል ማዕቀፍ።`,
        artifactTypes: ['mermaid', 'code'],
      },
      {
        id: `${lessonId}-s2`,
        order: 2,
        title: 'የምህንድስና ውሳኔዎች እና አማራጮች',
        summary: `የተለያዩ ቴክኒካዊ ውሳኔዎችን ጥቅምና ጉዳት ማወዳደር።`,
        artifactTypes: ['table'],
      },
      {
        id: `${lessonId}-s3`,
        order: 3,
        title: 'አጠቃላይ ውህደት እና የመጨረሻ ምዘና',
        summary: `ሙሉ እውቀቱን ወደ ተግባራዊ ውሳኔዎች በማዋሃድ ስርዓቱን ማጠናከር።`,
        artifactTypes: ['callout', 'math'],
      },
    ];
  }

  // English default sections (3-4 sections per lesson)
  if (lessonOrder === 1) {
    return [
      {
        id: `${lessonId}-s1`,
        order: 1,
        title: 'Physical Analogy & Intuitive Primer',
        summary: `Real-world analogy and intuitive mental model breaking down ${lessonTitle} for practical comprehension.`,
        artifactTypes: ['callout'],
      },
      {
        id: `${lessonId}-s2`,
        order: 2,
        title: 'Core Axioms & Conceptual Framework',
        summary: `Foundational primitives, essential terminology, and conceptual schema underpinning ${lessonTitle}.`,
        artifactTypes: ['table', 'code'],
      },
      {
        id: `${lessonId}-s3`,
        order: 3,
        title: 'Operational Scope & Boundary Verification',
        summary: `Key boundary rules, baseline invariants, and interactive comprehension check on the core premise.`,
        artifactTypes: ['mermaid'],
      },
    ];
  }

  if (lessonOrder === 2) {
    return [
      {
        id: `${lessonId}-s1`,
        order: 1,
        title: 'Execution Lifecycle & Dynamic Analogy',
        summary: `Step-by-step intuition tracing how ${lessonTitle} works under the hood from start to finish.`,
        artifactTypes: ['mermaid', 'timeline'],
      },
      {
        id: `${lessonId}-s2`,
        order: 2,
        title: 'State Transitions & Internal Logic',
        summary: `Deep dive into internal data structures, state machines, and operational transitions of ${lessonTitle}.`,
        artifactTypes: ['code', 'table'],
      },
      {
        id: `${lessonId}-s3`,
        order: 3,
        title: 'Performance Dynamics & Algorithmic Limits',
        summary: `Quantitative analysis, time and space complexity, and performance formulas for ${lessonTitle}.`,
        artifactTypes: ['math', 'callout'],
      },
    ];
  }

  if (lessonOrder === 3) {
    return [
      {
        id: `${lessonId}-s1`,
        order: 1,
        title: 'Pathological Edge Cases & Failure Traps',
        summary: `Critical anti-patterns, edge condition anomalies, and failure scenarios in ${lessonTitle}.`,
        artifactTypes: ['callout', 'code'],
      },
      {
        id: `${lessonId}-s2`,
        order: 2,
        title: 'Defensive Invariants & Recovery Mechanics',
        summary: `Defensive guards, invariant assertions, and recovery patterns ensuring system stability.`,
        artifactTypes: ['code', 'table'],
      },
      {
        id: `${lessonId}-s3`,
        order: 3,
        title: 'Boundary Evaluation & Resiliency Checkpoint',
        summary: `Interactive verification testing resilience and edge-case behavior under adverse conditions.`,
        artifactTypes: ['mermaid'],
      },
    ];
  }

  return [
    {
      id: `${lessonId}-s1`,
      order: 1,
      title: 'Production Architecture & Ecosystem Integration',
      summary: `Integrating ${lessonTitle} into modern production environments alongside real-world infrastructure.`,
      artifactTypes: ['mermaid', 'code'],
    },
    {
      id: `${lessonId}-s2`,
      order: 2,
      title: 'Engineering Compromises & Trade-off Matrix',
      summary: `Comparing alternative architectural choices with concrete pros, cons, and performance trade-offs.`,
      artifactTypes: ['table'],
    },
    {
      id: `${lessonId}-s3`,
      order: 3,
      title: 'Capstone Synthesis & Mastery Defense',
      summary: `Holistic end-to-end synthesis and defensive reasoning validating mastery of ${lessonTitle}.`,
      artifactTypes: ['callout', 'math'],
    },
  ];
}

/**
 * Deterministically constructs a fallback course curriculum for a given topic.
 * Enforces single-concept lessons with 15-20 min pacing and zero emojis.
 */
export function generateFallbackCurriculum(
  topic: string,
  targetGoal?: string,
  learnerBaseline?: string,
  language: 'en' | 'am' = 'en',
  sources?: GroundedSource[]
): CourseCurriculum {
  const isAm = language === 'am';
  let cleanTopic = stripEmojis(topic || '').replace(/[_-]/g, ' ').trim();

  if (cleanTopic.toLowerCase().includes('viewer demo') || cleanTopic.toLowerCase() === 'viewer demo') {
    return getViewerDemoCurriculum(language);
  }
  if (isAm) {
    if (!cleanTopic || !/[\u1200-\u137F]/.test(cleanTopic)) {
      cleanTopic = cleanTopic ? `ትምህርት፡ ${cleanTopic}` : 'መሰረታዊ የትምህርት ርዕስ';
    }
  } else if (!cleanTopic) {
    cleanTopic = 'Core Foundational Principles';
  }
  const title = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);
  const courseSlug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'topic';
  const courseId = `course-${courseSlug}`;

  const lesson1Id = `${courseId}-l1`;
  const lesson2Id = `${courseId}-l2`;
  const lesson3Id = `${courseId}-l3`;
  const lesson4Id = `${courseId}-l4`;

  const lessons: RoadmapLesson[] = isAm
    ? [
        {
          id: lesson1Id,
          order: 1,
          title: `${title}፡ መሰረታዊ መርሆች እና ቁልፍ ግንዛቤ`,
          slug: '01_foundational_principles',
          summary: `ስለ ${title} መሰረታዊ ፅንሰ-ሀሳቦች፣ የመጀመሪያ መርሆች እና የስራ ማዕቀፍ።`,
          description: `የ ${title}ን የመጀመሪያ መርሆች እና ቁልፍ ሚዛኖችን በዝርዝር ያስረዳል።`,
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['የመጀመሪያ መርሆች', 'መሰረታዊ አሰራር', 'ፅንሰ-ሀሳባዊ ሞዴሎች'],
          isRemediation: false,
          sections: generateDefaultLessonSections(lesson1Id, `${title}፡ መሰረታዊ መርሆች`, 1, true),
        },
        {
          id: lesson2Id,
          order: 2,
          title: `${title}፡ የአሰራር ሂደት እና የስራ ዑደት`,
          slug: '02_operational_mechanism',
          summary: `በ ${title} ውስጥ የሚከናወኑ የዑደት ደረጃዎች፣ የስራ ሂደቶች እና የስቴት ሽግግሮች።`,
          description: `የ ${title}ን ዝርዝር አሰራር፣ የውስጥ እንቅስቃሴ እና የስራ ፍሰት በጥልቀት ይዳስሳል።`,
          status: 'locked',
          estimatedMinutes: 20,
          prerequisites: [lesson1Id],
          conceptsCovered: ['የስራ ፍሰት', 'የስቴት ሽግግር', 'የአሰራር ዑደት'],
          isRemediation: false,
          sections: generateDefaultLessonSections(lesson2Id, `${title}፡ የአሰራር ሂደት`, 2, true),
        },
        {
          id: lesson3Id,
          order: 3,
          title: `${title}፡ የስህተት ሁኔታዎች እና የድንበር ወጥመዶች`,
          slug: '03_boundary_invariants',
          summary: `በ ${title} ውስጥ የሚያጋጥሙ ወሳኝ የስህተት ሁኔታዎች፣ የድንበር ወጥመዶች እና የደህንነት ወሰኖች ትንተና።`,
          description: `በድንበር ሁኔታዎች ወቅት የሚፈጠሩ ችግሮችን እና የስርዓት መበላሸትን የሚከላከሉ መርሆችን ይመረምራል።`,
          status: 'locked',
          estimatedMinutes: 20,
          prerequisites: [lesson2Id],
          conceptsCovered: ['የስህተት መቋቋም', 'የደህንነት ዋስትናዎች', 'የድንበር ሁኔታዎች'],
          isRemediation: false,
          sections: generateDefaultLessonSections(lesson3Id, `${title}፡ የድንበር ወጥመዶች`, 3, true),
        },
        {
          id: lesson4Id,
          order: 4,
          title: `${title}፡ አጠቃላይ ውህደት እና የምህንድስና ሚዛኖች`,
          slug: '04_architectural_synthesis',
          summary: `የተግባር ፈተናዎች፣ የንድፍ ውሳኔዎች እና የ ${title} አጠቃላይ ውህደት።`,
          description: `ሙሉ እውቀቱን ወደ ተግባራዊ የምህንድስና ውሳኔዎች በማዋሃድ ስርዓቱን ያጠነክራል።`,
          status: 'locked',
          estimatedMinutes: 15,
          prerequisites: [lesson3Id],
          conceptsCovered: ['የስርዓት ንድፍ', 'የምህንድስና ሚዛኖች', 'የስራ ላይ ጥንካሬ'],
          isRemediation: false,
          sections: generateDefaultLessonSections(lesson4Id, `${title}፡ አጠቃላይ ውህደት`, 4, true),
        },
      ]
    : [
        {
          id: lesson1Id,
          order: 1,
          title: `${title}: Foundational Principles & Core Intuition`,
          slug: '01_foundational_principles',
          summary: `Fundamental mental models, core axioms, and conceptual architecture for ${title}.`,
          description: `Establishes prerequisite intuition, fundamental primitives, and architectural baselines for ${title}.`,
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Foundational Axioms', 'Core Mechanics', 'Mental Models'],
          isRemediation: false,
          sections: generateDefaultLessonSections(lesson1Id, `${title}: Foundational Principles`, 1, false),
        },
        {
          id: lesson2Id,
          order: 2,
          title: `${title}: Operational Mechanism & Execution Dynamics`,
          slug: '02_operational_mechanism',
          summary: `Detailed causal mechanics, step-by-step data flows, and runtime behavior in ${title}.`,
          description: `Deep dive into internal execution workflows, state transformations, and operational dynamics of ${title}.`,
          status: 'locked',
          estimatedMinutes: 20,
          prerequisites: [lesson1Id],
          conceptsCovered: ['Execution Dynamics', 'Runtime Lifecycle', 'State Transitions'],
          isRemediation: false,
          sections: generateDefaultLessonSections(lesson2Id, `${title}: Operational Mechanism`, 2, false),
        },
        {
          id: lesson3Id,
          order: 3,
          title: `${title}: Boundary Traps & Failure Modes`,
          slug: '03_boundary_invariants',
          summary: `Analysis of critical failure conditions, edge cases, and safety invariant boundaries in ${title}.`,
          description: `Dissects pathological edge conditions, common design missteps, and defensive safety guarantees for ${title}.`,
          status: 'locked',
          estimatedMinutes: 20,
          prerequisites: [lesson2Id],
          conceptsCovered: ['Boundary Traps', 'Failure Isolation', 'Safety Guarantees'],
          isRemediation: false,
          sections: generateDefaultLessonSections(lesson3Id, `${title}: Boundary Traps`, 3, false),
        },
        {
          id: lesson4Id,
          order: 4,
          title: `${title}: Real-World Synthesis & Trade-offs`,
          slug: '04_architectural_synthesis',
          summary: `Production considerations, architectural compromises, and practical engineering synthesis for ${title}.`,
          description: `Synthesizes learned mental models into robust architectural decision-making and practical engineering trade-offs.`,
          status: 'locked',
          estimatedMinutes: 15,
          prerequisites: [lesson3Id],
          conceptsCovered: ['Architectural Trade-offs', 'Production Design', 'Engineering Synthesis'],
          isRemediation: false,
          sections: generateDefaultLessonSections(lesson4Id, `${title}: Real-World Synthesis`, 4, false),
        },
      ];

  const teacherWalkthrough = isAm
    ? `ይህ ለ ${title} የተዘጋጀው የትምህርት ካርታ ነው። በመጀመሪያ መሰረታዊ ፅንሰ-ሀሳቦችን እንረዳለን፣ በመቀጠል ዝርዝር አሰራሩን እንመለከታለን፣ ከዚያም የተለመዱ የስህተት ወጥመዶችን ከመረመርን በኋላ በተግባራዊ ምሳሌዎች እናጠናቅቃለን። በዚህ ከተስማሙ ኮርሱን ይጀምሩ፣ ወይም ማስተካከል የሚፈልጉትን በአስተያየት መስጫው ያሳውቁን።`
    : `Here is your learning roadmap for ${title}. We will start with the basic ideas, look closely at how it works, examine common mistakes and edge cases, and finish with practical real-world examples. If this sounds good, you can start the course now or leave a note below to adjust the plan.`;

  return {
    id: courseId,
    title: isAm ? `${title} ሙሉ ትምህርት` : `${title} Mastery`,
    topic: title,
    sourceType: 'prompt',
    sources: sources || [],
    targetGoal: targetGoal || (isAm ? `የ ${title}ን ዋና አሰራር እና የምህንድስና መርሆች መካን` : `Master architectural and operational dynamics of ${title}`),
    learnerBaseline: learnerBaseline || (isAm ? `የኮምፒውተር ሳይንስ መሰረታዊ እውቀት ያለው ተማሪ` : 'Intermediate engineer with core computer science literacy'),
    lessons,
    activeLessonId: lesson1Id,
    teacherWalkthrough,
    createdAt: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
  };
}

export interface GenerateCurriculumOptions {
  topic: string;
  answers?: Record<string, string>;
  sourceType?: 'prompt' | 'pdf' | 'document';
  sourceName?: string;
  sources?: GroundedSource[];
  files?: UploadedDoc[];
  useMock?: boolean;
  throwOnError?: boolean;
  language?: 'en' | 'am';
}

/**
 * Generates an atomic, sequenced CourseCurriculum adhering to the Single-Concept Invariant (15-20 min lessons).
 * Uses gemini-3.5-flash-lite with thinkingConfig: { thinkingBudget: 1 } and maxOutputTokens: 1200 or returns a deterministic structured curriculum.
 */
export async function generateCourseCurriculum(
  topicOrOptions: string | GenerateCurriculumOptions,
  answersArg?: Record<string, string>
): Promise<CourseCurriculum> {
  let topic = '';
  let answers: Record<string, string> = {};
  let sourceType: 'prompt' | 'pdf' | 'document' = 'prompt';
  let sourceName = '';
  let sourcesArg: GroundedSource[] | undefined = undefined;
  let filesArg: UploadedDoc[] | undefined = undefined;
  let useMock = false;
  let throwOnError = false;
  let language: 'en' | 'am' = 'en';

  if (typeof topicOrOptions === 'object' && topicOrOptions !== null) {
    topic = topicOrOptions.topic || '';
    answers = topicOrOptions.answers || {};
    sourceType = topicOrOptions.sourceType || 'prompt';
    sourceName = topicOrOptions.sourceName || '';
    sourcesArg = topicOrOptions.sources;
    filesArg = topicOrOptions.files;
    useMock = !!topicOrOptions.useMock;
    throwOnError = !!topicOrOptions.throwOnError;
    language = topicOrOptions.language === 'am' ? 'am' : 'en';
  } else {
    topic = typeof topicOrOptions === 'string' ? topicOrOptions : '';
    answers = answersArg || {};
  }

  const isAm = language === 'am';
  const cleanTopic = stripEmojis(topic).trim();
  if (!cleanTopic) {
    throw new Error('Missing topic: a valid topic string is required to generate a curriculum');
  }

  if (cleanTopic.toLowerCase().includes('viewer demo') || cleanTopic.toLowerCase() === 'viewer demo') {
    return getViewerDemoCurriculum(language);
  }

  // 1. Gather Grounded Sources
  const sources: GroundedSource[] =
    sourcesArg && sourcesArg.length > 0
      ? sourcesArg
      : await gatherGroundedSources(cleanTopic, filesArg, answers, language);

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  if (useMock || !apiKey) {
    return generateFallbackCurriculum(cleanTopic, answers.q1, answers.q2, language, sources);
  }

  const answersFormatted = Object.entries(answers)
    .map(([k, v]) => `Question [${k}]: "${stripEmojis(v)}"`)
    .join('\n');

  const sourcesFormatted = sources.length > 0
    ? sources.map((s, idx) => `Source [${idx + 1}] (${s.type}): "${s.title}"${s.url ? ` <${s.url}>` : ''}${s.snippet ? `\n   Context/Snippet: ${s.snippet}` : ''}`).join('\n')
    : 'Authoritative foundational documentation and canonical reference sources.';

  const languagePromptDirective = isAm
    ? `CRITICAL LANGUAGE INVARIANT:
You MUST author the title, targetGoal, learnerBaseline, and all lesson titles, summaries, descriptions, and conceptsCovered strictly in natural, articulate Amharic (አማርኛ) using Ge'ez script. Zero English letters or latin script.`
    : `CRITICAL LANGUAGE INVARIANT:
Author all fields in clear, articulate English.`;

    const courseSlug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'topic';
    const courseId = `course-${courseSlug}`;

    const systemPrompt = `You are the Ater Living Curriculum Architect.
Your task is to generate a sequenced, single-concept curriculum roadmap for a learner studying: "${cleanTopic}".

${languagePromptDirective}

Grounded Authoritative Sources of Truth:
${sourcesFormatted}

Learner Diagnostic Inputs:
${answersFormatted || 'Standard intermediate engineering baseline.'}

CRITICAL ARCHITECTURAL INVARIANTS:
1. Grounding Invariant: The curriculum must be 100% dynamically derived from the provided Grounded Sources of Truth and the learner's diagnostic answers.
2. "Single-Concept Invariant": Each lesson must address strictly ONE atomic concept that can be deeply digested in 15 to 20 minutes (estimatedMinutes between 15 and 20).
3. Generate between 3 and 6 ordered lessons.
4. Lessons must be topologically ordered (1, 2, 3...):
   - First lesson: status must be "active", prerequisites must be empty [].
   - Subsequent lessons: status must be "locked", prerequisites must reference the preceding lesson ID.
5. Unique Lesson ID Convention:
   - "id": "${courseId}-l1", "${courseId}-l2", "${courseId}-l3", etc.
6. Lesson Sections Architecture:
   - For EACH lesson, plan 3 to 4 concrete sections:
     * Section 1: Real-world analogy / intuition (ELI12).
     * Sections 2-3: The dynamic middle (concepts, mechanisms, code/diagrams).
     * Final section: Failure modes, edge cases, and boundary checkpoint.
   - For EACH section, specify planned "artifactTypes" selected from: ["code", "mermaid", "math", "table", "timeline", "callout"].
7. STRICT INVARIANT: ZERO EMOJIS in any string field.
8. STRICT INVARIANT: All summary, description, and section fields must use continuous analytical prose with strictly zero bullet points, asterisks, or numbered list prefixes.

Respond with ONLY valid JSON matching this schema:
{
  "title": "string",
  "topic": "${cleanTopic}",
  "targetGoal": "string",
  "learnerBaseline": "string",
  "lessons": [
    {
      "id": "${courseId}-l1",
      "order": 1,
      "title": "string",
      "slug": "01_slug",
      "summary": "string",
      "description": "string",
      "status": "active",
      "estimatedMinutes": 15,
      "prerequisites": [],
      "conceptsCovered": ["concept"],
      "isRemediation": false,
      "sections": [
        {
          "order": 1,
          "title": "string",
          "summary": "string",
          "artifactTypes": ["callout"]
        },
        {
          "order": 2,
          "title": "string",
          "summary": "string",
          "artifactTypes": ["code", "table"]
        },
        {
          "order": 3,
          "title": "string",
          "summary": "string",
          "artifactTypes": ["mermaid"]
        },
        {
          "order": 4,
          "title": "string",
          "summary": "string",
          "artifactTypes": ["callout", "math"]
        }
      ]
    }
  ],
  "teacherWalkthrough": "A spoken script by the AI teacher. First, introduce the course and target outcome. Then, walk sequentially through each generated lesson by title and give a clear, simple 1-sentence explanation of what will be learned and why it matters. Conclude by inviting the learner to approve and begin lesson 1 or type adjustments."
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 2500,
            thinkingConfig: {
              thinkingBudget: 1,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      if (throwOnError) throw new Error(`Gemini curriculum API returned ${response.status}`);
      return generateFallbackCurriculum(cleanTopic, answers.q1, answers.q2, language, sources);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      if (throwOnError) throw new Error('Empty response from Gemini curriculum model');
      return generateFallbackCurriculum(cleanTopic, answers.q1, answers.q2, language, sources);
    }

    const parsed = extractJsonFromResponse(rawText);
    const rawLessons: any[] = Array.isArray(parsed.lessons) ? parsed.lessons : [];
    if (rawLessons.length === 0) {
      return generateFallbackCurriculum(cleanTopic, answers.q1, answers.q2, language, sources);
    }

    const normalizedLessons: RoadmapLesson[] = rawLessons.map((l, idx) => {
      const order = idx + 1;
      const lessonId = `${courseId}-l${order}`;
      const titleStr = stripEmojis(l.title || `Module ${order}`);
      const slug = l.slug || `${String(order).padStart(2, '0')}_${titleStr.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      const summary = cleanContinuousProse(stripEmojis(l.summary || `Core principles of ${titleStr}.`));
      const description = cleanContinuousProse(stripEmojis(l.description || summary));
      const estimatedMinutes = Math.min(25, Math.max(10, Number(l.estimatedMinutes) || 15));
      const prereqs = idx === 0 ? [] : [`${courseId}-l${order - 1}`];

      // Parse and normalize planned sections
      const validArtifactTypes: ('code' | 'mermaid' | 'math' | 'table' | 'timeline' | 'callout')[] = [
        'code', 'mermaid', 'math', 'table', 'timeline', 'callout'
      ];
      const rawSections = Array.isArray(l.sections) ? l.sections : [];
      const sections: PlannedSection[] = rawSections.length > 0
        ? rawSections.map((s: any, sIdx: number) => {
            const sOrder = Number(s.order) || sIdx + 1;
            const arts = Array.isArray(s.artifactTypes)
              ? (s.artifactTypes as string[])
                  .map((a) => String(a).toLowerCase().trim())
                  .filter((a): a is ('code' | 'mermaid' | 'math' | 'table' | 'timeline' | 'callout') =>
                    validArtifactTypes.includes(a as any)
                  )
              : [];
            return {
              id: `${lessonId}-s${sOrder}`,
              order: sOrder,
              title: cleanContinuousProse(stripEmojis(s.title || `Section ${sOrder}`)),
              summary: cleanContinuousProse(stripEmojis(s.summary || `Planned section covering ${titleStr}.`)),
              artifactTypes: arts.length > 0 ? arts : (sOrder === 1 ? ['callout'] : ['code', 'table']),
            };
          })
        : generateDefaultLessonSections(lessonId, titleStr, order, isAm);

      return {
        id: lessonId,
        order,
        title: titleStr,
        slug,
        summary,
        description,
        status: idx === 0 ? 'active' : 'locked',
        estimatedMinutes,
        prerequisites: prereqs,
        conceptsCovered: Array.isArray(l.conceptsCovered) ? l.conceptsCovered.map(stripEmojis) : [titleStr],
        isRemediation: false,
        sections,
      };
    });

    const fallbackWalkthrough = isAm
      ? `ይህ የተዘጋጀው የ ${cleanTopic} የትምህርት ካርታ ነው። በዚህ ጉዞ ውስጥ ዋና ዋና ፅንሰ-ሀሳቦችን፣ የአሰራር ዑደቶችን እና የደህንነት ወሰኖችን ደረጃ በደረጃ እንሸፍናለን። የተዘጋጀውን ካርታ ይገምግሙ ወይም ማስተካከል የሚፈልጉትን ማንኛውንም ለውጥ ያሳውቁን።`
      : `Here is your calibrated curriculum roadmap for ${cleanTopic}. We will progressively master the core mental models, operational cycles, and boundary trade-offs. Review your roadmap, and share any modifications or click approve to begin.`;

    const teacherWalkthrough = cleanContinuousProse(stripEmojis(parsed.teacherWalkthrough || fallbackWalkthrough));

    return {
      id: courseId,
      title: stripEmojis(parsed.title || `${cleanTopic} Curriculum`),
      topic: cleanTopic,
      sourceType,
      sourceName,
      sources,
      targetGoal: cleanContinuousProse(stripEmojis(parsed.targetGoal || `Master ${cleanTopic}`)),
      learnerBaseline: cleanContinuousProse(stripEmojis(parsed.learnerBaseline || 'Intermediate')),
      lessons: normalizedLessons,
      activeLessonId: normalizedLessons[0]?.id || `${courseId}-l1`,
      teacherWalkthrough,
      createdAt: new Date().toISOString(),
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (throwOnError) throw err;
    return generateFallbackCurriculum(cleanTopic, answers.q1, answers.q2, language, sources);
  }
}

export interface GenerateRemediationOptions {
  courseId?: string;
  failedLesson: RoadmapLesson;
  misconceptions: string[];
  learnerExplanation?: string;
  useMock?: boolean;
  throwOnError?: boolean;
}

/**
 * Generates an atomic micro-remediation sub-lesson targeted specifically at bridging
 * conceptual misconceptions diagnosed during a failed Feynman evaluation.
 */
export async function generateRemediationLesson(
  options: GenerateRemediationOptions
): Promise<RoadmapLesson> {
  const { failedLesson, misconceptions, learnerExplanation, useMock, throwOnError } = options;

  const parentId = failedLesson.id;
  const parentOrder = failedLesson.order;
  const subOrder = parentOrder + 0.5;
  const remediationId = `${parentId}b`;
  const cleanMisconceptions = misconceptions.map(stripEmojis).filter(Boolean);

  const cleanParentTitle = stripEmojis(failedLesson.title);
  const remediationTitle = `Remediation: ${cleanParentTitle} Clarification`;
  const slug = `${failedLesson.slug}_remediation`;

  const fallbackSummary = cleanContinuousProse(
    `Targeted micro-remediation clarifying core misconceptions in ${cleanParentTitle}. Addresses ${cleanMisconceptions.join(', ') || 'causal mechanics and boundary limits'}.`
  );

  const fallbackLesson: RoadmapLesson = {
    id: remediationId,
    order: subOrder,
    title: remediationTitle,
    slug,
    summary: fallbackSummary,
    description: `Focussed remedial exercise isolating and resolving diagnosed misunderstandings in ${cleanParentTitle}.`,
    status: 'remediation',
    estimatedMinutes: 5,
    prerequisites: failedLesson.prerequisites,
    conceptsCovered: cleanMisconceptions.length > 0 ? cleanMisconceptions : [`${cleanParentTitle} Diagnostics`],
    isRemediation: true,
    parentLessonId: parentId,
  };

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  if (useMock || !apiKey) {
    return fallbackLesson;
  }

  const systemPrompt = `You are the Ater Adaptive Remediation Engine.
A learner failed the oral Feynman Gate on the following lesson:
Parent Lesson: "${cleanParentTitle}" (${failedLesson.summary})
Diagnosed Misconceptions: ${JSON.stringify(cleanMisconceptions)}
${learnerExplanation ? `Learner's flawed explanation: "${stripEmojis(learnerExplanation)}"` : ''}

Generate a concise micro-remediation sub-lesson that addresses ONLY these specific misconceptions.
CRITICAL INVARIANTS:
1. Single concept: Laser-focused on the precise misconception failure points.
2. Estimated time: 5 minutes.
3. Zero emojis.
4. Continuous analytical prose only (zero bullets).

Respond with ONLY valid JSON:
{
  "title": "string",
  "summary": "string",
  "description": "string",
  "conceptsCovered": ["concept"]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 1 },
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      if (throwOnError) throw new Error(`Gemini remediation API returned ${response.status}`);
      return fallbackLesson;
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return fallbackLesson;

    const parsed = extractJsonFromResponse(rawText);
    const title = stripEmojis(parsed.title || remediationTitle);
    const summary = cleanContinuousProse(stripEmojis(parsed.summary || fallbackSummary));
    const description = cleanContinuousProse(stripEmojis(parsed.description || summary));

    return {
      id: remediationId,
      order: subOrder,
      title,
      slug,
      summary,
      description,
      status: 'remediation',
      estimatedMinutes: 5,
      prerequisites: failedLesson.prerequisites,
      conceptsCovered: Array.isArray(parsed.conceptsCovered) ? parsed.conceptsCovered.map(stripEmojis) : cleanMisconceptions,
      isRemediation: true,
      parentLessonId: parentId,
    };
  } catch (err) {
    if (throwOnError) throw err;
    return fallbackLesson;
  }
}

/**
 * Splices a remediation lesson directly into a lesson array immediately following the failed lesson.
 * Sets the failed lesson's status to 'remediation' if not mastered, and returns the newly sequenced list.
 */
export function spliceRemediationLesson(
  lessons: RoadmapLesson[],
  failedLessonId: string,
  remediationLesson: RoadmapLesson
): RoadmapLesson[] {
  const result: RoadmapLesson[] = [];
  let found = false;

  for (const lesson of lessons) {
    if (lesson.id === failedLessonId) {
      found = true;
      // Mark failed lesson as remediation state
      result.push({
        ...lesson,
        status: 'remediation',
      });
      // Splice remediation sub-lesson immediately after
      result.push({
        ...remediationLesson,
        order: lesson.order + 0.5,
        parentLessonId: lesson.id,
        isRemediation: true,
        status: 'active',
      });
    } else {
      result.push(lesson);
    }
  }

  // If failedLessonId wasn't found, append
  if (!found) {
    result.push({
      ...remediationLesson,
      isRemediation: true,
      status: 'active',
    });
  }

  return result;
}
