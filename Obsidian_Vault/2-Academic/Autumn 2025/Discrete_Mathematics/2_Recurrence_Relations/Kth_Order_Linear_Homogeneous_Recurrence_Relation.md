---
title: Kth_Order_Linear_Homogeneous_Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 22
mode: MATH-PURE
read: false
generated: true
prerequisites:
- "[[Linear_Recurrence_Relation]]"
---

# 1. Mental Model
Imagine you have a row of dominoes standing upright, and each domino falls based on the state of a few preceding dominoes. A Kth Order Linear Homogeneous Recurrence Relation is like a rule that determines how each domino falls based on the state of the previous `k` dominoes, where the rule is the same for all dominoes and only depends on the positions and states of those preceding dominoes.

# 2. Derivation & Logical Trace
The Kth Order Linear Homogeneous Recurrence Relation is mechanically derived from the general form `c0*an + c1*an−1 + c2*an−2 + · · · + ck*an−k = 0`, where `an` represents the state at time `n`, and `c0, c1, ..., ck` are [[Coefficients]] that define the relationship. This equation implies that each term `an` in the sequence is a [[Linear Combination]] of the preceding `k` terms. The relation is [[Homogeneous]] because it equals zero, indicating that there's no external input or constant term. Solving such equations typically involves finding the [[Characteristic Equation]], which is obtained by substituting `an = r^n` into the recurrence relation.

# 3. Theorem Constraints & Incompleteness
The solution to a Kth Order Linear Homogeneous Recurrence Relation depends on finding the roots of the characteristic equation, which is a polynomial of degree `k`. The constraints include that `c0` must be nonzero (otherwise, it's not a `k`th order relation), and the sequence must satisfy the given recurrence relation for all `n >= k`. Boundary conditions, given as initial values `a0, a1, ..., ak-1`, are crucial for determining a unique solution but are not part of the recurrence relation itself. If the characteristic equation has [[Distinct Roots]], the general solution can be expressed as a linear combination of terms formed by these roots. However, if there are [[Repeated Roots]], the solution involves terms that account for the multiplicity of the roots.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Proof of Kth Order Linear Homogeneous Recurrence Relation}

Given a $k$th order linear homogeneous recurrence relation:
\[c_0a_n + c_1a_{n-1} + c_2a_{n-2} + \cdots + c_ka_{n-k} = 0\]

Assume $a_n = r^n$ for some constant $r$. Substituting into the recurrence relation:

\[c_0r^n + c_1r^{n-1} + c_2r^{n-2} + \cdots + c_kr^{n-k} = 0\]

Divide through by $r^{n-k}$:

\[c_0r^k + c_1r^{k-1} + c_2r^{k-2} + \cdots + c_k = 0\]

This is the characteristic equation.

\subsection*{Step 1: Formation of Characteristic Equation}
The characteristic equation is formed by substituting $a_n = r^n$ into the recurrence relation.

\subsection*{Step 2: Solution Based on Roots}
If $r_1, r_2, \ldots, r_k$ are distinct roots of the characteristic equation, the general solution to the recurrence relation is:
\[a_n = A_1r_1^n + A_2r_2^n + \cdots + A_kr_k^n\]
where $A_1, A_2, \ldots, A_k$ are constants determined by initial conditions.

\subsection*{Step 3: Handling Repeated Roots}
If $r$ is a root of multiplicity $m$, the solution includes terms of the form:
\[A_nr^n + A_{n+1}nr^n + \cdots + A_{n+m-1}n^{m-1}r^n\]

\subsection*{Step 4: Application of Initial Conditions}
The constants $A_i$ are determined by applying the initial conditions $a_0, a_1, \ldots, a_{k-1}$ to the general solution.

\end{document}
```

To read this LaTeX code: This is a step-by-step formal proof of the solution method for a $k$th order linear homogeneous recurrence relation. It starts with the given recurrence relation, assumes a solution of the form $a_n = r^n$, and derives the characteristic equation. The solution to the recurrence relation is then expressed in terms of the roots of the characteristic equation.

## 5. Walkthrough
Consider the 2nd order linear homogeneous recurrence relation:
\[a_n = 5a_{n-1} - 6a_{n-2} = 0\]
with initial conditions $a_0 = 1$ and $a_1 = 5$.

### Step 1: Formulate the Characteristic Equation
The characteristic equation is obtained by substituting $a_n = r^n$:
\[r^2 = 5r - 6\]
\[r^2 - 5r + 6 = 0\]

### Step 2: Solve the Characteristic Equation
Factor the quadratic equation:
\[(r - 2)(r - 3) = 0\]
So, $r_1 = 2$ and $r_2 = 3$.

### Step 3: Express the General Solution
The general solution is:
\[a_n = A_1(2)^n + A_2(3)^n\]

### Step 4: Apply Initial Conditions
Given $a_0 = 1$:
\[1 = A_1 + A_2\]

Given $a_1 = 5$:
\[5 = 2A_1 + 3A_2\]

### Step 5: Solve for $A_1$ and $A_2$
From the first equation:
\[A_2 = 1 - A_1\]

Substitute into the second equation:
\[5 = 2A_1 + 3(1 - A_1)\]
\[5 = 2A_1 + 3 - 3A_1\]
\[5 = 3 - A_1\]
\[A_1 = -2\]

Then,
\[A_2 = 1 - (-2) = 3\]

### Step 6: Write the Specific Solution
The solution to the recurrence relation is:
\[a_n = -2(2)^n + 3(3)^n\]

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the form of the solution to a Kth Order Linear Homogeneous Recurrence Relation when the characteristic equation has distinct roots?",
    "options": {
      "A": "A linear combination of terms formed by these roots",
      "B": "A product of terms formed by these roots",
      "C": "A sum of terms formed by these roots",
      "D": "A difference of terms formed by these roots"
    },
    "answer": "A",
    "explanation": "The solution is a linear combination of terms formed by the distinct roots."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The characteristic equation of a 2nd order linear homogeneous recurrence relation $a_n = 2a_{n-1} + 3a_{n-2}$ is [[Blank1]]",
    "textWithBlanks": "The characteristic equation is $r^2 - [[Blank1]]r - 3 = 0$",
    "answer": [
      "2"
    ],
    "explanation": "The characteristic equation is formed by substituting $a_n = r^n$ into the recurrence relation."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code/logic.",
    "content": "def solve_recurrence(relation):\n  # Assume a 2nd order relation\n  c0, c1, c2 = 1, -5, 6\n  r = [2, 3]\n  A = [0, 0]\n  # Apply initial conditions a0 = 1, a1 = 5\n  A[0] = -2; A[1] = 3\n  # General solution\n  def an(n):\n    return A[0]*(r[0])**n + A[1]*(r[1])**n\n  return an",
    "answer": "The code does not handle the case when the relation is not 2nd order and assumes fixed values for $c_0, c_1, c_2$ and roots $r$.",
    "explanation": "The provided code snippet lacks generality and does not dynamically compute the roots or handle variable order relations."
  }
]
```