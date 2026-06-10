export type WalkthroughMilestone =
  // Chapter 2: Command Center (Settings)
  | '2.1' | '2.2' | '2.3' | '2.4' | '2.5' | '2.6'
  // Chapter 3: Academic Dashboard
  | '3.1' | '3.2' | '3.3' | '3.4' | '3.5' | '3.6'
  // Chapter 4: Agents & Pipeline
  | '4.1' | '4.2' | '4.3' | '4.4' | '4.5' | '4.6' | '4.7'
  // Chapter 5: Obsidian Vault
  | '5.1' | '5.2' | '5.3' | '5.4' | '5.5' | '5.6' | '5.7' | '5.8'
  // Chapter 6: Practice
  | '6.1' | '6.2' | '6.3' | '6.4' | '6.5' | '6.6'
  // Chapter 7: Conversion
  | '7.1'

export type WalkthroughStatus = 'inactive' | 'active' | 'completed' | 'skipped'

export type WalkthroughTrigger =
  // Settings (Chapter 2)
  | 'nav_settings'
  | 'vaultPath_updated'
  | 'ai_config_opened' | 'add_key_started' | 'activeKey_tested'
  | 'timer_config_opened' | 'work_duration_updated'
  // Academic (Chapter 3)
  | 'nav_academic'
  | 'nav_academic_program' | 'nav_academic_courses' | 'nav_academic_planner'
  | 'nav_academic_assignments' | 'nav_academic_exams'
  // Agents (Chapter 4)
  | 'nav_agents'
  | 'oracle_queried' | 'pipeline_opened'
  | 'inbox_file_selected' | 'file_processing_started'
  | 'plan_generated' | 'plan_confirmed'
  // Obsidian (Chapter 5)
  | 'nav_obsidian'
  | 'graph_toggled' | 'note_opened' | 'pomodoro_started'
  | 'explain_dialog_open' | 'pdf_jumped'
  | 'properties_opened' | 'quiz_interacted'
  // Practice (Chapter 6)
  | 'nav_practice'
  | 'practice_custom_started' | 'practice_config_seen'
  | 'practice_started' | 'practice_session_active'
  | 'practice_session_completed'
  // Conversion
  | 'conversion_completed'

export interface WalkthroughState {
  status: WalkthroughStatus
  milestone: WalkthroughMilestone
}

const MILESTONE_ORDER: WalkthroughMilestone[] = [
  '2.1', '2.2', '2.3', '2.4', '2.5', '2.6',
  '3.1', '3.2', '3.3', '3.4', '3.5', '3.6',
  '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7',
  '5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8',
  '6.1', '6.2', '6.3', '6.4', '6.5', '6.6',
  '7.1',
]

const TRIGGER_BY_MILESTONE: Record<WalkthroughMilestone, WalkthroughTrigger[]> = {
  // Chapter 2: Settings
  '2.1': ['nav_settings'],                         // Open Settings (via sidebar button or welcome)
  '2.2': ['vaultPath_updated'],                     // Select Vault folder
  '2.3': ['ai_config_opened'],                     // Open AI Providers & Keys tab
  '2.4': ['add_key_started', 'activeKey_tested'],   // Add/test API key (or skip)
  '2.5': ['timer_config_opened'],                  // Open Focus Timer tab
  '2.6': ['work_duration_updated'],                // Adjust Pomodoro work duration
  // Chapter 3: Academic
  '3.1': ['nav_academic'],                         // Navigate to Academic Dashboard
  '3.2': ['nav_academic_program'],                 // Open Program tab
  '3.3': ['nav_academic_courses'],                 // Open Courses tab
  '3.4': ['nav_academic_planner'],                 // Open Study Planner tab
  '3.5': ['nav_academic_assignments'],             // Open Assignments tab
  '3.6': ['nav_academic_exams'],                   // Open Exams tab
  // Chapter 4: Agents & Pipeline
  '4.1': ['nav_agents'],                           // Navigate to Agents Hub
  '4.2': ['oracle_queried'],                       // Chat with Ater (type & send question)
  '4.3': ['pipeline_opened'],                      // Open Pipeline tab
  '4.4': ['inbox_file_selected'],                  // Select PDF from Inbox
  '4.5': ['file_processing_started'],              // Click Process File
  '4.6': ['plan_generated'],                       // Click Generate Plan
  '4.7': ['plan_confirmed'],                       // Click Confirm Setup & Deploy
  // Chapter 5: Obsidian
  '5.1': ['nav_obsidian'],                         // Navigate to Obsidian page
  '5.2': ['graph_toggled'],                        // Toggle Network Graph view
  '5.3': ['note_opened'],                          // Open notes/Consensus.md
  '5.4': ['pomodoro_started'],                     // Click embedded Pomodoro timer
  '5.5': ['explain_dialog_open'],                  // Select text & click Explain to AI
  '5.6': ['pdf_jumped'],                           // Click Jump to PDF
  '5.7': ['properties_opened'],                    // Click Note Properties panel
  '5.8': ['quiz_interacted'],                      // Answer embedded quiz & click verify
  // Chapter 6: Practice
  '6.1': ['nav_practice'],                         // Navigate to Practice tab
  '6.2': ['practice_custom_started'],              // Click Custom Practice button
  '6.3': ['practice_config_seen'],                 // Interact with Practice Config Panel
  '6.4': ['practice_started'],                     // Click Start Practice
  '6.5': ['practice_session_active'],              // Submit answer
  '6.6': ['practice_session_completed'],           // Click Finish Practice
  // Chapter 7: Conversion
  '7.1': ['conversion_completed'],                 // Exit simulation & Setup real program
}

export function advanceWalkthrough(
  state: WalkthroughState,
  trigger: WalkthroughTrigger,
): WalkthroughState {
  if (state.status !== 'active') return state
  if (!TRIGGER_BY_MILESTONE[state.milestone].includes(trigger)) return state

  const currentIndex = MILESTONE_ORDER.indexOf(state.milestone)
  if (currentIndex === -1 || currentIndex === MILESTONE_ORDER.length - 1) {
    return { status: 'completed', milestone: state.milestone }
  }

  return {
    status: 'active',
    milestone: MILESTONE_ORDER[currentIndex + 1],
  }
}

/** Advance to the next milestone unconditionally (for per-step "Skip" button) */
export function skipMilestone(state: WalkthroughState): WalkthroughState {
  if (state.status !== 'active') return state
  const currentIndex = MILESTONE_ORDER.indexOf(state.milestone)
  if (currentIndex === -1 || currentIndex === MILESTONE_ORDER.length - 1) {
    return { status: 'completed', milestone: state.milestone }
  }
  return { status: 'active', milestone: MILESTONE_ORDER[currentIndex + 1] }
}

/** Regress to the previous milestone (for tour "Backward" button) */
export function previousMilestone(state: WalkthroughState): WalkthroughState {
  if (state.status !== 'active') return state
  const currentIndex = MILESTONE_ORDER.indexOf(state.milestone)
  if (currentIndex <= 0) return state
  return { status: 'active', milestone: MILESTONE_ORDER[currentIndex - 1] }
}
