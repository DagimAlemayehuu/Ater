---
title: Homogeneous_Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: 2024/25
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 13
mode: MATH-PURE
read: false
generated: true
prerequisites:
- "[[Recurrence_Relation]]"
- "[[Linear_Recurrence_Relation]]"
---

# 1. Mental Model
Imagine you have a row of dominoes standing upright. Each domino falls and knocks down the next one in line. A homogeneous recurrence relation is like this chain reaction where each term is defined recursively as a function of previous terms, with no external "push" or constant term - just like how each domino falls based on the one before it.

# 2. Derivation & Logical Trace
A homogeneous recurrence relation is defined such that `f(n) = 0` for all `n`, implying that the relation has the form `a_n = c_1 * a_(n-1) + c_2 * a_(n-2) + ... + c_k * a_(n-k)`, where `c_i` are constants. Mechanically, this involves [[Characteristic_Equation]] formation, where we substitute `a_n = r^n` into the recurrence to find the [[Recurrence_Relation_Characteristic_Root]]s. Solving for `r` yields a [[General_Solution]] that combines these roots, often involving [[Linear_Combination]]s of terms formed from the roots.

# 3. Theorem Constraints & Incompleteness
The constraints for a homogeneous recurrence relation include requiring that the relation holds for all `n`, and typically, initial conditions `a_0, a_1, ..., a_(k-1)` are specified to pin down a unique solution. A failure state can occur if the characteristic equation has [[Repeated_Root]]s, necessitating a modified general solution that accounts for these. Furthermore, boundary conditions must align with the relation's definition; otherwise, the relation may not hold, leading to [[Inconsistent_Initial_Conditions]]. The solution's completeness hinges on accurately solving the characteristic equation and applying appropriate [[Linear_Independence]] checks.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Proof of Homogeneous Recurrence Relation}

Given a homogeneous recurrence relation of the form:
\[a_n = c_1 a_{n-1} + c_2 a_{n-2} + \ldots + c_k a_{n-k}\]

We aim to prove that the solution has the form:
\[a_n = A_1 r_1^n + A_2 r_2^n + \ldots + A_m r_m^n\]
where \(r_i\) are the roots of the characteristic equation.

\subsection{Characteristic Equation Formation}

Assume \(a_n = r^n\) for some \(r\). Substituting into the recurrence relation:
\[r^n = c_1 r^{n-1} + c_2 r^{n-2} + \ldots + c_k r^{n-k}\]
Divide through by \(r^{n-k}\):
\[r^k = c_1 r^{k-1} + c_2 r^{k-2} + \ldots + c_k\]
Rearrange to get the characteristic equation:
\[r^k - c_1 r^{k-1} - c_2 r^{k-2} - \ldots - c_k = 0\]

\subsection{General Solution}

Let \(r_1, r_2, \ldots, r_m\) be the distinct roots of the characteristic equation. The general solution to the recurrence relation is:
\[a_n = A_1 r_1^n + A_2 r_2^n + \ldots + A_m r_m^n\]
for some constants \(A_i\).

\section{Conclusion}

The solution to a homogeneous recurrence relation can be expressed as a linear combination of terms formed from the roots of the characteristic equation.

\end{document}
```
To read this LaTeX code: This is a step-by-step formal proof of the solution form for a homogeneous recurrence relation. It starts by assuming a solution of the form \(a_n = r^n\), substituting into the recurrence relation, and deriving the characteristic equation. The general solution is then expressed as a linear combination of terms formed from the roots of the characteristic equation.

## 5. Walkthrough
Consider the homogeneous recurrence relation:
\[a_n = 3a_{n-1} - 2a_{n-2}\]
with initial conditions \(a_0 = 1\) and \(a_1 = 3\).

### Steps:

1. **Form the Characteristic Equation:**
Substitute \(a_n = r^n\) into the recurrence relation:
\[r^n = 3r^{n-1} - 2r^{n-2}\]
Divide through by \(r^{n-2}\):
\[r^2 = 3r - 2\]
Rearrange:
\[r^2 - 3r + 2 = 0\]

2. **Solve the Characteristic Equation:**
Factor the quadratic equation:
\[(r - 1)(r - 2) = 0\]
So, the roots are \(r_1 = 1\) and \(r_2 = 2\).

3. **Express the General Solution:**
The general solution is:
\[a_n = A_1(1)^n + A_2(2)^n\]
\[a_n = A_1 + A_2(2)^n\]

4. **Apply Initial Conditions:**
Given \(a_0 = 1\):
\[1 = A_1 + A_2\]
Given \(a_1 = 3\):
\[3 = A_1 + 2A_2\]

5. **Solve for \(A_1\) and \(A_2\):**
From the first equation:
\[A_1 = 1 - A_2\]
Substitute into the second equation:
\[3 = (1 - A_2) + 2A_2\]
\[3 = 1 + A_2\]
\[A_2 = 2\]
Then,
\[A_1 = 1 - 2 = -1\]

6. **Final Solution:**
Substitute \(A_1 = -1\) and \(A_2 = 2\) into the general solution:
\[a_n = -1 + 2(2)^n\]
\[a_n = -1 + 2^{n+1}\]

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the form of a homogeneous recurrence relation?",
    "options": {
      "A": "A linear combination of previous terms with no constant term",
      "B": "A linear combination of previous terms with a constant term",
      "C": "An exponential function of previous terms",
      "D": "A polynomial function of previous terms"
    },
    "answer": "A",
    "explanation": "A homogeneous recurrence relation is defined as a linear combination of previous terms with no external constant term."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The characteristic equation for the recurrence relation $a_n = 2a_{n-1} + 3a_{n-2}$ is [[Blank1]].",
    "textWithBlanks": "The characteristic equation for the recurrence relation $a_n = 2a_{n-1} + 3a_{n-2}$ is $r^2 - [[Blank1]]r - [[Blank2]] = 0$.",
    "answer": [
      "2",
      "3"
    ],
    "explanation": "The characteristic equation is formed by substituting $a_n = r^n$ into the recurrence relation."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code/logic.",
    "content": "r^2 - 2r + 3 = 0",
    "answer": "The correct characteristic equation should be $r^2 - 2r - 3 = 0$.",
    "explanation": "The bug is in the sign of the coefficient of the $r$ term."
  }
]
```