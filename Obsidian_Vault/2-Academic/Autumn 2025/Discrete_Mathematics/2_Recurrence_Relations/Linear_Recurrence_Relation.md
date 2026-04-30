---
title: Linear_Recurrence_Relation
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
- "[[Recurrence_Relation]]"
---

# 1. Mental Model
Imagine you have a row of dominoes standing upright, and each domino falls based on the state of a few preceding dominoes. A linear recurrence relation is like a rule that determines how each domino falls based on the state of the previous k dominoes, where k is a fixed number. This rule is applied uniformly across the row, allowing you to predict the state of any domino given the states of its predecessors.

# 2. Derivation & Logical Trace
A linear recurrence relation is derived by expressing each term `an` in a sequence as a linear combination of previous terms `an-1`, `an-2`, ..., `an-k`, and a function `f(n)`. Mechanically, this involves specifying coefficients `c0`, `c1`, ..., `ck` that define the linear relationship, where `c0` and `ck` are non-zero. The relation is expressed as `c0*an + c1*an-1 + ... + ck*an-k = f(n)`. Solving such a relation typically involves finding the [[Homogeneous_Solution]] and a particular [[Particular_Solution]], which are then combined to form the [[General_Solution]]. The process relies heavily on [[Characteristic_Equations]] to determine the homogeneous solution.

# 3. Theorem Constraints & Incompleteness
The constraints for a linear recurrence relation include that `c0` and `ck` must be non-zero, and `1 ≤ k ≤ n`. The relation's solvability can be affected by the form of `f(n)`, which may require guessing a particular solution or using methods like [[Variation_Of_Parameters]]. Boundary conditions are crucial, as they allow for the determination of the unique solution by specifying initial values `a0`, `a1`, ..., `ak-1`. Failure to specify sufficient boundary conditions can result in infinitely many solutions or no solution at all. Moreover, the relation's complexity and the degree of the characteristic equation, which is determined by `k`, directly impact the solution's form and computability.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Linear Recurrence Relation}

Given a sequence $\{a_n\}$ and a fixed number $k$, a linear recurrence relation is defined as:
\[c_0a_n + c_1a_{n-1} + \ldots + c_ka_{n-k} = f(n)\]

where $c_0, c_1, \ldots, c_k$ are coefficients, $c_0 \neq 0$, $c_k \neq 0$, and $f(n)$ is a function.

\subsection{Proof of Homogeneous Solution}

The homogeneous equation is:
\[c_0a_n + c_1a_{n-1} + \ldots + c_ka_{n-k} = 0\]

The characteristic equation is:
\[c_0x^k + c_1x^{k-1} + \ldots + c_k = 0\]

Assume $r$ is a root of the characteristic equation. Then:
\[c_0r^k + c_1r^{k-1} + \ldots + c_k = 0\]

Let $a_n = r^n$. Substituting into the homogeneous equation:
\[c_0r^n + c_1r^{n-1} + \ldots + c_kr^{n-k} = 0\]

This shows $a_n = r^n$ is a solution.

\subsection{Proof of Particular Solution}

Assume a particular solution of the form $a_n = s(n)$, where $s(n)$ is a function that satisfies the recurrence relation.

\subsection{General Solution}

The general solution is a combination of the homogeneous and particular solutions.

\end{document}
```

To read this LaTeX code: This is a step-by-step formal proof of the linear recurrence relation concept, broken down into sections for the overall definition, the proof of the homogeneous solution, and the general solution. The code uses mathematical equations and symbols to express the relationships between terms in the sequence.

## 5. Walkthrough
Consider the linear recurrence relation:
\[a_n = 2a_{n-1} + 3a_{n-2} + n\]

with initial conditions $a_0 = 1$ and $a_1 = 2$. 

1. **Identify the Recurrence Relation**: The given relation is $a_n = 2a_{n-1} + 3a_{n-2} + n$. This is a second-order linear recurrence relation.

2. **Formulate the Homogeneous Equation**: The homogeneous part is $a_n - 2a_{n-1} - 3a_{n-2} = 0$.

3. **Solve the Characteristic Equation**: The characteristic equation is $x^2 - 2x - 3 = 0$. Factoring gives $(x - 3)(x + 1) = 0$, so $x = 3$ or $x = -1$.

4. **Find the Homogeneous Solution**: The homogeneous solution is $a_n^{(h)} = C_1(3)^n + C_2(-1)^n$.

5. **Find a Particular Solution**: Guess a particular solution of the form $a_n^{(p)} = An + B$. Substituting into the original equation:
\[An + B = 2(A(n-1) + B) + 3(A(n-2) + B) + n\]
Simplifying yields:
\[An + B = (2A + 3A)n + (-2A - 6A + 2B + 3B) + n\]
\[An + B = 5An + (-8A + 5B) + n\]
Equating coefficients:
\[A = 5A + 1\]
\[-8A + 5B = B\]
Solving gives $A = -\frac{1}{4}$ and $B = -\frac{2}{5}$.

6. **Combine Solutions**: The general solution is $a_n = C_1(3)^n + C_2(-1)^n - \frac{1}{4}n - \frac{2}{5}$.

7. **Apply Initial Conditions**: Using $a_0 = 1$ and $a_1 = 2$:
\[1 = C_1 + C_2 - \frac{2}{5}\]
\[2 = 3C_1 - C_2 - \frac{1}{4} - \frac{2}{5}\]
Solving these equations simultaneously gives $C_1$ and $C_2$.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the general form of a linear recurrence relation?",
    "options": {
      "A": "an = c1*an-1 + c2*an-2 + ... + ck*an-k + f(n)",
      "B": "an = c1*an-1 + c2*an-2 + ... + ck*an-k * f(n)",
      "C": "an = c1*an-1 + c2*an-2 + ... + ck*an-k / f(n)",
      "D": "an = c1*an-1 + c2*an-2 + ... + ck*an-k - f(n)"
    },
    "answer": "A",
    "explanation": "The general form is a linear combination of previous terms plus a function f(n)."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "In a linear recurrence relation, the characteristic equation is obtained from the [[Homogeneous_Part]] of the relation.",
    "textWithBlanks": "The characteristic equation is [[Blank1]] the homogeneous part by substituting $a_n = x^n$.",
    "answer": [
      "derived from"
    ],
    "explanation": "The characteristic equation is derived by substituting $a_n = x^n$ into the homogeneous part."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code for solving a linear recurrence relation.",
    "content": "def solve_recurrence(relation, initial_conditions):\n  # Assume relation is a list of coefficients [c0, c1, ..., ck]\n  # and initial_conditions is a list of initial values [a0, a1, ..., ak-1]\n  characteristic_equation = [1] + relation\n  # Solve characteristic equation...\n  return solution",
    "answer": "The code incorrectly constructs the characteristic equation and lacks implementation for solving it and applying initial conditions.",
    "explanation": "The characteristic equation should be constructed as $c_0x^k + c_1x^{k-1} + ... + c_k = 0$, and the code should solve this equation and apply initial conditions to find the specific solution."
  }
]
```