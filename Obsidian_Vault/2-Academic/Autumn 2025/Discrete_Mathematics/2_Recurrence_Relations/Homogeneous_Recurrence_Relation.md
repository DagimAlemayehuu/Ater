---
title: Homogeneous_Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 13
mode: MATH-PURE
read: false
generated: true
prerequisites:
- "[[Linear_Recurrence_Relation]]"
---

# 1. Mental Model
Imagine you have a staircase with an infinite number of steps, and you want to calculate the height of each step. A homogeneous recurrence relation is like a rule that says "the height of each step is determined by the heights of a fixed number of previous steps, and there's no external influence (like a varying force) affecting the heights". For example, if the rule is that each step's height is the sum of the heights of the two steps immediately before it, that's a homogeneous recurrence relation.

# 2. Derivation & Logical Trace
A homogeneous recurrence relation is a [[Recurrence_Relation]] of the form `$f(n) = a_1f(n-1) + a_2f(n-2) + \ldots + a_kf(n-k)$`, where `$a_1, a_2, \ldots, a_k$` are constants. This relation is called homogeneous because the [[Forcing_Function]] `$f(n)$` on the right-hand side is identically zero, implying that the sequence's evolution depends solely on its initial values and the [[Characteristic_Equation]] of the relation. The solution to such a relation typically involves finding the [[Root]] of the characteristic equation, which is obtained by substituting `$f(n) = r^n$` into the recurrence relation. The general solution is then constructed from the [[Linear_Independence]] of the solutions corresponding to these roots.

# 3. Theorem Constraints & Incompleteness
The existence and uniqueness of solutions to a homogeneous recurrence relation depend on the specification of initial conditions, typically `$f(0), f(1), \ldots, f(k-1)$`. The relation is [[Well-Posed]] if these initial conditions are provided. However, if the characteristic equation has [[Multiple_Roots]], the solution involves [[Generalized_Forms]] of the solutions, which can lead to [[Incompleteness]] in the solution space if not properly accounted for. Furthermore, the solution may involve [[Complex_Numbers]] if the roots of the characteristic equation are not real, which requires careful consideration of [[Convergence]] properties.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Proof of Homogeneous Recurrence Relation}

Given a homogeneous recurrence relation of the form:
$$f(n) = a_1f(n-1) + a_2f(n-2) + \ldots + a_kf(n-k)$$

We aim to prove that the solution involves finding the roots of the characteristic equation.

\subsection{Step 1: Define the Characteristic Equation}

The characteristic equation is obtained by substituting $f(n) = r^n$ into the recurrence relation:
$$r^n = a_1r^{n-1} + a_2r^{n-2} + \ldots + a_kr^{n-k}$$

\subsection{Step 2: Simplify the Characteristic Equation}

Dividing through by $r^{n-k}$, we get:
$$r^k = a_1r^{k-1} + a_2r^{k-2} + \ldots + a_k$$

\subsection{Step 3: Solve for the Roots}

The characteristic equation is a $k$-degree polynomial equation:
$$r^k - a_1r^{k-1} - a_2r^{k-2} - \ldots - a_k = 0$$

Let $r_1, r_2, \ldots, r_k$ be the roots of this equation.

\subsection{Step 4: Construct the General Solution}

The general solution to the homogeneous recurrence relation is:
$$f(n) = c_1r_1^n + c_2r_2^n + \ldots + c_kr_k^n$$

where $c_1, c_2, \ldots, c_k$ are constants determined by the initial conditions.

\end{document}
```
To read this LaTeX code, start from the top and follow the section headings. Each subsection represents a step in the formal proof, with the characteristic equation defined, simplified, and solved, and finally, the general solution constructed.

## 5. Walkthrough
Here's a rigorous, multi-step exam scenario applying the concept of homogeneous recurrence relations:

1. **Define the Problem**: Consider a sequence defined by the homogeneous recurrence relation $f(n) = 2f(n-1) + 3f(n-2)$ with initial conditions $f(0) = 1$ and $f(1) = 2$.

2. **Formulate the Characteristic Equation**: Substitute $f(n) = r^n$ into the recurrence relation to obtain the characteristic equation:
$$r^2 = 2r + 3$$

3. **Solve the Characteristic Equation**: Rearrange and solve for $r$:
$$r^2 - 2r - 3 = 0$$
$$(r - 3)(r + 1) = 0$$
Thus, $r_1 = 3$ and $r_2 = -1$.

4. **Construct the General Solution**: The general solution is:
$$f(n) = c_1(3)^n + c_2(-1)^n$$

5. **Apply Initial Conditions**: Use $f(0) = 1$ and $f(1) = 2$ to find $c_1$ and $c_2$:
- For $n = 0$: $1 = c_1 + c_2$
- For $n = 1$: $2 = 3c_1 - c_2$

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the form of a homogeneous recurrence relation?",
    "options": {
      "A": "$f(n) = a_1f(n-1) + a_2f(n-2) + \\ldots + a_kf(n-k)$",
      "B": "$f(n) = a_1f(n-1) + a_2f(n-2) + \\ldots + a_kf(n-k) + g(n)$",
      "C": "$f(n) = a_1f(n-1) \\cdot a_2f(n-2) \\cdot \\ldots \\cdot a_kf(n-k)$",
      "D": "$f(n) = a_1f(n-1) - a_2f(n-2) - \\ldots - a_kf(n-k)$"
    },
    "answer": "A",
    "explanation": "A homogeneous recurrence relation is defined by a linear combination of previous terms without an external function."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The characteristic equation for the recurrence relation $f(n) = 2f(n-1) + 3f(n-2)$ is [[Blank1]].",
    "textWithBlanks": "The characteristic equation for the recurrence relation $f(n) = 2f(n-1) + 3f(n-2)$ is $r^2 - [[Blank1]]r - [[Blank2]] = 0$.",
    "answer": [
      "2",
      "3"
    ],
    "explanation": "The characteristic equation is derived by substituting $f(n) = r^n$ into the recurrence relation."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code for solving a homogeneous recurrence relation.",
    "content": "def solve_recurrence(n, a1, a2, c1, c2):\nr = [3, -1]\nreturn c1 * (r[0] ** n) + c2 * (r[1] ** n)",
    "answer": "The bug is that the function does not use the provided coefficients $a_1$ and $a_2$ to compute the roots of the characteristic equation. It assumes fixed roots [3, -1].",
    "explanation": "The correct approach should involve calculating the roots based on $a_1$ and $a_2$."
  }
]
```