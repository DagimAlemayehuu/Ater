---
title: CS1220_1_An_Overview_Of_Programming_Possible_Questions
created_at: '2025-12-11T07:21:58Z'
last_modified: '2025-12-11T07:21:58Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 26e5d55e-6ea9-4e71-9eac-3cfbfffac6a5
type: Questions
course: Computer_Programming
year: Year_II
semester: Semester_I
credits: 4
original_source: Lecture_Slides_Chapter_1_Introduction_to_Programming
aliases: []
unit: 1_An_Overview_Of_Programming
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[What_Is_Programming]]
### Level 1: Understanding (The Basics)
1.  **The Fact Check:** Identify two distinct characteristics that differentiate "computer programming" from simply "operating a computer."
### Level 2: Competence (Application)
2.  **The Trade-off:** Explain how programming can be considered both a scientific and a creative endeavor, providing an example for each aspect.
### Level 3: Mastery (The Impostor)
3.  **The Impostor:** Among the following statements, identify the one that is NOT an aspect of programming as described: "Programming is modeling," "Programming is delegating," "Programming is problem solving," "Programming is teaching." Explain why it doesn't fit.

## [[Computer_Programs_and_Source_Code]]
### Level 1: Understanding (The Basics)
4.  **The Component Check:** What are the two essential elements that typically constitute a computer program, and what role does each play?
### Level 2: Competence (Application)
5.  **The Clean Build:** Describe the process a computer goes through when "executing" a program, starting from the source code.
### Level 3: Mastery (The Broken System)
6.  **The Broken System:** A new programmer writes what they believe is a complete program, but when executed, the computer produces an unexpected error message that says "Syntax Error." Based on your understanding of source code and execution, explain the most likely root cause of this error.

## [[Programming_Languages_Introduction]]
### Level 1: Understanding (The Basics)
7.  **The Fact Check:** Define the terms "syntax" and "semantics" as they apply to programming languages.
### Level 2: Competence (Application)
8.  **The Trade-off:** When designing a new programming language, why is it crucial for the language to be unambiguous in its instructions, and what potential issues could arise from ambiguity?
### Level 3: Mastery (The Impostor)
9.  **The Impostor:** A programming language feature allows for very flexible but potentially confusing code structures. Would this primarily be a violation of the language's syntax or its semantics? Justify your answer.

## [[Low_Level_Languages]]
### Level 1: Understanding (The Basics)
10. **The Fact Check:** What is the fundamental difference in readability for humans between machine language and assembly language?
### Level 2: Competence (Application)
11. **The Trade-off:** Imagine you are writing a small, performance-critical routine for a very specific embedded system. Would a low-level language like assembly be a suitable choice? Justify your answer by listing one advantage and one disadvantage.
### Level 3: Mastery (The Impostor)
12. **The Impostor:** A programmer states that "Machine code is inherently portable across all computer architectures because it's just zeroes and ones." Is this statement true or false? Explain why.

## [[High_Level_Languages]]
### Level 1: Understanding (The Basics)
13. **The Fact Check:** Provide two examples of high-level programming languages and describe a key characteristic that makes them "high-level."
### Level 2: Competence (Application)
14. **The Trade-off:** Why are high-level languages generally preferred for developing large, complex applications despite their execution potentially being slower than low-level languages?
### Level 3: Mastery (The Impostor)
15. **The Impostor:** A novice programmer claims that "high-level language instructions directly correspond to a single machine instruction." Is this accurate? Explain the typical relationship between a high-level instruction and machine code.

## [[Compilation_vs_Interpretation]]
### Level 1: Understanding (The Basics)
16. **The Variable ID:** In the analogy of translating a book versus a spoken statement, identify which process corresponds to compilation and which to interpretation.
### Level 2: Competence (Application)
17. **The Hard Choice:** You are developing a web application where the code needs to run instantly in a user's browser without any pre-processing delay. Would you prefer a compiled or interpreted language for the client-side scripting? Justify your choice with one key reason.
### Level 3: Mastery (The Lose-Lose Scenario)
18. **The Lose-Lose Scenario:** Consider a scenario where you have to choose between a strictly compiled language and a strictly interpreted language for a critical system that requires both extremely fast execution *and* immediate, live code changes for debugging. Why is this a difficult choice, and what is the fundamental trade-off you must accept regardless of your decision?

## [[Programming_Paradigms]]
### Level 1: Understanding (The Basics)
19. **The Neighbor Check:** What is a "programming paradigm," and how does it fundamentally influence the organization of a computer program?
### Level 2: Competence (Application)
20. **The Sort:** You are given a list of programming approaches: "focus on what is happening," "focus on who is being affected," "linear steps of code," "data and operations grouped." Sort these approaches into two categories, aligning them with code-centric and data-centric programming philosophies.
### Level 3: Mastery (The Impostor)
21. **The Impostor:** A software architect states that "all programming paradigms ultimately aim to achieve the same exact solution structure, just with different syntax." Evaluate this statement, discussing whether programming paradigms primarily differ in syntax or in their fundamental conceptual organization.

## [[Unstructured_Programming]]
### Level 1: Understanding (The Basics)
22. **The Component Check:** Describe the primary structural characteristic of an unstructured program in terms of its main program and data scope.
### Level 2: Competence (Application)
23. **The Clean Build:** Imagine a scenario where a small, one-off script is needed to perform a very simple, non-repetitive task. Could unstructured programming be considered an acceptable approach here? Explain why, considering its usual disadvantages.
### Level 3: Mastery (The Broken System)
24. **The Broken System:** A large, complex application was developed using an unstructured programming approach. As the development team tries to introduce a new feature that requires a sequence of statements already used in five other places in the program, what is the most significant challenge they will face due to the unstructured nature, and why?

## [[Procedural_Programming]]
### Level 1: Understanding (The Basics)
25. **The Component Check:** What is the core concept upon which procedural programming is based, and what does a "procedure call" achieve?
### Level 2: Competence (Application)
26. **The Clean Build:** You need to write a program where a specific block of code (e.g., calculating a square root) will be required multiple times throughout the application. How would procedural programming facilitate this requirement efficiently?
### Level 3: Mastery (The Broken System)
27. **The Broken System:** A large procedural program has a global variable `user_count` that is modified by several different procedures. If a bug is found where `user_count` sometimes has an incorrect value, why might it be particularly difficult to debug this issue in a large procedural system compared to other paradigms?

# Part II: Unit Synthesis (The Final Boss)
*These questions require combining multiple concepts from the unit to solve a complex problem.*

### Integrated Scenario: Designing a Simple Inventory System
**The Setup:** You are tasked with designing a basic inventory management system for a small shop. The system needs to keep track of product names, quantities, and prices. It should allow for adding new products, updating stock levels, and generating a simple report of all available items.
**The Constraints:**
*   You must prioritize ease of understanding and modification for future developers who might not have extensive programming experience.
*   The system initially needs to handle only 10-20 products, but it should be designed to scale gracefully if the shop expands to hundreds of products.
*   You must use a high-level programming language and cannot directly use assembly or machine code.
**The Challenge:**
(a)  **Choose a Programming Paradigm and Justify:** Based on the constraints and the needs of the shop, which programming paradigm (Unstructured, Procedural, Structured, or Object-Oriented) would be the most suitable for this inventory system? Justify your choice by explaining how its principles address the constraints, particularly the need for ease of understanding, modification, and scalability.
(b)  **Outline Algorithm and Control Flow:** Briefly outline the high-level algorithm for the "Update Stock" functionality (e.g., increasing quantity for an existing product). In your outline, explicitly mention how you would use at least two different control structures (sequence, selection, repetition) to manage the flow of this operation.
(c)  **Predict a Failure Mode:** If you were forced to use an "unstructured programming" paradigm for this system, predict one significant failure mode or major difficulty you would encounter as the shop (and thus the system's complexity) grows. Explain *why* this failure mode is inherent to unstructured programming in this context.