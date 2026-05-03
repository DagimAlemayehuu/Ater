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
- "[[Homogeneous_Recurrence_Relation]]"
---

# 1. Mental Model
Imagine you have a savings account where the amount of money you have at the end of each month is determined by the amount you had the previous month. A first-order linear homogeneous recurrence relation is like a simple rule that calculates the new amount based only on the previous month's amount, with no external factors like deposits or withdrawals. For example, if you have a rule that says you have 80% of the money you had last month, that's a first-order linear homogeneous recurrence relation.

# 2. Derivation & Logical Trace
The general form of a first-order linear homogeneous recurrence relation is given by `$c_0a_n + c_1a_{n-1} = 0$`. To derive the solution, we first assume that the solution has the form `$a_n = r^n$`. Substituting this into the recurrence relation gives `$c_0r^n + c_1r^{n-1} = 0$`. Factoring out `$r^{n-1}$` yields `$r^{n-1}(c_0r + c_1) = 0$`. Since `$r^{n-1}$` cannot be zero for all `$n$`, we must have `$c_0r + c_1 = 0$`. Solving for `$r$` gives the [[Characteristic_ Equation]] `$r = -\frac{c_1}{c_0}$`. The solution to the recurrence relation is then `$a_n = A \cdot r^n$`, where `$A$` is a constant determined by the [[Initial_Condition]].

# 3. Theorem Constraints & Incompleteness
The solution to the first-order linear homogeneous recurrence relation `$c_0a_n + c_1a_{n-1} = 0$` assumes that the [[Characteristic_Equation]] has a non-repeated root. If the characteristic equation has a repeated root, the solution form changes to `$a_n = A \cdot r^n + B \cdot n \cdot r^n$`. The solution also relies on the existence of [[Initial_Conditions]] to determine the constant `$A$`. Without a valid initial condition, the solution remains incomplete. Furthermore, the solution assumes that `$c_0 \neq 0$` and `$c_1 \neq 0$`; if either coefficient is zero, the recurrence relation reduces to a simpler form.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\begin{document}

\section{First-Order Linear Homogeneous Recurrence Relation}

Given: $c_0a_n + c_1a_{n-1} = 0$

\subsection*{Step 1: Assume a Solution of the Form $a_n = r^n$}

Substitute $a_n = r^n$ into the recurrence relation:
$c_0r^n + c_1r^{n-1} = 0$

\subsection*{Step 2: Derive the Characteristic Equation}

Factor out $r^{n-1}$:
$r^{n-1}(c_0r + c_1) = 0$

Since $r^{n-1}$ cannot be zero for all $n$, we must have:
$c_0r + c_1 = 0$

Solving for $r$ gives the characteristic equation:
$r = -\frac{c_1}{c_0}$

\subsection*{Step 3: General Solution}

The solution to the recurrence relation is:
$a_n = A \cdot r^n$

where $A$ is a constant determined by the initial condition.

\end{document}
```
To read this LaTeX code: This is a step-by-step formal proof of the solution to a first-order linear homogeneous recurrence relation. Each section represents a step in the derivation, from assuming a solution form to deriving the characteristic equation and general solution.

## 5. Walkthrough
Consider the recurrence relation: $a_n = 0.8a_{n-1}$ with initial condition $a_0 = 100$.

### Steps:

1. **Identify the Recurrence Relation**: The given recurrence relation is $a_n = 0.8a_{n-1}$. This can be rewritten as $a_n - 0.8a_{n-1} = 0$.

2. **Derive the Characteristic Equation**: Comparing with the general form $c_0a_n + c_1a_{n-1} = 0$, we have $c_0 = 1$ and $c_1 = -0.8$. The characteristic equation is $r - 0.8 = 0$.

3. **Solve the Characteristic Equation**: Solving $r - 0.8 = 0$ gives $r = 0.8$.

4. **General Solution**: The general solution to the recurrence relation is $a_n = A \cdot (0.8)^n$.

5. **Apply Initial Condition**: Given $a_0 = 100$, we substitute $n = 0$ into the general solution to find $A$: $100 = A \cdot (0.8)^0$. This simplifies to $A = 100$.

6. **Specific Solution**: Therefore, the specific solution to the recurrence relation with the given initial condition is $a_n = 100 \cdot (0.8)^n$.

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
      "C": "$c_0a_n + c_1a_n = 0$",
      "D": "$c_0a_{n-1} + c_1a_n = 0$"
    },
    "answer": "A",
    "explanation": "The general form is $c_0a_n + c_1a_{n-1} = 0$, which defines a first-order linear homogeneous recurrence relation."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The solution to the recurrence relation $a_n = 2a_{n-1}$ with initial condition $a_0 = 5$ is $a_n = [[Blank1]] \\cdot 2^n$.",
    "textWithBlanks": "The solution to the recurrence relation $a_n = 2a_{n-1}$ with initial condition $a_0 = 5$ is $a_n = [[Blank1]] \\cdot 2^n$.",
    "answer": [
      "5"
    ],
    "explanation": "Given $a_n = 2a_{n-1}$, the characteristic equation is $r = 2$. With $a_0 = 5$, the solution is $a_n = 5 \\cdot 2^n$."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code for solving $a_n = 0.8a_{n-1}$ with $a_0 = 100$.",
    "content": "def solve_recurrence(n):\n  A = 100\n  return A * (0.8 ** (n - 1))",
    "answer": "The bug is in the line 'return A * (0.8 ** (n - 1))'. It should be 'return A * (0.8 ** n)' because the formula for $a_n$ does not shift $n$ by 1.",
    "explanation": "The corrected code should directly calculate $a_n = 100 \\cdot (0.8)^n$ without subtracting 1 from $n$."
  }
]
```