---
read: true
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

Given a sequence $a_n$ and a fixed number $k$, a linear recurrence relation can be expressed as:
\[c_0a_n + c_1a_{n-1} + c_2a_{n-2} + \ldots + c_ka_{n-k} = f(n)\]

\subsection{Proof of Well-Definedness}

Assume $c_0 \neq 0$. We can solve for $a_n$:
\[a_n = \frac{1}{c_0}(-c_1a_{n-1} - c_2a_{n-2} - \ldots - c_ka_{n-k} + f(n))\]

\subsection{Characteristic Equation}

For the homogeneous part, $f(n) = 0$:
\[c_0a_n + c_1a_{n-1} + c_2a_{n-2} + \ldots + c_ka_{n-k} = 0\]
Assume $a_n = r^n$:
\[c_0r^n + c_1r^{n-1} + c_2r^{n-2} + \ldots + c_kr^{n-k} = 0\]
Divide by $r^{n-k}$:
\[c_0r^k + c_1r^{k-1} + c_2r^{k-2} + \ldots + c_k = 0\]
This is the characteristic equation.

\end{document}
```
To read this LaTeX code: This is a step-by-step formal proof of the linear recurrence relation concept. The code first defines the linear recurrence relation, then proves that it is well-defined by solving for $a_n$. It also derives the characteristic equation for the homogeneous part of the relation.

## 5. Walkthrough
Consider the linear recurrence relation: $a_n = 2a_{n-1} + 3a_{n-2} + n$.

### Steps:

1. **Identify the relation**: The given relation is $a_n = 2a_{n-1} + 3a_{n-2} + n$. Here, $c_0 = 1$, $c_1 = -2$, $c_2 = -3$, and $f(n) = n$.

2. **Formulate the characteristic equation**: For the homogeneous part, $a_n - 2a_{n-1} - 3a_{n-2} = 0$. Assume $a_n = r^n$:
\[r^n - 2r^{n-1} - 3r^{n-2} = 0\]
Divide by $r^{n-2}$:
\[r^2 - 2r - 3 = 0\]

3. **Solve the characteristic equation**:
\[r^2 - 2r - 3 = (r - 3)(r + 1) = 0\]
Thus, $r = 3$ or $r = -1$.

4. **Find the general solution to the homogeneous part**:
\[a_n^{(h)} = A(3)^n + B(-1)^n\]

5. **Find a particular solution for the non-homogeneous part**:
Given $f(n) = n$, assume $a_n^{(p)} = Cn + D$:
\[Cn + D = 2(C(n-1) + D) + 3(C(n-2) + D) + n\]
Simplify and equate coefficients:
\[Cn + D = (2C + 3C)n + (-2C - 6C + 2D + 3D) + n\]
\[Cn + D = 5Cn + (-8C + 5D) + n\]
Equating:
\[C = -1\]
\[-8C + 5D = 0\]
Solving gives $C = -1$ and $D = -\frac{8}{5}$.

6. **Combine solutions**:
\[a_n = A(3)^n + B(-1)^n - n - \frac{8}{5}\]

read: true
---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is a necessary condition for a linear recurrence relation to be well-defined?",
    "options": {
      "A": "The leading coefficient $c_0$ must be zero.",
      "B": "The leading coefficient $c_0$ and $c_k$ must be non-zero.",
      "C": "The relation must be homogeneous.",
      "D": "The relation must be non-homogeneous."
    },
    "answer": "B",
    "explanation": "For a linear recurrence relation to be well-defined, the leading coefficient $c_0$ and the coefficient $c_k$ must be non-zero."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "In the linear recurrence relation $a_n = 2a_{n-1} + 3a_{n-2}$, the characteristic equation is [[Blank1]].",
    "textWithBlanks": "The characteristic equation is $r^2 - [[Blank1]]r - [[Blank2]] = 0$.",
    "answer": [
      "2",
      "3"
    ],
    "explanation": "The characteristic equation is derived from the homogeneous part of the relation."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code for solving a linear recurrence relation.",
    "content": "def solve_recurrence(n):\n  if n == 0:\n    return 0\n  elif n == 1:\n    return 1\n  else:\n    return 2 * solve_recurrence(n-1) + 3 * solve_recurrence(n-2) + n",
    "answer": "The function does not store or reuse previously computed values, leading to exponential time complexity. It should be modified to use dynamic programming.",
    "explanation": "The given recursive function does not optimize for repeated computations."
  }
]
```