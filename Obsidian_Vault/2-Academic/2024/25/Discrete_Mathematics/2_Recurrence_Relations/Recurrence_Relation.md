---
title: Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: 2024/25
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

Given a sequence $a_n$ defined by the recurrence relation:
\[ a_n = a_{n-1} + a_{n-2} \]
for $n \geq 2$, with initial conditions $a_0 = 0$ and $a_1 = 1$.

\subsection*{Base Case}
We start with the base case to establish the initial conditions.

\subsection*{Inductive Step}
Assume that for some $k \geq 1$, the statement holds:
\[ a_k = a_{k-1} + a_{k-2} \]

We need to show that:
\[ a_{k+1} = a_k + a_{k-1} \]

Using the recurrence relation:
\[ a_{k+1} = a_k + a_{k-1} \]
which is what we needed to show.

\subsection*{Conclusion}
By mathematical induction, the recurrence relation $a_n = a_{n-1} + a_{n-2}$ holds for all $n \geq 2$.

\end{document}
```
To read this LaTeX code: This is a step-by-step formal proof of a recurrence relation using mathematical induction. The code first defines the sequence and its initial conditions, then proceeds with the base case and inductive step to prove that the relation holds for all $n \geq 2$.

## 5. Walkthrough
Consider the recurrence relation:
\[ T(n) = 2T\left(\frac{n}{2}\right) + n \]
for $n > 1$, with $T(1) = 1$.

### Steps to Solve:
1. **Identify the Recurrence Relation**: The given relation is $T(n) = 2T\left(\frac{n}{2}\right) + n$.
2. **Apply the Master Theorem or Substitution Method**: Here, we opt for substitution for clarity.
3. **Solve for $T(n)$**:
   - Assume $n = 2^k$.
   - Substitute $T(n)$ into itself:
     \[ T(n) = 2T\left(\frac{n}{2}\right) + n = 2\left(2T\left(\frac{n}{4}\right) + \frac{n}{2}\right) + n = 2^2T\left(\frac{n}{4}\right) + 2\frac{n}{2} + n \]
   - Generalizing:
     \[ T(n) = 2^kT(1) + \sum_{i=0}^{k-1} 2^i n \]
   - Since $n = 2^k$, $k = \log_2 n$:
     \[ T(n) = n + n\sum_{i=0}^{\log_2 n - 1} 2^i \]
   - Using the sum of a geometric series $\sum_{i=0}^{m} r^i = \frac{1-r^{m+1}}{1-r}$:
     \[ T(n) = n + n\left(\frac{1-2^{\log_2 n}}{1-2}\right) \]
   - Simplifying:
     \[ T(n) = n + n(2^{\log_2 n} - 1) = n + n(n - 1) = n^2 + n - n = n^2 \]
4. **Conclusion**: $T(n) = n^2$.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is a recurrence relation?",
    "options": {
      "A": "An equation expressing a sequence term using previous terms",
      "B": "A method for solving differential equations",
      "C": "A type of algebraic expression",
      "D": "A numerical method for approximations"
    },
    "answer": "A",
    "explanation": "A recurrence relation is an equation that expresses a term in a sequence as a function of previous terms."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The solution to a recurrence relation often involves finding a [[Blank1]] that satisfies the equation for all $n$.",
    "textWithBlanks": "The solution to a recurrence relation often involves finding a [[Blank1]] that satisfies the equation for all $n$.",
    "answer": [
      "Closed-Form Expression"
    ],
    "explanation": "The solution involves finding a closed-form expression."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code/logic for solving a recurrence relation.",
    "content": "T(n) = T(n/2) + n; assume T(1) = 1; then T(n) = T(n/4) + n/2 + n; conclude T(n) = n",
    "answer": "The bug is in not properly substituting and simplifying the recurrence relation across all levels, leading to an incorrect conclusion of T(n) = n without considering all terms.",
    "explanation": "The provided logic incorrectly concludes T(n) = n without proper substitution and summation of all terms across levels of the recurrence relation."
  }
]
```