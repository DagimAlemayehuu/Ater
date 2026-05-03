---
title: Sequence
type: Atomic Note
course: Discrete Mathematics
semester: 2024/25
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
Imagine you have a never-ending staircase where each step has a number on it, starting from a certain step number, say the first step. A sequence is like a rule that assigns a specific number to each step, and you can keep going up the staircase, getting a new number at each step, according to that rule.

# 2. Derivation & Logical Trace
A sequence is formally defined as a function whose domain is a subset of integers $n \geq n_0$, where $n_0$ is typically 1, and the codomain is usually a set of numbers, such as $\mathbb{R}$ or $\mathbb{C}$. Mechanically, this involves [[Function_Application]] where for each input $n$, the sequence outputs a value, often denoted as $a_n$. The sequence can be thought of as a [[Bijective]] mapping from the domain of integers to the range of sequence values, although not all sequences are bijective. The [[Domain_Restriction]] to $n \geq n_0$ ensures that the sequence is well-defined and can be evaluated for all valid inputs.

# 3. Theorem Constraints & Incompleteness
The definition of a sequence imposes certain constraints, such as the requirement that the domain is a subset of integers $n \geq n_0$. Boundary conditions arise when considering the [[Limit_Of_A_Sequence]], which may or may not exist, and the behavior of the sequence as $n$ approaches infinity. Failure states can occur when a sequence is not [[Convergent]], or when it is not [[Well-Formed]], meaning that it does not satisfy certain properties, such as [[Monotonicity]]. Furthermore, the [[Skolemization]] of sequences can lead to incompleteness results, highlighting the limitations of formal systems in describing sequences.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Formal Proof of Sequence Properties}

\subsection{Definition of a Sequence}

A sequence is a function $f: \mathbb{N} \to \mathbb{R}$, where $\mathbb{N}$ is the set of natural numbers and $\mathbb{R}$ is the set of real numbers.

\subsection{Proof of Sequence Properties}

Let $a_n$ be a sequence of real numbers.

\subsubsection{Property 1: Domain Restriction}

The domain of $a_n$ is restricted to $n \geq n_0$, where $n_0$ is a natural number.

\begin{align*}
\forall n \in \mathbb{N}, \exists n_0 \in \mathbb{N} \text{ s.t. } n &\geq n_0 \\
&\downarrow \\
\forall n \in \mathbb{N}, \exists a_n \in \mathbb{R} \text{ s.t. } a_n &\text{ is defined}
\end{align*}

\subsubsection{Property 2: Function Application}

For each input $n$, the sequence outputs a value $a_n$.

\begin{align*}
\forall n \in \mathbb{N}, \exists a_n \in \mathbb{R} \text{ s.t. } a_n &= f(n) \\
&\downarrow \\
\forall n \in \mathbb{N}, \exists a_n \in \mathbb{R} \text{ s.t. } a_n &\text{ is a real number}
\end{align*}

\end{document}
```
To read this LaTeX code, start from the top and follow the logical flow of the proof. The code defines a sequence as a function from natural numbers to real numbers and then proves two properties: domain restriction and function application.

## 5. Walkthrough
Suppose we have a sequence $a_n = 2n + 1$, and we want to evaluate its properties.

1. **Define the sequence**: The given sequence is $a_n = 2n + 1$.
2. **Determine the domain**: The domain of the sequence is all natural numbers $n \geq 1$.
3. **Evaluate the sequence at $n = 3$**: Substitute $n = 3$ into the sequence formula: $a_3 = 2(3) + 1 = 7$.
4. **Check for monotonicity**: To check if the sequence is monotonic, evaluate the difference between consecutive terms: $a_{n+1} - a_n = 2(n+1) + 1 - (2n + 1) = 2 > 0$. Since the difference is positive, the sequence is increasing.
5. **Determine the limit**: To determine the limit of the sequence as $n$ approaches infinity, evaluate $\lim_{n \to \infty} (2n + 1) = \infty$. Since the limit does not exist, the sequence is not convergent.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the definition of a sequence?",
    "options": {
      "A": "A function from natural numbers to real numbers",
      "B": "A function from real numbers to natural numbers",
      "C": "A set of real numbers",
      "D": "A set of natural numbers"
    },
    "answer": "A",
    "explanation": "A sequence is formally defined as a function whose domain is a subset of integers $n \\geq n_0$ and the codomain is usually a set of numbers, such as $\\mathbb{R}$ or $\\mathbb{C}$."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The domain of a sequence $a_n$ is restricted to [[Blank1]]",
    "textWithBlanks": "The domain of a sequence $a_n$ is restricted to [[Blank1]]",
    "answer": [
      "$n \\geq n_0$"
    ],
    "explanation": "The domain restriction to $n \\geq n_0$ ensures that the sequence is well-defined and can be evaluated for all valid inputs."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code",
    "content": "def sequence(n):\n  if n <= 0:\n    return 'undefined'\n  else:\n    return 2 * n - 1",
    "answer": "The bug is that the sequence is not defined for $n = 0$ and the function does not handle non-integer inputs.",
    "explanation": "The given code does not correctly implement a sequence as it does not handle non-integer inputs and returns 'undefined' for $n \\leq 0$ instead of restricting the domain to $n \\geq 1$."
  }
]
```