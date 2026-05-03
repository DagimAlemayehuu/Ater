---
title: "Characteristic_Equation"
type: "Atomic Note"
course: "Discrete Mathematics"
semester: "2024/25"
unit: "2"
hub: [[2_Recurrence_Relations_Hub]]
source: [[2_Recurrence_Relations.Pdf]]
source_pages:
  - "17"
mode: "MATH-PURE"
read: true
generated: true
prerequisites: [[Linear_Homogeneous_Recurrence_Relation]]
---

# 1. Mental Model
Imagine you're trying to find the resonant frequency of a guitar string. The characteristic equation is like a mathematical string that vibrates at specific frequencies, and solving it helps you find those frequencies. Just as the guitar string's vibrations are determined by its physical properties, the characteristic equation's solutions depend on the coefficients of the polynomial.

# 2. Derivation & Logical Trace
The characteristic equation is derived from a [[Linear_Recurrence_Relation]] of the form $y_k + a_1y_{k-1} + a_2y_{k-2} + \cdots + a_ky = 0$. By substituting $y_k = r^k$ into the recurrence relation, we obtain the characteristic equation `c0*r^k + c1*r^(k-1) + c2*r^(k-2) + ... + ck = 0`. This equation is a [[Polynomial_Equation]] in $r$, and its solutions are the [[Eigenvalues]] of the recurrence relation. The mechanical process involves substituting, rearranging, and factoring the polynomial to obtain the characteristic equation.

# 3. Theorem Constraints & Incompleteness
The characteristic equation's solutions are subject to certain constraints, such as the [[Fundamental_Theorem_Of_Algebra]], which states that a polynomial equation has at least one complex root. However, the equation may have [[Repeated_Roots]], which can lead to [[Generalized_Eigenvectors]] and a more complex solution structure. Additionally, the equation's coefficients must satisfy certain [[Stability_Conditions]] to ensure that the recurrence relation converges. If these conditions are not met, the solution may exhibit [[Unstable_Behavior]].
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Characteristic Equation}

Given a linear recurrence relation of the form:
\[y_k + a_1y_{k-1} + a_2y_{k-2} + \cdots + a_ky = 0\]

We substitute $y_k = r^k$ into the recurrence relation:

\begin{align*}
r^k + a_1r^{k-1} + a_2r^{k-2} + \cdots + a_kr^0 &= 0 \\
r^k \left(1 + a_1r^{-1} + a_2r^{-2} + \cdots + a_kr^{-k} \right) &= 0
\end{align*}

Dividing through by $r^{-k}$, we obtain:

\[r^k + a_1r^{k-1} + a_2r^{k-2} + \cdots + a_k = 0\]

This is the characteristic equation.

\end{document}
```
To read this LaTeX code, start from the top and follow the step-by-step derivation of the characteristic equation. The code begins with a standard LaTeX document class and preamble, then defines the characteristic equation using standard mathematical notation.

## 5. Walkthrough
Here's a rigorous, multi-step exam scenario applying the concept of the characteristic equation:

Suppose we have a linear recurrence relation:
\[y_k = 2y_{k-1} + 3y_{k-2}\]

with initial conditions $y_0 = 1$ and $y_1 = 2$. 

1. Write down the characteristic equation:
The characteristic equation is obtained by substituting $y_k = r^k$ into the recurrence relation:
\[r^k = 2r^{k-1} + 3r^{k-2}\]

2. Rearrange the equation:
\[r^k - 2r^{k-1} - 3r^{k-2} = 0\]

3. Divide through by $r^{k-2}$:
\[r^2 - 2r - 3 = 0\]

4. Solve the quadratic equation:
\[(r - 3)(r + 1) = 0\]
\[r = 3 \text{ or } r = -1\]

5. Write down the general solution:
The general solution to the recurrence relation is:
\[y_k = A(3)^k + B(-1)^k\]

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the characteristic equation of the recurrence relation $y_k = 2y_{k-1} + 3y_{k-2}$?",
    "options": {
      "A": "$r^2 - 2r - 3 = 0$",
      "B": "$r^2 + 2r + 3 = 0$",
      "C": "$r^2 - 2r + 3 = 0$",
      "D": "$r^2 + 2r - 3 = 0$"
    },
    "answer": "A",
    "explanation": "The characteristic equation is obtained by substituting $y_k = r^k$ into the recurrence relation."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The characteristic equation of the recurrence relation $y_k = 4y_{k-1} - 4y_{k-2}$ is $r^2 - [[Blank1]]r + [[Blank2]] = 0$. ",
    "textWithBlanks": "The characteristic equation of the recurrence relation $y_k = 4y_{k-1} - 4y_{k-2}$ is $r^2 - [[Blank1]]r + [[Blank2]] = 0$. ",
    "answer": [
      "4",
      "4"
    ],
    "explanation": "The characteristic equation is obtained by substituting $y_k = r^k$ into the recurrence relation."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code:",
    "content": "def characteristic_equation(a, b):\n  return $r^2 + ar + b = 0$\nprint(characteristic_equation(2, 3))",
    "answer": "The bug is that the function is trying to return a mathematical equation as a string, but it's not properly formatted. The correct implementation should be",
    "explanation": "The bug is in the return statement of the function. The correct implementation should use Python's string formatting to insert the values of a and b into the equation."
  }
]
```