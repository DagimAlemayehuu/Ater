---
title: Recursive_Definition
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 9
mode: MATH-PURE
read: false
generated: true
---

# 1. Mental Model
Imagine you're trying to define what a "family tree" is. You might say it's a tree where each person has parents, and those parents are also people who have parents, and so on. A recursive definition is like this: it defines something in terms of itself, but with a clear base case that stops the recursion.

# 2. Derivation & Logical Trace
A recursive definition works by specifying a [[Base_Case]] that provides a foundation for the definition, and a [[Recursive_Case]] that defines the concept in terms of itself. The recursive case involves applying a [[Function_Application]] to a smaller instance of the concept, which reduces the problem size until it reaches the base case. This process unfolds through a series of [[Stack_Frames]], each representing a recursive call. The definition is well-formed if it satisfies the conditions of termination and uniqueness.

# 3. Theorem Constraints & Incompleteness
For a recursive definition to be well-defined, it must satisfy certain constraints, including [[Termination_Condition]] and [[Uniqueness_Constraint]]. If these conditions are not met, the definition may lead to [[Non_Termination]] or [[Ambiguity]]. Furthermore, the [[Halting_Problem]] implies that it's impossible to determine in general whether a recursive definition will terminate for all possible inputs. Therefore, careful consideration of boundary conditions and failure states is essential when constructing a recursive definition.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Recursive Definition Proof}

Let $f$ be a function defined recursively as follows:

$$ 
f(x) = 
\begin{cases} 
x & \text{if } x \leq 0 \\
f(f(x-1)) & \text{if } x > 0 
\end{cases}
$$

\subsection*{Base Case}
The base case is when $x \leq 0$. In this case, $f(x) = x$.

\subsection*{Inductive Step}
Assume that for some $k \geq 0$, $f(k) = 0$. We need to show that $f(k+1) = f(f(k))$.

\[
f(k+1) = f(f(k)) = f(0) = 0
\]

\subsection*{Termination Condition}
To prove termination, we observe that $f(x)$ decreases with each recursive call until it reaches the base case.

\end{document}
```

To read this LaTeX code: This is a formal proof that a simple recursive function $f(x)$ terminates. The function is defined in two parts: a base case when $x$ is less than or equal to $0$, and a recursive case when $x$ is greater than $0$. The proof shows that the function decreases with each recursive call until it reaches the base case, ensuring termination.

## 5. Walkthrough
Consider a recursive definition for the factorial function:

$$
\text{factorial}(n) =
\begin{cases}
1 & \text{if } n = 0 \\
n \times \text{factorial}(n-1) & \text{if } n > 0
\end{cases}
$$

Here are the steps to calculate $\text{factorial}(3)$:

1. $\text{factorial}(3) = 3 \times \text{factorial}(2)$
2. $\text{factorial}(2) = 2 \times \text{factorial}(1)$
3. $\text{factorial}(1) = 1 \times \text{factorial}(0)$
4. $\text{factorial}(0) = 1$ (base case)
5. Backtrack: $\text{factorial}(1) = 1 \times 1 = 1$
6. Backtrack: $\text{factorial}(2) = 2 \times 1 = 2$
7. Backtrack: $\text{factorial}(3) = 3 \times 2 = 6$

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is a key component of a recursive definition?",
    "options": {
      "A": "Base Case",
      "B": "Recursive Case",
      "C": "Function Application",
      "D": "All of the above"
    },
    "answer": "D",
    "explanation": "A recursive definition consists of a base case, a recursive case, and function application."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "A recursive definition must satisfy the [[Blank1]] condition to ensure that the recursion stops.",
    "textWithBlanks": "A recursive definition must satisfy the [[Blank1]] condition to ensure that the recursion stops.",
    "answer": [
      "Termination"
    ],
    "explanation": "The termination condition is crucial for a recursive definition to prevent infinite loops."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the recursive function.",
    "content": "def factorial(n):\n  if n == 0:\n    return 1\n  else:\n    return n * factorial(n)",
    "answer": "The function does not decrement $n$ in the recursive call, leading to infinite recursion.",
    "explanation": "The recursive call should be with $n-1$, not $n$, to ensure termination."
  }
]
```