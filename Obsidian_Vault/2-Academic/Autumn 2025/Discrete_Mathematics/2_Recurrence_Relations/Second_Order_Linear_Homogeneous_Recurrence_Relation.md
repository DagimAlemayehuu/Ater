---
title: Second_Order_Linear_Homogeneous_Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 19
mode: MATH-PURE
read: false
generated: true
prerequisites:
- "[[Linear_Recurrence_Relation]]"
---

# 1. Mental Model
Imagine you are on a staircase where each step represents a value in a sequence. The height of each step depends on the heights of the two previous steps. A second-order linear homogeneous recurrence relation is like a rule that calculates the height of the current step (`an`) based on the heights of the two preceding steps (`an-1` and `an-2`), using a linear combination.

# 2. Derivation & Logical Trace
The general form of a second-order linear homogeneous recurrence relation is given by `c0*an + c1*an-1 + c2*an-2 = 0`. To solve this, one must find the [[Characteristic_Equation]], which is obtained by substituting `an = r^n` into the recurrence relation, yielding `c0*r^2 + c1*r + c2 = 0`. This [[Quadratic_Equation]] can be solved for `r`, giving the [[Eigenvalues]] of the recurrence relation. The solution to the recurrence relation is then expressed as a linear combination of terms formed by these eigenvalues.

# 3. Theorem Constraints & Incompleteness
The solution to a second-order linear homogeneous recurrence relation depends on the [[Initial_Conditions]] `a0` and `a1`, which are not provided by the recurrence relation itself. The [[Characteristic_Equation]] may have distinct roots, repeated roots, or complex roots, each case requiring a different approach to solve for `an`. If the [[Characteristic_Equation]] has no solutions or if the initial conditions are not provided, the recurrence relation is [[Underdetermined]], and its solution cannot be uniquely determined. The method of solution also relies on the [[Linear_Independence]] of the solutions formed by the eigenvalues.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Second-Order Linear Homogeneous Recurrence Relation}

Given a sequence $\{a_n\}$ defined by the recurrence relation:
\[c_0a_n + c_1a_{n-1} + c_2a_{n-2} = 0\]

\subsection*{Step 1: Substitute $a_n = r^n$ into the Recurrence Relation}

Substituting $a_n = r^n$, $a_{n-1} = r^{n-1}$, and $a_{n-2} = r^{n-2}$ into the recurrence relation yields:
\[c_0r^n + c_1r^{n-1} + c_2r^{n-2} = 0\]

\subsection*{Step 2: Derive the Characteristic Equation}

Dividing through by $r^{n-2}$ (assuming $r \neq 0$) gives:
\[c_0r^2 + c_1r + c_2 = 0\]
This is the characteristic equation.

\subsection*{Step 3: Solve the Characteristic Equation}

Let $r_1$ and $r_2$ be the roots of the characteristic equation. The solution to the recurrence relation depends on the nature of these roots.

\subsection*{Step 4: Express the General Solution}

If $r_1$ and $r_2$ are distinct, the general solution is:
\[a_n = A(r_1)^n + B(r_2)^n\]
where $A$ and $B$ are constants determined by initial conditions.

\end{document}
```
To read this LaTeX code: This is a step-by-step formal proof of the concept of a second-order linear homogeneous recurrence relation. It starts with the given recurrence relation, substitutes $a_n = r^n$ to derive the characteristic equation, and then expresses the general solution based on the roots of the characteristic equation.

## 5. Walkthrough
Consider the recurrence relation $a_n = 5a_{n-1} - 6a_{n-2}$ with initial conditions $a_0 = 1$ and $a_1 = 5$. 

1. **Identify the Recurrence Relation**: The given recurrence relation is $a_n - 5a_{n-1} + 6a_{n-2} = 0$.

2. **Derive the Characteristic Equation**: Substituting $a_n = r^n$ yields $r^2 - 5r + 6 = 0$.

3. **Solve the Characteristic Equation**: Factoring gives $(r - 2)(r - 3) = 0$, so $r_1 = 2$ and $r_2 = 3$.

4. **Express the General Solution**: The general solution is $a_n = A(2)^n + B(3)^n$.

5. **Apply Initial Conditions**: Using $a_0 = 1$ and $a_1 = 5$:
   - For $n = 0$: $1 = A + B$
   - For $n = 1$: $5 = 2A + 3B$

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the characteristic equation for the recurrence relation $a_n = 2a_{n-1} + 3a_{n-2}$?",
    "options": {
      "A": "$r^2 - 2r - 3 = 0$",
      "B": "$r^2 + 2r + 3 = 0$",
      "C": "$r^2 - 2r + 3 = 0$",
      "D": "$r^2 + 2r - 3 = 0$"
    },
    "answer": "A",
    "explanation": "The characteristic equation is obtained by substituting $a_n = r^n$ into the recurrence relation."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "For the recurrence relation $a_n = 4a_{n-1} - 4a_{n-2}$, the characteristic equation is $r^2 - 4r + [[Blank1]] = 0$. The roots are [[Blank2]].",
    "textWithBlanks": "The characteristic equation is $r^2 - 4r + [[Blank1]] = 0$. The roots are [[Blank2]].",
    "answer": [
      "4",
      "2, 2"
    ],
    "explanation": "The characteristic equation is derived by substitution, and its roots determine the solution form."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code for solving a second-order linear homogeneous recurrence relation:",
    "content": "def solve_recurrence(c0, c1, c2, a0, a1):\n  # assuming c0 = 1\n  A = [1, -c2/c1]\n  B = [a0, a1]\n  return A, B",
    "answer": "The bug is in the calculation of A and B. The correct approach involves solving the characteristic equation and applying initial conditions properly.",
    "explanation": "The provided code does not correctly solve the recurrence relation as it misinterprets the relationship between the coefficients and the initial conditions."
  }
]
```