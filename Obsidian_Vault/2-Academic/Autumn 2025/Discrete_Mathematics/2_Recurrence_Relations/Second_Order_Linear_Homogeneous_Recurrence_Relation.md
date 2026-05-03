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
- "[[Homogeneous_Recurrence_Relation]]"
---

# 1. Mental Model
Imagine you're on a staircase where each step represents a value in a sequence. The height of each step depends on the heights of the two previous steps. The second order linear homogeneous recurrence relation is like a formula that calculates the height of the current step (`$a_n$`) based on the heights of the two preceding steps (`$a_{n-1}$` and `$a_{n-2}$`), using coefficients `$c_0$`, `$c_1$`, and `$c_2$` to weigh their influence.

# 2. Derivation & Logical Trace
The second order linear homogeneous recurrence relation is mechanically defined as `$c_0a_n + c_1a_{n-1} + c_2a_{n-2} = 0$` for `$n \geq 2$`. This equation implies that each term in the sequence is determined by a [[Linear Combination]] of the two preceding terms. The relation can be rearranged to solve for `$a_n$` as `$a_n = -\frac{c_1}{c_0}a_{n-1} - \frac{c_2}{c_0}a_{n-2}$`. The solution to such equations typically involves finding the [[Characteristic Equation]], which is obtained by substituting `$a_n = r^n$` into the recurrence relation, yielding `$c_0r^2 + c_1r + c_2 = 0$`. The roots of this quadratic equation determine the general form of the solution to the recurrence relation, often involving [[Exponential Functions]] or [[Power Series]].

# 3. Theorem Constraints & Incompleteness
The second order linear homogeneous recurrence relation requires that the sequence be defined for at least two initial terms (`$a_0$` and `$a_1$`) to serve as [[Base Cases]] for the recursion. The relation itself does not provide a method for determining these initial conditions, which must be specified separately. If the [[Characteristic Equation]] has distinct roots, the general solution to the recurrence relation is a linear combination of terms formed by these roots. However, if the roots are repeated, the solution involves terms that account for this [[Degenerate Case]], typically including `$n$`-fold [[Multiplicative Factors]]. The failure to specify initial conditions or the miscalculation of the characteristic equation's roots can lead to incorrect solutions or [[Inconsistent Systems]].
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Second Order Linear Homogeneous Recurrence Relation}

Given a sequence $\{a_n\}$ and coefficients $c_0$, $c_1$, $c_2$, the second order linear homogeneous recurrence relation is defined as:
$$c_0a_n + c_1a_{n-1} + c_2a_{n-2} = 0 \quad \text{for } n \geq 2$$

\subsection*{Step 1: Characteristic Equation}
Assume $a_n = r^n$ for some constant $r$. Substituting into the recurrence relation:
$$c_0r^n + c_1r^{n-1} + c_2r^{n-2} = 0$$
Divide through by $r^{n-2}$:
$$c_0r^2 + c_1r + c_2 = 0$$

\subsection*{Step 2: General Solution}
Let $r_1$ and $r_2$ be the roots of the characteristic equation. If $r_1 \neq r_2$, the general solution is:
$$a_n = A(r_1)^n + B(r_2)^n$$
where $A$ and $B$ are constants determined by initial conditions.

\subsection*{Step 3: Initial Conditions}
Given $a_0$ and $a_1$, we can solve for $A$ and $B$:
$$a_0 = A + B$$
$$a_1 = Ar_1 + Br_2$$
Solving this system yields $A$ and $B$.

\end{document}
```
To read this LaTeX code: This is a step-by-step derivation of the solution to a second-order linear homogeneous recurrence relation. It begins with the definition of the recurrence relation, then assumes a solution of the form `$a_n = r^n$` to derive the characteristic equation.

## 5. Walkthrough
Consider the recurrence relation `$a_n = 2a_{n-1} + 3a_{n-2}$` with initial conditions `$a_0 = 1$` and `$a_1 = 2$`.

1. **Identify the Recurrence Relation**: The given recurrence relation is `$a_n - 2a_{n-1} - 3a_{n-2} = 0$`.
2. **Formulate the Characteristic Equation**: Substitute `$a_n = r^n$` into the relation to get `$r^2 - 2r - 3 = 0$`.
3. **Solve the Characteristic Equation**: Factor the quadratic equation to get `$(r - 3)(r + 1) = 0$`, so `$r_1 = 3$` and `$r_2 = -1$`.
4. **General Solution**: The general solution is `$a_n = A(3)^n + B(-1)^n$`.
5. **Apply Initial Conditions**: Using `$a_0 = 1$` and `$a_1 = 2$`, we get:
   - For `$n = 0$`: `$1 = A + B$`
   - For `$n = 1$`: `$2 = 3A - B$`
6. **Solve for A and B**: Solving these equations simultaneously:
   - From `$1 = A + B$` and `$2 = 3A - B$`, adding them gives `$3 = 4A$` or `$A = \frac{3}{4}$`.
   - Substituting `$A = \frac{3}{4}$` into `$1 = A + B$` yields `$B = \frac{1}{4}$`.
7. **Specific Solution**: Therefore, the specific solution to the recurrence relation is `$a_n = \frac{3}{4}(3)^n + \frac{1}{4}(-1)^n$`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the general form of the solution to a second-order linear homogeneous recurrence relation when the characteristic equation has distinct roots?",
    "options": {
      "A": "A linear combination of terms formed by the roots",
      "B": "A single term formed by one of the roots",
      "C": "A product of the roots",
      "D": "A sum of the roots"
    },
    "answer": "A",
    "explanation": "The general solution involves a linear combination of terms formed by the roots of the characteristic equation."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The characteristic equation for the recurrence relation $a_n = 2a_{n-1} + 3a_{n-2}$ is [[Blank1]].",
    "textWithBlanks": "The characteristic equation for the recurrence relation $a_n = 2a_{n-1} + 3a_{n-2}$ is [[Blank1]].",
    "answer": [
      "$r^2 - 2r - 3 = 0$"
    ],
    "explanation": "This is derived by substituting $a_n = r^n$ into the recurrence relation."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code/logic for solving $a_n = 2a_{n-1} + 3a_{n-2}$ with $a_0 = 1$, $a_1 = 2$.",
    "content": "r = [3, -1]; A = 1; B = 1; an = A*(r(1))^n + B*(r(2))^n",
    "answer": "The bug is in the calculation of A and B. The correct approach should involve solving a system of equations derived from initial conditions.",
    "explanation": "The provided code incorrectly assumes A = 1 and B = 1 without using the initial conditions to solve for A and B."
  }
]
```