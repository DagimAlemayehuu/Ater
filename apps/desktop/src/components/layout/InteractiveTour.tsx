import React, { useState, useEffect, useRef } from 'react';
import { useConfig } from '@/lib/ConfigContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { sidecarApi } from '@/lib/sidecarApi';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePomodoroStore } from '@/lib/pomodoroStore';

interface TourStep {
  selector?: string;
  title: string;
  explanation: string;
  action: string;
  route?: string;
  actionRequired?: 'click' | 'text' | 'none';
  actionTrigger?: () => void;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  lowMask?: boolean;
}

export function InteractiveTour() {
  const isBypass = new URLSearchParams(window.location.search).get('bypass') === 'true' || window.location.hash.includes('bypass=true');
  if (isBypass) return null;

  const { config, saveConfig } = useConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const { setShowOverlay } = usePomodoroStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<DOMRect | null>(null);
  const [isActive, setIsActive] = useState(false);
  const targetRef = useRef<Element | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Check if tour needs to start or continue
  useEffect(() => {
    if (config?.isDemoMode && config?.isProgramConfigured) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [config?.isDemoMode, config?.isProgramConfigured]);

  const steps: TourStep[] = [
    {
      title: "Welcome to Ater Walkthrough!",
      explanation: "This guided tour takes you through Ater's workspace features, utilizing a pre-loaded Computer Science curriculum and note vaults. No AI costs or database configurations are needed. We will cover absolutely 100% of every page, tab, subpage, and action button.",
      action: "Click the 'Next' button to begin exploring the global interface layout.",
      placement: "center",
      route: "/academic"
    },
    // Global Header Items
    {
      selector: "[data-tour='header-back']",
      title: "Header: Navigate Backwards",
      explanation: "Click the back arrow to reverse navigation history, returning to previously visited notes, tabs, or vaults. It remembers your journey like a browser.",
      action: "Look at the back arrow in the header, then click 'Next'.",
      placement: "bottom",
      route: "/academic"
    },
    {
      selector: "[data-tour='header-forward']",
      title: "Header: Navigate Forwards",
      explanation: "Re-advance your navigation timeline after backing out. Extremely handy when jumping back and forth during heavy note revision.",
      action: "Look at the forward arrow, then click 'Next'.",
      placement: "bottom",
      route: "/academic"
    },
    {
      selector: "[data-tour='db-sync']",
      title: "Header: Refresh & Sync Database",
      explanation: "Surgically indexes and syncs all offline local Obsidian markdown note files and frontmatter with the internal state database. Any changes you make in Obsidian are indexed instantly.",
      action: "Look at the sync icon in the top right, then click 'Next'.",
      placement: "bottom",
      route: "/academic"
    },
    {
      selector: "[data-tour='db-calendar']",
      title: "Header: Consolidated Calendar Toggle",
      explanation: "Toggles the university timeline calendar view. It consolidates study session planner hubs, homework due dates, and exam schedules into a single calendar grid.",
      action: "Look at the calendar icon in the header, then click 'Next'.",
      placement: "bottom",
      route: "/academic"
    },
    {
      selector: "[data-tour='header-timer']",
      title: "Header: Pomodoro Focus Timer Widget",
      explanation: "Distraction lockdown! Tracks your live focus sessions, work intervals, and logs study times directly to your spaced recall telemetry. Clicking it launches the Focus HUD overlay.",
      action: "Click the timer widget in the header to open the Focus HUD overlay.",
      placement: "bottom",
      route: "/academic",
      actionRequired: "click"
    },
    {
      selector: "[class*='overlay'], [class*='dialog'], [class*='pomodoro']",
      title: "Focus Timer: Pomodoro HUD Overlay",
      explanation: "Tracks active focus sessions, work intervals, and counts down breaks. Deep study sessions logged here automatically feed your memory analytics, locking your device footprint during focus.",
      action: "Look at the Pomodoro controller overlay, then click 'Next' to close it.",
      placement: "center",
      route: "/academic",
      actionTrigger: () => {
        setShowOverlay(true);
      }
    },
    {
      selector: "[data-tour='header-credit']",
      title: "Header: AI Credit Balance Meter",
      explanation: "Shows your available hybrid cloud/local token credit balance. Generating concepts, answers, vector plans, and summaries deducts credits.",
      action: "Observe the credit meter in the header, then click 'Next'.",
      placement: "bottom",
      route: "/academic",
      actionTrigger: () => {
        setShowOverlay(false);
      }
    },
    {
      selector: "[data-tour='header-theme']",
      title: "Header: Appearance Theme Toggle",
      explanation: "Toggle custom dark mode and light mode aesthetics. The entire app adjusts to sharp, geometric, outfits-typography gray tones.",
      action: "Locate the light/dark theme switch in the header, then click 'Next'.",
      placement: "bottom",
      route: "/academic"
    },
    // AI Hub Tab (OracleChat & Pipeline)
    {
      selector: "[data-tour='sidebar-ater']",
      title: "Sidebar: AI Socratic Oracle & Pipeline",
      explanation: "Navigates directly to your Socratic AI assistant page where you chat and review curriculum insights, syllabus pipelines, and telemetry.",
      action: "Click the Socratic AI shortcut icon in the sidebar to open the chat interface.",
      placement: "right",
      route: "/academic",
      actionRequired: "click"
    },
    {
      selector: "textarea",
      title: "AI Oracle: Socratic Dialogue Input",
      explanation: "Submit questions, paste reading notes, or import syllabus topics here to receive customized Socratic active explanations. It uses local RAG vector search over your notes.",
      action: "Observe the query input. Click 'Tell me about binary search' below to simulate a live AI query.",
      placement: "top",
      route: "/agents?tab=ater",
      lowMask: true
    },
    {
      selector: ".prose",
      title: "AI Oracle: Semantic RAG Response",
      explanation: "Welcome to the streaming Socratic assistant response. Ater scans your notes, runs semantic vector searches, and structures highly pedagogical responses.",
      action: "Read the Socratic response, then click 'Next'.",
      placement: "bottom",
      route: "/agents?tab=ater"
    },
    {
      selector: "button:contains('CLEAR')",
      title: "AI Oracle: Clear Conversation History",
      explanation: "Wipes conversation memory clean to start a fresh Socratic focus thread, freeing up context windows.",
      action: "Locate the CLEAR button in the top right of the agents hub, then click 'Next'.",
      placement: "bottom",
      route: "/agents?tab=ater"
    },
    {
      selector: "button:contains('Pipeline')",
      title: "AI Hub: Syllabus Ingestion Pipeline",
      explanation: "Switch here to upload syllabus documents, lecture files, and PDFs to extract key course maps, years, and notes.",
      action: "Click the Pipeline tab to switch views.",
      placement: "bottom",
      route: "/agents?tab=ater",
      actionRequired: "click",
      actionTrigger: () => {
        navigate("/agents?tab=pipeline");
      }
    },
    {
      selector: "button:contains('Auto-Ingest')",
      title: "Pipeline: Auto-Ingest Watcher",
      explanation: "Toggles Tauri native background directory watchers. If enabled, dropping PDFs in the inbox auto-generates structured notes.",
      action: "Look at the Auto-Ingest toggle in the header, then click 'Next'.",
      placement: "bottom",
      route: "/agents?tab=pipeline"
    },
    {
      selector: "button:contains('RefreshCw')",
      title: "Pipeline: Refresh Cache Pager",
      explanation: "Refetches folders and uploaded syllabus files from the local directory immediately.",
      action: "Observe the refresh button in the header, then click 'Next'.",
      placement: "bottom",
      route: "/agents?tab=pipeline"
    },
    {
      selector: "div:contains('Inbox Files')",
      title: "Pipeline: Uploaded Inbox Files",
      explanation: "Lists unprocessed academic PDFs, syllabus catalogs, and slides awaiting deployment.",
      action: "Look at the inbox list, then click 'Next'.",
      placement: "right",
      route: "/agents?tab=pipeline",
      lowMask: true
    },
    {
      selector: "button:contains('Analyze Context')",
      title: "Pipeline: Analyze Context",
      explanation: "Triggers heavy structure extraction. It parses the document layout, identifying course codes, descriptions, and chapters.",
      action: "Observe the analyze button, then click 'Next'.",
      placement: "bottom",
      route: "/agents?tab=pipeline",
      lowMask: true
    },
    {
      selector: "input[placeholder*='Unit']",
      title: "Pipeline: Curriculum Mapping Form",
      explanation: "Surgically adjust or select target Courses, Semesters, Units, and Hub titles where these notes should be generated in your timeline.",
      action: "Observe the curriculum properties mapping cards, then click 'Next'.",
      placement: "left",
      route: "/agents?tab=pipeline",
      lowMask: true
    },
    {
      selector: "button:contains('Generate Plan')",
      title: "Pipeline: Generate Plan",
      explanation: "Instructs Ater to compile a multi-batch note roadmap. It previews the planned note structures before execution.",
      action: "Observe the generate plan button, then click 'Next'.",
      placement: "bottom",
      route: "/agents?tab=pipeline",
      lowMask: true
    },
    {
      selector: "[class*='PlanCardView']",
      title: "Pipeline: Plan Ingestion Tree",
      explanation: "The generated roadmap feed shows which notes, models (e.g. MCQ, SYNTHESIS, CODE), and syllabus pages are assigned to each file.",
      action: "Look at the plan details cards tree, then click 'Next'.",
      placement: "left",
      route: "/agents?tab=pipeline",
      lowMask: true
    },
    {
      selector: "button:contains('Confirm Final Plan')",
      title: "Pipeline: Deploy Step 1",
      explanation: "Surgically executes and deploy notes in manageable batches. Creates folders, markdown templates, and quizzes.",
      action: "Observe the Confirm & Deploy button, then click 'Next'.",
      placement: "bottom",
      route: "/agents?tab=pipeline",
      lowMask: true
    },
    {
      selector: "button:contains('Proceed Batch (Auto)')",
      title: "Pipeline: Full Auto-Deploy",
      explanation: "Instructs Ater to deploy all batches sequentially without user confirmation steps. Perfect for large textbooks.",
      action: "Observe the Proceed Auto-Deploy button, then click 'Next'.",
      placement: "bottom",
      route: "/agents?tab=pipeline",
      lowMask: true
    },
    {
      selector: "[class*='AiPressureBar']",
      title: "Pipeline: AI Pressure Telemetry",
      explanation: "Tracks background rate limits (governor pressure). Automatically throttles requests to prevent API blockages.",
      action: "Observe the pressure bar dashboard metrics, then click 'Next'.",
      placement: "top",
      route: "/agents?tab=pipeline"
    },
    // Academic Dashboard Tab 1: PROGRAM
    {
      selector: "[data-tour='sidebar-academic']",
      title: "Sidebar: Academic Dashboard",
      explanation: "This opens your university timeline housing study planners, course catalogs, assignments, exams, and active-recall modules.",
      action: "Click the graduation cap icon in the sidebar to open the dashboard.",
      placement: "right",
      route: "/agents?tab=pipeline",
      actionRequired: "click"
    },
    {
      selector: "[data-tour='tab-program']",
      title: "Academic Dashboard: Degree Program",
      explanation: "Tracks overall completion ratios, courses checklists, degree GPA, and academic semesters.",
      action: "Click the Program tab in the header.",
      placement: "bottom",
      route: "/academic?tab=PROGRAM",
      actionRequired: "click",
      lowMask: true
    },
    {
      selector: "[data-tour='program-bento']",
      title: "Program: Bento Roadmap",
      explanation: "The left bento roadmap panel displays a vertical tree of active, completed, and planned semesters.",
      action: "Identify the left bento sidebar, then click 'Next'.",
      placement: "right",
      route: "/academic?tab=PROGRAM",
      lowMask: true
    },
    {
      selector: "[data-tour='program-edit']",
      title: "Program: Edit & Scaffold Curriculum",
      explanation: "Scaffold a complete multi-year university curriculum (Year I-IV, sem semesters, courses) in one click or edit parameters.",
      action: "Look at the Edit/Setup roadmap button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PROGRAM",
      lowMask: true
    },
    {
      selector: "[data-tour='program-progress']",
      title: "Program: Completion Analytics",
      explanation: "Displays degree metrics (earned vs target credits) and overall university timeline completion ratio.",
      action: "Observe the progress bento card, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PROGRAM",
      lowMask: true
    },
    {
      selector: "[data-tour='program-active-year']",
      title: "Program: Active Year Card",
      explanation: "Displays your current enrolled year. Clicking it opens details to manage semesters and credits.",
      action: "Observe the Active Year card, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PROGRAM",
      lowMask: true
    },
    {
      selector: "[data-tour='program-active-semester']",
      title: "Program: Active Semester Card",
      explanation: "Displays your current active semester. Clicking it opens details to manage courses and credits.",
      action: "Observe the Active Semester card, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PROGRAM",
      lowMask: true
    },
    {
      selector: "[data-tour='program-gpa']",
      title: "Program: Cumulative GPA tracking",
      explanation: "Aggregates course grade scales across semesters to compute your overall cumulative GPA.",
      action: "Observe the Cumulative GPA card, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PROGRAM",
      lowMask: true
    },
    {
      selector: "[data-tour='program-grid']",
      title: "Program: Degree Curriculum Grid",
      explanation: "Displays your complete multi-year roadmap grid. Click on any year or semester to manage courses.",
      action: "Observe the All Years roadmap grid, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=PROGRAM",
      lowMask: true
    },
    // Year Detail Subpage
    {
      selector: "[data-tour='program-grid']",
      title: "Program: Year Detail Subpage",
      explanation: "Clicking a Year card opens the Year Detail view. Here you can edit its title, status, set it as the active year, or mark it complete.",
      action: "Click 'Next' to view details for Year I.",
      placement: "center",
      route: "/academic?tab=PROGRAM",
      actionTrigger: () => {
        navigate("/academic?tab=PROGRAM&id=Year_I");
      }
    },
    {
      selector: "button:contains('Set Active')",
      title: "Year Detail: Set Active Year",
      explanation: "Sets this year as the current academic focus year. All dashboard courses automatically adapt.",
      action: "Observe the Set Active button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PROGRAM&id=Year_I",
      lowMask: true
    },
    {
      selector: "button:contains('Mark Complete')",
      title: "Year Detail: Mark Complete",
      explanation: "Manually flags this year status as Completed. Locked degree credits sync.",
      action: "Observe the Mark Complete button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PROGRAM&id=Year_I",
      lowMask: true
    },
    {
      selector: "button:contains('Add Semester')",
      title: "Year Detail: Add Semester",
      explanation: "Adds a new custom semester (e.g. Winter 2025) directly under this academic year.",
      action: "Observe the Add Semester button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PROGRAM&id=Year_I",
      lowMask: true
    },
    {
      selector: "div:contains('Semesters')",
      title: "Year Detail: Semesters List",
      explanation: "Lists all semesters mapped to this year, showing status, course counts, and progress.",
      action: "Observe the Semesters list, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=PROGRAM&id=Year_I",
      lowMask: true
    },
    // Semester Detail Subpage
    {
      selector: "div:contains('Semesters')",
      title: "Program: Semester Detail Subpage",
      explanation: "Clicking a Semester opens the Semester Detail view. Here you manage all lectures, grades, and credits in this term.",
      action: "Click 'Next' to view details for Autumn 2024.",
      placement: "center",
      route: "/academic?tab=PROGRAM&id=Year_I",
      actionTrigger: () => {
        navigate("/academic?tab=PROGRAM&id=Autumn_2024");
      }
    },
    {
      selector: "button:contains('Add Course')",
      title: "Semester Detail: Add Course",
      explanation: "Creates a new lecture card mapped directly inside this semester timeline.",
      action: "Observe the Add Course button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PROGRAM&id=Autumn_2024",
      lowMask: true
    },
    {
      selector: "div:contains('Courses')",
      title: "Semester Detail: Linked Course Catalog",
      explanation: "Highlights all courses, credits, and active grades assigned to this semester. Click any course to view details.",
      action: "Observe the Courses list, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=PROGRAM&id=Autumn_2024",
      lowMask: true
    },
    // Academic Dashboard Tab 2: COURSES
    {
      selector: "[data-tour='tab-courses']",
      title: "Academic Dashboard: Course Catalog",
      explanation: "Displays your academic lectures list. Tracks grades, credit weights, due assignments, and exams for each class.",
      action: "Click the Courses tab in the header.",
      placement: "bottom",
      route: "/academic?tab=PROGRAM&id=Autumn_2024",
      actionRequired: "click",
      lowMask: true
    },
    {
      selector: "button:contains('Active')",
      title: "Courses: Status Filters",
      explanation: "Filter courses by status: Active (current semester), All (complete degree), or Completed.",
      action: "Observe the filters bar, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=COURSES"
    },
    {
      selector: "input[placeholder*='Search']",
      title: "Courses: Course search",
      explanation: "Filter course cards by code or name instantly as you type.",
      action: "Observe the search input, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=COURSES"
    },
    {
      selector: "[data-tour='course-add']",
      title: "Courses: Create Course",
      explanation: "Creates a new custom course, generating markdown files and database indexes.",
      action: "Look at the Add Course button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=COURSES"
    },
    {
      selector: "[data-tour='course-card-cs_201']",
      title: "Courses: Course Card Grid",
      explanation: "Highlights lecture info: title, credits weight, grade letter, upcoming exams, and remaining assignments countdown.",
      action: "Click on the CS 201 Course card to view details.",
      placement: "top",
      route: "/academic?tab=COURSES",
      actionRequired: "click",
      lowMask: true
    },
    {
      selector: "[data-tour='course-detail-view']",
      title: "Courses: Detail Subpage View",
      explanation: "Opening a course reveals its academic properties, credit weight, grade scales, and direct shortcuts to linked notes in your vault.",
      action: "Read the course properties panel, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=COURSES",
      lowMask: true
    },
    {
      selector: "button:contains('← Courses')",
      title: "Courses: Return to Catalog",
      explanation: "Clicking this arrow collapses the course detailed overlay and returns to the catalog grid.",
      action: "Observe the back button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=COURSES&id=cs_201",
      lowMask: true
    },
    {
      selector: "[class*='EditableTitle']",
      title: "Courses: Rename Course",
      explanation: "Clicking on the course name lets you rename the lecture. Updates markdown frontmatter dynamically.",
      action: "Observe the editable title, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=COURSES&id=cs_201",
      lowMask: true
    },
    {
      selector: "button[title='Open Note']",
      title: "Courses: Open Vault Note",
      explanation: "Jumps directly to the course notes overview file inside the Obsidian note workspace editor.",
      action: "Observe the BookOpen icon in the top right, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=COURSES&id=cs_201",
      lowMask: true
    },
    {
      selector: "button[title='Delete']",
      title: "Courses: Delete Course",
      explanation: "Removes the course from Ater database and prompts to safely archive or purge markdown notes.",
      action: "Observe the Trash icon in the top right, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=COURSES&id=cs_201",
      lowMask: true
    },
    {
      selector: "[class*='StatCard']",
      title: "Courses: Consolidated Metrics",
      explanation: "Displays total credit weights, assignments done ratios, studied hubs, and exams counts for this lecture.",
      action: "Observe the course stats cards, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=COURSES&id=cs_201",
      lowMask: true
    },
    {
      selector: "[class*='BigPropertyCard']",
      title: "Courses: Properties Configurator",
      explanation: "Edit course data in-line: Semester, Credits, Professor, and custom properties mapped to Obsidian frontmatter.",
      action: "Observe the properties cards grid, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=COURSES&id=cs_201",
      lowMask: true
    },
    {
      selector: "div:contains('Study Hubs')",
      title: "Courses: Linked Study Hubs",
      explanation: "Shows all active revision hubs mapped to this course. Clicking a hub opens its Obsidian markdown file.",
      action: "Observe the Study Hubs list, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=COURSES&id=cs_201",
      lowMask: true
    },
    {
      selector: "div:contains('Pending Assignments')",
      title: "Courses: Assignments checklist",
      explanation: "Displays homework tasks and priority alerts. Clicking Add creates an assignment inline.",
      action: "Observe the assignments list, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=COURSES&id=cs_201",
      lowMask: true
    },
    // Academic Dashboard Tab 3: PLANNER
    {
      selector: "[data-tour='tab-planner']",
      title: "Academic Dashboard: Weekly Study Planner",
      explanation: "Structures study planners and hours. Hubs organize lecture topics into notes linked to your vault.",
      action: "Click the Planner tab in the header.",
      placement: "bottom",
      route: "/academic?tab=COURSES&id=cs_201",
      actionRequired: "click",
      lowMask: true
    },
    {
      selector: "button:contains('Active')",
      title: "Planner: Status Filters",
      explanation: "Switch between Active (to be revised) and Completed study sessions.",
      action: "Observe the filters bar, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PLANNER"
    },
    {
      selector: "button:contains('By course')",
      title: "Planner: Grouping Modes",
      explanation: "Group study hubs: Flat (simple list), By Course, or By Status (Active vs Completed).",
      action: "Observe the grouping selectors, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PLANNER"
    },
    {
      selector: "[data-tour='planner-add']",
      title: "Planner: Create Study Hub",
      explanation: "Adds a new custom Study Hub folder to structure markdown note files.",
      action: "Observe the Add Hub button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PLANNER"
    },
    {
      selector: "[data-tour='planner-card-searching_complexity']",
      title: "Planner: Study Hub Card",
      explanation: "Displays active study targets. Checkbox toggles Completed status. Shows study time and recall quiz scores.",
      action: "Click on the 'Unit 1: Searching & Complexity' study hub card to view details.",
      placement: "top",
      route: "/academic?tab=PLANNER",
      actionRequired: "click",
      lowMask: true
    },
    {
      selector: "[data-tour='planner-detail-view']",
      title: "Planner: Hub Detail View",
      explanation: "Tracks study hours, practice quiz statistics, linked exams, and provides shortcuts for active recall practice.",
      action: "Read the study hub properties, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=PLANNER",
      lowMask: true
    },
    {
      selector: "button:contains('← Study Planner')",
      title: "Planner: Back to Planner",
      explanation: "Collapses the Study Hub detailed view, returning to your active planners catalog list.",
      action: "Observe the back button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PLANNER&id=searching_complexity",
      lowMask: true
    },
    {
      selector: "button:contains('Mark Complete')",
      title: "Planner: Mark Complete",
      explanation: "Flags study hub status as Completed, marking all linked checklist notes as read.",
      action: "Observe the Mark Complete button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PLANNER&id=searching_complexity",
      lowMask: true
    },
    {
      selector: "button[title='Open Note']",
      title: "Planner: Open Note",
      explanation: "Open this study planner notes directory inside your Obsidian vault workspace.",
      action: "Observe the Open Note button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PLANNER&id=searching_complexity",
      lowMask: true
    },
    {
      selector: "button[title='Delete']",
      title: "Planner: Delete Hub",
      explanation: "Purges the hub directory index from the database safely.",
      action: "Observe the delete button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PLANNER&id=searching_complexity",
      lowMask: true
    },
    {
      selector: "div:contains('Linked Exam')",
      title: "Planner: Linked Exam Card",
      explanation: "Shows midterms linked to this Study Hub. Click View to jump to Exam prep.",
      action: "Observe the Linked Exam section, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PLANNER&id=searching_complexity",
      lowMask: true
    },
    {
      selector: "button:contains('Practice This Hub')",
      title: "Planner: Practice This Hub",
      explanation: "Launches the Custom Spaced Recall Quiz configurator, auto-loading notes from this Study Hub.",
      action: "Observe the Practice button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PLANNER&id=searching_complexity",
      lowMask: true
    },
    {
      selector: "button:contains('View in Calendar')",
      title: "Planner: View in Calendar",
      explanation: "Exits detailed view and focuses this hub timeline date in the calendar grid.",
      action: "Observe the Calendar navigation shortcut, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PLANNER&id=searching_complexity",
      lowMask: true
    },
    // Academic Dashboard Tab 4: ASSIGNMENTS
    {
      selector: "[data-tour='tab-assignments']",
      title: "Academic Dashboard: Homework & Assignments",
      explanation: "Tracks course deliverables, homework, problem sets, and projects. Monitors upcoming timelines.",
      action: "Click the Assignments tab in the header.",
      placement: "bottom",
      route: "/academic?tab=PLANNER&id=searching_complexity",
      actionRequired: "click",
      lowMask: true
    },
    {
      selector: "button:contains('Pending')",
      title: "Assignments: Status Filters",
      explanation: "Toggle between Pending (undelivered assignments) and Completed files.",
      action: "Observe the filters bar, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=ASSIGNMENTS"
    },
    {
      selector: "select:first-of-type",
      title: "Assignments: Course filter",
      explanation: "Select specific courses to filter assignment listings.",
      action: "Observe the course select dropdown, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=ASSIGNMENTS"
    },
    {
      selector: "select:nth-of-type(2)",
      title: "Assignments: Sort Options",
      explanation: "Sort tasks: By Due Date, By Priority (Critical to Low), or alphabetically By Course.",
      action: "Observe the sorting dropdown, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=ASSIGNMENTS"
    },
    {
      selector: "[data-tour='assignment-add']",
      title: "Assignments: Add Assignment",
      explanation: "Creates a new custom assignment checklist mapped to a course.",
      action: "Observe the Add Assignment button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=ASSIGNMENTS"
    },
    {
      selector: "div:contains('overdue')",
      title: "Assignments: Overdue Alerts Banner",
      explanation: "A high-visibility banner listing overdue homework. Clicking an alert jumps to details.",
      action: "Observe the overdue notification banner, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=ASSIGNMENTS",
      lowMask: true
    },
    {
      selector: "[data-tour='assignment-card-assign_1']",
      title: "Assignments: Assignment Card",
      explanation: "Checkbox toggles Done status. Displays name, course code, priority label, and due dates.",
      action: "Click on 'Problem Set 1' to view details.",
      placement: "top",
      route: "/academic?tab=ASSIGNMENTS",
      actionRequired: "click",
      lowMask: true
    },
    {
      selector: "[data-tour='assignment-detail-view']",
      title: "Assignments: Detail View",
      explanation: "Change priority status, set due dates, edit titles, open files, and track days left.",
      action: "Read the assignment details panel, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=ASSIGNMENTS",
      lowMask: true
    },
    {
      selector: "button:contains('← Assignments')",
      title: "Assignments: Return to List",
      explanation: "Clicking this collapses detail overlay to return to your tasks list.",
      action: "Observe the back button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=ASSIGNMENTS&id=assign_1",
      lowMask: true
    },
    {
      selector: "button[title='Open Note']",
      title: "Assignments: Open Note",
      explanation: "Opens the assignment specifications and checklist file in Obsidian.",
      action: "Observe the Open Note button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=ASSIGNMENTS&id=assign_1",
      lowMask: true
    },
    {
      selector: "button[title='Delete']",
      title: "Assignments: Delete Assignment",
      explanation: "Safely removes this task index from the degree database.",
      action: "Observe the delete button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=ASSIGNMENTS&id=assign_1",
      lowMask: true
    },
    {
      selector: "div:contains('days left')",
      title: "Assignments: Countdown Alert",
      explanation: "Computes exact remaining time, highlighting late tasks in signal gray/red.",
      action: "Observe the countdown badge, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=ASSIGNMENTS&id=assign_1",
      lowMask: true
    },
    {
      selector: "button:contains('Mark Complete')",
      title: "Assignments: Toggle Done Action",
      explanation: "Flags task status. Swaps properties between Pending and Completed.",
      action: "Observe the full-width Mark Complete button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=ASSIGNMENTS&id=assign_1",
      lowMask: true
    },
    // Academic Dashboard Tab 5: EXAMS
    {
      selector: "[data-tour='tab-exams']",
      title: "Academic Dashboard: Exams & Quizzes",
      explanation: "Tracks test schedules, midterms, and final exams. Links study notes to grade weights.",
      action: "Click the Exams tab in the header.",
      placement: "bottom",
      route: "/academic?tab=ASSIGNMENTS&id=assign_1",
      actionRequired: "click",
      lowMask: true
    },
    {
      selector: "button:contains('Upcoming')",
      title: "Exams: Status Filters",
      explanation: "Filters quizzes list by Upcoming (upcoming exam timelines) and Past exams.",
      action: "Observe the filters bar, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=EXAMS"
    },
    {
      selector: "select",
      title: "Exams: Course filter",
      explanation: "Filter exams list by selecting specific lecture subjects.",
      action: "Observe the select filter, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=EXAMS"
    },
    {
      selector: "[data-tour='exam-add']",
      title: "Exams: Add Exam",
      explanation: "Creates a new quiz or midterm index, generating study properties.",
      action: "Observe the Add button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=EXAMS"
    },
    {
      selector: "div:contains('Next Exam')",
      title: "Exams: Next Exam Countdown",
      explanation: "A top banner highlighting your next exam date, calculating remaining revision days.",
      action: "Observe the next exam info banner, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=EXAMS",
      lowMask: true
    },
    {
      selector: "[data-tour='exam-card-midterm_1']",
      title: "Exams: Test Card Grid",
      explanation: "Highlights scheduled dates, course name, exam type (e.g. Midterm, Final), and countdown tags.",
      action: "Click on 'Midterm Exam 1' to view details.",
      placement: "top",
      route: "/academic?tab=EXAMS",
      actionRequired: "click",
      lowMask: true
    },
    {
      selector: "[data-tour='exam-detail-view']",
      title: "Exams: Detail Subpage",
      explanation: "Manages test details: Confidence sliders, revision progress, total study times, and checklist notes.",
      action: "Read the exam properties panel, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=EXAMS",
      lowMask: true
    },
    {
      selector: "button:contains('← Exams')",
      title: "Exams: Back to List",
      explanation: "Collapses exam details and returns to your testing timeline.",
      action: "Observe the back button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=EXAMS&id=midterm_1",
      lowMask: true
    },
    {
      selector: "button[title='Open Note']",
      title: "Exams: Open Exam Note",
      explanation: "Open the exam prep notes index directly inside Obsidian notes workspace.",
      action: "Observe the Open Note button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=EXAMS&id=midterm_1",
      lowMask: true
    },
    {
      selector: "button[title='Delete']",
      title: "Exams: Delete Exam",
      explanation: "Deletes this test index from your database.",
      action: "Observe the delete button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=EXAMS&id=midterm_1",
      lowMask: true
    },
    {
      selector: "div:contains('days')",
      title: "Exams: Revision Countdown",
      explanation: "Calculates days left for revision, reminding you to start practicing.",
      action: "Observe the countdown box, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=EXAMS&id=midterm_1",
      lowMask: true
    },
    {
      selector: "div:contains('Enter Your Result')",
      title: "Exams: Result Grader Panel",
      explanation: "If the exam is past and uncompleted, Ater displays a grader panel (A+ to F buttons) to log grades easily.",
      action: "Observe the grader panel buttons, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=EXAMS&id=midterm_1",
      lowMask: true
    },
    {
      selector: "div:contains('Preparation')",
      title: "Exams: Preparation analytics",
      explanation: "Monitors active preparation: lists linked Study Hubs, tracks study hours, and confidence parameters.",
      action: "Observe the prep statistics grid, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=EXAMS&id=midterm_1",
      lowMask: true
    },
    {
      selector: "div:contains('Study Hubs')",
      title: "Exams: Study checklist notes",
      explanation: "Lists checklist study notes under this exam. Click any item to jump to note revision.",
      action: "Observe the notes checklists list, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=EXAMS&id=midterm_1",
      lowMask: true
    },
    // Academic Dashboard Tab 6: PRACTICE
    {
      selector: "[data-tour='tab-practice']",
      title: "Academic Dashboard: Recall & Practice",
      explanation: "The active recall engine. Houses statistics, custom quizzes, reference vaults, and live tests.",
      action: "Click the Practice tab in the header.",
      placement: "bottom",
      route: "/academic?tab=EXAMS&id=midterm_1",
      actionRequired: "click",
      lowMask: true
    },
    {
      selector: "button:contains('Dashboard')",
      title: "Practice: Mode Switcher Tabs",
      explanation: "Toggles between Practice Dashboard, Past Sessions History, and Reference Vaults.",
      action: "Observe the modes tabs switcher, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PRACTICE&view=dashboard"
    },
    {
      selector: "[data-tour='practice-due-btn']",
      title: "Practice: Review Due (FSRS)",
      explanation: "FSRS (Free Spaced Repetition Scheduler) reviews! Generates customized tests matching note recall stability.",
      action: "Observe the Review Due button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PRACTICE&view=dashboard"
    },
    {
      selector: "[data-tour='practice-custom-btn']",
      title: "Practice: Custom Quiz Builder",
      explanation: "Click Custom to open the exam configurator, selecting notes, presets, and limits.",
      action: "Observe the Custom button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PRACTICE&view=dashboard"
    },
    {
      selector: "[data-tour='practice-stats-grid']",
      title: "Practice: Telemetry Analytics Dashboard",
      explanation: "Tracks recall diagnostics: Average score accuracies, total practiced sessions, and memory stability status.",
      action: "Observe the recall analytics statistics grid, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PRACTICE&view=dashboard"
    },
    {
      selector: "div:contains('Cognitive Modalities')",
      title: "Practice: Cognitive Modalities",
      explanation: "Plots active telemetry over cognitive skills like Choice, Synthesis, Debugging, Logic Trace, and Code.",
      action: "Observe the cognitive modalities progress meters list, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=PRACTICE&view=dashboard"
    },
    // Practice: History View
    {
      selector: "button:contains('Dashboard')",
      title: "Practice: History Subpage",
      explanation: "Tracks all your past recall quizzes. Review scores, dates, and delete unwanted history logs.",
      action: "Click Next to explore the History subtab view.",
      placement: "center",
      route: "/academic?tab=PRACTICE&view=dashboard",
      actionTrigger: () => {
        navigate("/academic?tab=PRACTICE&view=history");
      }
    },
    {
      selector: "div:contains('Past Sessions')",
      title: "History: Past Practice Sessions",
      explanation: "Lists completed quizzes showing scores. Clicking a session resumes or reviews errors. Trash deletes logs.",
      action: "Observe the history sessions lists, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=PRACTICE&view=history",
      lowMask: true
    },
    {
      selector: "button:contains('Start')",
      title: "History: Start Quiz",
      explanation: "Quick shortcut button to navigate to the Custom Quiz Configurator view.",
      action: "Observe the Start button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PRACTICE&view=history"
    },
    // Practice: Reference Vault View
    {
      selector: "button:contains('Dashboard')",
      title: "Practice: Reference Vault Subpage",
      explanation: "Surgically extract structured question lists from textbook files, worksheets, or custom copied text.",
      action: "Click Next to explore the Reference Vault subtab view.",
      placement: "center",
      route: "/academic?tab=PRACTICE&view=history",
      actionTrigger: () => {
        navigate("/academic?tab=PRACTICE&view=vault");
      }
    },
    {
      selector: "select",
      title: "Reference Vault: Select Hub",
      explanation: "Select your active Study Hub where compiled reference questions should be saved.",
      action: "Observe the Hub select dropdown, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PRACTICE&view=vault",
      lowMask: true
    },
    {
      selector: "input[placeholder*='Source name']",
      title: "Reference Vault: Add Source Form",
      explanation: "Name your source (e.g. Midterm 2024), paste raw lecture notes or exam questions, and compile.",
      action: "Observe the text import configs, then click 'Next'.",
      placement: "left",
      route: "/academic?tab=PRACTICE&view=vault",
      lowMask: true
    },
    {
      selector: "div:contains('Question Banks')",
      title: "Reference Vault: Question Banks",
      explanation: "Lists processed reference documents. Checkboxes select sources to include in the quiz.",
      action: "Observe the Question Banks checklist selector, then click 'Next'.",
      placement: "right",
      route: "/academic?tab=PRACTICE&view=vault",
      lowMask: true
    },
    {
      selector: "div:contains('All Questions')",
      title: "Reference Vault: Selected Modes",
      explanation: "Select generating modes: All extracted questions, Hard only (L3-L4 difficulty), AI Variants, Weak spots, or Exam simulation.",
      action: "Observe the mode option cards, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=PRACTICE&view=vault",
      lowMask: true
    },
    {
      selector: "button:contains('Practice')",
      title: "Reference Vault: Start Practice",
      explanation: "Triggers extraction, compiling questions from selected vaults into a live session.",
      action: "Observe the generate practice session button, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=PRACTICE&view=vault",
      lowMask: true
    },
    // Practice: Configuring View
    {
      selector: "button:contains('Dashboard')",
      title: "Practice: Custom Configurator View",
      explanation: "Deeply configure active-recall quizzes. Set parameters, note boundaries, and questions distribution.",
      action: "Click Next to explore the Configurator subtab view.",
      placement: "center",
      route: "/academic?tab=PRACTICE&view=vault",
      actionTrigger: () => {
        navigate("/academic?tab=PRACTICE&view=configuring");
      }
    },
    {
      selector: "div:contains('Select Notes')",
      title: "Configurator: Note boundaries checklist",
      explanation: "Pick specific note files to narrow exam boundaries, isolating weak spots.",
      action: "Observe the select notes checklist, then click 'Next'.",
      placement: "right",
      route: "/academic?tab=PRACTICE&view=configuring",
      lowMask: true
    },
    {
      selector: "button:contains('Balanced')",
      title: "Configurator: Question Presets",
      explanation: "Apply quick curriculum presets (e.g. Balanced, MCQ Blitz, Deep Write, Math Mode, Hard Mode, Exam Sim).",
      action: "Observe the preset buttons, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PRACTICE&view=configuring",
      lowMask: true
    },
    {
      selector: "div:contains('MCQ')",
      title: "Configurator: Counts Configurator",
      explanation: "Adjust sliders to specify count distributions: MCQs, synthesis, ordering, code, or mathematics.",
      action: "Observe the question count sliders, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=PRACTICE&view=configuring",
      lowMask: true
    },
    {
      selector: "[class*='BigPropertyCard']",
      title: "Configurator: Advanced Parameters",
      explanation: "Calibrate exam parameters: Difficulty (L1-L3), Grading Strictness, Plausibility, Tricks, hints toggles, and limits.",
      action: "Observe the parameter config sliders, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=PRACTICE&view=configuring",
      lowMask: true
    },
    {
      selector: "button:contains('Generate Exam')",
      title: "Configurator: Generate Exam",
      explanation: "Launches AI generation compiling active recall prompts from selected notes.",
      action: "Observe the Generate Exam button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PRACTICE&view=configuring",
      lowMask: true
    },
    // Practice: Loading View
    {
      selector: "button:contains('Dashboard')",
      title: "Practice: RAG Compilation Loader",
      explanation: "Ater indexes your notes, structuring L1 recall, L2 application, and L3 debugging challenges.",
      action: "Click Next to observe the Quiz Ingesting loader overlay.",
      placement: "center",
      route: "/academic?tab=PRACTICE&view=configuring",
      actionTrigger: () => {
        navigate("/academic?tab=PRACTICE&view=loading");
      }
    },
    {
      selector: "[class*='BlockingLoader']",
      title: "Loading: Status Logs",
      explanation: "Displays status logs detailing note scanning, questions indexing, and compiler progress.",
      action: "Observe the loader overlay status feeds, then click 'Next'.",
      placement: "center",
      route: "/academic?tab=PRACTICE&view=loading",
      lowMask: true
    },
    // Practice: Live Session View
    {
      selector: "button:contains('Dashboard')",
      title: "Practice: Session Quiz Arena",
      explanation: "The testing arena. Answer MCQs, write code, fill in blanks, order items, or complete Feynman prompts.",
      action: "Click Next to step into the Live Quiz view.",
      placement: "center",
      route: "/academic?tab=PRACTICE&view=loading",
      actionTrigger: () => {
        navigate("/academic?tab=PRACTICE&view=session&q=0");
      }
    },
    {
      selector: "[data-tour='practice-session-card']",
      title: "Quiz Arena: Interactive Questions",
      explanation: "Displays active questions with timers, progress bars, and multiple formats.",
      action: "Read the active session layout, then click 'Next'.",
      placement: "center",
      route: "/academic?tab=PRACTICE&view=session&q=0",
      lowMask: true
    },
    {
      selector: "button:contains('Check')",
      title: "Quiz Arena: Check Answer Action",
      explanation: "Submits your response to the Socratic grader. Reviews correct answers and counts points.",
      action: "Observe the Check/Submit Answer button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PRACTICE&view=session&q=0",
      lowMask: true
    },
    {
      selector: "div:contains('Explanation')",
      title: "Quiz Arena: Socratic Explanation Block",
      explanation: "Detailed, mathematically rigorous pedagogical explanations outlining why options are correct or wrong.",
      action: "Observe the Socratic explanation box, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=PRACTICE&view=session&q=0",
      lowMask: true
    },
    {
      selector: "button:contains('Explain')",
      title: "Quiz Arena: Deep Socratic Explain Dialog",
      explanation: "Still confused? Click Deep Explain to open a popup Socratic chat with Ater, guiding you to correct answers.",
      action: "Observe the Socratic Explain More button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PRACTICE&view=session&q=0",
      lowMask: true
    },
    {
      selector: "button:contains('Again')",
      title: "Quiz Arena: SRS recall ratings row",
      explanation: "Rate your memory stability (Again, Hard, Good, Easy) instantly. Schedules FSRS recall times.",
      action: "Observe the memory rating selectors, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=PRACTICE&view=session&q=0",
      lowMask: true
    },
    {
      selector: "button:contains('Next')",
      title: "Quiz Arena: Next Question / Finish",
      explanation: "Advances to the next question. Saves test logs and results on the final slide.",
      action: "Observe the Next button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PRACTICE&view=session&q=0",
      lowMask: true
    },
    // Practice: Results View
    {
      selector: "button:contains('Dashboard')",
      title: "Practice: Results Subpage",
      explanation: "Once completed, review your overall quiz telemetry, time spent, correct counts, and wrong choices.",
      action: "Click Next to step into the Results subpage view.",
      placement: "center",
      route: "/academic?tab=PRACTICE&view=session&q=0",
      actionTrigger: () => {
        navigate("/academic?tab=PRACTICE&view=results");
      }
    },
    {
      selector: "div:contains('Trophy')",
      title: "Results: Score Trophy overlay",
      explanation: "Shows your grade badge and overall accuracy score.",
      action: "Observe the trophy score overlay, then click 'Next'.",
      placement: "center",
      route: "/academic?tab=PRACTICE&view=results",
      lowMask: true
    },
    {
      selector: "div:contains('Accuracy')",
      title: "Results: Performance details",
      explanation: "Shows detailed session telemetry: total time elapsed, correct/total counts, and accuracy trends.",
      action: "Observe the quiz statistics review, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PRACTICE&view=results",
      lowMask: true
    },
    {
      selector: "button:contains('Review Errors')",
      title: "Results: Review Errors list",
      explanation: "Lists questions you got wrong, allowing you to review Socratic explanations.",
      action: "Observe the error review list, then click 'Next'.",
      placement: "top",
      route: "/academic?tab=PRACTICE&view=results",
      lowMask: true
    },
    {
      selector: "button:contains('Done')",
      title: "Results: Done & Exit",
      explanation: "Exits quiz review, saving session telemetry to your study statistics.",
      action: "Observe the Done button, then click 'Next'.",
      placement: "bottom",
      route: "/academic?tab=PRACTICE&view=results",
      lowMask: true
    },
    // Obsidian Notes Vault
    {
      selector: "[data-tour='sidebar-knowledge']",
      title: "Sidebar: Knowledge Base (Obsidian)",
      explanation: "Opens your offline-first Obsidian Markdown directory. Manage notes, syllabus plans, code playgrounds, and PDFs.",
      action: "Click the book icon in the sidebar to enter the vault explorer.",
      placement: "right",
      route: "/academic?tab=PRACTICE&view=results",
      actionRequired: "click"
    },
    {
      selector: "button[title='Toggle Graph View']",
      title: "Obsidian: Sidebar Navigation Tabs",
      explanation: "Switch sidebar panels: File Explorer, Course Hub lists, and syllabus PDF files list.",
      action: "Observe the explorer tabs in the sidebar header, then click 'Next'.",
      placement: "right",
      route: "/obsidian",
      lowMask: true
    },
    {
      selector: "div[draggable]",
      title: "Obsidian: File Tree item nodes",
      explanation: "Click folders to expand, or files to open. Hovering nodes shows custom buttons: Add File (Plus), Rename (Edit), Delete (Trash).",
      action: "Observe the explorer file list, then click 'Next'.",
      placement: "right",
      route: "/obsidian",
      lowMask: true
    },
    {
      selector: "[class*='resize']",
      title: "Obsidian: Drag Resize handle bars",
      explanation: "Drag handle bars on the explorer boundaries to surgically resize the sidebar width.",
      action: "Observe the resize border spacer, then click 'Next'.",
      placement: "right",
      route: "/obsidian"
    },
    {
      selector: "button[title='Toggle Graph View']",
      title: "Obsidian: Knowledge Graph Toggle",
      explanation: "Click this button to open the global force-directed vector connectivity graph of note structures.",
      action: "Observe the graph toggle icon, then click 'Next'.",
      placement: "bottom",
      route: "/obsidian",
      lowMask: true
    },
    {
      selector: "canvas",
      title: "Obsidian: Force-Directed Connectivity Graph",
      explanation: "An interactive force-directed graph tracking connections between note nodes, syllabus targets, and courses.",
      action: "Observe the global vector connectivity graph canvas, then click 'Next'.",
      placement: "center",
      route: "/obsidian",
      lowMask: true,
      actionTrigger: () => {
        // Toggle graph if not open
        const btn = document.querySelector("button[title='Toggle Graph View']") as HTMLButtonElement;
        if (btn && !btn.className.includes("text-foreground")) {
          btn.click();
        }
      }
    },
    // Note Editor View
    {
      selector: "canvas",
      title: "Obsidian: Note workspace editor",
      explanation: "Double-clicking notes opens the Markdown workspace. Toggle edit status, split screens, edit properties, and rate memories.",
      action: "Click Next to step into a structured notes file (Binary Search).",
      placement: "center",
      route: "/obsidian",
      actionTrigger: () => {
        // Toggle graph off if open
        const btn = document.querySelector("button[title='Toggle Graph View']") as HTMLButtonElement;
        if (btn && btn.className.includes("text-foreground")) {
          btn.click();
        }
        navigate("/obsidian?path=Notes/Binary_Search.md");
      }
    },
    {
      selector: "h1",
      title: "Obsidian Note: Note Title Heading",
      explanation: "Displays the active note title. Links other notes using double wikilinks format.",
      action: "Observe the note title heading, then click 'Next'.",
      placement: "left",
      route: "/obsidian?path=Notes/Binary_Search.md",
      lowMask: true
    },
    {
      selector: "button[title='Edit Note']",
      title: "Obsidian Note: Edit Note",
      explanation: "Enables manual editing of note files. Save edits directly to local directories.",
      action: "Observe the edit icon in the top header, then click 'Next'.",
      placement: "bottom",
      route: "/obsidian?path=Notes/Binary_Search.md",
      lowMask: true
    },
    {
      selector: "button[title='Cancel']",
      title: "Obsidian Note: Save / Cancel Edits",
      explanation: "When editing, click Save to commit changes, or Cancel to revert edits.",
      action: "Observe the header save buttons, then click 'Next'.",
      placement: "bottom",
      route: "/obsidian?path=Notes/Binary_Search.md",
      lowMask: true
    },
    {
      selector: "button[title='Jump to Source PDF']",
      title: "Obsidian Note: Jump to Source PDF waypoint",
      explanation: "Splits screen side-by-side, jumping to the exact source PDF page of this note.",
      action: "Observe the PDF link icon in the header, then click 'Next'.",
      placement: "bottom",
      route: "/obsidian?path=Notes/Binary_Search.md",
      lowMask: true
    },
    {
      selector: "button[title='Toggle Properties']",
      title: "Obsidian Note: Toggle Properties panel",
      explanation: "Click this info button to toggle the Obsidian frontmatter properties editor.",
      action: "Observe the Toggle Properties button in the header, then click 'Next'.",
      placement: "bottom",
      route: "/obsidian?path=Notes/Binary_Search.md",
      lowMask: true
    },
    {
      selector: "button[title*='Fullscreen']",
      title: "Obsidian Note: Focus Mode Fullscreen",
      explanation: "Toggles fullscreen focus mode, collapsing sidebars for distraction-free reading.",
      action: "Observe the fullscreen widget button, then click 'Next'.",
      placement: "bottom",
      route: "/obsidian?path=Notes/Binary_Search.md",
      lowMask: true
    },
    {
      selector: "[class*='NoteProperties']",
      title: "Obsidian Note: Frontmatter Properties grid",
      explanation: "Manage note metadata (Semester, Course, Difficulty, due status) synced directly with frontmatter properties.",
      action: "Observe the properties editor card, then click 'Next'.",
      placement: "left",
      route: "/obsidian?path=Notes/Binary_Search.md",
      lowMask: true,
      actionTrigger: () => {
        // Force show properties
        saveConfig({ showProperties: true });
      }
    },
    {
      selector: "[class*='HubConnectionsNav']",
      title: "Obsidian Note: Connections roadmap checklists",
      explanation: "Highlights linked checklist nodes under this Study Hub, showing completed active-recall status.",
      action: "Observe the Hub Connections timeline checklist in the right panel, then click 'Next'.",
      placement: "left",
      route: "/obsidian?path=Notes/Binary_Search.md",
      lowMask: true
    },
    {
      selector: "h2:contains('Mental Model')",
      title: "Obsidian Note: Analog English Metaphor",
      explanation: "Every note begins with a plain English analogy, helping you visualize the mechanics before diving into mathematical models.",
      action: "Read the phonebook metaphor section, then click 'Next'.",
      placement: "left",
      route: "/obsidian?path=Notes/Binary_Search.md",
      lowMask: true
    },
    {
      selector: "h2:contains('Algorithmic')",
      title: "Obsidian Note: Core Prose",
      explanation: "Mathematical algorithms, Scientific prose, and double wikilinks connecting topics.",
      action: "Read the algorithmic prose section, then click 'Next'.",
      placement: "left",
      route: "/obsidian?path=Notes/Binary_Search.md",
      lowMask: true
    },
    {
      selector: "code",
      title: "Obsidian Note: Code Playground",
      explanation: "Demonstrates implementations using midpoint math to prevent integer overflows. Monaco playground coding editor.",
      action: "Observe the C++ syntax-highlighted code block, then click 'Next'.",
      placement: "top",
      route: "/obsidian?path=Notes/Binary_Search.md",
      lowMask: true
    },
    {
      selector: "[class*='quiz']",
      title: "Obsidian Note: Proving grounds quiz Checks",
      explanation: "An interactive quiz card at the footer of notes. Test memory retention instantly.",
      action: "Observe the quiz checkers in the footer, then click 'Next'.",
      placement: "top",
      route: "/obsidian?path=Notes/Binary_Search.md",
      lowMask: true
    },
    {
      selector: "div:contains('Space Repetition Review')",
      title: "Obsidian Note: FSRS memory stability rating buttons",
      explanation: "Rate recall stability (Again, Hard, Good, Easy) at the note footer, feeding the scheduler.",
      action: "Observe the recall feedback rating buttons, then click 'Next'.",
      placement: "top",
      route: "/obsidian?path=Notes/Binary_Search.md",
      lowMask: true
    },
    // PDF Viewer Split Screen View
    {
      selector: "[data-tour='sidebar-knowledge']",
      title: "Obsidian Note: PDF Splitscreen Viewer",
      explanation: "Splitscreen viewer! Displays note prose and syllabus PDFs side-by-side.",
      action: "Click Next to step into the side-by-side splitscreen viewer.",
      placement: "center",
      route: "/obsidian?path=Notes/Binary_Search.md",
      actionTrigger: () => {
        navigate("/obsidian?path=Notes/Binary_Search.md&source=Algorithms_Syllabus.pdf");
      }
    },
    {
      selector: "[class*='PdfViewer']",
      title: "PDF Split: Side-by-Side Splitscreen",
      explanation: "Displays notes alongside high-fidelity syllabus PDF catalogs, keeping reading aligned.",
      action: "Observe the splitscreen panel, then click 'Next'.",
      placement: "center",
      route: "/obsidian?path=Notes/Binary_Search.md&source=Algorithms_Syllabus.pdf",
      lowMask: true
    },
    {
      selector: "div:contains('MapPin')",
      title: "PDF Split: Waypoints navigation page pins",
      explanation: "Shows page waypoints (MapPin page numbers) matching the note's source properties, enabling one-click jumps.",
      action: "Observe the waypoints list in the header, then click 'Next'.",
      placement: "bottom",
      route: "/obsidian?path=Notes/Binary_Search.md&source=Algorithms_Syllabus.pdf",
      lowMask: true
    },
    {
      selector: "button:contains('ChevronLeft')",
      title: "PDF Split: page counters & back/forward pagers",
      explanation: "Click arrows to flip pages manually. Pagers calculate index locations.",
      action: "Observe the PDF pagers in the top right header, then click 'Next'.",
      placement: "bottom",
      route: "/obsidian?path=Notes/Binary_Search.md&source=Algorithms_Syllabus.pdf",
      lowMask: true
    },
    // System Settings
    {
      selector: "[data-tour='sidebar-settings']",
      title: "Sidebar: System Settings & Keys",
      explanation: "Opens configurations: storage paths, Tauri app updater, log packaging, API provider key grid, and limits.",
      action: "Click the settings gear icon at the bottom-left of the sidebar.",
      placement: "right",
      route: "/obsidian?path=Notes/Binary_Search.md&source=Algorithms_Syllabus.pdf",
      actionRequired: "click"
    },
    {
      selector: "[role='tablist']",
      title: "Settings: Configuration tabs",
      explanation: "Switch between General (folders, updates, logs) and AI & Keys tab configurations.",
      action: "Observe the tab selections, then click 'Next'.",
      placement: "bottom",
      route: "/settings"
    },
    {
      selector: "div:contains('Storage Folders')",
      title: "Settings: Storage Folders configurations",
      explanation: "Configure directories: Obsidian Vault path, Inbox folder, and Academic hub files.",
      action: "Observe the storage paths inputs, then click 'Next'.",
      placement: "bottom",
      route: "/settings"
    },
    {
      selector: "button:contains('Edit')",
      title: "Settings: Tauri directory dialogue selector",
      explanation: "Launches dialogue file browser to surgically pick folders on your local disk.",
      action: "Observe the folder directory selector edit button, then click 'Next'.",
      placement: "bottom",
      route: "/settings"
    },
    {
      selector: "button:contains('Check for Updates')",
      title: "Settings: App version updates check",
      explanation: "Checks update manifests via Tauri native rust pipelines, downloading latest production builds.",
      action: "Observe the check update button, then click 'Next'.",
      placement: "bottom",
      route: "/settings"
    },
    {
      selector: "button:contains('Package & Export Logs')",
      title: "Settings: Troubleshooting Export Logs button",
      explanation: "Packages background troubleshooting logs into local text files, resolving configuration issues.",
      action: "Observe the troubleshooting logs packaging button, then click 'Next'.",
      placement: "bottom",
      route: "/settings"
    },
    {
      selector: "div:contains('Danger Zone')",
      title: "Settings: Danger Zone resets",
      explanation: "Reset study history, clear configs, or perform full factory resets with confirmation overlays.",
      action: "Observe the danger zone cards, then click 'Next'.",
      placement: "bottom",
      route: "/settings"
    },
    // Settings: AI & Keys Tab
    {
      selector: "[role='tablist']",
      title: "Settings: AI & Keys Tab View",
      explanation: "Configure AI key vaults, models families (Gemini, OpenAI, Anthropic), rate limits, and test connections.",
      action: "Click Next to step into the AI & Keys configuration tab view.",
      placement: "center",
      route: "/settings",
      actionTrigger: () => {
        const tabBtn = Array.from(document.querySelectorAll("[role='tablist'] button")).find(el => el.textContent?.includes("AI & Keys")) as HTMLButtonElement;
        if (tabBtn) tabBtn.click();
      }
    },
    {
      selector: "select",
      title: "AI Keys: AI Provider select dropdown",
      explanation: "Select API providers: Google, OpenAI, Anthropic, or custom local server endpoints.",
      action: "Observe the provider dropdown selector, then click 'Next'.",
      placement: "bottom",
      route: "/settings",
      lowMask: true
    },
    {
      selector: "input[placeholder*='model']",
      title: "AI Keys: API model select parameters",
      explanation: "Select specific LLM models (e.g. gemini-2.0-flash, gpt-4o, claude-3-5-sonnet).",
      action: "Observe the model name selector input, then click 'Next'.",
      placement: "bottom",
      route: "/settings",
      lowMask: true
    },
    {
      selector: "[class*='Slider']",
      title: "AI Keys: Rate limits & concurrency sliders",
      explanation: "Slide to configure rate limit parameters: Max tokens per minute (TPM), requests per minute (RPM), day limits, and concurrency.",
      action: "Observe the rate limits sliders, then click 'Next'.",
      placement: "top",
      route: "/settings",
      lowMask: true
    },
    {
      selector: "button:contains('Test Connection')",
      title: "AI Keys: Test Connection button",
      explanation: "Performs active connections verification, ensuring APIs respond before saving keys.",
      action: "Observe the Test Connection validation button, then click 'Next'.",
      placement: "bottom",
      route: "/settings",
      lowMask: true
    },
    {
      selector: "div:contains('Saved Keys')",
      title: "AI Keys: Saved Keys Vault grid",
      explanation: "Lists saved credentials. Select keys to make them primary, edit properties, or delete them.",
      action: "Observe the key vault grids, then click 'Next'.",
      placement: "top",
      route: "/settings",
      lowMask: true
    },
    {
      selector: "button:contains('Add Key')",
      title: "AI Keys: Add New Key dialog config button",
      explanation: "Opens a popup credential config dialogue card to securely register a new API key.",
      action: "Observe the Add Key button, then click 'Next'.",
      placement: "bottom",
      route: "/settings",
      lowMask: true
    },
    // Walkthrough Complete
    {
      title: "Walkthrough Complete!",
      explanation: "Congratulations! You have reviewed absolutely every bento dashboard tab, course catalog page, study planner hub, assignments countdown deliverable, exam confidence tracker, custom spaced-recall configurator, Socratic pipeline, Obsidian notes, split-screen waypoints, and AI keys vault! You are fully prepared to build perfect academic vaults.",
      action: "Click Finish to exit the walkthrough.",
      placement: "center",
      route: "/settings"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsActive(false);
    if (config) {
      await saveConfig({ isDemoMode: false });
      toast.success("Walkthrough completed!");
    }
  };

  // Route alignment helper
  useEffect(() => {
    if (!isActive) return;
    const stepObj = steps[currentStep];
    if (stepObj && stepObj.route && location.pathname !== stepObj.route) {
      navigate(stepObj.route);
    }
    if (stepObj && stepObj.actionTrigger) {
      stepObj.actionTrigger();
    }
  }, [currentStep, isActive, location.pathname]);

  // Track position of highlighted element
  useEffect(() => {
    if (!isActive) return;
    const stepObj = steps[currentStep];
    if (!stepObj || !stepObj.selector) {
      setCoords(null);
      return;
    }

    const updatePosition = () => {
      let element: Element | null = null;
      const selector = stepObj.selector || '';

      if (selector.startsWith('text:')) {
        const text = selector.slice(5).toLowerCase().trim();
        // Prioritize specific tag elements first to prevent selector collision
        const specificTags = Array.from(document.querySelectorAll('span, a, button, code, h1, h2, h3'));
        element = specificTags.find(el => {
          const elText = (el.textContent || '').toLowerCase().trim();
          return elText === text || elText.includes(text);
        }) || null;

        if (!element) {
          const containers = Array.from(document.querySelectorAll('div, aside, header'));
          element = containers.find(el => {
            const elText = (el.textContent || '').toLowerCase().trim();
            return elText === text || elText.includes(text);
          }) || null;
        }
      } else if (selector.includes(':contains(')) {
        const tag = selector.split(':contains(')[0];
        const text = selector.match(/:contains\("([^"]+)"\)/)?.[1] || selector.match(/:contains\('([^']+)'\)/)?.[1] || '';
        const items = Array.from(document.querySelectorAll(tag));
        element = items.find(el => el.textContent?.includes(text)) || null;
      } else {
        element = document.querySelector(selector);
      }

      if (element) {
        targetRef.current = element;
        const rect = element.getBoundingClientRect();
        setCoords(rect);
      } else {
        setCoords(null);
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 100);
    window.addEventListener('resize', updatePosition);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStep, isActive, location.pathname]);

  // Option A Auto-Advance Click Handler
  useEffect(() => {
    if (!isActive) return;
    const stepObj = steps[currentStep];
    if (!stepObj || stepObj.actionRequired !== 'click') return;

    const handleTargetClick = () => {
      setTimeout(() => {
        handleNext();
      }, 150);
    };

    const target = targetRef.current;
    if (target) {
      target.addEventListener('click', handleTargetClick);
      return () => {
        target.removeEventListener('click', handleTargetClick);
      };
    }
  }, [currentStep, isActive, coords]);

  if (!isActive) return null;

  const current = steps[currentStep];
  const isOracleInputStep = current.title === "Oracle: Socratic Dialogue Input";

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none select-none">
      {/* Background Mask - Dynamic transparency on lowMask steps */}
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-300 pointer-events-auto",
          current.lowMask 
            ? "bg-[#000000]/40 backdrop-blur-[2px]" 
            : "bg-[#000000]/85 backdrop-blur-[8px]"
        )}
        style={{
          clipPath: coords 
            ? `polygon(
                 0% 0%, 0% 100%, 
                 ${coords.left}px 100%, 
                 ${coords.left}px ${coords.top}px, 
                 ${coords.right}px ${coords.top}px, 
                 ${coords.right}px ${coords.bottom}px, 
                 ${coords.left}px ${coords.bottom}px, 
                 ${coords.left}px 100%, 
                 100% 100%, 100% 0%
               )`
            : undefined
        }}
      />

      {/* Popover Card - Positioned statically in the bottom right corner */}
      <div
        ref={popoverRef}
        className="fixed sm:fixed sm:bottom-6 sm:right-6 bottom-3 right-3 pointer-events-auto sm:w-[320px] w-[calc(100vw-24px)] max-h-[calc(100vh-48px)] overflow-y-auto custom-scrollbar bg-[#131314]/95 border border-[#2b2b2d]/80 rounded-[12px] shadow-2xl p-5 select-text"
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xs font-black uppercase tracking-tight text-white pr-8">
            {current.title}
          </h3>
          <span className="text-[10px] font-mono font-bold text-muted-foreground/75 shrink-0 absolute top-4 right-4 font-sans">
            {currentStep + 1}/{steps.length}
          </span>
        </div>
        
        <p className="text-[11px] text-[#a1a1aa] leading-relaxed mb-3">
          {current.explanation}
        </p>

        {current.action && (
          <p className="text-[11px] text-white/90 leading-relaxed mb-4 font-bold">
            {current.action}
          </p>
        )}

        {isOracleInputStep && (
          <button
            onClick={() => {
              // Inject text into the chat textarea and trigger send
              const chatInput = document.querySelector('textarea') as HTMLTextAreaElement;
              if (chatInput) {
                chatInput.value = "Tell me about binary search";
                const event = new Event('input', { bubbles: true });
                chatInput.dispatchEvent(event);
                // Trigger button click
                const sendBtn = chatInput.nextElementSibling as HTMLButtonElement;
                if (sendBtn) {
                  sendBtn.click();
                }
              }
              handleNext();
            }}
            className="w-full mb-4 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded hover:bg-foreground/90 transition-all text-center cursor-pointer"
          >
            Tell me about binary search
          </button>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-[#2b2b2d]/50">
          <button
            onClick={handleComplete}
            className="text-[9px] font-black uppercase tracking-widest text-[#a1a1aa] hover:text-white cursor-pointer"
          >
            Skip Tour
          </button>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-3 py-1.5 border border-[#2b2b2d] text-white hover:bg-[#232326] text-[9px] font-black uppercase tracking-widest rounded transition-colors font-sans cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={current.actionRequired === 'click' || current.actionRequired === 'text'}
              className={cn(
                "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded transition-colors font-sans cursor-pointer",
                (current.actionRequired === 'click' || current.actionRequired === 'text')
                  ? "bg-white/10 text-white/40 cursor-not-allowed border border-white/5"
                  : "bg-white text-black hover:bg-white/90"
              )}
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
