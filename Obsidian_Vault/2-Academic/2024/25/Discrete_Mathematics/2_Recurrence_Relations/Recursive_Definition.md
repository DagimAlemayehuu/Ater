---
title: "Recursive_Definition"
type: "Atomic Note"
course: "Discrete Mathematics"
semester: "2024/25"
unit: "2"
hub:
  - "2_Recurrence_Relations_Hub"
source:
  - "2_Recurrence_Relations.Pdf"
source_pages:
  - "9"
mode: "MATH-PURE"
read: true
generated: true
---

# 1. Mental Model
Imagine you want to define a function that calculates the factorial of a number. A recursive definition would be like saying "to calculate the factorial of a number, multiply it by the factorial of the number minus one, and to calculate the factorial of the number minus one, use the same rule until you get to the factorial of 1, which is 1". This is similar to a set of Russian nesting dolls, where each doll is defined in terms of a smaller doll of the same type.

# 2. Derivation & Logical Trace
A recursive definition works mechanically by using a [[Base_Case]] to terminate the recursion and a [[Recursive_Case]] that calls itself with a smaller input. The process unfolds by applying the recursive rule to the input, generating a new instance of the function with a smaller input, until the base case is reached. The [[Call_Stack]] keeps track of the active subroutines, allowing the function to return values back up the chain. The recursive definition relies on [[Referential_Transparency]], where the output of the function depends only on its input and not on any side effects. The recursive function can be defined using a [[Fixed-Point_Operator]], which allows the function to be defined in terms of itself.

# 3. Theorem Constraints & Incompleteness
A recursive definition must satisfy certain constraints to be well-formed, including a [[Base_Case]] that provides a termination condition and a [[Recursive_Case]] that makes progress towards the base case. If the recursive definition is not well-formed, it may lead to [[Non_Termination]] or [[Stack_Overflow]]. Additionally, recursive definitions can be subject to the [[Halting_Problem]], which states that it is undecidable whether a given recursive function will halt for a given input. To mitigate these risks, recursive definitions must be carefully crafted to ensure that they are [[Total]] and [[Correct]], meaning that they always terminate and produce the correct result.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Recursive Definition of Factorial}

Let $f(n)$ be the factorial function defined recursively as:
\begin{align*}
f(0) &= 1 \tag{Base Case} \\
f(n) &= n \cdot f(n-1) \tag{Recursive Case}
\end{align*}

\section{Proof of Correctness}

We want to prove that $f(n) = n!$ for all $n \geq 0$.

\subsection{Base Case}

For $n = 0$, we have:
\begin{align*}
f(0) &= 1 \\
&= 0! \\
&= 1
\end{align*}

\subsection{Inductive Step}

Assume that $f(k) = k!$ for some $k \geq 0$. We want to show that $f(k+1) = (k+1)!$.

\begin{align*}
f(k+1) &= (k+1) \cdot f(k) \\
&= (k+1) \cdot k! \\
&= (k+1)! \\
\end{align*}

\section{Conclusion}

By mathematical induction, we have shown that $f(n) = n!$ for all $n \geq 0$.

\end{document}
```

To read this LaTeX code, start from the top and follow the logical flow. The document begins by defining the recursive factorial function, then proceeds to prove its correctness using mathematical induction. The base case and inductive step are clearly marked.

## 5. Walkthrough
Here's a step-by-step exam scenario applying the concept of recursive definition:

Suppose we want to calculate the factorial of 4 using a recursive function.

1. We start with the input `n = 4`.
2. The function calls itself with `n-1 = 3`, so we have `f(4) = 4 * f(3)`.
3. The function calls itself with `n-1 = 2`, so we have `f(3) = 3 * f(2)`.
4. The function calls itself with `n-1 = 1`, so we have `f(2) = 2 * f(1)`.
5. The function calls itself with `n-1 = 0`, so we have `f(1) = 1 * f(0)`.
6. The base case is reached, `f(0) = 1`.
7. Now, we start returning values back up the chain:
	* `f(1) = 1 * 1 = 1`.
	* `f(2) = 2 * 1 = 2`.
	* `f(3) = 3 * 2 = 6`.
	* `f(4) = 4 * 6 = 24`.

The final result is `f(4) = 24`, which is the correct factorial of 4.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the primary characteristic of a recursive definition?",
    "options": {
      "A": "It uses a loop to iterate over a sequence.",
      "B": "It defines a function in terms of itself.",
      "C": "It uses a fixed-point operator to define a function.",
      "D": "It relies on side effects to produce output."
    },
    "answer": "B",
    "explanation": "A recursive definition defines a function in terms of itself."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "A recursive function must have a [[Base_Case]] that provides a [[Termination_Condition]] and a [[Recursive_Case]] that makes progress towards the [[Base_Case]].",
    "textWithBlanks": "The [[Base_Case]] does [[Termination_Condition]] and the [[Recursive_Case]] makes progress towards the [[Base_Case]].",
    "answer": [
      "termination condition",
      "base case"
    ],
    "explanation": "A recursive function must have a base case that provides a termination condition."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the recursive function.",
    "content": "def factorial(n):\n  if n == 0:\n    return 1\n  else:\n    return n * factorial(n)",
    "answer": "The bug is that the recursive call is made with the same value of n, causing infinite recursion. The correct code should be 'return n * factorial(n-1)'.",
    "explanation": "The bug causes a stack overflow due to infinite recursion."
  }
]
```