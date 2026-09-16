import type {
  CourseCurriculum,
  RoadmapLesson,
  CurriculumGenerateRequest,
  CurriculumRemediateRequest,
  CurriculumRemediateResponse,
} from '@/types';
import { extractJsonFromResponse } from '@/lib/ai/gemini';
import { cleanContinuousProse, stripEmojis } from './intake';
import { getViewerDemoCurriculum } from './viewerDemo';

/**
 * Deterministically constructs a fallback course curriculum for a given topic.
 * Enforces single-concept lessons with 15-20 min pacing and zero emojis.
 */
export function generateFallbackCurriculum(
  topic: string,
  targetGoal?: string,
  learnerBaseline?: string,
  language: 'en' | 'am' = 'en'
): CourseCurriculum {
  const isAm = language === 'am';
  let cleanTopic = (topic || '').replace(/[_-]/g, ' ').trim();

  if (cleanTopic.toLowerCase().includes('viewer demo') || cleanTopic.toLowerCase() === 'viewer demo') {
    return getViewerDemoCurriculum(language);
  }
  if (isAm) {
    if (!cleanTopic || !/[\u1200-\u137F]/.test(cleanTopic)) {
      cleanTopic = cleanTopic ? `ትምህርት፡ ${cleanTopic}` : 'የተሰራጩ ስርዓቶች እና ስምምነት';
    }
  } else if (!cleanTopic) {
    cleanTopic = 'Distributed Systems and Consensus';
  }
  const title = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);
  const courseId = `course-${cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const lessons: RoadmapLesson[] = isAm
    ? [
        {
          id: 'lesson-01',
          order: 1,
          title: `${title}፡ መሰረታዊ መርሆች`,
          slug: '01_foundational_principles',
          summary: `ስለ ${title} መሰረታዊ ፅንሰ-ሀሳቦች፣ የመጀመሪያ መርሆች እና የስራ ማዕቀፍ።`,
          description: `የ ${title}ን የመጀመሪያ መርሆች እና ቁልፍ ሚዛኖችን በዝርዝር ያስረዳል።`,
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['የመጀመሪያ መርሆች', 'መሰረታዊ አሰራር', 'ፅንሰ-ሀሳባዊ ሞዴሎች'],
          isRemediation: false,
        },
        {
          id: 'lesson-02',
          order: 2,
          title: `${title}፡ የአሰራር ሂደት እና የስቴት ለውጦች`,
          slug: '02_operational_mechanism',
          summary: `በ ${title} ውስጥ የሚከናወኑ የዑደት ደረጃዎች፣ የመልእክት ዝውውሮች እና የስቴት ሽግግሮች።`,
          description: `የስቴት ማባዛት፣ የማረጋገጫ ደንቦች እና የኮረም ስምምነት አሰራርን በጥልቀት ይዳስሳል።`,
          status: 'locked',
          estimatedMinutes: 20,
          prerequisites: ['lesson-01'],
          conceptsCovered: ['የመልእክት ዝውውር', 'የስቴት ሽግግር', 'የአሰራር ዑደት'],
          isRemediation: false,
        },
        {
          id: 'lesson-03',
          order: 3,
          title: `${title}፡ የስህተት ሁኔታዎች እና የድንበር ወጥመዶች`,
          slug: '03_boundary_invariants',
          summary: `የአውታረ መረብ መቆራረጥ፣ የስርዓት መከፈል አደጋዎች እና የደህንነት ወሰኖች ትንተና።`,
          description: `በድንበር ሁኔታዎች ወቅት የሚፈጠሩ ችግሮችን እና የስርዓት መበላሸትን የሚከላከሉ መርሆችን ይመረምራል።`,
          status: 'locked',
          estimatedMinutes: 20,
          prerequisites: ['lesson-02'],
          conceptsCovered: ['የመቆራረጥ መቋቋም', 'የደህንነት ዋስትናዎች', 'የመከፈል አደጋዎች'],
          isRemediation: false,
        },
        {
          id: 'lesson-04',
          order: 4,
          title: `${title}፡ አጠቃላይ ውህደት እና የምህንድስና ሚዛኖች`,
          slug: '04_architectural_synthesis',
          summary: `የተግባር ፈተናዎች፣ የፍጥነት እና አስተማማኝነት ሚዛኖች እና አጠቃላይ ውህደት።`,
          description: `ሙሉ እውቀቱን ወደ ተግባራዊ የምህንድስና ውሳኔዎች በማዋሃድ ስርዓቱን ያጠነክራል።`,
          status: 'locked',
          estimatedMinutes: 15,
          prerequisites: ['lesson-03'],
          conceptsCovered: ['የስርዓት ንድፍ', 'የምህንድስና ሚዛኖች', 'የስራ ላይ ጥንካሬ'],
          isRemediation: false,
        },
      ]
    : [
        {
          id: 'lesson-01',
          order: 1,
          title: `${title}: Foundational Principles`,
          slug: '01_foundational_principles',
          summary: `Core mental models, fundamental axioms, and operational context for ${title}.`,
          description: `Explores foundational principles of ${title}, establishing prerequisite baseline intuition and core trade-offs.`,
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['Foundational Axioms', 'Core Mechanics', 'Mental Models'],
          isRemediation: false,
        },
        {
          id: 'lesson-02',
          order: 2,
          title: `${title}: Operational Mechanism & State Transitions`,
          slug: '02_operational_mechanism',
          summary: `Detailed trace of execution cycles, message flows, and state machine transitions in ${title}.`,
          description: `Deep dive into the operational mechanics governing state replication, verification protocols, and quorum consensus.`,
          status: 'locked',
          estimatedMinutes: 20,
          prerequisites: ['lesson-01'],
          conceptsCovered: ['Message Flow', 'State Transitions', 'Execution Cycles'],
          isRemediation: false,
        },
        {
          id: 'lesson-03',
          order: 3,
          title: `${title}: Failure Modes & Boundary Invariants`,
          slug: '03_boundary_invariants',
          summary: `Analysis of network partitions, split-brain hazards, and safety property boundaries.`,
          description: `Formal dissection of edge condition dynamics, timing anomalies, and invariants required to avoid silent corruption.`,
          status: 'locked',
          estimatedMinutes: 20,
          prerequisites: ['lesson-02'],
          conceptsCovered: ['Partition Tolerance', 'Safety Invariants', 'Split-Brain Hazards'],
          isRemediation: false,
        },
        {
          id: 'lesson-04',
          order: 4,
          title: `${title}: Synthesis & Architectural Trade-offs`,
          slug: '04_architectural_synthesis',
          summary: `Production battle-testing, latency versus consistency trade-offs, and synthesis.`,
          description: `Synthesizes end-to-end knowledge into production architecture decisions, benchmarking trade-offs under scale.`,
          status: 'locked',
          estimatedMinutes: 15,
          prerequisites: ['lesson-03'],
          conceptsCovered: ['System Design', 'Benchmarking Trade-offs', 'Production Hardening'],
          isRemediation: false,
        },
      ];

  const teacherWalkthrough = isAm
    ? `ይህ ለ ${title} የተዘጋጀው የትምህርት ካርታ ነው። በመጀመሪያ መሰረታዊ ፅንሰ-ሀሳቦችን እንረዳለን፣ በመቀጠል ዝርዝር አሰራሩን እንመለከታለን፣ ከዚያም የተለመዱ የስህተት ወጥመዶችን ከመረመርን በኋላ በተግባራዊ ምሳሌዎች እናጠናቅቃለን። በዚህ ከተስማሙ ትምህርት 01ን ይጀምሩ፣ ወይም ማስተካከል የሚፈልጉትን በአስተያየት መስጫው ያሳውቁን።`
    : `Here is your learning roadmap for ${title}. We will start with the basic ideas, look closely at how it works, examine common mistakes and edge cases, and finish with practical real-world examples. If this sounds good, you can start Lesson 01 now or leave a note below to adjust the plan.`;

  return {
    id: courseId,
    title: isAm ? `${title} ሙሉ ትምህርት` : `${title} Mastery`,
    topic: title,
    sourceType: 'prompt',
    targetGoal: targetGoal || (isAm ? `የ ${title}ን ዋና አሰራር እና የምህንድስና መርሆች መካን` : `Master architectural and operational dynamics of ${title}`),
    learnerBaseline: learnerBaseline || (isAm ? `የኮምፒውተር ሳይንስ መሰረታዊ እውቀት ያለው ተማሪ` : 'Intermediate engineer with core computer science literacy'),
    lessons,
    activeLessonId: 'lesson-01',
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
  useMock?: boolean;
  throwOnError?: boolean;
  language?: 'en' | 'am';
}

/**
 * Generates an atomic, sequenced CourseCurriculum adhering to the Single-Concept Invariant (15-20 min lessons).
 * Uses gemini-3.5-flash-lite or returns a deterministic structured curriculum.
 */
export async function generateCourseCurriculum(
  topicOrOptions: string | GenerateCurriculumOptions,
  answersArg?: Record<string, string>
): Promise<CourseCurriculum> {
  let topic = '';
  let answers: Record<string, string> = {};
  let sourceType: 'prompt' | 'pdf' | 'document' = 'prompt';
  let sourceName = '';
  let useMock = false;
  let throwOnError = false;
  let language: 'en' | 'am' = 'en';

  if (typeof topicOrOptions === 'object' && topicOrOptions !== null) {
    topic = topicOrOptions.topic || '';
    answers = topicOrOptions.answers || {};
    sourceType = topicOrOptions.sourceType || 'prompt';
    sourceName = topicOrOptions.sourceName || '';
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

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  if (useMock || !apiKey) {
    return generateFallbackCurriculum(cleanTopic, answers.q1, answers.q2, language);
  }

  const answersFormatted = Object.entries(answers)
    .map(([k, v]) => `Question [${k}]: "${stripEmojis(v)}"`)
    .join('\n');

  const languagePromptDirective = isAm
    ? `CRITICAL LANGUAGE INVARIANT:
You MUST author the title, targetGoal, learnerBaseline, and all lesson titles, summaries, descriptions, and conceptsCovered strictly in natural, articulate Amharic (አማርኛ) using Ge'ez script. Zero English letters or latin script.`
    : `CRITICAL LANGUAGE INVARIANT:
Author all fields in clear, articulate English.`;

  const systemPrompt = `You are the Ater Living Curriculum Architect.
Your task is to generate a sequenced, single-concept curriculum roadmap for a learner studying: "${cleanTopic}".

${languagePromptDirective}

Learner Diagnostic Inputs:
${answersFormatted || 'Standard intermediate engineering baseline.'}

CRITICAL ARCHITECTURAL INVARIANTS:
1. "Single-Concept Invariant": Each lesson must address strictly ONE atomic concept that can be deeply digested in 15 to 20 minutes (estimatedMinutes between 15 and 20).
2. Generate between 3 and 6 ordered lessons.
3. Lessons must be topologically ordered (1, 2, 3...):
   - First lesson: status must be "active", prerequisites must be empty [].
   - Subsequent lessons: status must be "locked", prerequisites must reference the preceding lesson ID.
4. Lesson Schema:
   - "id": string (e.g. "lesson-01", "lesson-02")
   - "order": number (1, 2, 3...)
   - "title": string (concise concept name)
   - "slug": string (e.g. "01_concept_name")
   - "summary": string (continuous analytical prose, strictly zero bullet points)
   - "description": string (1-2 sentences on what will be mastered)
   - "status": "active" for first, "locked" for rest
   - "estimatedMinutes": number (15 or 20)
   - "prerequisites": string[]
   - "conceptsCovered": string[]
   - "isRemediation": false
5. STRICT INVARIANT: ZERO EMOJIS in any string field.
6. STRICT INVARIANT: All summary and description fields must use continuous analytical prose with strictly zero bullet points, asterisks, or numbered list prefixes.

Respond with ONLY valid JSON matching this schema:
{
  "title": "string",
  "topic": "${cleanTopic}",
  "targetGoal": "string",
  "learnerBaseline": "string",
  "lessons": [
    {
      "id": "lesson-01",
      "order": 1,
      "title": "string",
      "slug": "01_slug",
      "summary": "string",
      "description": "string",
      "status": "active",
      "estimatedMinutes": 15,
      "prerequisites": [],
      "conceptsCovered": ["concept"],
      "isRemediation": false
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
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (!response.ok) {
      if (throwOnError) throw new Error(`Gemini curriculum API returned ${response.status}`);
      return generateFallbackCurriculum(cleanTopic, answers.q1, answers.q2, language);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      if (throwOnError) throw new Error('Empty response from Gemini curriculum model');
      return generateFallbackCurriculum(cleanTopic, answers.q1, answers.q2, language);
    }

    const parsed = extractJsonFromResponse(rawText);
    const rawLessons: any[] = Array.isArray(parsed.lessons) ? parsed.lessons : [];
    if (rawLessons.length === 0) {
      return generateFallbackCurriculum(cleanTopic, answers.q1, answers.q2, language);
    }

    const courseId = `course-${cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const normalizedLessons: RoadmapLesson[] = rawLessons.map((l, idx) => {
      const order = idx + 1;
      const lessonId = l.id || `lesson-${String(order).padStart(2, '0')}`;
      const titleStr = stripEmojis(l.title || `Module ${order}`);
      const slug = l.slug || `${String(order).padStart(2, '0')}_${titleStr.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      const summary = cleanContinuousProse(stripEmojis(l.summary || `Core principles of ${titleStr}.`));
      const description = cleanContinuousProse(stripEmojis(l.description || summary));
      const estimatedMinutes = Math.min(25, Math.max(10, Number(l.estimatedMinutes) || 15));
      const prereqs = idx === 0 ? [] : (Array.isArray(l.prerequisites) && l.prerequisites.length > 0 ? l.prerequisites : [`lesson-${String(order - 1).padStart(2, '0')}`]);

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
      targetGoal: cleanContinuousProse(stripEmojis(parsed.targetGoal || `Master ${cleanTopic}`)),
      learnerBaseline: cleanContinuousProse(stripEmojis(parsed.learnerBaseline || 'Intermediate')),
      lessons: normalizedLessons,
      activeLessonId: normalizedLessons[0]?.id || 'lesson-01',
      teacherWalkthrough,
      createdAt: new Date().toISOString(),
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (throwOnError) throw err;
    return generateFallbackCurriculum(cleanTopic, answers.q1, answers.q2, language);
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
    estimatedMinutes: 10,
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
2. Estimated time: 10-15 minutes.
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
          generationConfig: { responseMimeType: 'application/json' },
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
      estimatedMinutes: 10,
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
