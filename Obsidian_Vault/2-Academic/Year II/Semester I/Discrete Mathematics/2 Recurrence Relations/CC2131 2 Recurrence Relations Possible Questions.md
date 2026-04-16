---
title: "CC2131_2_Recurrence_Relations_Possible_Questions"
type: "Questions"
course: "[[Discrete Mathematics]]"
semester: "[[Semester I]]"
unit: "2 Recurrence Relations"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.058437"
last_edited_time: "2026-04-16T13:47:45.058439"
last_edited_by: "LifeOs AI Agent"
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[The_Notion_of_Sequences]]
### Level 1: Understanding (The Basics)
1.  **The Variable ID:** In the sequence notation $a_n$, $f_n$, or $f(n)$, identify what 'n' typically represents within the domain of integers for a sequence.
### Level 2: Competence (Application)
2.  **The Standard Solver:** A sequence is given by enumerating its first few terms as $\{2, 6, 18, 54, \dots\}$. Write down the explicit general term for this sequence.
### Level 3: Mastery (The Crucible)
3.  **The Impossible Case:** Consider a sequence defined by $a_n = \frac{1}{n-k}$. If the domain is $n \ge n_0$, what value must $n_0$ absolutely *not* be in relation to $k$, and why, to ensure the sequence is well-defined?

## [[Recursive_Definition]]
### Level 1: Understanding (The Basics)
4.  **The Variable ID:** State the two essential conditions that must be met for an algorithm, set, or function to be considered recursively defined.
### Level 2: Competence (Application)
5.  **The Standard Solver:** Provide a recursive definition for the factorial function, $n!$, for a non-negative integer $n$.
### Level 3: Mastery (The Crucible)
6.  **The Impossible Case:** A student attempts to define a recursive function $g(n)$ as $g(n) = g(n-1) + g(n-2)$ for $n \ge 2$. Explain why this definition is not well-defined and what critical information is missing.

## [[Recurrence_Relations]]
### Level 1: Understanding (The Basics)
7.  **The Variable ID:** Define what a recurrence relation (or difference equation) is in the context of a sequence $\{a_n\}$.
### Level 2: Competence (Application)
8.  **The Standard Solver:** The population of a certain bacteria doubles every hour. If the initial population is 10, write a recurrence relation that models the number of bacteria after $n$ hours.
### Level 3: Mastery (The Crucible)
9.  **The Impossible Case:** You are modeling the amount of a drug in a patient's bloodstream. If the initial dose is $D_0$, and half the drug is eliminated every hour, but a new dose of $D_{new}$ is administered simultaneously, formulate the recurrence relation. What happens to the amount of drug in the bloodstream if $D_{new}$ becomes zero, and how does this relate to the initial conditions?

## [[Linear_Recurrence_Relations]]
### Level 1: Understanding (The Basics)
10. **The Variable ID:** State the general form of a linear recurrence relation of order $k$.
### Level 2: Competence (Application)
11. **The Standard Solver:** Classify the following recurrence relation as linear or non-linear: $a_n = 5a_{n-1} + (a_{n-2})^2$. Justify your answer.
### Level 3: Mastery (The Crucible)
12. **The Impossible Case:** A researcher defines a sequence $b_n = 2b_{n-1} + f(n)$, where $f(n)$ is a polynomial in $n$. Another sequence $c_n = 3c_{n-1} - c_{n-2}$. Are both inherently linear recurrence relations? If $f(n)$ included a term $b_{n-1}c_{n-1}$, how would the linearity of the entire system change?

## [[Order_of_Recurrence_Relations]]
### Level 1: Understanding (The Basics)
13. **The Neighbor Check:** For the recurrence relation $a_{n+2} - 4a_{n+1} + a_n = 0$, what is its order?
### Level 2: Competence (Application)
14. **The Sort:** Classify the order of the following recurrence relations:
    (i) $a_n = 2a_{n-1} - 3n$
    (ii) $a_n - a_{n-3} = 0$
### Level 3: Mastery (The Crucible)
15. **The Impostor:** A student calculates the order of $a_n = a_{n-1} \cdot a_{n-2} - 5$ to be 2, because the difference between the highest and lowest indices is 2 ($n - (n-2) = 2$). Explain why this student's reasoning is flawed in the context of formally defining the order of a *linear* recurrence relation.

## [[General_and_Unique_Solutions_of_Recurrence_Relations]]
### Level 1: Understanding (The Basics)
16. **The Variable ID:** Differentiate between a general solution and a unique solution for a recurrence relation.
### Level 2: Competence (Application)
17. **The Standard Solver:** Given the general solution $a_n = c_1(2)^n + c_2(-1)^n$ for a recurrence relation, what specific information would you need to find its unique solution?
### Level 3: Mastery (The Crucible)
18. **The Impossible Case:** If a recurrence relation has only one initial condition ($a_0 = K$) but requires two arbitrary constants in its general solution, such as $a_n = c_1 r_1^n + c_2 r_2^n$, what does this imply about the uniqueness of the solution if no other conditions are given?

## [[Homogeneous_Linear_Recurrence_Relations]]
### Level 1: Understanding (The Basics)
19. **The Variable ID:** State the general form of a k-th order homogeneous linear recurrence relation with constant coefficients.
### Level 2: Competence (Application)
20. **The Standard Solver:** Determine if the recurrence relation $a_n - 3a_{n-1} + 2a_{n-2} = \sin(n)$ is homogeneous or non-homogeneous. Justify your answer.
### Level 3: Mastery (The Crucible)
21. **The Impossible Case:** A recurrence relation is given as $c_0 a_n + c_1 a_{n-1} = 0$. If $c_0 = 0$, explain why this ceases to be a meaningful first-order homogeneous linear recurrence relation and how it simplifies or breaks the definition.

## [[Solving_First_Order_Homogeneous_Linear_Recurrence_Relations]]
### Level 1: Understanding (The Basics)
22. **The Variable ID:** What is the general form of the solution for a first-order homogeneous linear recurrence relation with constant coefficients?
### Level 2: Competence (Application)
23. **The Standard Solver:** Find the characteristic equation and the general solution for the recurrence relation $a_n - 7a_{n-1} = 0$.
### Level 3: Mastery (The Crucible)
24. **The Impossible Case:** Consider the first-order recurrence relation $2a_n - 4a_{n-1} = 0$. If an initial condition is given as $a_0 = 0$, what unique solution would you derive, and what does this specific result imply about the sequence's terms?

## [[Solving_Second_Order_Homogeneous_Linear_Recurrence_Relations]]
### Level 1: Understanding (The Basics)
25. **The Variable ID:** What is the quadratic equation used to determine the roots for a second-order homogeneous linear recurrence relation?
### Level 2: Competence (Application)
26. **The Standard Solver:** Find the general solution for the recurrence relation $a_n - 5a_{n-1} + 6a_{n-2} = 0$.
### Level 3: Mastery (The Crucible)
27. **The Impossible Case:** A characteristic equation for a second-order homogeneous linear recurrence relation is found to be $r^2 - 4r + 4 = 0$. What type of roots does this yield, and how does that specifically affect the form of the general solution, considering the standard rules for distinct vs. repeated roots?

## [[Solving_N_Order_Relations]]
### Level 1: Understanding (The Basics)
28. **The Variable ID:** For a general $k^{th}$ order homogeneous linear recurrence relation $c_0 a_n + c_1 a_{n-1} + \dots + c_k a_{n-k} = 0$, what is the corresponding characteristic equation?
### Level 2: Competence (Application)
29. **The Standard Solver:** Given a recurrence relation $a_n - 6a_{n-1} + 11a_{n-2} - 6a_{n-3} = 0$, write its characteristic equation.
### Level 3: Mastery (The Crucible)
30. **The Impossible Case:** If a k-th order characteristic equation has a root $r$ with multiplicity $m$, explain how this multiplicity is incorporated into the terms of the general solution. What happens if the sum of multiplicities of all distinct roots is less than $k$?

## [[Non_Homogeneous_Linear_Recurrence_Relations]]
### Level 1: Understanding (The Basics)
31. **The Variable ID:** State the general form of a k-th order non-homogeneous linear recurrence relation.
### Level 2: Competence (Application)
32. **The Standard Solver:** If the general solution to a non-homogeneous linear recurrence relation is given by $a_n = a_n^{(h)} + a_n^{(p)}$, what do $a_n^{(h)}$ and $a_n^{(p)}$ represent?
### Level 3: Mastery (The Crucible)
33. **The Impossible Case:** Consider a non-homogeneous recurrence relation where the function $f(n)$ on the right-hand side is $f(n) = 0$ for all $n$. How does this specific case simplify the problem, and what type of recurrence relation does it effectively become?

## [[Method_of_Undetermined_Coefficients]]
### Level 1: Understanding (The Basics)
34. **The Variable ID:** When using the Method of Undetermined Coefficients, if $f(n)$ is a polynomial function of degree $k$, what is the assumed form of the particular solution, $a_n^{(p)}$?
### Level 2: Competence (Application)
35. **The Standard Solver:** If $f(n) = 3 \cdot 2^n$ in a non-homogeneous recurrence relation, what would be your initial guess for the form of the particular solution $a_n^{(p)}$, assuming 2 is not a root of the characteristic equation of the associated homogeneous relation?
### Level 3: Mastery (The Crucible)
36. **The Impossible Case:** Suppose $f(n) = 5 \cdot 3^n$ and $r=3$ is a root of multiplicity 2 for the characteristic equation of the associated homogeneous recurrence relation. What specific modification must be made to the assumed form of the particular solution $a_n^{(p)}$ to avoid linear dependence, and why is this modification critical?

# Part II: Unit Synthesis (The Final Boss)
*These questions require combining multiple concepts from the unit to solve a complex problem.*

### Integrated Scenario: Secure System Authentication
**The Setup:** You are designing an authentication system where the number of unsuccessful login attempts, $a_n$, on day $n$ is governed by a recurrence relation. The system has a base failure rate (homogeneous component) and is also subjected to a surge in bot attacks (non-homogeneous component). Specifically, for the first two days, you observe $a_0 = 1$ and $a_1 = 5$ unsuccessful attempts. The overall recurrence relation for the number of attempts is $a_n - 4a_{n-1} + 4a_{n-2} = 3(2)^n$ for $n \ge 2$.
**The Constraints:** The system must identify and block patterns. The $2^n$ term in $f(n)$ presents a particular challenge because $r=2$ is also a root of the associated homogeneous characteristic equation with multiplicity 2.
**The Challenge:**
(a) Determine the characteristic equation of the associated homogeneous recurrence relation for the login attempts.
(b) Find the general solution for the homogeneous part of the recurrence relation, $a_n^{(h)}$.
(c) Using the Method of Undetermined Coefficients, find the particular solution, $a_n^{(p)}$, specifically addressing the issue of the repeated root.
(d) Find the unique solution for $a_n$ by applying the initial conditions $a_0 = 1$ and $a_1 = 5$. What does this unique solution predict for the number of unsuccessful attempts on day 3 ($a_3$)?