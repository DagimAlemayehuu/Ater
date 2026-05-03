---
title: Solution_of_Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: 2024/25
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 11
mode: MATH-PURE
read: false
generated: true
prerequisites:
- "[[Recurrence_Relation]]"
---

# 1. Mental Model
Imagine you're on a staircase where each step represents a value in a sequence. The recurrence relation is like a rule that tells you how to get to the next step based on the previous steps. Solving the recurrence relation is like finding a general formula that allows you to calculate the value of any step directly, without having to climb the entire staircase.

# 2. Derivation & Logical Trace
The solution of a recurrence relation involves finding a sequence `an` that satisfies the given recurrence relation. This is typically achieved through a process of substitution and elimination, often facilitated by using [[Characteristic_Equation]] to find the [[Homogeneous_Solution]]. For linear recurrence relations, the solution is often expressed as a combination of the homogeneous solution and a [[Particular_Solution]], which is found by guessing a solution of a certain form or using methods like [[Generating_Functions]]. The [[Superposition_Principle]] is then applied to combine these components into a general solution.

# 3. Theorem Constraints & Incompleteness
The solution of a recurrence relation is subject to certain constraints, such as [[Initial_Conditions]], which are specific values of the sequence that must be satisfied. The existence and uniqueness of a solution depend on the [[Well-Posedness]] of the problem, which includes the specification of the recurrence relation and the initial conditions. If the recurrence relation is nonlinear or has non-constant coefficients, finding a closed-form solution can be challenging or impossible, leading to [[Incompleteness]] in the solution. Furthermore, some recurrence relations may have multiple solutions or no solution at all, depending on the [[Boundary_Conditions]].
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Solution of Recurrence Relation}

Given a recurrence relation of the form:
\[a_n = c_1a_{n-1} + c_2a_{n-2} + \ldots + c_ka_{n-k} + f(n)\]

\subsection{Step 1: Find the Characteristic Equation}
The characteristic equation is obtained by substituting $a_n = r^n$ into the homogeneous part of the recurrence relation:
\[r^n = c_1r^{n-1} + c_2r^{n-2} + \ldots + c_kr^{n-k}\]
Dividing through by $r^{n-k}$ gives:
\[r^k = c_1r^{k-1} + c_2r^{k-2} + \ldots + c_k\]

\subsection{Step 2: Solve the Characteristic Equation}
Let $r_1, r_2, \ldots, r_k$ be the roots of the characteristic equation.

\subsection{Step 3: Find the Homogeneous Solution}
The homogeneous solution is:
\[a_n^{(h)} = A_1r_1^n + A_2r_2^n + \ldots + A_kr_k^n\]
where $A_1, A_2, \ldots, A_k$ are constants.

\subsection{Step 4: Find the Particular Solution}
The particular solution $a_n^{(p)}$ is found by guessing a solution of a certain form or using methods like generating functions.

\subsection{Step 5: Combine the Solutions}
The general solution is:
\[a_n = a_n^{(h)} + a_n^{(p)}\]
Using the superposition principle.

\subsection{Step 6: Apply Initial Conditions}
Apply the initial conditions to find the constants $A_1, A_2, \ldots, A_k$.

\end{document}
```
To read this LaTeX code, start from the top and follow the step-by-step derivation of the solution of a recurrence relation. Each section represents a crucial step in solving the recurrence relation, from finding the characteristic equation to applying the initial conditions.

## 5. Walkthrough
Here's a rigorous, multi-step exam scenario applying the concept of solving a recurrence relation:

Given the recurrence relation:
\[T(n) = 2T(n-1) + 3\]
with initial condition $T(0) = 1$.

### Step 1: Find the Characteristic Equation
The characteristic equation is obtained by substituting $T(n) = r^n$ into the homogeneous part of the recurrence relation:
\[r^n = 2r^{n-1}\]
Dividing through by $r^{n-1}$ gives:
\[r = 2\]

### Step 2: Solve the Characteristic Equation
The root of the characteristic equation is $r = 2$.

### Step 3: Find the Homogeneous Solution
The homogeneous solution is:
\[T(n}^{(h)} = A \cdot 2^n\]
where $A$ is a constant.

### Step 4: Find the Particular Solution
Guess a particular solution of the form $T(n}^{(p)} = k$, where $k$ is a constant.
Substituting into the recurrence relation:
\[k = 2k + 3\]
Solving for $k$ gives:
\[k = -3\]

### Step 5: Combine the Solutions
The general solution is:
\[T(n) = A \cdot 2^n - 3\]

### Step 6: Apply Initial Conditions
Apply the initial condition $T(0) = 1$:
\[1 = A \cdot 2^0 - 3\]
Solving for $A$ gives:
\[A = 4\]

The final solution is:
\[T(n) = 4 \cdot 2^n - 3\]

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the purpose of the characteristic equation in solving a recurrence relation?",
    "options": {
      "A": "To find the particular solution",
      "B": "To find the homogeneous solution",
      "C": "To combine the solutions using the superposition principle",
      "D": "To guess the form of the particular solution"
    },
    "answer": "B",
    "explanation": "The characteristic equation is used to find the homogeneous solution of a recurrence relation."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The general solution of a recurrence relation is a combination of the [[Blank1]] and the [[Blank2]].",
    "textWithBlanks": "The general solution of a recurrence relation is a combination of the [[Blank1]] and the [[Blank2]].",
    "answer": [
      "homogeneous solution",
      "particular solution"
    ],
    "explanation": "The general solution of a recurrence relation is a combination of the homogeneous solution and the particular solution."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code:",
    "content": "T(n) = 2T(n-1) + 3\nT(0) = 1\nA = 2\nT(n) = A * 2^n - 3",
    "answer": "The value of A is incorrect. It should be 4.",
    "explanation": "The initial condition T(0) = 1 is not properly applied to find the value of A."
  }
]
```