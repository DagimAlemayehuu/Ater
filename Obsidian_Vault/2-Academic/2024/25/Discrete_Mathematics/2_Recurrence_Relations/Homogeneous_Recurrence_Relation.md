---
title: "Homogeneous_Recurrence_Relation"
type: "Atomic Note"
course: "Discrete Mathematics"
semester: "2024/25"
unit: "2"
hub:
  - "2_Recurrence_Relations_Hub"
source:
  - "2_Recurrence_Relations.Pdf"
source_pages:
  - "13"
mode: "MATH-PURE"
read: false
generated: true
prerequisites:
  - "Recurrence_Relation"
---

# 1. Mental Model
Imagine you have a row of dominoes standing upright. Each domino falls and knocks down the next one in line. A homogeneous recurrence relation is like this chain reaction where each term is defined recursively as a function of previous terms, with no external "push" or constant term - just like how each domino falls based on the one before it.

# 2. Derivation & Logical Trace
A homogeneous recurrence relation is defined such that `f(n) = 0` for all `n`, implying that the relation has the form `a_n = c_1 * a_(n-1) + c_2 * a_(n-2) + ... + c_k * a_(n-k)`, where `c_i` are constants. Mechanically, this involves [[Characteristic_Equation]] formation, where we substitute `a_n = r^n` into the recurrence to find the [[Recurrence_Relation_Characteristic_Root]]s. Solving for `r` yields a [[General_Solution]] that combines these roots, often involving [[Linear_Combination]]s of terms formed from the roots.

# 3. Theorem Constraints & Incompleteness
The constraints for a homogeneous recurrence relation include requiring that the relation be linear and homogeneous, meaning no term is independent of the sequence's previous terms. Boundary conditions, or initial conditions, are necessary to specify a unique solution but are not part of the recurrence relation itself. If the [[Characteristic_Equation]] has repeated roots, the solution involves terms of the form `n^i * r^n`, where `i` is an integer that increments with each repeat. Failure to meet these conditions can result in a non-homogeneous or non-linear relation, which would require different solution methods.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Proof of Homogeneous Recurrence Relation}

Given a sequence $\{a_n\}$ defined by the homogeneous recurrence relation:
\[a_n = c_1a_{n-1} + c_2a_{n-2} + \ldots + c_ka_{n-k}\]

\subsection*{Base Case}
Assume the solution has the form $a_n = r^n$ for some constant $r$. Substituting into the recurrence relation:
\[r^n = c_1r^{n-1} + c_2r^{n-2} + \ldots + c_kr^{n-k}\]

\subsection*{Characteristic Equation}
Divide through by $r^{n-k}$:
\[r^k = c_1r^{k-1} + c_2r^{k-2} + \ldots + c_k\]
Rearrange to get the characteristic equation:
\[r^k - c_1r^{k-1} - c_2r^{k-2} - \ldots - c_k = 0\]

\subsection*{General Solution}
Let $r_1, r_2, \ldots, r_k$ be the roots of the characteristic equation. The general solution to the recurrence relation is:
\[a_n = A_1r_1^n + A_2r_2^n + \ldots + A_kr_k^n\]
where $A_1, A_2, \ldots, A_k$ are constants determined by initial conditions.

\end{document}
```
To read this LaTeX code: This is a step-by-step proof of the homogeneous recurrence relation concept. It starts with the definition of the recurrence relation, assumes a solution of the form $a_n = r^n$, and derives the characteristic equation, which is then used to find the general solution.

## 5. Walkthrough
Consider the homogeneous recurrence relation:
\[a_n = 5a_{n-1} - 6a_{n-2}\]
with initial conditions $a_0 = 1$ and $a_1 = 5$.

### Steps:
1. **Form the Characteristic Equation**: Substitute $a_n = r^n$ into the recurrence relation:
\[r^n = 5r^{n-1} - 6r^{n-2}\]
Divide through by $r^{n-2}$:
\[r^2 = 5r - 6\]
Rearrange:
\[r^2 - 5r + 6 = 0\]

2. **Solve the Characteristic Equation**:
\[(r - 2)(r - 3) = 0\]
So, $r_1 = 2$ and $r_2 = 3$.

3. **General Solution**:
\[a_n = A_1(2)^n + A_2(3)^n\]

4. **Apply Initial Conditions**:
- For $n = 0$: $a_0 = A_1 + A_2 = 1$
- For $n = 1$: $a_1 = 2A_1 + 3A_2 = 5$

5. **Solve for $A_1$ and $A_2$**:
From the first equation: $A_1 = 1 - A_2$.
Substitute into the second equation:
\[2(1 - A_2) + 3A_2 = 5\]
\[2 - 2A_2 + 3A_2 = 5\]
\[A_2 = 3\]
Then, $A_1 = 1 - 3 = -2$.

6. **Specific Solution**:
\[a_n = -2(2)^n + 3(3)^n\]

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the general form of a homogeneous recurrence relation?",
    "options": {
      "A": "a_n = c_1a_{n-1} + c_2a_{n-2} + ... + c_ka_{n-k}",
      "B": "a_n = c_1a_{n-1} - c_2a_{n-2} - ... - c_ka_{n-k}",
      "C": "a_n = c_1a_{n} + c_2a_{n-1} + ... + c_ka_{n-k}",
      "D": "a_n = c_1a_{n+1} + c_2a_{n+2} + ... + c_ka_{n+k}"
    },
    "answer": "A",
    "explanation": "The general form of a homogeneous recurrence relation is a linear combination of previous terms without any constant term."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The characteristic equation for the recurrence relation $a_n = 4a_{n-1} - 4a_{n-2}$ is [[Characteristic_Equation]].",
    "textWithBlanks": "The characteristic equation for the recurrence relation $a_n = 4a_{n-1} - 4a_{n-2}$ is $r^2 - [[Blank1]]r + [[Blank2]] = 0$.",
    "answer": [
      "4",
      "4"
    ],
    "explanation": "To form the characteristic equation, substitute $a_n = r^n$ into the recurrence relation and simplify."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code/logic for solving a homogeneous recurrence relation.",
    "content": "Given: $a_n = 2a_{n-1} - a_{n-2}$. Characteristic equation: $r^2 = 2r$. Solving gives $r(r - 2) = 0$, so $r = 0$ or $r = 2$. General solution: $a_n = A_1(0)^n + A_2(2)^n$.",
    "answer": "The bug is in the general solution when $r = 0$. The term $A_1(0)^n$ will be 0 for all $n > 0$, making the solution $a_n = A_2(2)^n$ for $n > 0$. The case for $r = 0$ needs special handling as it results in a constant term which might not be directly derived through standard methods for distinct roots.",
    "explanation": "The term with root $r=0$ indicates a constant solution which should be considered as $A_1$ for $n=0$ but results in $0$ for $n>0$."
  }
]
```