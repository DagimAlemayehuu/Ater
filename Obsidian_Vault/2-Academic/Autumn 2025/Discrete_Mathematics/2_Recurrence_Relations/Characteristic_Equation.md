---
title: Characteristic_Equation
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 17
mode: MATH-PURE
read: false
generated: true
---

# 1. Mental Model
Imagine you're trying to predict how a spring-mass system will behave over time. The characteristic equation is like a secret formula that helps you understand the underlying patterns of the system's oscillations. It's a simple equation that captures the essence of the system's behavior, much like how a single note can define a musical chord.

# 2. Derivation & Logical Trace
The characteristic equation is derived from a [[Linear_Differential_Equation]] of the form `$c_0 \frac{d^2y}{dt^2} + c_1y = 0$`, where `$c_0$` and `$c_1$` are constants. By assuming a solution of the form `$y = e^{rt}$`, we can substitute this into the differential equation and simplify to obtain the characteristic equation `$c_0r + c_1 = 0$`. This equation is a [[Polynomial_Equation]] in `$r$`, and its roots determine the behavior of the system. The solution to the characteristic equation is `$r = -\frac{c_1}{c_0}$`, which is a [[Eigenvalue]] of the system.

# 3. Theorem Constraints & Incompleteness
The characteristic equation is only defined for [[Linear_Time_Invariant]] systems, and its applicability is limited to systems with constant coefficients. If the system has [[Non_Constant_Coefficients]], the characteristic equation may not be sufficient to capture its behavior. Furthermore, the characteristic equation assumes that the system has a [[Single_Input_Single_Output]] (SISO) configuration; for [[Multi_Input_Multi_Output]] (MIMO) systems, a more complex analysis is required. In cases where the characteristic equation has [[Repeated_Roots]], the system's behavior may exhibit [[Non_Distinct_Mode]] responses.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\begin{document}

\section{Characteristic Equation}

Given a linear differential equation of the form:
$$c_0 \frac{d^2y}{dt^2} + c_1y = 0$$

Assume a solution of the form:
$$y = e^{rt}$$

Differentiate $y$ with respect to $t$:
$$\frac{dy}{dt} = re^{rt}$$
$$\frac{d^2y}{dt^2} = r^2e^{rt}$$

Substitute $y$ and $\frac{d^2y}{dt^2}$ into the differential equation:
$$c_0r^2e^{rt} + c_1e^{rt} = 0$$

Factor out $e^{rt}$:
$$e^{rt}(c_0r^2 + c_1) = 0$$

Since $e^{rt} \neq 0$, we have:
$$c_0r^2 + c_1 = 0$$

This is the characteristic equation.

\end{document}
```
To read this LaTeX code, start from the top and follow the step-by-step derivation of the characteristic equation. Each section and equation is numbered and clearly defined.

## 5. Walkthrough
Consider a spring-mass system with a differential equation of the form:
$$m\frac{d^2y}{dt^2} + ky = 0$$

where $m = 2$ kg and $k = 8$ N/m.

1. Write down the given differential equation:
$$2\frac{d^2y}{dt^2} + 8y = 0$$

2. Identify the constants $c_0$ and $c_1$:
$$c_0 = 2, c_1 = 8$$

3. Assume a solution of the form $y = e^{rt}$ and substitute into the differential equation:
$$2r^2e^{rt} + 8e^{rt} = 0$$

4. Factor out $e^{rt}$ and simplify:
$$e^{rt}(2r^2 + 8) = 0$$

5. Write down the characteristic equation:
$$2r^2 + 8 = 0$$

6. Solve for $r$:
$$r^2 = -4$$
$$r = \pm 2i$$

The roots of the characteristic equation are $r = \pm 2i$, which indicates that the system will exhibit oscillatory behavior.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the general form of the characteristic equation for a linear differential equation of the form $c_0 \\frac{d^2y}{dt^2} + c_1y = 0$?",
    "options": {
      "A": "$c_0r + c_1 = 0$",
      "B": "$c_0r^2 + c_1 = 0$",
      "C": "$c_0r^2 - c_1 = 0$",
      "D": "$c_0r - c_1 = 0$"
    },
    "answer": "B",
    "explanation": "The characteristic equation is obtained by assuming a solution of the form $y = e^{rt}$ and substituting into the differential equation."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The characteristic equation for a spring-mass system with a differential equation of the form $m\\frac{d^2y}{dt^2} + ky = 0$ is $[[Blank1]] = 0$.",
    "textWithBlanks": "The characteristic equation for a spring-mass system with a differential equation of the form $m\\frac{d^2y}{dt^2} + ky = 0$ is $[[Blank1]] = 0$.",
    "answer": [
      "$mr^2 + k$"
    ],
    "explanation": "The characteristic equation is obtained by assuming a solution of the form $y = e^{rt}$ and substituting into the differential equation."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code:",
    "content": "def characteristic_equation(c0, c1):\n  return c0 * r + c1",
    "answer": "The bug is that the code is missing the squaring of the variable r. The correct code should be:\ndef characteristic_equation(c0, c1, r):\n  return c0 * r**2 + c1",
    "explanation": "The characteristic equation is a quadratic equation in $r$, and the code should reflect this."
  }
]
```