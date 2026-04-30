---
title: First_Order_Linear_Homogeneous_Recurrence_Relation
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
prerequisites:
- "[[Linear_Recurrence_Relation]]"
---

# 1. Mental Model
Imagine you have a savings account where the amount of money you have at the end of each month is determined by how much you had the previous month. A first-order linear homogeneous recurrence relation is like a simple rule that calculates the new amount based only on the previous month's amount, with no external factors like deposits or withdrawals. For example, if you have a rule that says you'll have half the amount next month, it can be represented as `an = 0.5 * an-1`.

# 2. Derivation & Logical Trace
The general form of a first-order linear homogeneous recurrence relation is given by `c0*an + c1*an-1 = 0`. To derive the solution, we first rearrange the equation to isolate `an`, yielding `an = -c1/c0 * an-1`. Let's denote `-c1/c0` as `r`, so `an = r * an-1`. This shows that each term is obtained by multiplying the previous term by a constant `r`. The solution to this recurrence relation can be expressed as `an = a0 * r^n`, where `a0` is the initial condition. This solution can be verified by substitution into the original equation, demonstrating a [[Characteristic_Equation]] with a single [[Root]] that leads to a [[Geometric_Progression]].

# 3. Theorem Constraints & Incompleteness
The first-order linear homogeneous recurrence relation `c0*an + c1*an-1 = 0` has a solution that depends on the [[Initial_Condition]] `a0` and the [[Characteristic_Root]] `r = -c1/c0`. A critical constraint is that `c0` cannot be zero, or the relation would not be first-order. If `c0 = 0` and `c1 = 0`, the relation is undefined. The solution `an = a0 * r^n` assumes that `r` is a constant, which is valid as long as `c0` and `c1` are constant coefficients. The relation does not directly account for [[Boundary_Conditions]] beyond the initial condition `a0`, making it essential to specify `a0` to obtain a unique solution.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{First-Order Linear Homogeneous Recurrence Relation}

Given: $c_0a_n + c_1a_{n-1} = 0$

\subsection*{Step 1: Rearrange the Equation}
Rearrange to isolate $a_n$: $a_n = -\frac{c_1}{c_0}a_{n-1}$

\subsection*{Step 2: Define the Characteristic Root}
Let $r = -\frac{c_1}{c_0}$. Then, $a_n = ra_{n-1}$.

\subsection*{Step 3: Express the Solution}
The solution has the form $a_n = a_0r^n$, where $a_0$ is the initial condition.

\subsection*{Step 4: Verify the Solution}
Substitute $a_n = a_0r^n$ into the original equation:
$c_0(a_0r^n) + c_1(a_0r^{n-1}) = 0$

Simplifying yields:
$a_0r^{n-1}(c_0r + c_1) = 0$

Since $a_0r^{n-1} \neq 0$ for all $n$, we must have:
$c_0r + c_1 = 0$

Solving for $r$ gives:
$r = -\frac{c_1}{c_0}$

\subsection*{Conclusion}
The solution $a_n = a_0r^n$ satisfies the recurrence relation, where $r = -\frac{c_1}{c_0}$.

\end{document}
```
To read this LaTeX code: This is a step-by-step formal proof of the solution to a first-order linear homogeneous recurrence relation. Each section represents a step in deriving and verifying the solution.

## 5. Walkthrough
Consider the recurrence relation: $a_n = 2a_{n-1}$ with initial condition $a_0 = 3$.

### Steps:
1. **Identify the Characteristic Root**: Here, $r = 2$.
2. **Express the Solution**: The solution is of the form $a_n = a_0 \cdot 2^n$.
3. **Apply Initial Condition**: With $a_0 = 3$, we have $a_n = 3 \cdot 2^n$.
4. **Verify for $n=1$**: $a_1 = 3 \cdot 2^1 = 6$. Using the recurrence relation: $a_1 = 2a_0 = 2 \cdot 3 = 6$. This matches.
5. **Calculate $a_3$**: Using $a_n = 3 \cdot 2^n$, $a_3 = 3 \cdot 2^3 = 24$.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the general form of a first-order linear homogeneous recurrence relation?",
    "options": {
      "A": "$c_0a_n + c_1a_{n-1} = 0$",
      "B": "$c_0a_n - c_1a_{n-1} = 0$",
      "C": "$c_0a_n = c_1a_{n-1}$",
      "D": "$a_n = c_0a_{n-1} + c_1$"
    },
    "answer": "A",
    "explanation": "The general form is $c_0a_n + c_1a_{n-1} = 0$."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The solution to the recurrence relation $a_n = 3a_{n-1}$ with $a_0 = 2$ is $a_n = 2 \\cdot [[Blank1]]^n$.",
    "textWithBlanks": "The solution to the recurrence relation $a_n = 3a_{n-1}$ with $a_0 = 2$ is $a_n = 2 \\cdot [[Blank1]]^n$.",
    "answer": [
      "3"
    ],
    "explanation": "The characteristic root $r$ is 3."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code/logic.",
    "content": "def recurrence_relation(n):\n  if n == 0:\n    return 1\n  else:\n    return 2 * recurrence_relation(n-1) + 1",
    "answer": "The correct relation should be $a_n = 2a_{n-1}$ without the '+ 1'.",
    "explanation": "The given code implements $a_n = 2a_{n-1} + 1$, not $a_n = 2a_{n-1}$."
  }
]
```