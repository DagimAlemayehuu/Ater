---
title: Recurrence_Relation_Definition
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
Imagine you're on a staircase where each step represents a term in a sequence. A recurrence relation is like a rule that tells you how to calculate the value of the current step based on the values of the previous steps. For example, if you're on step $n$, the rule might tell you that the value of step $n$ is the sum of the values of steps $n-1$ and $n-2$.

# 2. Derivation & Logical Trace
A recurrence relation is defined as an equation that expresses the $n$-th term of a sequence, $a_n$, in terms of one or more previous terms, such as $a_{n-1}$, $a_{n-2}$, ..., $a_{n-k}$. This equation can be represented as `a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k})`, where $f$ is a function that defines the relationship between the terms. The relation is typically defined using [[Initial_Conditions]] and a [[Recursive_Formula]] that involves [[Term_Indexing]]. For instance, the Fibonacci sequence can be defined by the recurrence relation `F(n) = F(n-1) + F(n-2)`, with initial conditions `F(0) = 0` and `F(1) = 1`.

# 3. Theorem Constraints & Incompleteness
Recurrence relations can be subject to certain constraints, such as [[Linearity]] or [[Homogeneity]], which affect the form of the solution. For example, a linear homogeneous recurrence relation has the form `a_n = c_1 * a_{n-1} + ... + c_k * a_{n-k}`, where $c_i$ are constants. The solution to a recurrence relation may also be subject to [[Boundary_Conditions]], which specify the values of the sequence at certain indices. If these conditions are not properly specified, the solution to the recurrence relation may be [[Underdetermined]], leading to multiple possible solutions. Furthermore, some recurrence relations may not have a [[Closed-Form_Solution]], requiring instead an [[Approximate_Solution]] or a [[Numerical_Method]] to solve.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Recurrence Relation Definition}

A recurrence relation is defined as an equation that expresses the $n$-th term of a sequence, $a_n$, in terms of one or more previous terms, such as $a_{n-1}$, $a_{n-2}$, ..., $a_{n-k}$.

\subsection{Definition}

Let $a_n$ be a sequence of terms. A recurrence relation is an equation of the form:

$$a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k})$$

where $f$ is a function that defines the relationship between the terms.

\subsection{Example}

The Fibonacci sequence can be defined by the recurrence relation:

$$F(n) = F(n-1) + F(n-2)$$

with initial conditions:

$$F(0) = 0$$
$$F(1) = 1$$

\end{document}
```

To read this LaTeX code: This is a step-by-step formal proof of the definition of a recurrence relation. The code first defines a recurrence relation as an equation expressing the $n$-th term of a sequence in terms of previous terms. It then provides an example using the Fibonacci sequence.

## 5. Walkthrough
Here's a rigorous, multi-step exam scenario applying the concept of recurrence relations:

1. **Problem Statement**: Consider a sequence defined by the recurrence relation `a_n = 2 * a_{n-1} + 3 * a_{n-2}` with initial conditions `a_0 = 1` and `a_1 = 2`.
2. **Calculate `a_2`**: Using the recurrence relation, we can calculate `a_2` as `a_2 = 2 * a_1 + 3 * a_0 = 2 * 2 + 3 * 1 = 4 + 3 = 7`.
3. **Calculate `a_3`**: Using the recurrence relation again, we can calculate `a_3` as `a_3 = 2 * a_2 + 3 * a_1 = 2 * 7 + 3 * 2 = 14 + 6 = 20`.
4. **Calculate `a_4`**: Using the recurrence relation once more, we can calculate `a_4` as `a_4 = 2 * a_3 + 3 * a_2 = 2 * 20 + 3 * 7 = 40 + 21 = 61`.
5. **Verify the sequence**: The sequence so far is `1, 2, 7, 20, 61, ...`.

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
      "A": "An equation expressing the $n$-th term of a sequence in terms of previous terms",
      "B": "An equation expressing the $n$-th term of a sequence in terms of future terms",
      "C": "An equation expressing the $n$-th term of a sequence in terms of random variables",
      "D": "An equation expressing the $n$-th term of a sequence in terms of constants only"
    },
    "answer": "A",
    "explanation": "A recurrence relation is an equation that expresses the $n$-th term of a sequence in terms of one or more previous terms."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The recurrence relation for the Fibonacci sequence is $F(n) = [[Blank1]] + F(n-2)$ with initial conditions $F(0) = 0$ and $F(1) = 1$.",
    "textWithBlanks": "The recurrence relation for the Fibonacci sequence is $F(n) = [[Blank1]] + F(n-2)$ with initial conditions $F(0) = 0$ and $F(1) = 1$.",
    "answer": [
      "F(n-1)"
    ],
    "explanation": "The Fibonacci sequence is defined by the recurrence relation $F(n) = F(n-1) + F(n-2)$."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code for calculating the $n$-th term of a sequence defined by a recurrence relation.",
    "content": "def calculate_nth_term(n):\n  if n == 0:\n    return 1\n  elif n == 1:\n    return 2\n  else:\n    return 2 * calculate_nth_term(n-1) + 3 * calculate_nth_term(n)",
    "answer": "The bug is in the line 'return 2 * calculate_nth_term(n-1) + 3 * calculate_nth_term(n)'. It should be 'return 2 * calculate_nth_term(n-1) + 3 * calculate_nth_term(n-2)'.",
    "explanation": "The code has an incorrect recursive call which leads to a stack overflow error."
  }
]
```