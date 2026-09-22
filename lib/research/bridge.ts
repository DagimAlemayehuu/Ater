import type { CourseCurriculum, RoadmapLesson } from '@/types';
import type { ResearchFinding } from '@/lib/notebooklm/client';
import { stripEmojis, cleanContinuousProse } from '@/lib/curriculum/intake';

export interface ConvertResearchOptions {
  finding: ResearchFinding;
  language?: 'en' | 'am';
}

/**
 * Transforms an autonomous research result into a valid 5-lesson CourseCurriculum
 * structured for Ater's cognitive intake and Socratic progression.
 *
 * Invariants enforced:
 * 1. Single-Concept Invariant: 5 lessons with 15-20 min pacing.
 * 2. Silent Academic Grounding: Scholarly papers enrich summaries/insights without trivia quizzes.
 * 3. Zero Emojis: All fields cleanly stripped.
 * 4. Topological Ordering: Lesson 01 active, lessons 02-05 locked with preceding prerequisites.
 */
export function convertResearchToCurriculum(options: ConvertResearchOptions): CourseCurriculum {
  const { finding, language = 'en' } = options;
  const isAm = language === 'am';

  const rawTopic = finding.title || 'Autonomous Research Topic';
  const cleanTopic = stripEmojis(rawTopic).trim();
  const title = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);
  const slugBase = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'research';
  const courseId = `course-research-${slugBase}-${Date.now().toString(36)}`;

  const takeaways = finding.takeaways && finding.takeaways.length > 0
    ? finding.takeaways.map((t) => stripEmojis(t))
    : [
        `Foundational mechanisms and structural invariants of ${cleanTopic}.`,
        `Formal protocols, message exchanges, and state consistency.`,
        `Empirical failure modes, latency bottlenecks, and real-world trade-offs.`,
        `Boundary conditions, adversarial inputs, and edge recoveries.`,
        `Cross-domain synthesis and next-generation architectural paradigms.`,
      ];

  const papers = finding.papers || [];
  const primaryPaper = papers[0];
  const secondaryPaper = papers[1];

  // Paper insights for silent grounding
  const paper1Insight = primaryPaper?.keyInsight
    ? `Grounding literature: ${stripEmojis(primaryPaper.title)} (${primaryPaper.year || 2024}). Key finding: ${stripEmojis(primaryPaper.keyInsight)}`
    : '';

  const paper2Insight = secondaryPaper?.keyInsight
    ? `Empirical baseline: ${stripEmojis(secondaryPaper.title)} (${secondaryPaper.year || 2024}). ${stripEmojis(secondaryPaper.keyInsight)}`
    : '';

  const lessons: RoadmapLesson[] = isAm
    ? [
        {
          id: 'lesson-01',
          order: 1,
          title: `${title}፡ መሰረታዊ መርሆች`,
          slug: '01_foundational_principles',
          summary: cleanContinuousProse(takeaways[0] || `${title} የመጀመሪያ መርሆች እና መሰረታዊ ማዕቀፍ።`),
          description: cleanContinuousProse(`የ ${title}ን የመጀመሪያ መርሆች እና ቁልፍ ሚዛኖችን በዝርዝር ያስረዳል። ${paper1Insight}`),
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
          summary: cleanContinuousProse(takeaways[1] || `በ ${title} ውስጥ የሚከናወኑ የዑደት ደረጃዎች እና የስቴት ሽግግሮች።`),
          description: cleanContinuousProse(`የስቴት ማባዛት፣ የማረጋገጫ ደንቦች እና የአሰራር ሂደትን በጥልቀት ይዳስሳል። ${paper2Insight}`),
          status: 'locked',
          estimatedMinutes: 18,
          prerequisites: ['lesson-01'],
          conceptsCovered: ['የስቴት ሽግግር', 'የማረጋገጫ ደንቦች', 'የአሰራር ዑደት'],
          isRemediation: false,
        },
        {
          id: 'lesson-03',
          order: 3,
          title: `${title}፡ የምህንድስና ተግዳሮቶች እና ውስንነቶች`,
          slug: '03_engineering_tradeoffs',
          summary: cleanContinuousProse(takeaways[2] || `በእውነተኛ የምህንድስና ስራ ውስጥ የሚያጋጥሙ ክፍተቶች እና መፍትሄዎች።`),
          description: cleanContinuousProse(`የስርዓት አፈጻጸም፣ መዘግየት እና የማስፋፊያ ገደቦችን ከተጨባጭ ተሞክሮዎች ጋር ያገናዝባል።`),
          status: 'locked',
          estimatedMinutes: 20,
          prerequisites: ['lesson-02'],
          conceptsCovered: ['አፈጻጸም', 'የሀብት አጠቃቀም', 'ሚዛናዊ ውሳኔዎች'],
          isRemediation: false,
        },
        {
          id: 'lesson-04',
          order: 4,
          title: `${title}፡ የድንበር ሁኔታዎች እና የስህተት መቋቋም`,
          slug: '04_boundary_conditions',
          summary: cleanContinuousProse(takeaways[3] || `ያልተጠበቁ ሁኔታዎች ሲያጋጥሙ ስርዓቱ ስህተቶችን እንዴት እንደሚቆጣጠር።`),
          description: cleanContinuousProse(`ድንበር ሁኔታዎች፣ የስርዓት ብልሽት መቋቋሚያ መንገዶች እና የመልሶ ማግኛ ስልቶች።`),
          status: 'locked',
          estimatedMinutes: 15,
          prerequisites: ['lesson-03'],
          conceptsCovered: ['የስህተት መቋቋም', 'ድንበር ሁኔታዎች', 'መልሶ ማገገም'],
          isRemediation: false,
        },
        {
          id: 'lesson-05',
          order: 5,
          title: `${title}፡ ውህደት እና ቀጣይ አቅጣጫዎች`,
          slug: '05_synthesis_frontiers',
          summary: cleanContinuousProse(takeaways[4] || `የተማሩትን ፅንሰ-ሀሳቦች በአጠቃላይ ማዋሃድ እና የወደፊት አዝማሚያዎች።`),
          description: cleanContinuousProse(`ሁሉንም መርሆች በማቀናጀት ውስብስብ ችግሮችን የመፍታት እና የማጠቃለል ችሎታ።`),
          status: 'locked',
          estimatedMinutes: 20,
          prerequisites: ['lesson-04'],
          conceptsCovered: ['ሁለንተናዊ ውህደት', 'የወደፊት አዝማሚያዎች', 'የላቀ ግንዛቤ'],
          isRemediation: false,
        },
      ]
    : [
        {
          id: 'lesson-01',
          order: 1,
          title: `${title}: Foundational Principles`,
          slug: '01_foundational_principles',
          summary: cleanContinuousProse(takeaways[0] || `First principles and mental models governing ${title}.`),
          description: cleanContinuousProse(`Introduces core mental models and foundational invariants. ${paper1Insight}`),
          status: 'active',
          estimatedMinutes: 15,
          prerequisites: [],
          conceptsCovered: ['First Principles', 'Core Invariants', 'Conceptual Foundation'],
          isRemediation: false,
        },
        {
          id: 'lesson-02',
          order: 2,
          title: `${title}: Operational Mechanism`,
          slug: '02_operational_mechanism',
          summary: cleanContinuousProse(takeaways[1] || `Step-by-step state transitions and protocol execution in ${title}.`),
          description: cleanContinuousProse(`Details the lifecycle stages, state mutations, and protocol flows. ${paper2Insight}`),
          status: 'locked',
          estimatedMinutes: 18,
          prerequisites: ['lesson-01'],
          conceptsCovered: ['State Transitions', 'Protocol Execution', 'Causal Mechanics'],
          isRemediation: false,
        },
        {
          id: 'lesson-03',
          order: 3,
          title: `${title}: Engineering Trade-offs & Bottlenecks`,
          slug: '03_engineering_tradeoffs',
          summary: cleanContinuousProse(takeaways[2] || `Empirical performance bounds, latency bottlenecks, and trade-offs.`),
          description: cleanContinuousProse(`Examines architectural trade-offs, resource consumption, and scaling realities.`),
          status: 'locked',
          estimatedMinutes: 20,
          prerequisites: ['lesson-02'],
          conceptsCovered: ['Performance Bounds', 'Resource Allocation', 'Architectural Trade-offs'],
          isRemediation: false,
        },
        {
          id: 'lesson-04',
          order: 4,
          title: `${title}: Boundary Traps & Fault Tolerance`,
          slug: '04_boundary_conditions',
          summary: cleanContinuousProse(takeaways[3] || `Pathological cases, edge vulnerabilities, and resilient recovery.`),
          description: cleanContinuousProse(`Explores behavior under partition, race conditions, and adversarial states.`),
          status: 'locked',
          estimatedMinutes: 15,
          prerequisites: ['lesson-03'],
          conceptsCovered: ['Edge Traps', 'Fault Resilience', 'Recovery Invariants'],
          isRemediation: false,
        },
        {
          id: 'lesson-05',
          order: 5,
          title: `${title}: Synthesis & Future Horizons`,
          slug: '05_synthesis_frontiers',
          summary: cleanContinuousProse(takeaways[4] || `End-to-end cognitive synthesis and emerging research frontiers.`),
          description: cleanContinuousProse(`Synthesizes the complete problem space and charts cutting-edge paradigms.`),
          status: 'locked',
          estimatedMinutes: 20,
          prerequisites: ['lesson-04'],
          conceptsCovered: ['Holistic Synthesis', 'Research Horizons', 'Mastery Integration'],
          isRemediation: false,
        },
      ];

  const teacherWalkthrough = isAm
    ? `ይህ ለ ${title} የተዘጋጀው የምርምር ትምህርት ፍኖተ-ካርታ ነው። ከተገኙት ጥናታዊ ወረቀቶች እና መረጃዎች የተውጣጣ ሲሆን በአምስት ተከታታይ ደረጃዎች የተዋቀረ ነው። ከመጀመሪያው ትምህርት ጀምረው ግንዛቤዎን ማጎልበት ይችላሉ።`
    : `Here is your living curriculum roadmap synthesized from autonomous research on ${title}. Grounded across verified literature, this 5-stage progression guides you from initial mental models to frontier engineering synthesis.`;

  return {
    id: courseId,
    title: isAm ? `${title} ሙሉ ትምህርት` : `${title} Mastery`,
    topic: title,
    sourceType: 'prompt',
    sourceName: primaryPaper ? primaryPaper.title : 'Autonomous Research Station',
    targetGoal: isAm
      ? `የ ${title}ን ቁልፍ የምርምር መርሆች እና አሰራር መካን`
      : `Master foundational principles, empirical trade-offs, and invariants of ${title}`,
    learnerBaseline: isAm
      ? 'የኮምፒውተር ሳይንስ እና የምህንድስና መሰረታዊ ግንዛቤ'
      : 'Engineering student or practitioner calibrated through research grounding',
    lessons,
    activeLessonId: 'lesson-01',
    teacherWalkthrough,
    createdAt: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
  };
}
