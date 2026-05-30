import React, { useState, useEffect, useRef } from 'react';
import { useConfig } from '@/lib/ConfigContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { sidecarApi } from '@/lib/sidecarApi';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
      explanation: "This guided tour takes you through Ater's workspace features, utilizing a pre-loaded Computer Science curriculum and note vaults. No AI costs or database configurations are needed.",
      action: "Click the 'Next' button to begin exploring the global interface layout.",
      placement: "center",
      route: "/academic"
    },
    // Sidebar items
    {
      selector: "[data-tour='sidebar-ater']",
      title: "Sidebar: AI Oracle Chat Shortcut",
      explanation: "This button navigates directly to your Socratic AI assistant page where you chat and review curriculum insights.",
      action: "Identify the Socratic AI shortcut icon, then click 'Next'.",
      placement: "right",
      route: "/academic"
    },
    {
      selector: "[data-tour='sidebar-academic']",
      title: "Sidebar: Academic Dashboard",
      explanation: "This icon opens your centralized university timeline. It houses study planners, courses catalogs, assignments, exams, and active-recall modules.",
      action: "Look at the graduation cap icon in the sidebar, then click 'Next'.",
      placement: "right",
      route: "/academic"
    },
    {
      selector: "[data-tour='sidebar-knowledge']",
      title: "Sidebar: Knowledge Base (Obsidian)",
      explanation: "This shortcut opens your local Obsidian markdown notes directory. Access atomic curriculum files, code snippets, and study templates.",
      action: "Identify the book icon in the sidebar navigation, then click 'Next'.",
      placement: "right",
      route: "/academic"
    },
    {
      selector: "[data-tour='sidebar-settings']",
      title: "Sidebar: System Settings & Keys",
      explanation: "Use the Settings cog to configure your Obsidian vault directory, hook up real Gemini/OpenAI API keys, and update profiles.",
      action: "Identify the settings gear at the bottom-left, then click 'Next'.",
      placement: "right",
      route: "/academic"
    },
    // Header items
    {
      selector: "[data-tour='header-back']",
      title: "Header: Navigate Backwards",
      explanation: "Use the back arrow to reverse navigation history, returning seamlessly to previously visited notes, tabs, or vaults.",
      action: "Look at the left-facing arrow in the top header, then click 'Next'.",
      placement: "bottom",
      route: "/academic"
    },
    {
      selector: "[data-tour='header-forward']",
      title: "Header: Navigate Forwards",
      explanation: "Use the forward arrow to re-advance navigation history after backing out.",
      action: "Look at the right-facing arrow in the top header, then click 'Next'.",
      placement: "bottom",
      route: "/academic"
    },
    {
      selector: "[data-tour='header-timer']",
      title: "Header: Pomodoro Focus Timer",
      explanation: "The integrated study timer locks down distraction. Clicking it opens a deep work timer window to schedule active studying intervals.",
      action: "Look at the timer widget in the top header, then click 'Next'.",
      placement: "bottom",
      route: "/academic"
    },
    {
      selector: "[data-tour='header-credit']",
      title: "Header: AI Credit Balance Meter",
      explanation: "This badge shows your available credit balance. Generating concepts, answers, or automated summaries costs credits.",
      action: "Observe your AI credit meter, then click 'Next'.",
      placement: "bottom",
      route: "/academic"
    },
    {
      selector: "[data-tour='header-theme']",
      title: "Header: Appearance Theme Toggle",
      explanation: "Toggle theme modes. Ater supports custom light modes and sleeker dark mode aesthetics to match your work habits.",
      action: "Locate the light/dark toggle button in the header, then click 'Next'.",
      placement: "bottom",
      route: "/academic"
    },
    // Dashboard overall controls
    {
      selector: "[data-tour='db-sync']",
      title: "Dashboard: Refresh & Sync Database",
      explanation: "Synchronize local Obsidian note structures with your database, ensuring course credits, assignments, and exam status remain in sync.",
      action: "Look at the round sync icon in the top right, then click 'Next'.",
      placement: "bottom",
      route: "/academic"
    },
    {
      selector: "[data-tour='db-calendar']",
      title: "Dashboard: Calendar View Toggle",
      explanation: "Toggle the main calendar grid. This overlay view consolidates deadline logs, study sessions, and exams in one place.",
      action: "Look at the Calendar toggle button, then click 'Next'.",
      placement: "bottom",
      route: "/academic"
    },
    // Academic Dashboard tabs
    {
      selector: "[data-tour='tab-program']",
      title: "Tab 1: Academic Program Hub",
      explanation: "The Program tab tracks semesters, overall courses completion ratios, and academic roadmaps. Observe the active timeline contents loaded below.",
      action: "Identify the Program tab selector, then click 'Next'.",
      placement: "bottom",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PROGRAM");
      }
    },
    {
      selector: "[data-tour='program-edit']",
      title: "Program: Initialize & Setup Curriculum",
      explanation: "This scaffolding button deploys complete academic roadmap units (e.g. Year I to Year IV grids) based on your degree guidelines.",
      action: "Observe the Edit/Setup toggle in the Program sub-header, then click 'Next'.",
      placement: "right",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PROGRAM");
      }
    },
    {
      selector: "[data-tour='program-bento']",
      title: "Program: Degree Roadmap Bento",
      explanation: "The left bento roadmap panel displays a vertical tree of active, completed, and planned Year blocks and semesters.",
      action: "Identify the left bento sidebar, then click 'Next'.",
      placement: "right",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PROGRAM");
      }
    },
    {
      selector: "[data-tour='program-progress']",
      title: "Program: Progress Analytics Card",
      explanation: "This statistic card displays completed year metrics and overall degree completion percentage rates.",
      action: "Observe the progress bento card, then click 'Next'.",
      placement: "bottom",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PROGRAM");
      }
    },
    {
      selector: "[data-tour='program-active-year']",
      title: "Program: Active Academic Year",
      explanation: "Tracks which Year timeline unit is currently active. Clicking this card opens detailed semester reports.",
      action: "Look at the active year indicator, then click 'Next'.",
      placement: "bottom",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PROGRAM");
      }
    },
    {
      selector: "[data-tour='program-active-semester']",
      title: "Program: Active Semester Block",
      explanation: "Pinpoints your active study semester (e.g. 'Semester III'). Keeps track of class lists and daily workloads.",
      action: "Look at the active semester indicator card, then click 'Next'.",
      placement: "bottom",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PROGRAM");
      }
    },
    {
      selector: "[data-tour='program-gpa']",
      title: "Program: Cumulative GPA tracking",
      explanation: "This metric aggregates grade details logged across courses to calculate and display your overall cumulative GPA.",
      action: "Look at the GPA widget card, then click 'Next'.",
      placement: "bottom",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PROGRAM");
      }
    },
    {
      selector: "[data-tour='program-grid']",
      title: "Program: Curriculum Grid",
      explanation: "This directory showcases all Year timelines. Each Year block displays sub-semester trees and active tags.",
      action: "Look at the timeline grid, then click 'Next' to view the Courses catalog.",
      placement: "top",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PROGRAM");
      }
    },
    // Courses tab
    {
      selector: "[data-tour='tab-courses']",
      title: "Tab 2: Course Catalog Directory",
      explanation: "The Courses tab displays catalog courses (such as 'Algorithms & Data Structures'), tracking credit balances and grades for each class.",
      action: "We are switching tabs now. Click 'Next'.",
      placement: "bottom",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=COURSES");
      }
    },
    {
      selector: "[data-tour='course-card-cs_201']",
      title: "Courses: Lecture Card Detailed View",
      explanation: "Each catalog class details course names, credit weights, grades, and linked notes.",
      action: "Observe the CS 201 Course card, then click 'Next' to open its detailed panel.",
      placement: "top",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=COURSES");
      }
    },
    {
      selector: "[data-tour='course-detail-view']",
      title: "Courses: Full-Screen Details View",
      explanation: "Opening a course reveals its academic properties, total credit weight, status, grade scale, and direct shortcuts to linked notes in your vault.",
      action: "Observe the full-screen detailed layout for CS 201, then click 'Next'.",
      placement: "top",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=COURSES&id=cs_201");
      }
    },
    // Planner tab
    {
      selector: "[data-tour='tab-planner']",
      title: "Tab 3: Weekly Hour Planner",
      explanation: "The Study Planner structures weekly focus timetables. Set credit hour goals, log focus history, and build active streaks.",
      action: "We are switching tabs now. Click 'Next'.",
      placement: "bottom",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PLANNER");
      }
    },
    {
      selector: "[data-tour='planner-card-searching_complexity']",
      title: "Planner: Interactive Study Hubs",
      explanation: "Study hubs organize lectures, chapters, or syllabus units into focused targets linked to your vaults.",
      action: "Observe the 'Unit 1: Searching & Complexity' study hub, then click 'Next' to open its detailed panel.",
      placement: "top",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PLANNER");
      }
    },
    {
      selector: "[data-tour='planner-detail-view']",
      title: "Planner: Study Hub Full-Screen View",
      explanation: "Opening a study hub displays practice accuracies, total study times logged, linked exams, and lets you immediately jump into spaced recall practice.",
      action: "Observe the full-screen study hub detailed layout, then click 'Next'.",
      placement: "top",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PLANNER&id=searching_complexity");
      }
    },
    // Assignments tab
    {
      selector: "[data-tour='tab-assignments']",
      title: "Tab 4: Assignments deliverables",
      explanation: "Assignments logs project tasks, homework, and reports. Color badges flag urgent items and close deadlines.",
      action: "We are switching tabs now. Click 'Next'.",
      placement: "bottom",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=ASSIGNMENTS");
      }
    },
    {
      selector: "[data-tour='assignment-card-assign_1']",
      title: "Assignments: Tasks List",
      explanation: "List view displays task priorities, countdown status tags, course contexts, and check boxes.",
      action: "Observe 'Problem Set 1', then click 'Next' to open its detailed panel.",
      placement: "top",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=ASSIGNMENTS");
      }
    },
    {
      selector: "[data-tour='assignment-detail-view']",
      title: "Assignments: Full-Screen View",
      explanation: "The detailed full screen card displays due dates, status selectors, linked notes, and options to toggle task completions.",
      action: "Observe the full-screen detailed layout for this assignment, then click 'Next'.",
      placement: "top",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=ASSIGNMENTS&id=assign_1");
      }
    },
    // Exams tab
    {
      selector: "[data-tour='tab-exams']",
      title: "Tab 5: Exams & Quiz Schedules",
      explanation: "Exams outlines university testing dates. Create custom prep checklists and trace overall grade weights.",
      action: "We are switching tabs now. Click 'Next'.",
      placement: "bottom",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=EXAMS");
      }
    },
    {
      selector: "[data-tour='exam-card-midterm_1']",
      title: "Exams: Test Schedule Card",
      explanation: "The exams grid highlights exam types, countdown clocks, linked courses, and finalized grades.",
      action: "Observe 'Midterm Exam 1', then click 'Next' to open its detailed panel.",
      placement: "top",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=EXAMS");
      }
    },
    {
      selector: "[data-tour='exam-detail-view']",
      title: "Exams: Full-Screen View",
      explanation: "Opening an exam details date records, confidence levels, and linked study hubs so you know exactly which chapters require revision.",
      action: "Observe the full-screen detailed layout for this exam, then click 'Next'.",
      placement: "top",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=EXAMS&id=midterm_1");
      }
    },
    // Practice tab
    {
      selector: "[data-tour='tab-practice']",
      title: "Tab 6: Spaced Recall Analytics",
      explanation: "The Practice module guides active-recall reviews. Generate custom flashcards, inspect recall score analytics, and study weak concepts.",
      action: "We are switching tabs now. Click 'Next'.",
      placement: "bottom",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PRACTICE&view=dashboard");
      }
    },
    {
      selector: "[data-tour='practice-stats-grid']",
      title: "Practice: Analytics Diagnostics",
      explanation: "The dashboard displays core statistics: Average Score shows cumulative test accuracies, Total Practices logs the count of sessions completed, and Stability measures memory decay to map active retention strength levels.",
      action: "Observe the recall analytics diagnostic widgets, then click 'Next'.",
      placement: "bottom",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PRACTICE&view=dashboard");
      }
    },
    {
      selector: "[data-tour='practice-due-btn']",
      title: "Practice: Automated FSRS Due Cards",
      explanation: "The 'Review Due' action automatically schedules active spaced review sessions. It evaluates vault metadata based on FSRS memory models to fetch card items exactly when they are close to being forgotten, keeping recall near 100%.",
      action: "Observe the spaced repetition trigger button, then click 'Next'.",
      placement: "bottom",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PRACTICE&view=dashboard");
      }
    },
    {
      selector: "[data-tour='practice-custom-btn']",
      title: "Practice: Custom Quiz Builder",
      explanation: "Clicking 'Custom' launches the session builder panel. This enables deep personalization of active recall drills.",
      action: "Click 'Next' to open and inspect the custom quiz configurations.",
      placement: "bottom",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PRACTICE&view=dashboard");
      }
    },
    {
      selector: "[data-tour='practice-config-panel']",
      title: "Practice: Advanced Exam Configurator",
      explanation: "The configurator lets you select specific atomic notes, choose exact difficulties (L1 to L3), and allocate question counts per type (Presets like MCQ Blitz, Exam Sim, or Math Mode). It also supports progressive hints, confidence wagering, global time bounds, and strict grading margins.",
      action: "Observe the advanced config parameters, then click 'Next' to compile a simulated exam session.",
      placement: "top",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PRACTICE&view=configuring");
      }
    },
    {
      selector: "[data-tour='practice-config-panel']",
      title: "Practice: RAG Compile Loading",
      explanation: "Upon starting, the compiling loader initiates. Ater scans notes, parses mathematical/logical structures, designs multi-format questions, and structures active test files.",
      action: "Observe the loading compiler overlay, then click 'Next' to enter the live mock exam.",
      placement: "center",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PRACTICE&view=session&q=0");
      }
    },
    {
      selector: "[data-tour='practice-session-card']",
      title: "Mock Exam: Multi-Format Live Session",
      explanation: "Welcome to the active recall testing arena! Sessions support MCQ, True/False, Fill-in blanks, Matching pairs, ordering tasks, and full Feynman writing boards.",
      action: "Observe the mock exam layout, then click 'Next' to view the next Ingestion Pipeline tab.",
      placement: "center",
      route: "/academic",
      lowMask: true,
      actionTrigger: () => {
        navigate("/academic?tab=PRACTICE&view=session&q=0");
      }
    },
    // AI Ingestion Pipeline
    {
      selector: "text:Pipeline",
      title: "AI Hub: File Ingestion Pipeline",
      explanation: "The Ingestion Pipeline handles uploaded syllabus documents, lecture files, and PDFs. It extracts key definitions and creates notes automatically.",
      action: "We are switching tabs now. Click 'Next'.",
      placement: "bottom",
      route: "/agents",
      lowMask: true,
      actionTrigger: () => {
        navigate("/agents?tab=pipeline");
      }
    },
    {
      selector: "text:Auto-Ingest",
      title: "Pipeline: Auto-Deploy Switcher",
      explanation: "Toggling this feature permits the system to automatically generate markdown note files when uploads hit the pipeline folder.",
      action: "Observe the Auto-Ingest toggle, then click 'Next'.",
      placement: "bottom",
      route: "/agents",
      lowMask: true
    },
    // Socratic Oracle
    {
      selector: "text:Oracle",
      title: "AI Hub: Socratic AI Oracle assistant",
      explanation: "The Oracle page provides Socratic dialogue support. It helps you digest tough engineering concepts by asking prompt questions.",
      action: "Click the test query button ('Tell me about binary search') below to test a live streaming AI response stream.",
      placement: "bottom",
      route: "/agents",
      lowMask: true,
      actionRequired: "click",
      actionTrigger: () => {
        navigate("/agents?tab=ater");
      }
    },
    {
      selector: "textarea",
      title: "Oracle: Socratic Dialogue Input",
      explanation: "Submit questions, paste reading notes, or import syllabus topics here to receive customized active explanations.",
      action: "Observe the Socratic chatbot query input field, then click 'Next'.",
      placement: "top",
      route: "/agents",
      lowMask: true
    },
    // Obsidian
    {
      selector: ".custom-scrollbar",
      title: "Obsidian Vaults: File Explorer",
      explanation: "This sidebar tree displays offline-first folders. Ater generated preconfigured notes: 'Binary Search' and 'Time Complexity'.",
      action: "Observe the file vault explorer panel on the left, then click 'Next'.",
      placement: "right",
      route: "/obsidian",
      lowMask: true
    },
    {
      title: "Obsidian: Opening A Note",
      explanation: "The Obsidian note layout integrates premium design systems, split-bento analogies, and proof-based active learning cards.",
      action: "Click 'Next' to open and inspect the pre-scaffolded note.",
      placement: "center",
      route: "/obsidian",
      lowMask: true,
      actionTrigger: () => {
        navigate("/obsidian?path=Notes/Binary_Search.md");
      }
    },
    {
      selector: "#content h2:contains('Mental Model')",
      title: "Obsidian Notes: Plain English Analogy",
      explanation: "All notes start with a basic analogy (Mental Model) to clarify the academic topic in simple English before diving into technical details.",
      action: "Read the mental model analogy on the screen, then click 'Next'.",
      placement: "left",
      route: "/obsidian",
      lowMask: true
    },
    {
      selector: "code",
      title: "Obsidian Notes: Coding Playground",
      explanation: "The Formal Model block displays copyable, syntax-highlighted code files demonstrating correct implementation details.",
      action: "Observe the code playground block, then click 'Next'.",
      placement: "top",
      route: "/obsidian",
      lowMask: true
    },
    {
      selector: ".proving-grounds, [class*='ProvingGrounds'], [class*='quiz']",
      title: "Obsidian Notes: Embedded Active Quizzes",
      explanation: "The Proving Grounds footer integrates multi-choice concept questions. Test active-recall directly inside Obsidian.",
      action: "Look at the practice cards, then click 'Next'.",
      placement: "top",
      route: "/obsidian",
      lowMask: true
    },
    {
      title: "Setup Complete!",
      explanation: "You have reviewed every dashboard tab, sidebar option, pipeline status, and Obsidian note module! Deactivating demo mode will let you construct real vaults.",
      action: "Click 'Finish' to exit this walkthrough and configure real API keys.",
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
  }, [currentStep, isActive]);

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
        // Priotize specific tag elements first to prevent selector collision
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

  if (!isActive) return null;

  const current = steps[currentStep];

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
          <p className="text-[11px] text-white/90 leading-relaxed mb-4">
            {current.action}
          </p>
        )}

        {currentStep === 28 && (
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
            className="w-full mb-4 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded hover:bg-foreground/90 transition-all text-center"
          >
            Tell me about binary search
          </button>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-[#2b2b2d]/50">
          <button
            onClick={handleComplete}
            className="text-[9px] font-black uppercase tracking-widest text-[#a1a1aa] hover:text-white"
          >
            Skip Tour
          </button>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-3 py-1.5 border border-[#2b2b2d] text-white hover:bg-[#232326] text-[9px] font-black uppercase tracking-widest rounded transition-colors font-sans"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-1.5 bg-white text-black hover:bg-white/90 text-[9px] font-black uppercase tracking-widest rounded transition-colors font-sans"
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
