---
title: Homogeneous_Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 13
mode: MATH-PURE
read: false
generated: true
prerequisites:
- "[[Linear_Recurrence_Relation]]"
---

# 1. Mental Model
Imagine you have a row of dominoes where each domino falling triggers the next one to fall. A homogeneous recurrence relation is like this chain reaction where the "force" causing each domino to fall comes solely from previous dominoes, with no external pushes. This means that if all previous dominoes were somehow prevented from falling, no domino would fall.

# 2. Derivation & Logical Trace
A homogeneous recurrence relation is defined as a relation where the function `f(n)` equals `0` for all `n`, implying that the recurrence depends solely on previous terms of the sequence and not on any external function of `n`. Mechanically, this works by defining a sequence `a_n` where each term is a linear combination of previous terms, typically expressed as `a_n = c_1*a_(n-1) + c_2*a_(n-2) + ... + c_k*a_(n-k)`, where `c_1, c_2, ..., c_k` are constants. The solution to such equations often involves finding the [[Characteristic_Equation]] of the recurrence, which is derived by substituting `a_n = r^n` into the recurrence relation, yielding a polynomial equation in terms of `r`. Solving this equation provides the [[Root]]s that are used to construct the general solution, often involving [[Linear_Independence]] of the solutions formed by these roots.

# 3. Theorem Constraints & Incompleteness
For a homogeneous recurrence relation to have a solution that can be expressed in a closed form, certain constraints must be met, such as the existence of a [[Characteristic_Equation]] with distinct roots, or if there are repeated roots, the form of the solution changes to accommodate [[Generalized_Linear_Combination]]s. The boundary conditions, or initial conditions, are crucial as they allow for the determination of the specific solution out of the general solution space. Failure to specify these conditions, or specifying inconsistent conditions, can lead to an ill-posed problem. Moreover, the relation's [[Computational_Complexity]] can increase significantly with the number of terms it depends on, making the solution harder to compute for large `n`. The constraints on the coefficients and the initial conditions are critical for ensuring the existence and uniqueness of the solution.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Proof of Homogeneous Recurrence Relation}

Given a sequence $a_n$ defined by a homogeneous recurrence relation:
\[a_n = c_1a_{n-1} + c_2a_{n-2} + \ldots + c_ka_{n-k}\]

Assume $a_n = r^n$ for some $r$. Substituting into the recurrence relation:

\[r^n = c_1r^{n-1} + c_2r^{n-2} + \ldots + c_kr^{n-k}\]

Divide through by $r^{n-k}$:

\[r^k = c_1r^{k-1} + c_2r^{k-2} + \ldots + c_k\]

This is the characteristic equation.

\section{Characteristic Equation Roots}

Let $r_1, r_2, \ldots, r_k$ be the roots of the characteristic equation.

If all roots are distinct, the general solution is:
\[a_n = A_1r_1^n + A_2r_2^n + \ldots + A_kr_k^n\]

for some constants $A_1, A_2, \ldots, A_k$.

\end{document}
```
To read this LaTeX code: This is a step-by-step proof of the homogeneous recurrence relation concept. It starts by defining the recurrence relation, assumes a solution of the form $a_n = r^n$, and then derives the characteristic equation, which is a crucial step in solving such recurrences.

## 5. Walkthrough
Consider the homogeneous recurrence relation:
\[a_n = 5a_{n-1} - 6a_{n-2}\]

with initial conditions $a_0 = 1$ and $a_1 = 5$.

1. **Formulate the Characteristic Equation**: Assume $a_n = r^n$. Substituting into the recurrence relation gives:
\[r^n = 5r^{n-1} - 6r^{n-2}\]
Divide through by $r^{n-2}$:
\[r^2 = 5r - 6\]
\[r^2 - 5r + 6 = 0\]

2. **Solve the Characteristic Equation**:
\[(r - 2)(r - 3) = 0\]
So, $r_1 = 2$ and $r_2 = 3$.

3. **General Solution**: Since the roots are distinct, the general solution is:
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

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the characteristic equation for the recurrence relation $a_n = 4a_{n-1} - 4a_{n-2}$?",
    "options": {
      "A": " $r^2 - 4r - 4 = 0$",
      "B": " $r^2 - 4r + 4 = 0$",
      "C": " $r^2 + 4r - 4 = 0$",
      "D": " $r^2 + 4r + 4 = 0$"
    },
    "answer": "B",
    "explanation": "The characteristic equation is found by substituting $a_n = r^n$ into the recurrence relation."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "For the recurrence relation $a_n = 2a_{n-1} + 3a_{n-2}$, if the roots of the characteristic equation are $r_1 = -1$ and $r_2 = 3$, the general solution is $a_n = A_1[[-1]]^n + A_2[[3]]^n$.",
    "textWithBlanks": "The general solution to the recurrence relation is $a_n = A_1(-1)^n + A_2(3)^n$.",
    "answer": [
      "-1",
      "3"
    ],
    "explanation": "The general solution form is based on the roots of the characteristic equation."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code/logic for solving a homogeneous recurrence relation: $a_n = 6a_{n-1} - 9a_{n-2}$ with initial conditions $a_0 = 1$, $a_1 = 6$.",
    "content": "Characteristic equation: $r^2 = 6r - 9$\nSolving: $(r-3) = 0$, so $r = 3$\nGeneral solution: $a_n = A_1(3)^n$\nApply $a_0 = 1$: $1 = A_1$\nThe solution is $a_n = (3)^n$",
    "answer": "The general solution should account for the repeated root, thus $a_n = (A_1 + A_2n)(3)^n$.",
    "explanation": "For a repeated root, the general solution must include a term that accounts for this, typically of the form $A_2n(r)^n$."
  }
]
```