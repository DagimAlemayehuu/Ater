---
title: Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 10
mode: MATH-PURE
read: false
generated: true
---

# 1. Mental Model
Imagine you're on a staircase where each step represents a term in a sequence. A recurrence relation is like a rule that tells you how to calculate the value of the current step based on the values of the previous steps. For example, if you're on step `n`, the rule might say that the value of step `n` is the sum of the values of steps `n-1` and `n-2`.

# 2. Derivation & Logical Trace
A recurrence relation is formally defined as an equation that expresses `an` in terms of one or more previous terms of the sequence, namely `a0, a1, ..., an-1`, for all integers `n ≥ n0`. This equation can be mechanically represented as `an = f(an-1, an-2, ..., an-k)`, where `f` is a function that combines the previous `k` terms. The solution to the recurrence relation involves finding a [[Closed-Form_Expression]] that satisfies the equation for all `n`. The process of solving a recurrence relation often involves [[Backward_Substitution]] and [[Characteristic_Equation]] techniques to find the [[Homogeneous_Solution]] and [[Particular_Solution]].

# 3. Theorem Constraints & Incompleteness
The constraints on a recurrence relation include specifying the initial conditions `a0, a1, ..., an0-1` and ensuring that the equation is well-defined for all `n ≥ n0`. If the initial conditions are not properly specified, the solution to the recurrence relation may not be unique or may not exist. Moreover, some recurrence relations may not have a [[Closed-Form_Solution]] and may require [[Numerical_Methods]] to approximate the solution. The study of recurrence relations is also closely related to [[Dynamic_Systems]] and [[Linear_Algebra]], which provide a framework for analyzing and solving these equations.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Recurrence Relation Proof}

Let $a_n$ be a sequence defined by the recurrence relation:
\[a_n = 2a_{n-1} + 3a_{n-2}\]

We aim to prove that the solution to this recurrence relation has the form:
\[a_n = A \cdot r_1^n + B \cdot r_2^n\]
where $r_1$ and $r_2$ are the roots of the characteristic equation.

\subsection{Characteristic Equation}

The characteristic equation is obtained by substituting $a_n = r^n$ into the recurrence relation:
\[r^n = 2r^{n-1} + 3r^{n-2}\]

Dividing through by $r^{n-2}$:
\[r^2 = 2r + 3\]
\[r^2 - 2r - 3 = 0\]

\subsection{Solving the Characteristic Equation}

Solving the quadratic equation:
\[(r - 3)(r + 1) = 0\]
\[r_1 = 3, r_2 = -1\]

\subsection{General Solution}

The general solution to the recurrence relation is:
\[a_n = A \cdot 3^n + B \cdot (-1)^n\]

\section{Conclusion}

The solution to the recurrence relation $a_n = 2a_{n-1} + 3a_{n-2}$ is of the form $a_n = A \cdot 3^n + B \cdot (-1)^n$.

\end{document}
```
To read this LaTeX code, start from the top and follow the logical flow. The document begins by stating the recurrence relation and the proposed solution form. It then derives the characteristic equation, solves for its roots, and finally presents the general solution.

## 5. Walkthrough
Consider the recurrence relation:
\[T(n) = 2T(n-1) + n\]
with initial conditions $T(1) = 2$.

### Step-by-Step Solution

1. **Define the Recurrence Relation**: 
\[T(n) = 2T(n-1) + n\]

2. **Guess the Particular Solution**: Assume $T_p(n) = an + b$.

3. **Substitute into the Recurrence Relation**:
\[an + b = 2(a(n-1) + b) + n\]
\[an + b = 2an - 2a + 2b + n\]

4. **Equating Coefficients**:
\[an + b = (2a + 1)n + (2b - 2a)\]

5. **Solve for $a$ and $b$**:
\[a = 2a + 1\]
\[-a = 1\]
\[a = -1\]
\[b = 2b - 2a\]
\[b = 2b + 2\]
\[-b = 2\]
\[b = -2\]

6. **Particular Solution**: 
\[T_p(n) = -n - 2\]

7. **Homogeneous Solution**: 
\[T_h(n) = C \cdot 2^n\]

8. **General Solution**:
\[T(n) = T_h(n) + T_p(n) = C \cdot 2^n - n - 2\]

9. **Apply Initial Condition**:
\[T(1) = 2 = C \cdot 2^1 - 1 - 2\]
\[2 = 2C - 3\]
\[2C = 5\]
\[C = \frac{5}{2}\]

10. **Final Solution**:
\[T(n) = \frac{5}{2} \cdot 2^n - n - 2\]

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the form of the solution to a linear homogeneous recurrence relation with constant coefficients?",
    "options": {
      "A": "A \\cdot r_1^n + B \\cdot r_2^n",
      "B": "A \\cdot r^n",
      "C": "A \\cdot n \\cdot r^n",
      "D": "A \\cdot r_1^n \\cdot r_2^n"
    },
    "answer": "A",
    "explanation": "The solution involves roots of the characteristic equation."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "In the recurrence relation $a_n = 3a_{n-1} + 2a_{n-2}$, the characteristic equation is [[Blank1]].",
    "textWithBlanks": "The characteristic equation is $r^2 - [[Blank1]]r - [[Blank2]] = 0$.",
    "answer": [
      "3",
      "2"
    ],
    "explanation": "Derive from the recurrence relation."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code/logic.",
    "content": "def solve_recurrence(n):\n  if n == 1:\n    return 2\n  else:\n    return 2 * solve_recurrence(n-1) + n * 2",
    "answer": "The code does not correctly implement the recurrence relation $T(n) = 2T(n-1) + n$. The term $n*2$ should just be $n$.",
    "explanation": "Correct implementation is crucial for accurate results."
  }
]
```