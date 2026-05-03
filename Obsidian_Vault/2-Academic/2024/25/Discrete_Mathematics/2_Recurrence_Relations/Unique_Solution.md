---
title: Unique_Solution
type: Atomic Note
course: Discrete Mathematics
semester: 2024/25
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 15
mode: MATH-PURE
read: false
generated: true
prerequisites:
- "[[Solution_Of_Recurrence_Relation]]"
- "[[Initial_Condition]]"
---

# 1. Mental Model
Imagine you have a set of building blocks stacked in a specific way, and you want to find a single, specific block that perfectly fits on top to complete the structure. The unique solution is like finding that one special block that fits perfectly, given the initial arrangement of blocks. Just as the block must match the shape and size of the existing structure, a unique solution to a recurrence relation must satisfy the initial conditions and the relation itself.

# 2. Derivation & Logical Trace
The unique solution to a recurrence relation is derived by solving the characteristic equation, which is obtained by substituting `an = r^n` into the recurrence relation. This process involves finding the [[Eigenvalues]] of the relation, which are the roots of the characteristic equation. The general solution is then expressed as a linear combination of terms formed by these [[Eigenvalues]] and [[Linearly_Independent]] solutions. To obtain the unique solution, we apply the initial conditions to the general solution, which allows us to determine the [[Coefficients]] of the linear combination.

# 3. Theorem Constraints & Incompleteness
The existence of a unique solution relies on the satisfaction of certain constraints, such as the requirement that the recurrence relation has a finite number of [[Basis_Solutions]]. If the relation has multiple [[Eigenvalues]] with the same value, or if the initial conditions are inconsistent, the unique solution may not exist or may not be well-defined. Furthermore, the [[Domain]] of the solution must be considered, as the unique solution may only be valid for a specific range of values. In cases where the constraints are not met, the solution may be incomplete or may require additional [[Boundary_Conditions]] to be specified.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Unique Solution to a Recurrence Relation}

Given a recurrence relation of the form:
\[a_n = c_1a_{n-1} + c_2a_{n-2} + \ldots + c_ka_{n-k}\]

\subsection*{Step 1: Characteristic Equation}
Substitute $a_n = r^n$ into the recurrence relation:
\[r^n = c_1r^{n-1} + c_2r^{n-2} + \ldots + c_kr^{n-k}\]
Divide through by $r^{n-k}$:
\[r^k = c_1r^{k-1} + c_2r^{k-2} + \ldots + c_k\]
Rearrange to get the characteristic equation:
\[r^k - c_1r^{k-1} - c_2r^{k-2} - \ldots - c_k = 0\]

\subsection*{Step 2: General Solution}
Assume the characteristic equation has $k$ distinct roots $r_1, r_2, \ldots, r_k$. The general solution is:
\[a_n = A_1r_1^n + A_2r_2^n + \ldots + A_kr_k^n\]

\subsection*{Step 3: Apply Initial Conditions}
Given initial conditions $a_0, a_1, \ldots, a_{k-1}$, we can write:
\[\begin{bmatrix}
1 & 1 & \ldots & 1 \\
r_1 & r_2 & \ldots & r_k \\
\vdots & \vdots & \ddots & \vdots \\
r_1^{k-1} & r_2^{k-1} & \ldots & r_k^{k-1}
\end{bmatrix}
\begin{bmatrix}
A_1 \\
A_2 \\
\vdots \\
A_k
\end{bmatrix}
=
\begin{bmatrix}
a_0 \\
a_1 \\
\vdots \\
a_{k-1}
\end{bmatrix}\]

\subsection*{Step 4: Unique Solution}
If the matrix is invertible (i.e., the $r_i$ are distinct), there exists a unique solution for $A_1, A_2, \ldots, A_k$.

\end{document}
```
To read this LaTeX code, start from the top and follow the step-by-step derivation of the unique solution to a recurrence relation. The code first defines the recurrence relation, then derives the characteristic equation, and finally applies the initial conditions to obtain the unique solution.

## 5. Walkthrough
Consider the recurrence relation:
\[a_n = 2a_{n-1} + 3a_{n-2}\]
with initial conditions $a_0 = 1$ and $a_1 = 2$.

1. **Characteristic Equation**: Substitute $a_n = r^n$ into the recurrence relation:
\[r^n = 2r^{n-1} + 3r^{n-2}\]
Divide through by $r^{n-2}$:
\[r^2 = 2r + 3\]
Rearrange to get the characteristic equation:
\[r^2 - 2r - 3 = 0\]

2. **Solve Characteristic Equation**: Factor the quadratic equation:
\[(r - 3)(r + 1) = 0\]
So, $r_1 = 3$ and $r_2 = -1$.

3. **General Solution**: The general solution is:
\[a_n = A_1(3)^n + A_2(-1)^n\]

4. **Apply Initial Conditions**:
- For $n = 0$: $a_0 = A_1 + A_2 = 1$
- For $n = 1$: $a_1 = 3A_1 - A_2 = 2$

5. **Solve for $A_1$ and $A_2$**:
\[\begin{bmatrix}
1 & 1 \\
3 & -1
\end{bmatrix}
\begin{bmatrix}
A_1 \\
A_2
\end{bmatrix}
=
\begin{bmatrix}
1 \\
2
\end{bmatrix}\]
Solving this system of equations yields $A_1 = \frac{3}{4}$ and $A_2 = \frac{1}{4}$.

6. **Unique Solution**: Therefore, the unique solution to the recurrence relation is:
\[a_n = \frac{3}{4}(3)^n + \frac{1}{4}(-1)^n\]

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the primary method used to derive the unique solution to a recurrence relation?",
    "options": {
      "A": "Substitution of $a_n = r^n$ into the recurrence relation",
      "B": "Direct application of initial conditions",
      "C": "Elimination of variables",
      "D": "Graphical analysis"
    },
    "answer": "A",
    "explanation": "The primary method involves substituting $a_n = r^n$ into the recurrence relation to obtain the characteristic equation."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The general solution to a recurrence relation with distinct [[Eigenvalues]] $r_1, r_2, \\ldots, r_k$ is given by $a_n = [[A_1]]r_1^n + [[A_2]]r_2^n + \\ldots + [[A_K]]r_k^n$.",
    "textWithBlanks": "The general solution to a recurrence relation with distinct [[Eigenvalues]] $r_1, r_2, \\ldots, r_k$ is given by $a_n = [[A_1]]r_1^n + [[A_2]]r_2^n + \\ldots + [[A_K]]r_k^n$.",
    "answer": [
      "A_1",
      "A_2",
      "\\ldots",
      "A_k"
    ],
    "explanation": "The coefficients $A_1, A_2, \\ldots, A_k$ are determined by applying the initial conditions to the general solution."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code/logic for solving a recurrence relation:",
    "content": "Characteristic equation: $r^2 = 4r$; Solve for $r$: $r(r - 4) = 0$, so $r = 0$ or $r = 4$. General solution: $a_n = A_1(0)^n + A_2(4)^n$.",
    "answer": "The issue arises when $r=0$ because it leads to a term that vanishes for all $n>0$, effectively reducing the number of independent solutions. This could cause issues with satisfying initial conditions if $a_0$ is not equal to $A_1$.",
    "explanation": "The bug involves not considering the implications of a root being zero, which may affect the ability to satisfy all initial conditions."
  }
]
```