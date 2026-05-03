---
title: Characteristic_Equation
type: Atomic Note
course: Discrete Mathematics
semester: 2024/25
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 17
mode: MATH-PURE
read: false
generated: true
prerequisites:
- "[[Linear_Recurrence_Relation]]"
- "[[Homogeneous_Recurrence_Relation]]"
---

# 1. Mental Model
Imagine you're trying to find the resonant frequency of a swing. The characteristic equation is like a secret formula that helps you calculate this frequency. It's a simple equation that captures the essential behavior of the swing, and its solutions tell you how the swing will respond to different inputs.

# 2. Derivation & Logical Trace
The characteristic equation is derived from a [[Linear_Differential_Equation]] of the form `c0*y'' + c1*y' + c2*y = 0`, where `c0`, `c1`, and `c2` are constants. To find the characteristic equation, we assume a solution of the form `y = e^(r*x)`, where `r` is a constant. Substituting this into the differential equation, we get `c0*r^2*e^(r*x) + c1*r*e^(r*x) + c2*e^(r*x) = 0`. Canceling out the `e^(r*x)` term, we're left with the characteristic equation `c0*r^2 + c1*r + c2 = 0`. This is a [[Quadratic_Equation]] in `r`, and its solutions are the [[Eigenvalues]] of the differential equation.

# 3. Theorem Constraints & Incompleteness
The characteristic equation has certain constraints and limitations. For instance, if the [[Discriminant]] of the quadratic equation is negative, the solutions will be complex conjugates, indicating oscillatory behavior. On the other hand, if the discriminant is positive, the solutions will be real and distinct, indicating exponential growth or decay. However, if the discriminant is zero, the solutions will be repeated, leading to a [[Degenerate_Case]]. Furthermore, the characteristic equation assumes that the differential equation has constant coefficients, which may not always be the case in real-world applications.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Characteristic Equation}

Given a linear differential equation of the form:
\[ c_0y'' + c_1y' + c_2y = 0 \]

Assume a solution of the form:
\[ y = e^{rx} \]

Differentiating:
\[ y' = re^{rx} \]
\[ y'' = r^2e^{rx} \]

Substituting into the differential equation:
\[ c_0r^2e^{rx} + c_1re^{rx} + c_2e^{rx} = 0 \]

Canceling out the $e^{rx}$ term:
\[ c_0r^2 + c_1r + c_2 = 0 \]

This is the characteristic equation.

\end{document}
```
To read this LaTeX code: This is a step-by-step derivation of the characteristic equation, starting with a linear differential equation and assuming a solution of the form `y = e^(rx)`. The code then differentiates and substitutes into the differential equation to obtain the characteristic equation.

## 5. Walkthrough
Here's a rigorous, multi-step exam scenario applying the concept of the characteristic equation:

1. Consider a mass-spring system with a differential equation of the form: `m*x'' + b*x' + k*x = 0`, where `m = 1`, `b = 5`, and `k = 6`.
2. Write down the characteristic equation: `r^2 + 5*r + 6 = 0`.
3. Solve the characteristic equation: `(r + 2)*(r + 3) = 0`, so `r1 = -2` and `r2 = -3`.
4. Write down the general solution: `x(t) = c1*e^(-2*t) + c2*e^(-3*t)`.
5. Determine the behavior of the system: Since both eigenvalues are negative, the system is overdamped and will decay exponentially to zero.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the characteristic equation for a differential equation of the form $y'' + 3y' + 2y = 0$?",
    "options": {
      "A": "$r^2 + 3r + 2 = 0$",
      "B": "$r^2 - 3r - 2 = 0$",
      "C": "$r^2 + 2r + 3 = 0$",
      "D": "$r^2 - 2r - 3 = 0$"
    },
    "answer": "A",
    "explanation": "The characteristic equation is obtained by substituting $y = e^{rx}$ into the differential equation."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The characteristic equation for a differential equation of the form $2y'' + 4y' + 3y = 0$ is [[Blank1]].",
    "textWithBlanks": "The characteristic equation for a differential equation of the form $2y'' + 4y' + 3y = 0$ is $[[Blank1]] = 0$.",
    "answer": [
      "2r^2 + 4r + 3"
    ],
    "explanation": "The characteristic equation is obtained by substituting $y = e^{rx}$ into the differential equation and canceling out the $e^{rx}$ term."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code:",
    "content": "def characteristic_equation(c0, c1, c2):\n  return c0*r^2 + c1*r + c2",
    "answer": "The bug is that the variable 'r' is not defined. The correct code should be: def characteristic_equation(c0, c1, c2, r):\n  return c0*r**2 + c1*r + c2",
    "explanation": "The variable 'r' should be defined as a parameter of the function or as a symbolic variable."
  }
]
```