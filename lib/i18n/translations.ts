export type AppLanguage = 'en' | 'am';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  nav: {
    howItWorks: string;
    demo: string;
    waitlist: string;
    signIn: string;
    github: string;
  };
  hero: {
    title: string;
    subtitle: string;
    tryDemo: string;
    joinWaitlist: string;
  };
  benefits: {
    title: string;
    subtitle: string;
    step1Tag: string;
    step1Title: string;
    step1Desc: string;
    step2Tag: string;
    step2Title: string;
    step2Desc: string;
    step3Tag: string;
    step3Title: string;
    step3Desc: string;
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
  footer: {
    tagline: string;
    signIn: string;
  };
  newCourse: string;
  createCourseBtn: string;
  activeCourses: string;
  savedNotes: string;
  workspaceLibrary: string;
  noSavedNotes: string;
  noActiveLesson: string;
  selectLessonHint: string;
  sparFeynman: string;
  guidedSteps: string;
  fullNote: string;
  stepOf: (step: number, total: number) => string;
  teacherExplanation: string;
  keyNoteSummary: string;
  askPlaceholder: (sectionTitle: string) => string;
  askBtn: string;
  thinking: string;
  continueTo: (nextTitle: string) => string;
  prevSection: string;
  socraticCheckpoint: string;
  playAudio: string;
  pauseAudio: string;
  resumeAudio: string;
  restartAudio: string;
  whatAgentJustSaid: string;
  agentTranscript: string;
  btwTitle: string;
  askTeacherBottomPlaceholder: string;
  gotIt: string;
  close: string;
  submitCheckpoint: string;
  typeSynthesis: string;
  failureTraps: string;
  provingGrounds: string;
  revealAnswer: string;
  hideAnswer: string;
  oralFeynmanGate: string;
  companionStatus: string;
  holdToSpeak: string;
  releaseToSend: string;
  sections: {
    intuition: string;
    framework: string;
    mechanism: string;
    checkpoint: string;
    synthesis: string;
    sec1Full: string;
    sec2Full: string;
    sec3Full: string;
    sec4Full: string;
    sec5Full: string;
  };
  intake: {
    title: string;
    promptTab: string;
    pdfTab: string;
    modePromptTitle: string;
    modePromptDesc: string;
    modePdfTitle: string;
    modePdfDesc: string;
    promptPlaceholder: string;
    pdfDropTitle: string;
    pdfDropSubtitle: string;
    startInterview: string;
    nextQuestion: string;
    generateCurriculum: string;
    cancel: string;
    back: string;
    clearSelection: string;
    multiSelectLabel: string;
    synthesizingTitle: (topic: string) => string;
    synthesizingDesc: string;
  };
  drawer: {
    title: string;
    activeCourses: string;
    lessonsCount: (count: number) => string;
    savedNotes: string;
    noNotesYet: string;
    recentTopics: string;
    removeNote: string;
    removeCourse: string;
    collapse: string;
    expand: string;
  };
  roadmap: {
    title: string;
    noCourse: string;
    newBtn: string;
    progress: (mastered: number, total: number) => string;
    loading: string;
    noLessons: string;
    statusActive: string;
    statusMastered: string;
    statusLocked: string;
    statusRemediation: string;
    minShort: (min: number) => string;
  };
  feynman: {
    title: string;
    challengeTitle: string;
    tabooForbidden: string;
    yourExplanation: string;
    placeholder: string;
    holdToSpeak: string;
    releaseToSend: string;
    submitEvaluation: string;
    evaluating: string;
    feedbackTitle: string;
    score: (pts: number) => string;
    passMessage: string;
    remediationMessage: string;
    tryAgain: string;
    proceedNext: string;
  };
}

export const translations: Record<AppLanguage, TranslationDictionary> = {
  en: {
    appName: 'ATER',
    tagline: 'Learn Anything',
    nav: {
      howItWorks: 'How it works',
      demo: 'Demo',
      waitlist: 'Waitlist',
      signIn: 'Sign In',
      github: 'GitHub',
    },
    hero: {
      title: 'Fixing the illusion of competence in the age of AI.',
      subtitle: 'Reading smooth AI summaries tricks your brain into thinking you understand how a system works. Ater tests whether you can actually explain it in your own words.',
      tryDemo: 'Try Demo',
      joinWaitlist: 'Join the Waitlist',
    },
    benefits: {
      title: 'How Ater Works',
      subtitle: 'From any concept to active understanding in three connected steps.',
      step1Tag: 'Step 01',
      step1Title: 'Tell us what you want to learn',
      step1Desc: 'Enter any topic or subject. Ater asks 2-3 quick questions to discover your goal and current experience level before building anything.',
      step2Tag: 'Step 02',
      step2Title: 'Approve your structured path',
      step2Desc: 'Ater generates an ordered sequence of lessons. Once you approve, get concise mental model notes with clear analogies.',
      step3Tag: 'Step 03',
      step3Title: 'Explain in your own words',
      step3Desc: 'Answer comprehension checkpoints aloud using speech or in writing. Ater verifies whether you articulated the real causal mechanism.',
    },
    cta: {
      title: 'Ready to test your actual understanding?',
      subtitle: 'Create an account to join the waitlist. We are rolling out access in regular student batches.',
      button: 'Join the Waitlist',
    },
    footer: {
      tagline: 'Active recall and Socratic learning studio.',
      signIn: 'Sign In',
    },
    newCourse: '+ New Course',
    createCourseBtn: '+ Create New Course',
    activeCourses: 'Active Courses',
    savedNotes: 'Saved Notes',
    workspaceLibrary: 'Workspace Library',
    noSavedNotes: 'No saved notes yet.',
    noActiveLesson: 'No active lesson selected',
    selectLessonHint: 'Select a lesson from your roadmap on the right, or create a new course to begin.',
    sparFeynman: 'Practice',
    guidedSteps: 'Summary',
    fullNote: 'Transcription',
    stepOf: (step, total) => `Step ${step} of ${total}`,
    teacherExplanation: 'Explanation',
    keyNoteSummary: 'Summary',
    askPlaceholder: (sectionTitle) => `Ask about ${sectionTitle}...`,
    askBtn: 'Ask Teacher',
    thinking: 'Thinking...',
    continueTo: (nextTitle) => `Next: ${nextTitle}`,
    prevSection: 'Previous',
    socraticCheckpoint: 'Causal Checkpoint',
    playAudio: 'Play',
    pauseAudio: 'Pause',
    resumeAudio: 'Resume',
    restartAudio: 'Restart',
    whatAgentJustSaid: 'Teacher Explanation',
    agentTranscript: 'Spoken Transcript',
    btwTitle: 'Did You Know?',
    askTeacherBottomPlaceholder: 'Ask a question about this lesson...',
    gotIt: 'Got It',
    close: 'Close',
    submitCheckpoint: 'Check Answer',
    typeSynthesis: 'Explain how it works...',
    failureTraps: 'Common Mistakes',
    provingGrounds: 'Practice Problems',
    revealAnswer: 'Show Answer',
    hideAnswer: 'Hide Answer',
    oralFeynmanGate: 'Socratic Defense Gate',
    companionStatus: 'Audio Assistant',
    holdToSpeak: 'Hold to speak',
    releaseToSend: 'Release to send',
    sections: {
      intuition: 'Intuition',
      framework: 'Idea',
      mechanism: 'How It Works',
      checkpoint: 'Check',
      synthesis: 'Summary',
      sec1Full: '01 · Simple Example',
      sec2Full: '02 · Core Idea',
      sec3Full: '03 · How It Works',
      sec4Full: '04 · Watch Out & Check',
      sec5Full: '05 · Summary',
    },
    intake: {
      title: 'New Course',
      promptTab: 'Topic',
      pdfTab: 'PDF',
      modePromptTitle: 'Type a Topic',
      modePromptDesc: 'Start with any concept, question, or technology you want to learn.',
      modePdfTitle: 'Upload a PDF',
      modePdfDesc: 'Start from a book chapter, syllabus, or paper.',
      promptPlaceholder: 'What do you want to learn? (e.g. How computers work, Machine Learning)...',
      pdfDropTitle: 'Drop a PDF here or click to browse',
      pdfDropSubtitle: 'Books, papers, or syllabi up to 20MB',
      startInterview: 'Continue',
      nextQuestion: 'Next',
      generateCurriculum: 'Create Course',
      cancel: 'Cancel',
      back: 'Back',
      clearSelection: 'Clear',
      multiSelectLabel: 'Options',
      synthesizingTitle: (topic) => `Creating course for "${topic}"...`,
      synthesizingDesc: 'Building simple step-by-step lessons based on your answers.',
    },
    drawer: {
      title: 'Workspace Library',
      activeCourses: 'Active Courses',
      lessonsCount: (count) => `${count} lessons`,
      savedNotes: 'Saved Notes',
      noNotesYet: 'No notes saved yet',
      recentTopics: 'Recent Topics',
      removeNote: 'Remove note',
      removeCourse: 'Delete course',
      collapse: 'Collapse',
      expand: 'Expand',
    },
    roadmap: {
      title: 'Roadmap',
      noCourse: 'No Course',
      newBtn: '+ New',
      progress: (mastered, total) => `Progress: ${mastered}/${total} Completed`,
      loading: 'Loading...',
      noLessons: 'No lessons loaded',
      statusActive: 'Active',
      statusMastered: 'Completed',
      statusLocked: 'Locked',
      statusRemediation: 'Review',
      minShort: (min) => `${min}m`,
    },
    feynman: {
      title: 'Practice Test',
      challengeTitle: 'Explain in Your Own Words',
      tabooForbidden: 'Forbidden Words',
      yourExplanation: 'Your Simple Explanation',
      placeholder: 'Explain how this works in simple words without using forbidden words...',
      holdToSpeak: 'Hold to speak',
      releaseToSend: 'Release to send',
      submitEvaluation: 'Submit Answer',
      evaluating: 'Checking answer...',
      feedbackTitle: 'Feedback',
      score: (pts) => `Score: ${pts}/10`,
      passMessage: 'Great job. You mastered this concept.',
      remediationMessage: 'Good effort. A quick review step was added to your roadmap.',
      tryAgain: 'Try Again',
      proceedNext: 'Next Concept',
    },
  },
  am: {
    appName: 'አጠር',
    tagline: 'ቀላል ትምህርት',
    nav: {
      howItWorks: 'አሰራር',
      demo: 'ሙከራ',
      waitlist: 'ይመዝገቡ',
      signIn: 'ግባ',
      github: 'ጊትሃብ',
    },
    hero: {
      title: 'በአርቴፊሻል ኢንተለጀንስ ዘመን እውነተኛ ግንዛቤን ማረጋገጥ።',
      subtitle: 'የኤአይ አጫጭር ማጠቃለያዎችን ማንበብ ስርዓቱ እንዴት እንደሚሰራ የተረዳን እንዲመስለን ያታልለናል። አጠር በራስዎ ቃላት ማብራራት እንደሚችሉ ይፈትሻል።',
      tryDemo: 'ይሞክሩት',
      joinWaitlist: 'ይመዝገቡ',
    },
    benefits: {
      title: 'አጠር እንዴት ይሰራል',
      subtitle: 'ከማንኛውም ፅንሰ-ሀሳብ ወደ ጥልቅ ግንዛቤ በሶስት የተሳሰሩ ደረጃዎች።',
      step1Tag: 'ደረጃ 01',
      step1Title: 'ምን መማር እንደሚፈልጉ ይንገሩን',
      step1Desc: 'ማንኛውንም ርዕስ ያስገቡ። አጠር ምንም ነገር ከማዘጋጀቱ በፊት ግብዎን እና የአሁን ግንዛቤዎን ለመለየት 2-3 ፈጣን ጥያቄዎችን ይጠይቃል።',
      step2Tag: 'ደረጃ 02',
      step2Title: 'የትምህርት ካርታዎን ያጽድቁ',
      step2Desc: 'አጠር ቅደም ተከተላቸው የተጠበቁ ትምህርቶችን ያዘጋጃል። ካጸደቁ በኋላ ግልጽ ምሳሌዎች ያላቸው አጫጭር ማስታወሻዎችን ያገኛሉ።',
      step3Tag: 'ደረጃ 03',
      step3Title: 'በራስዎ ቃላት ያስረዱ',
      step3Desc: 'የግንዛቤ መመዘኛ ጥያቄዎችን በንግግር ወይም በጽሑፍ ይመልሱ። አጠር ትክክለኛውን የአሰራር ሂደት ማስረዳትዎን ያረጋግጣል።',
    },
    cta: {
      title: 'እውነተኛ ግንዛቤዎን ለመፈተሽ ዝግጁ ነዎት?',
      subtitle: 'የቅድሚያ ተጠቃሚ ለመሆን ይመዝገቡ። መዳረሻዎችን በተከታታይ የተማሪዎች ቡድን እየከፈትን ነው።',
      button: 'ይመዝገቡ',
    },
    footer: {
      tagline: 'የነቃ ማስታወስ እና የሶቅራጥስ ትምህርት መድረክ።',
      signIn: 'ግባ',
    },
    newCourse: '+ አዲስ ኮርስ',
    createCourseBtn: '+ አዲስ ኮርስ ጀምር',
    activeCourses: 'ገባሪ ኮርሶች',
    savedNotes: 'የተቀመጡ ማስታወሻዎች',
    workspaceLibrary: 'የስራ ቤተ-መጽሐፍት',
    noSavedNotes: 'እስካሁን የተቀመጠ ማስታወሻ የለም።',
    noActiveLesson: 'የተመረጠ ትምህርት የለም',
    selectLessonHint: 'ከቀኝ በኩል ካለው የትምህርት ካርታ ላይ ትምህርት ይምረጡ፣ ወይም ለመጀመር አዲስ ኮርስ ይፍጠሩ።',
    sparFeynman: 'ልምምድ',
    guidedSteps: 'ማጠቃለያ',
    fullNote: 'ጽሑፍ',
    stepOf: (step, total) => `ደረጃ ${step} ከ ${total}`,
    teacherExplanation: 'ማብራሪያ',
    keyNoteSummary: 'ማጠቃለያ',
    askPlaceholder: (sectionTitle) => `ስለ ${sectionTitle} ጠይቅ...`,
    askBtn: 'አስተማሪውን ጠይቅ',
    thinking: 'እያሰበ ነው...',
    continueTo: (nextTitle) => `ቀጣይ፡ ${nextTitle}`,
    prevSection: 'ወደ ኋላ',
    socraticCheckpoint: 'የምክንያታዊነት ፍተሻ',
    playAudio: 'አጫውት',
    pauseAudio: 'አፍታ አቁም',
    resumeAudio: 'ቀጥል',
    restartAudio: 'ከመጀመሪያ',
    whatAgentJustSaid: 'የአስተማሪ ማብራሪያ',
    agentTranscript: 'የድምፅ ጽሑፍ',
    btwTitle: 'ይህን ያውቁ ኖሯል?',
    askTeacherBottomPlaceholder: 'ስለዚህ ትምህርት ጥያቄ ይጠይቁ...',
    gotIt: 'ገባኝ',
    close: 'ዝጋ',
    submitCheckpoint: 'መልስ ፈትሽ',
    typeSynthesis: 'እንዴት እንደሚሰራ አስረዳ...',
    failureTraps: 'የተለመዱ ስህተቶች',
    provingGrounds: 'የልምምድ ጥያቄዎች',
    revealAnswer: 'መልስ አሳይ',
    hideAnswer: 'መልስ ደብቅ',
    oralFeynmanGate: 'የልምምድ ፈተና',
    companionStatus: 'የድምፅ ረዳት',
    holdToSpeak: 'ተጭነህ ተናገር',
    releaseToSend: 'ስትጨርስ ልቀቅ',
    sections: {
      intuition: 'ፅንሰ-ሀሳብ',
      framework: 'ሀሳብ',
      mechanism: 'አሰራር',
      checkpoint: 'ፍተሻ',
      synthesis: 'ማጠቃለያ',
      sec1Full: '01 · ቀላል ምሳሌ',
      sec2Full: '02 · ዋናው ሀሳብ',
      sec3Full: '03 · እንዴት ይሰራል',
      sec4Full: '04 · መጠንቀቂያ እና ፍተሻ',
      sec5Full: '05 · ማጠቃለያ',
    },
    intake: {
      title: 'አዲስ ኮርስ',
      promptTab: 'ርዕስ',
      pdfTab: 'ፒዲኤፍ',
      modePromptTitle: 'ርዕስ ይጻፉ',
      modePromptDesc: 'መማር የሚፈልጉትን ማንኛውንም ርዕስ ወይም ቴክኖሎጂ ያስገቡ።',
      modePdfTitle: 'ፒዲኤፍ ይጫኑ',
      modePdfDesc: 'የማስታወሻ፣ የትምህርት ማውጫ ወይም መጽሐፍ ሰነድ በመጫን ይጀምሩ።',
      promptPlaceholder: 'ምን መማር ይፈልጋሉ? (ምሳሌ፡ ኮምፒውተር ሳይንስ፣ አርቴፊሻል ኢንተለጀንስ)...',
      pdfDropTitle: 'ፒዲኤፍ እዚህ ይጣሉ ወይም ለመምረጥ ይጫኑ',
      pdfDropSubtitle: 'እስከ 20 ሜጋባይት የሚደርሱ ሰነዶችን ይቀበላል',
      startInterview: 'ቀጥል',
      nextQuestion: 'ቀጣይ',
      generateCurriculum: 'ኮርስ ፍጠር',
      cancel: 'ይቅር',
      back: 'ተመለስ',
      clearSelection: 'አጽዳ',
      multiSelectLabel: 'አማራጮች',
      synthesizingTitle: (topic) => `ለ "${topic}" ኮርስ እየተዘጋጀ ነው...`,
      synthesizingDesc: 'ቀላል ደረጃ በደረጃ ትምህርቶች እየተዘጋጁ ነው።',
    },
    drawer: {
      title: 'የስራ ቤተ-መጽሐፍት',
      activeCourses: 'ገባሪ ኮርሶች',
      lessonsCount: (count) => `${count} ትምህርቶች`,
      savedNotes: 'የተቀመጡ ማስታወሻዎች',
      noNotesYet: 'እስካሁን ምንም ማስታወሻ አልተቀመጠም',
      recentTopics: 'የቅርብ ርዕሶች',
      removeNote: 'ማስታወሻ አስወግድ',
      removeCourse: 'ኮርስ ሰርዝ',
      collapse: 'አሳንስ',
      expand: 'አስፋ',
    },
    roadmap: {
      title: 'ፍኖተ-ካርታ',
      noCourse: 'ኮርስ የለም',
      newBtn: '+ አዲስ',
      progress: (mastered, total) => `ደረጃ፡ ${mastered}/${total} የተጠናቀቁ`,
      loading: 'እየጫነ ነው...',
      noLessons: 'ምንም ትምህርቶች አልተጫኑም',
      statusActive: 'ገባሪ',
      statusMastered: 'የተጠናቀቀ',
      statusLocked: 'የተቆለፈ',
      statusRemediation: 'ክለሳ',
      minShort: (min) => `${min}ደቂቃ`,
    },
    feynman: {
      title: 'የልምምድ ፈተና',
      challengeTitle: 'በራስዎ ቃላት ያስረዱ',
      tabooForbidden: 'የተከለከሉ ቃላት',
      yourExplanation: 'የእርስዎ ቀላል ማብራሪያ',
      placeholder: 'የፅንሰ-ሀሳቡን ዋና አሰራር በቀላል ቃላት ሳትጠቀሙ አስረዱ...',
      holdToSpeak: 'ተጭነህ ተናገር',
      releaseToSend: 'ስትጨርስ ልቀቅ',
      submitEvaluation: 'መልስ አስገባ',
      evaluating: 'መልስዎን እየገመገመ ነው...',
      feedbackTitle: 'ግብረ-መልስ',
      score: (pts) => `ውጤት፡ ${pts}/10`,
      passMessage: 'በጣም ጥሩ። ይህንን ፅንሰ-ሀሳብ ተረድተዋል።',
      remediationMessage: 'ጥሩ ጥረት። ፈጣን የክለሳ ደረጃ ወደ ፍኖተ-ካርታዎ ተጨምሯል።',
      tryAgain: 'እንደገና ሞክር',
      proceedNext: 'ቀጣይ ፅንሰ-ሀሳብ',
    },
  },
};
