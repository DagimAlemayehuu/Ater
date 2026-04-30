---
title: Sequence_Definition
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 4
mode: MATH-PURE
read: false
generated: true
---

# 1. Mental Model
Imagine you have a toy box where you can put a certain number of toys in a specific order. A sequence definition is like a rule that tells you how to put toys into the box, one at a time, in a specific order, starting from a certain position, like the first toy box. Just like how you can put a specific toy in the first box, a second toy in the second box, and so on.

# 2. Derivation & Logical Trace
A sequence definition is formally derived as a function `f` whose domain is a subset of integers `n ≥ n0`, usually starting at 1, and is often denoted as `f(n) = a_n`. Mechanically, this works by mapping each integer `n` in the domain to a unique element `a_n` in the codomain, utilizing [[Bijective_Function]] properties to ensure a one-to-one correspondence. The sequence is then defined by its [[Recursive_Formula]] or [[Explicit_Formula]], which provides a systematic way to compute each term. The [[Domain_Restriction]] to integers `n ≥ n0` ensures that the sequence is well-defined and can be evaluated.

# 3. Theorem Constraints & Incompleteness
The sequence definition is subject to certain constraints, such as the requirement that the domain is a subset of integers `n ≥ n0`, which implies that the sequence must be [[Well-Ordered]]. Additionally, the sequence may be infinite, in which case it must satisfy certain [[Convergence_Criteria]] to ensure that it behaves predictably. However, not all sequences can be defined by a simple formula, and some may be inherently [[Non-Computable]], limiting our ability to evaluate them. Furthermore, the [[Halting_Problem]] may arise when attempting to determine whether a sequence is well-defined or not.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Sequence Definition}

Given a function $f$ whose domain is a subset of integers $n \geq n_0$, we can define a sequence $\{a_n\}$ as follows:

\begin{align*}
f(n) &= a_n \\
a_n &= f(n)
\end{align*}

\subsection{Proof}

Let $n_0$ be the starting position of the sequence. We can then define the sequence recursively as:

\begin{align*}
a_{n_0} &= f(n_0) \\
a_{n_0 + 1} &= f(n_0 + 1) \\
a_{n_0 + 2} &= f(n_0 + 2) \\
&\vdots
\end{align*}

This recursive definition ensures that each term in the sequence is uniquely determined by the function $f$.

\subsection{Conclusion}

Therefore, we have shown that a sequence definition can be formally derived as a function $f$ whose domain is a subset of integers $n \geq n_0$.

\end{document}
```
To read this LaTeX code, start from the top and follow the logical steps. The proof begins by defining the sequence in terms of the function $f$, and then proceeds to show how each term in the sequence can be uniquely determined using a recursive definition.

## 5. Walkthrough
Here's a step-by-step exam scenario applying the concept of sequence definition:

Suppose we want to define a sequence $\{a_n\}$ that represents the number of students in a class on the $n^{th}$ day of school. We know that there are initially 20 students on the first day, and 5 new students join every day.

1. Define the function $f(n)$ that represents the number of students on the $n^{th}$ day.
2. Determine the starting position $n_0$ of the sequence.
3. Write out the first few terms of the sequence using the recursive definition.
4. Find an explicit formula for the sequence.
5. Evaluate the sequence for $n = 5$.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the primary characteristic of a sequence definition?",
    "options": {
      "A": "It is a function whose domain is a subset of integers $n \\geq n_0$.",
      "B": "It is a function whose domain is a subset of real numbers.",
      "C": "It is a function whose range is a subset of integers.",
      "D": "It is a function whose range is a subset of real numbers."
    },
    "answer": "A",
    "explanation": "A sequence definition is a function whose domain is a subset of integers $n \\geq n_0$, which ensures that the sequence is well-defined and can be evaluated."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The sequence definition is often denoted as $f(n) = [[Blank1]]$.",
    "textWithBlanks": "The sequence definition is often denoted as $f(n) = [[Blank1]]$.",
    "answer": [
      "a_n"
    ],
    "explanation": "The sequence definition is often denoted as $f(n) = a_n$, which provides a systematic way to compute each term."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code",
    "content": "def sequence_definition(n):\n  if n == 1:\n    return 1\n  else:\n    return sequence_definition(n-1) + 2\n  return sequence_definition(n-1)",
    "answer": "Extra return statement",
    "explanation": "The code has an unreachable return statement which will cause a syntax error."
  }
]
```