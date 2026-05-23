"use client";

import React from 'react';
import { IndustrialButton } from '@/components/IndustrialButton';
import { MacbookMockup } from '@/components/MacbookMockup';

export default function AcademicDashboardPage() {
  return (
    <div className="min-h-[100dvh] bg-background w-full flex flex-col">
      
      {/* SECTION 01: HERO */}
      <section className="z-10 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto flex flex-col gap-6 text-center items-center justify-center flex-1">
          <h1 className="text-display-hero text-center w-full">
            ACADEMIC DASHBOARD
          </h1>
          <p className="text-body max-w-2xl leading-relaxed opacity-85 text-center">
            Your school control center. One simple dashboard to see all your classes, homework, and exams. It helps you stay organized so you never forget a deadline.
          </p>
          
          {/* Integrated Mockup */}
          <div className="w-full max-w-4xl relative origin-center flex items-center justify-center mt-2">
            <MacbookMockup 
              lightSrc="/academic-light.png" 
              darkSrc="/academic-dark.png" 
              alt="Academic Dashboard" 
              priority 
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-8">
            {[
              { label: "Graduation Progress", desc: "Plan your semesters and track graduation goals." },
              { label: "Task manager", desc: "Stay on top of assignments and daily homework." },
              { label: "Exam planner", desc: "See countdown alerts and get ready for tests." }
            ].map(stat => (
              <div key={stat.label} className="p-4 border border-outline-variant bg-surface flex flex-col gap-1 text-left">
                <span className="text-[10px] opacity-50 font-mono uppercase">{stat.label}</span>
                <span className="text-sm font-bold tracking-tight text-primary uppercase">{stat.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* SECTION 02: PROGRAM */}
      <section className="z-20 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">TRACK YOUR PROGRESS</h2>
            <p className="text-body opacity-85">
              Manage your entire degree and see your progress in real-time. Easily track which semesters you've finished, view your active classes, and watch your GPA grow.
            </p>
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
              <li>&gt; Track your semesters from Year 1 to Year 4.</li>
              <li>&gt; See your current GPA and accumulated credits automatically.</li>
              <li>&gt; Easily plan future courses for upcoming terms.</li>
            </ul>
          </div>
          
          {/* Program Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">DEGREE PROGRESS</span>
              <span className="text-[10px] opacity-40">GPA: 3.9</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="border border-outline-variant/30 p-2 bg-background/40">
                <span className="text-[9px] opacity-40 uppercase">YEAR</span>
                <p className="font-bold text-primary">YEAR 3</p>
              </div>
              <div className="border border-outline-variant/30 p-2 bg-background/40">
                <span className="text-[9px] opacity-40 uppercase">SEMESTER</span>
                <p className="font-bold text-primary">SPRING</p>
              </div>
              <div className="border border-outline-variant/30 p-2 bg-background/40">
                <span className="text-[9px] opacity-40 uppercase">CREDITS</span>
                <p className="font-bold text-primary">90 / 120</p>
              </div>
            </div>
            <div className="border border-outline-variant/30 p-3 bg-background/20 flex flex-col gap-2">
              <span className="text-[9px] opacity-40 uppercase">SEMESTER HISTORY</span>
              <div className="flex justify-between items-center gap-2 border-t border-outline-variant/10 pt-2">
                <span>Fall Semester (Done)</span>
                <span className="opacity-60">GPA: 3.9</span>
              </div>
              <div className="flex justify-between items-center gap-2 border-t border-outline-variant/10 pt-1">
                <span className="text-primary font-bold">Spring Semester (Active)</span>
                <span className="text-[10px] text-emerald-500">In Progress</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03: COURSES */}
      <section className="z-30 stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          {/* Course Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto order-last lg:order-first">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">ACTIVE COURSES</span>
              <span className="text-[10px] opacity-40">SPRING TERM</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { code: "CS 301", title: "DATABASE SYSTEMS", grade: "A", credits: "4", progress: "85%" },
                { code: "MATH 402", title: "LINEAR ALGEBRA", grade: "A-", credits: "3", progress: "60%" },
                { code: "PHYS 310", title: "MODERN PHYSICS", grade: "B+", credits: "4", progress: "45%" }
              ].map(course => (
                <div key={course.code} className="border border-outline-variant/30 p-3 bg-background/40 flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] opacity-40">{course.code}</span>
                    <span className="font-bold text-primary">{course.title}</span>
                    <span className="text-[9px] opacity-40">{course.credits} Credits</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 border border-outline-variant font-bold text-xs bg-background">{course.grade}</span>
                    <span className="text-[9px] opacity-40">Progress: {course.progress}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">YOUR CLASSES</h2>
            <p className="text-body opacity-85">
              Keep all your active classes in one simple list. Save teacher email details, upload syllabus info, and see what percentage of each course you have successfully reviewed.
            </p>
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
              <li>&gt; Store grade history and active study status.</li>
              <li>&gt; Quick access to teacher details and school links.</li>
              <li>&gt; Track how much of each course you have successfully reviewed.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 04: STUDY PLANNER */}
      <section className="z-[40] stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">BITE-SIZED PLANNERS</h2>
            <p className="text-body opacity-85">
              Break down big courses into small, manageable study blocks. Set confidence levels (Easy, Medium, Hard) for different topics so you know exactly what to practice next.
            </p>
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
              <li>&gt; Sort and filter your study tasks by due date or status.</li>
              <li>&gt; Set confidence levels (High, Medium, Low) for study topics.</li>
              <li>&gt; Build custom weekly study lists to stay on track.</li>
            </ul>
          </div>
          
          {/* Study Planner Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">STUDY LIST</span>
              <span className="text-[10px] opacity-40">SORT: CONFIDENCE</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { title: "Database Indexing", conf: "High", status: "Done", date: "May 15" },
                { title: "Linear Algebra Exam Prep", conf: "Medium", status: "Review", date: "May 18" },
                { title: "Quantum Physics Introduction", conf: "Low", status: "To Do", date: "May 20" }
              ].map(hub => (
                <div key={hub.title} className="border border-outline-variant/30 p-3 bg-background/40 flex justify-between items-center">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-primary text-[10px]">{hub.title}</span>
                    <span className="text-[9px] opacity-45">Study Date: {hub.date}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 border border-outline-variant bg-background text-[9px] font-mono">{hub.conf}</span>
                    <span className="text-[9px] text-primary">{hub.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 05: ASSIGNMENTS */}
      <section className="z-[50] stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          {/* Assignments Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto order-last lg:order-first">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">TASK MANAGER</span>
              <span className="text-[10px] opacity-40">3 Active Tasks</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold text-red-500 uppercase">&gt; Overdue Tasks</span>
                <div className="border border-red-500/20 bg-red-500/5 p-3 flex justify-between items-center">
                  <span className="font-bold text-red-500 text-[10px]">CS 301: Homework 3</span>
                  <span className="text-[9px] text-red-500 font-bold">2 days late</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold text-primary uppercase">&gt; Due Today</span>
                <div className="border border-outline-variant/30 bg-background/40 p-3 flex justify-between items-center">
                  <span className="font-bold text-primary text-[10px]">Math 402: Practice Sheet</span>
                  <span className="text-[9px] text-primary font-bold">Due today</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">NEVER FORGET HOMEWORK</h2>
            <p className="text-body opacity-85">
              Keep track of your homework, essays, and school projects. Ater automatically lists your tasks by due date: overdue work turns red, tasks due today show up first, and upcoming projects are sorted neatly.
            </p>
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
              <li>&gt; Group tasks by time urgency (Overdue, Due Today, Due This Week, Upcoming).</li>
              <li>&gt; Add direct links to your notes and reference sources for each task.</li>
              <li>&gt; Get clean alerts for late work or tight deadlines.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 06: EXAMS */}
      <section className="z-[60] stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full border-b border-outline-variant py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">STRESS-FREE EXAM PREP</h2>
            <p className="text-body opacity-85">
              Prepare for your exams with clear countdown alerts. Track your study readiness based on how many topics you have finished in your planner, so you know exactly when you're ready.
            </p>
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
              <li>&gt; View prominent countdown days for upcoming exams.</li>
              <li>&gt; Calculate your readiness score by comparing study progress.</li>
              <li>&gt; Keep a list of past test scores to see how you are doing over time.</li>
            </ul>
          </div>
          
          {/* Exams Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto">
            <div className="border border-outline-variant/60 bg-background/50 p-4 text-center flex flex-col gap-1 items-center justify-center">
              <span className="text-[8px] font-bold text-red-500 uppercase">Exam Alert</span>
              <p className="font-bold text-base text-primary">CS 301 MIDTERM EXAM</p>
              <p className="font-bold text-xs border border-outline-variant px-3 py-1 bg-surface mt-2 text-primary">3 DAYS REMAINING</p>
            </div>
            
            <div className="border border-outline-variant/30 p-3 bg-background/20 flex flex-col gap-2">
              <span className="text-[9px] opacity-40 uppercase">STUDY HUB PROGRESS</span>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between items-center text-emerald-500 font-bold">
                  <span>[X] Unit 1: Indexing Schemes</span>
                  <span>Done</span>
                </div>
                <div className="flex justify-between items-center text-emerald-500 font-bold">
                  <span>[X] Unit 2: B-Trees Deep Study</span>
                  <span>Done</span>
                </div>
                <div className="flex justify-between items-center text-primary">
                  <span>[ ] Unit 3: Transaction Stack</span>
                  <span className="opacity-50">To Do</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 07: PRACTICE */}
      <section className="z-[70] stack-section bg-background grid-background flex flex-col items-center justify-center min-h-[100dvh] w-full py-8 px-4 md:px-8">
        <div className="industrial-container w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center flex-1">
          {/* Practice Mockup */}
          <div className="w-full border border-outline-variant bg-surface p-6 flex flex-col gap-4 font-mono text-[11px] leading-relaxed relative overflow-hidden shadow-xl max-w-lg mx-auto order-last lg:order-first">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="text-primary font-bold">PRACTICE SESSION</span>
              <span className="text-[10px] opacity-40">CARD 3 OF 10</span>
            </div>
            
            <div className="border border-outline-variant/30 p-3 bg-background/50 flex flex-col gap-2">
              <span className="text-[8px] opacity-40 uppercase">QUESTION</span>
              <p className="font-bold text-primary uppercase text-[10px]">Explain why range queries are faster on B-Trees than Hash Indexes.</p>
            </div>
            
            <div className="border border-outline-variant/30 p-3 bg-background/20 flex flex-col gap-2">
              <span className="text-[8px] opacity-40 uppercase">KEY TERMS TO CHECK</span>
              <div className="grid grid-cols-2 gap-2 text-[9px] text-emerald-500 font-bold">
                <span>[X] Sequential Leaves</span>
                <span>[X] Height log(n)</span>
                <span>[ ] Tree Pointers</span>
                <span>[X] Hash Buckets</span>
              </div>
            </div>
            
            <button className="h-10 border border-primary bg-primary text-background font-mono font-bold tracking-widest text-[9px] uppercase hover:bg-background hover:text-primary transition-colors">
              VIEW EXPLANATION
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-section-heading">PRACTICE QUIZZES</h2>
            <p className="text-body opacity-85">
              Practice quizzes that actually help. Ater creates quick quizzes from your notes. It grades your answers and highlights the key words you missed, helping you study smarter, not harder.
            </p>
            <ul className="space-y-3 font-mono text-[11px] leading-relaxed opacity-75">
              <li>&gt; Build smart quizzes directly from your Markdown notes.</li>
              <li>&gt; Grade your own progress with automatically compiled key terms.</li>
              <li>&gt; Review weak topics dynamically to improve your scores.</li>
            </ul>
          </div>
        </div>
      </section>

    </div>
  );
}
