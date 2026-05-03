---
title: Unique_Solution
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 15
mode: MATH-PURE
read: false
generated: true
prerequisites:
- "[[General_Solution]]"
---

# 1. Mental Model
Imagine you have a set of building blocks stacked in a specific way, and you want to find a single, specific block that perfectly fits on top to complete the structure. The unique solution is like finding that one special block that fits perfectly, given the initial arrangement of blocks. Just as the block must match the shape and size of the existing structure, a unique solution to a recurrence relation must satisfy the initial conditions and the relation itself.

# 2. Derivation & Logical Trace
The unique solution to a recurrence relation is derived by solving the characteristic equation, which is obtained by substituting $a_n = r^n$ into the recurrence relation. This process involves finding the [[Eigenvalues]] of the relation, which are the roots of the characteristic equation. The general solution is then expressed as a linear combination of terms formed by these [[Eigenvalues]], and the [[Initial Conditions]] are used to determine the specific coefficients of this linear combination, ultimately yielding the unique solution. The solution is expressed as a function `an = f(n)`, where `f(n)` is a formula that satisfies the recurrence relation for all `n`. The [[Superposition Principle]] is often used to combine the homogeneous and particular solutions.

# 3. Theorem Constraints & Incompleteness
The existence of a unique solution depends on the [[Linear Independence]] of the solutions to the characteristic equation and the specification of a complete set of [[Initial Conditions]]. If the characteristic equation has repeated roots or if the initial conditions are not fully specified, the solution may not be unique or may not exist. Furthermore, for nonlinear recurrence relations, the existence of a unique solution is not guaranteed, and the solution may exhibit [[Chaotic Behavior]]. The uniqueness of the solution also relies on the [[Well-Posedness]] of the problem, meaning that small changes in the initial conditions should lead to small changes in the solution.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Unique Solution to a Recurrence Relation}

Given a linear homogeneous recurrence relation of the form:
$$a_n = c_1a_{n-1} + c_2a_{n-2} + \ldots + c_ka_{n-k}$$

The characteristic equation is:
$$r^k - c_1r^{k-1} - c_2r^{k-2} - \ldots - c_k = 0$$

Assume the solution has the form $a_n = r^n$. Substituting into the recurrence relation yields the characteristic equation.

\subsection*{Step 1: Find the Roots of the Characteristic Equation}

Let $r_1, r_2, \ldots, r_k$ be the roots of the characteristic equation.

\subsection*{Step 2: Express the General Solution}

The general solution is a linear combination of terms formed by these roots:
$$a_n = A_1r_1^n + A_2r_2^n + \ldots + A_kr_k^n$$

\subsection*{Step 3: Apply Initial Conditions}

Given initial conditions $a_0, a_1, \ldots, a_{k-1}$, we can solve for $A_1, A_2, \ldots, A_k$.

\subsection*{Step 4: Solve for Coefficients}

The system of equations is:
$$
\begin{bmatrix}
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
\end{bmatrix}
$$

\subsection*{Step 5: Uniqueness of Solution}

If the roots $r_1, r_2, \ldots, r_k$ are distinct, the matrix is invertible, and the solution is unique.

\end{document}
```
To read this LaTeX code: This is a step-by-step formal proof that derives the unique solution to a linear homogeneous recurrence relation. It begins with the definition of the recurrence relation, proceeds to find the roots of the characteristic equation, expresses the general solution, applies initial conditions, and finally solves for the coefficients to demonstrate the uniqueness of the solution.

## 5. Walkthrough
Consider the recurrence relation $a_n = 5a_{n-1} - 6a_{n-2}$ with initial conditions $a_0 = 1$ and $a_1 = 5$.

### Step 1: Find the Characteristic Equation
The characteristic equation is obtained by substituting $a_n = r^n$:
$$r^2 = 5r - 6$$

### Step 2: Solve the Characteristic Equation
Solving $r^2 - 5r + 6 = 0$ yields:
$$(r - 2)(r - 3) = 0$$
So, $r_1 = 2$ and $r_2 = 3$.

### Step 3: Express the General Solution
The general solution is:
$$a_n = A_1(2)^n + A_2(3)^n$$

### Step 4: Apply Initial Conditions
Using $a_0 = 1$:
$$1 = A_1 + A_2$$

Using $a_1 = 5$:
$$5 = 2A_1 + 3A_2$$

### Step 5: Solve for Coefficients
Solving the system of equations:
$$
\begin{bmatrix}
1 & 1 \\
2 & 3
\end{bmatrix}
\begin{bmatrix}
A_1 \\
A_2
\end{bmatrix}
=
\begin{bmatrix}
1 \\
5
\end{bmatrix}
$$

Yields $A_1 = -2$ and $A_2 = 3$.

### Step 6: Unique Solution
The unique solution is:
$$a_n = -2(2)^n + 3(3)^n$$

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the primary method to derive the unique solution to a recurrence relation?",
    "options": {
      "A": "Substituting $a_n = r^n$ into the recurrence relation",
      "B": "Using the Superposition Principle alone",
      "C": "Applying initial conditions without the characteristic equation",
      "D": "Guessing the solution directly"
    },
    "answer": "A",
    "explanation": "The characteristic equation is obtained by substituting $a_n = r^n$ into the recurrence relation."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The general solution to a recurrence relation is expressed as a linear combination of terms formed by the [[Eigenvalues]]. The [[Initial Conditions]] are used to determine the specific [[Blank1]] of this linear combination.",
    "textWithBlanks": "The [[Blank1]] are used to determine the specific coefficients of this linear combination.",
    "answer": [
      "coefficients"
    ],
    "explanation": "The initial conditions help in finding the coefficients of the general solution."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code that is supposed to solve for the coefficients $A_1$ and $A_2$ in the general solution.",
    "content": "def solve_coefficients():\n  A1 = 0\n  A2 = 0\n  # No actual computation of A1 and A2 from initial conditions\n  return A1, A2",
    "answer": "The bug is that the function does not compute $A_1$ and $A_2$ using the initial conditions. It simply returns zeros.",
    "explanation": "The correct approach involves solving a system of linear equations derived from the initial conditions to find $A_1$ and $A_2$."
  }
]
```