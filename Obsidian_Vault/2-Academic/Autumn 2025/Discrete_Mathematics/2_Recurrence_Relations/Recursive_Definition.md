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
Imagine you want to define a function that calculates the factorial of a number. A recursive definition would be like saying "to calculate the factorial of a number, multiply it by the factorial of the number minus one, until you get to 1, which is defined as 1". This is similar to a set of Russian nesting dolls, where each doll is defined in terms of a smaller version of itself.

# 2. Derivation & Logical Trace
A recursive definition works mechanically by using a [[Base_Case]] to terminate the recursion and a [[Recursive_Case]] that breaks down the problem into smaller sub-problems of the same type. The process involves applying a [[Reduction_Rule]] to transform the problem into a smaller instance of itself, until the [[Base_Case]] is reached. The solution to the original problem is then constructed by combining the solutions to the sub-problems, often using a [[Stack_Frame]] to keep track of the recursive calls. The recursive definition is typically formalized using a [[Fixed-Point_Operator]], which ensures that the recursive function has a well-defined meaning.

# 3. Theorem Constraints & Incompleteness
Recursive definitions must satisfy certain constraints to be well-formed, such as ensuring that the [[Recursive_Case]] eventually reduces to the [[Base_Case]], and that the [[Reduction_Rule]] is properly defined. Failure to meet these constraints can lead to [[Non_Termination]] or [[Undefinedness]]. Furthermore, recursive definitions can lead to [[Incompleteness]] results, such as Gödel's incompleteness theorems, which show that certain formal systems cannot prove their own consistency. Therefore, recursive definitions must be carefully crafted to avoid such pitfalls and ensure that the defined function or set is well-behaved.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Recursive Definition of Factorial}

Let $f(n)$ be the factorial function defined recursively as:
\begin{align*}
f(0) &= 1 \tag{Base Case} \\
f(n+1) &= (n+1) \cdot f(n) \tag{Recursive Case}
\end{align*}

\section{Proof of Well-Definedness}

We aim to prove that $f(n)$ is well-defined for all $n \in \mathbb{N}$.

\subsection{Base Case}

For $n=0$, $f(0) = 1$ by definition.

\subsection{Recursive Case}

Assume $f(k)$ is well-defined for some $k \in \mathbb{N}$. We must show that $f(k+1)$ is well-defined.

\begin{align*}
f(k+1) &= (k+1) \cdot f(k) \\
&= (k+1) \cdot \text{(well-defined value)} \\
&= \text{well-defined value}
\end{align*}

\section{Conclusion}

By mathematical induction, $f(n)$ is well-defined for all $n \in \mathbb{N}$.

\end{document}
```
To read this LaTeX code: This is a formal proof that the recursive definition of the factorial function is well-defined for all natural numbers. The proof consists of a base case and a recursive case, which together establish that the function is well-defined.

## 5. Walkthrough
Here's a step-by-step exam scenario applying the concept of recursive definition:

1. **Define the problem**: Suppose we want to calculate the factorial of 4 using a recursive definition.
2. **Identify the base case**: The base case is when $n=0$, in which case $f(0) = 1$.
3. **Apply the recursive case**: To calculate $f(4)$, we need to calculate $f(3)$ first.
4. **Calculate $f(3)$**: $f(3) = 3 \cdot f(2)$.
5. **Calculate $f(2)$**: $f(2) = 2 \cdot f(1)$.
6. **Calculate $f(1)$**: $f(1) = 1 \cdot f(0) = 1 \cdot 1 = 1$.

Now, we can work our way back up:

$f(2) = 2 \cdot f(1) = 2 \cdot 1 = 2$

$f(3) = 3 \cdot f(2) = 3 \cdot 2 = 6$

$f(4) = 4 \cdot f(3) = 4 \cdot 6 = 24$

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the base case in a recursive definition?",
    "options": {
      "A": "The recursive formula",
      "B": "The termination condition",
      "C": "The initial condition that stops recursion",
      "D": "The reduction rule"
    },
    "answer": "C",
    "explanation": "The base case is the initial condition that stops recursion."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "In a recursive definition of the factorial function, [[Blank1]] is used to terminate the recursion.",
    "textWithBlanks": "The [[Blank1]] does X",
    "answer": [
      "base case"
    ],
    "explanation": "The base case is used to terminate the recursion."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the recursive definition of the factorial function.",
    "content": "f(n) = n * f(n+1)",
    "answer": "The recursive definition is incorrect. It should be f(n+1) = (n+1) * f(n). The base case f(0) = 1 is also missing.",
    "explanation": "The given recursive definition does not terminate and is not well-defined."
  }
]
```