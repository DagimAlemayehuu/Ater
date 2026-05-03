---
title: Linear_Recurrence_Relation
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
---

# 1. Mental Model
Imagine you have a row of dominoes standing upright, and each domino falls based on the state of a few preceding dominoes. A linear recurrence relation is like a rule that determines how each domino falls based on the state of the previous k dominoes, where k is a fixed number. This rule is applied uniformly across the row, allowing you to predict the state of any domino given the states of the preceding ones.

# 2. Derivation & Logical Trace
A linear recurrence relation is derived by expressing each term `an` in a sequence as a linear combination of preceding terms, namely `an−1`, `an−2`, ..., `an−k`, and possibly a function `f(n)`. Mechanically, this involves specifying coefficients `c0`, `c1`, ..., `ck` such that the relation `c0*an + c1*an−1 + c2*an−2 + ... + ck*an−k = f(n)` holds. The relation is termed linear because each term is combined using [[Linear_Combination]] with constant coefficients. The [[Characteristic_Equation]] of the homogeneous part of the relation (when `f(n) = 0`) is crucial for finding the [[General_Solution]].

# 3. Theorem Constraints & Incompleteness
For a linear recurrence relation to be well-defined, the leading coefficient `c0` and the coefficient `ck` must be non-zero, ensuring that the relation can be solved for `an` given the preceding terms. The order of the relation, `k`, dictates how many initial conditions are required to uniquely determine the sequence. Boundary conditions, or initial conditions, are essential for specifying a unique solution to the recurrence relation. Failure to provide sufficient initial conditions results in a family of solutions rather than a single sequence. The [[Superposition_Principle]] applies to the homogeneous solution, allowing the combination of solutions but particular solutions must be found to address non-homogeneous terms like `f(n)`.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Linear Recurrence Relation}

Given a sequence $a_n$ and a set of constants $c_0, c_1, \ldots, c_k$, a linear recurrence relation can be expressed as:

\begin{equation}
c_0a_n + c_1a_{n-1} + \ldots + c_ka_{n-k} = f(n)
\label{eq:linear-recurrence}
\end{equation}

where $f(n)$ is a function of $n$.

\subsection{Proof of Well-Definedness}

Assume $c_0 \neq 0$. We can solve for $a_n$:

\begin{equation}
a_n = \frac{1}{c_0} \left( -c_1a_{n-1} - \ldots - c_ka_{n-k} + f(n) \right)
\label{eq:solve-for-an}
\end{equation}

This shows that $a_n$ can be uniquely determined given the preceding terms.

\subsection{Characteristic Equation}

For the homogeneous part of the relation ($f(n) = 0$), we have:

\begin{equation}
c_0a_n + c_1a_{n-1} + \ldots + c_ka_{n-k} = 0
\label{eq:homogeneous}
\end{equation}

The characteristic equation is:

\begin{equation}
c_0x^k + c_1x^{k-1} + \ldots + c_k = 0
\label{eq:characteristic}
\end{equation}

\end{document}
```

To read this LaTeX code: This is a step-by-step formal proof of the linear recurrence relation concept. The code first presents the general form of a linear recurrence relation, then proves that the relation is well-defined by solving for $a_n$. Finally, it introduces the characteristic equation for the homogeneous part of the relation.

## 5. Walkthrough
Consider the linear recurrence relation:

$$a_n = 2a_{n-1} + 3a_{n-2} + n$$

with initial conditions $a_0 = 1$ and $a_1 = 2$. 

1. **Identify the Recurrence Relation**: The given relation is $a_n = 2a_{n-1} + 3a_{n-2} + n$. This is a second-order linear recurrence relation.

2. **Determine the Characteristic Equation**: For the homogeneous part $a_n - 2a_{n-1} - 3a_{n-2} = 0$, the characteristic equation is $x^2 - 2x - 3 = 0$.

3. **Solve the Characteristic Equation**: 
   $$x^2 - 2x - 3 = (x - 3)(x + 1) = 0$$
   So, $x = 3$ or $x = -1$.

4. **Find the Particular Solution**: Assume a particular solution of the form $a_n^{(p)} = An + B$. Substituting into the recurrence relation:
   $$An + B = 2(A(n-1) + B) + 3(A(n-2) + B) + n$$
   Simplifying yields:
   $$An + B = (2A + 3A)n + (-2A - 6A + 2B + 3B) + n$$
   $$An + B = 5An + (-8A + 5B) + n$$
   Equating coefficients:
   $$A = 5A + 1$$
   $$B = -8A + 5B$$
   Solving these equations gives $A = -\frac{1}{4}$ and $B = -\frac{2}{5}$.

5. **Combine Solutions**: The general solution to the homogeneous part is $a_n^{(h)} = C_1(3)^n + C_2(-1)^n$. The general solution to the recurrence relation is:
   $$a_n = C_1(3)^n + C_2(-1)^n - \frac{1}{4}n - \frac{2}{5}$$

6. **Apply Initial Conditions**: Given $a_0 = 1$ and $a_1 = 2$:
   - For $n = 0$: $1 = C_1 + C_2 - \frac{2}{5}$
   - For $n = 1$: $2 = 3C_1 - C_2 - \frac{1}{4} - \frac{2}{5}$

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the characteristic equation for the homogeneous part of the recurrence relation $a_n = 2a_{n-1} + 3a_{n-2}$?",
    "options": {
      "A": "x^2 - 2x - 3 = 0",
      "B": "x^2 + 2x + 3 = 0",
      "C": "x^2 - 2x + 3 = 0",
      "D": "x^2 + 2x - 3 = 0"
    },
    "answer": "A",
    "explanation": "The characteristic equation is derived from the homogeneous part of the recurrence relation by substituting $a_n = x^n$."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "In a linear recurrence relation of the form $a_n = c_1a_{n-1} + c_2a_{n-2}$, the number of initial conditions required to uniquely determine the sequence is [[Blank1]].",
    "textWithBlanks": "In a linear recurrence relation of the form $a_n = c_1a_{n-1} + c_2a_{n-2}$, the number of initial conditions required to uniquely determine the sequence is [[Blank1]].",
    "answer": [
      "2"
    ],
    "explanation": "The order of the recurrence relation dictates the number of initial conditions needed."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code for solving a linear recurrence relation.",
    "content": "def solve_recurrence(n, a0, a1):\n  if n == 0:\n    return a0\n  elif n == 1:\n    return a1\n  else:\n    return 2 * solve_recurrence(n-1, a0, a1) + 3 * solve_recurrence(n-2, a0, a1)",
    "answer": "The function does not correctly implement memoization or dynamic programming, leading to exponential time complexity due to repeated computation of the same subproblems.",
    "explanation": "The given recursive solution lacks optimization for performance."
  }
]
```