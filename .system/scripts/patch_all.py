import sys

def patch_file(path, patches):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    for old, new in patches:
        if old not in content:
            print(f"Error: Could not find snippet in {path}\n{old[:100]}...")
            sys.exit(1)
        content = content.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Patched {path}")

# VALIDATOR.PY
validator_patches = [
(
r'''                elif len(quiz_data) < 3 or len(quiz_data) > 6:
                    errors.append(f"QUIZ_WRONG_LENGTH: expected 3-6 questions, got {len(quiz_data)}")''',
r'''                elif len(quiz_data) < 3 or len(quiz_data) > 5:
                    errors.append(f"QUIZ_WRONG_LENGTH: expected 3-5 questions, got {len(quiz_data)}")'''
),
(
r'''        # ── 7. Walkthrough step count — section is ## 5. Walkthrough in the template
        walkthrough_match = re.search(r'## 5\. Walkthrough(.*?)(?=## 6\.|```interactive-quiz|$)', body, re.DOTALL)
        if walkthrough_match:
            steps = re.findall(r'^[\-\*]|^\d+\.', walkthrough_match.group(1), re.MULTILINE)
            if len(steps) < 3:
                import logging
                logging.getLogger("Ater").warning(f"[AterValidator] WALKTHROUGH_TOO_SHORT: {len(steps)} steps, need 3+")''',
r'''        # ── 7. Walkthrough step count — section is ## 5. Walkthrough in the template
        walkthrough_match = re.search(r'## 5\. Walkthrough(.*?)(?=## 6\.|```interactive-quiz|$)', body, re.DOTALL)
        if walkthrough_match:
            steps = re.findall(r'^[\-\*]|^\d+\.', walkthrough_match.group(1), re.MULTILINE)
            if len(steps) < 5:
                errors.append(f"WALKTHROUGH_TOO_SHORT: Found {len(steps)} steps, need ≥ 5.")'''
)
]
patch_file("apps/api/src/domains/ater/validator.py", validator_patches)

# VAULT MANAGER
vault_patches = [
(
r'''        # 2. PROACTIVE GUTTER DEFENSE: Ensure headings and rules have a blank line above them
        lines = content.split('\n')
        fixed_lines = []
        in_frontmatter = False
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            # Track frontmatter boundary
            if stripped == "---":
                if i == 0:
                    in_frontmatter = True
                elif in_frontmatter:
                    in_frontmatter = False
                else:
                    # Horizontal rule outside frontmatter: ensure gutter above
                    if fixed_lines and fixed_lines[-1].strip() != "":
                        fixed_lines.append("")
            
            # Heading Defense (only outside frontmatter)
            elif stripped.startswith("#") and not in_frontmatter:
                # If the line is a heading (e.g., "## Title"), ensure it has a blank line above it
                if fixed_lines and fixed_lines[-1].strip() != "":
                    fixed_lines.append("")
            
            fixed_lines.append(line)
        
        final_content = "\n".join(fixed_lines)''',
r'''        # 2. PROACTIVE GUTTER DEFENSE: Ensure headings and rules have a blank line above them
        # (also Setext double-newline defense and table/codeblock gutters)
        lines = content.split('\n')
        fixed_lines = []
        in_frontmatter = False
        in_code_block = False
        in_table = False
        
        for i, line in enumerate(lines):
            stripped = line.strip()
            
            if i == 0 and stripped == "---":
                in_frontmatter = True
                fixed_lines.append(line)
                continue
                
            if in_frontmatter:
                fixed_lines.append(line)
                if stripped == "---":
                    in_frontmatter = False
                continue

            # Outside frontmatter checks
            is_hr = (stripped == "---")
            is_heading = stripped.startswith("#")
            is_code_fence = stripped.startswith("```")
            is_table_row = stripped.startswith("|") and stripped.endswith("|")

            # Handling transitions into blocks/elements
            if is_hr:
                # Setext defense: Needs EXACTLY double newlines before it
                while len(fixed_lines) > 0 and fixed_lines[-1].strip() == "":
                    fixed_lines.pop()
                fixed_lines.append("")
                fixed_lines.append("")
                fixed_lines.append(line)
                fixed_lines.append("") # Gutter after
                continue
                
            if is_heading:
                if len(fixed_lines) > 0 and fixed_lines[-1].strip() != "":
                    fixed_lines.append("")
                fixed_lines.append(line)
                fixed_lines.append("") # Gutter after
                continue
                
            if is_code_fence:
                if not in_code_block:
                    if len(fixed_lines) > 0 and fixed_lines[-1].strip() != "":
                        fixed_lines.append("")
                    fixed_lines.append(line)
                    in_code_block = True
                else:
                    fixed_lines.append(line)
                    fixed_lines.append("") # Gutter after
                    in_code_block = False
                continue
                
            if is_table_row:
                if not in_table:
                    if len(fixed_lines) > 0 and fixed_lines[-1].strip() != "":
                        fixed_lines.append("")
                    in_table = True
                fixed_lines.append(line)
                continue
            else:
                if in_table:
                    if len(fixed_lines) > 0 and fixed_lines[-1].strip() != "":
                        fixed_lines.append("")
                    in_table = False

            if not (is_hr or is_heading or is_code_fence or is_table_row):
                # Avoid appending duplicate empty lines
                if stripped == "" and len(fixed_lines) > 0 and fixed_lines[-1].strip() == "":
                    continue
                fixed_lines.append(line)

        final_content = "\n".join(fixed_lines)'''
)
]
patch_file("apps/api/src/domains/ater/vault_manager.py", vault_patches)

# PRACTICE.TSX
practice_patches = [
(
r''' const calculateScore = () => {
  const selfGradedTypes = ['writing', 'synthesis', 'debug', 'trace', 'calculation', 'data_analysis'];
  let correct = 0;
  const total = questions.length;
  questions.forEach(q => {
   const isSG = selfGradedTypes.includes(q.type);
   if (isSG) {
    // Self-graded: only counted correct if user explicitly marked it correct
    if (gradedAnswers[q.id] === true) correct++;
   } else {
    // Objective: graded[q.id] is true/false; undefined = unanswered = wrong
    if (gradedAnswers[q.id] === true) correct++;
   }
  });
  return {score: Math.round((correct / (total || 1)) * 100), correct, total};
 }''',
r''' const calculateScore = () => {
  let correct = 0;
  const total = questions.length;
  questions.forEach(q => {
   if (gradedAnswers[q.id] === true) correct++;
  });
  return {score: Math.round((correct / (total || 1)) * 100), correct, total};
 }'''
),
(
r''' const handleSubmitAnswer = () => {
 setIsRevealed(true);
 const q = questions[currentQuestionIdx];
 let isCorrect = false;

 if (q.type === 'mcq' || q.type === 'true_false' || q.type === 'writing' || q.type === 'debug' || q.type === 'synthesis') {
 const userVal = String(userAnswers[q.id] || '').trim();
 const correctVal = String(q.answer || '').trim();
 
 if (q.type === 'true_false') {
 const userBool = userVal.toLowerCase() === 'true';
 const correctBool = typeof q.answer === 'boolean' ? q.answer : String(q.answer).toLowerCase() === 'true';
 isCorrect = userBool === correctBool;
 } else if (q.type === 'mcq') {
  // Match only by key letter to avoid false positives from similar option text
  isCorrect = userVal.trim().toUpperCase() === String(q.answer || '').trim().toUpperCase();
 } else if (q.type === 'debug') {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  isCorrect = norm(userVal) === norm(correctVal);
 } else {
  isCorrect = userVal.toLowerCase() === correctVal.toLowerCase();
 }
} else if (q.type === 'fill_in') {
 const answers = userAnswers[q.id] || [];
 const correctAnswers = q.answer || [];
 isCorrect = Array.isArray(correctAnswers) && correctAnswers.every((ans: string, idx: number) => 
 String(answers[idx] || '').trim().toLowerCase() === String(ans || '').trim().toLowerCase()
 );
} else if (q.type === 'matching') {
 const userPairs = userAnswers[q.id] || {};
 const correctPairs = q.pairs || [];
 isCorrect = Array.isArray(correctPairs) && correctPairs.every((p: any) => 
 String(userPairs[p.left] || '').trim().toLowerCase() === String(p.right || '').trim().toLowerCase()
 );
} else if (q.type === 'order') {
 const userOrder = userAnswers[q.id] || (q as any).steps || [];
 const correctOrder = (q as any).answer || [];
 isCorrect = Array.isArray(correctOrder) && correctOrder.every((step: string, idx: number) => 
 String(userOrder[idx] || '').trim().toLowerCase() === String(step).trim().toLowerCase()
 );
}

 const isSelfGraded = ['writing', 'synthesis', 'debug', 'trace'].includes(q.type);
 if (!isSelfGraded) {
  setGradedAnswers(prev => ({...prev, [q.id]: isCorrect}));
 }
}''',
r''' const handleSubmitAnswer = () => {
 setIsRevealed(true);
 const q = questions[currentQuestionIdx];
 let isCorrect = false;

 const isSelfGraded = ['writing', 'synthesis', 'debug', 'trace'].includes(q.type);

 if (!isSelfGraded) {
  if (q.type === 'mcq' || q.type === 'true_false') {
   const userVal = String(userAnswers[q.id] || '').trim();
   const correctVal = String(q.answer || '').trim();
   
   if (q.type === 'true_false') {
   const userBool = userVal.toLowerCase() === 'true';
   const correctBool = typeof q.answer === 'boolean' ? q.answer : String(q.answer).toLowerCase() === 'true';
   isCorrect = userBool === correctBool;
   } else if (q.type === 'mcq') {
    isCorrect = userVal.trim().toUpperCase() === String(q.answer || '').trim().toUpperCase();
   }
  } else if (q.type === 'fill_in') {
   const answers = userAnswers[q.id] || [];
   const correctAnswers = q.answer || [];
   isCorrect = Array.isArray(correctAnswers) && correctAnswers.every((ans: string, idx: number) => 
   String(answers[idx] || '').trim().toLowerCase() === String(ans || '').trim().toLowerCase()
   );
  } else if (q.type === 'matching') {
   const userPairs = userAnswers[q.id] || {};
   const correctPairs = q.pairs || [];
   isCorrect = Array.isArray(correctPairs) && correctPairs.every((p: any) => 
   String(userPairs[p.left] || '').trim().toLowerCase() === String(p.right || '').trim().toLowerCase()
   );
  } else if (q.type === 'order') {
   const userOrder = userAnswers[q.id] || (q as any).steps || [];
   const correctOrder = (q as any).answer || [];
   isCorrect = Array.isArray(correctOrder) && correctOrder.every((step: string, idx: number) => 
   String(userOrder[idx] || '').trim().toLowerCase() === String(step).trim().toLowerCase()
   );
  }
  setGradedAnswers(prev => ({...prev, [q.id]: isCorrect}));
 }
}'''
),
(
r''' useEffect(() => {
 if (questions.length > 0 && view === 'session') {
 timerRef.current = setInterval(() => {
 // Handle Global Timer''',
r''' useEffect(() => {
  if (view === 'session' && questions.length === 0) {
   setView('configuring');
  }
 }, [view, questions]);

 useEffect(() => {
 if (questions.length > 0 && view === 'session') {
 timerRef.current = setInterval(() => {
 // Handle Global Timer'''
)
]
patch_file("apps/desktop/src/routes/practice.tsx", practice_patches)

# ACADEMIC.TSX
academic_patches = [
(
r''' const onUpdate = useCallback(async (dbId: string, itemId: string, properties: Record<string, any>) => {
 console.log(`[Academic] Updating ${dbId}/${itemId}:`, properties)
 // Optimistic update
 setData(prev => {
 if (!prev) return prev
 const next = {...prev}
 const dbMap: Record<string, keyof AcademicData> = {
 '09 - Years': 'years',
 '08 - Semesters': 'semesters',
 '07 - Courses': 'courses',
 '06 - Study Planner': 'study_sessions',
 '04 - Exams': 'exams',
 '03 - Assignments': 'assignments'
}
 const key = dbMap[dbId]''',
r''' const onUpdate = useCallback(async (dbId: string, itemId: string, properties: Record<string, any>) => {
 console.log(`[Academic] Updating ${dbId}/${itemId}:`, properties)
 // Optimistic update
 setData(prev => {
 if (!prev) return prev
 const next = {...prev}
 let key: keyof AcademicData | undefined;
 if (dbId.includes('Years')) key = 'years';
 else if (dbId.includes('Semesters')) key = 'semesters';
 else if (dbId.includes('Courses')) key = 'courses';
 else if (dbId.includes('Study Planner')) key = 'study_sessions';
 else if (dbId.includes('Exams')) key = 'exams';
 else if (dbId.includes('Assignments')) key = 'assignments';'''
),
(
r''' const onCreate = useCallback(async (dbId: string, title: string, props?: Record<string, any>): Promise<string | null> => {
 // Optimistic update for creation
 setData(prev => {
 if (!prev) return prev
 const next = {...prev}
 const dbMap: Record<string, keyof AcademicData> = {
 '09 - Years': 'years',
 '08 - Semesters': 'semesters',
 '07 - Courses': 'courses',
 '06 - Study Planner': 'study_sessions',
 '04 - Exams': 'exams',
 '03 - Assignments': 'assignments'
}
 const key = dbMap[dbId]''',
r''' const onCreate = useCallback(async (dbId: string, title: string, props?: Record<string, any>): Promise<string | null> => {
 // Optimistic update for creation
 setData(prev => {
 if (!prev) return prev
 const next = {...prev}
 let key: keyof AcademicData | undefined;
 if (dbId.includes('Years')) key = 'years';
 else if (dbId.includes('Semesters')) key = 'semesters';
 else if (dbId.includes('Courses')) key = 'courses';
 else if (dbId.includes('Study Planner')) key = 'study_sessions';
 else if (dbId.includes('Exams')) key = 'exams';
 else if (dbId.includes('Assignments')) key = 'assignments';'''
),
(
r''' useEffect(() => {
 fetchData()
 fetchDatabases()
 // SSE for real-time vault changes
 const es = new EventSource(`${API_BASE}/api/vault/events`)
 es.onerror = () => es.close() // don't crash if not available
 es.onmessage = (ev) => {
 try {
 const d = JSON.parse(ev.data)
 if (['vault_change', 'file_create', 'file_delete'].includes(d.type)) fetchData()
} catch {}
}
 return () => es.close()
}, [])''',
r''' useEffect(() => {
 fetchData()
 fetchDatabases()
 // SSE for real-time vault changes
 const es = new EventSource(`${API_BASE}/api/vault/events`)
 es.onerror = () => es.close() // don't crash if not available
 es.onmessage = (ev) => {
 try {
 const d = JSON.parse(ev.data)
 if (['vault_change', 'file_create', 'file_delete'].includes(d.type)) fetchData()
} catch {}
}
 return () => es.close()
}, [fetchData, fetchDatabases])'''
),
(
r''' // ── Tab definitions ────────────────────────────────────────────────────────
 const tabs: {id: AcademicTab; label: string; icon: React.ReactNode}[] = [
 {id: 'PROGRAM', label: 'Program', icon: <GraduationCap size={11} />},
 {id: 'COURSES', label: 'Courses', icon: <BookOpen size={11} />},
 {id: 'PLANNER', label: 'Planner', icon: <LayoutDashboard size={11} />},
 {id: 'ASSIGNMENTS', label: 'Assignments', icon: <ClipboardList size={11} />},
 {id: 'EXAMS', label: 'Exams', icon: <FlaskConical size={11} />},
 {id: 'PRACTICE', label: 'Practice', icon: <Layers size={11} />},
 ]''',
r''' // ── Tab definitions ────────────────────────────────────────────────────────
 const tabs = React.useMemo(() => [
 {id: 'PROGRAM' as AcademicTab, label: 'Program', icon: <GraduationCap size={11} />},
 {id: 'COURSES' as AcademicTab, label: 'Courses', icon: <BookOpen size={11} />},
 {id: 'PLANNER' as AcademicTab, label: 'Planner', icon: <LayoutDashboard size={11} />},
 {id: 'ASSIGNMENTS' as AcademicTab, label: 'Assignments', icon: <ClipboardList size={11} />},
 {id: 'EXAMS' as AcademicTab, label: 'Exams', icon: <FlaskConical size={11} />},
 {id: 'PRACTICE' as AcademicTab, label: 'Practice', icon: <Layers size={11} />},
 ], [])'''
)
]
patch_file("apps/desktop/src/routes/academic.tsx", academic_patches)
