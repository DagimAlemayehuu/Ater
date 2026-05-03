---
title: Recursive_Definition
type: Atomic Note
course: Discrete Mathematics
semester: 2024/25
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
Imagine you want to define a function that calculates the factorial of a number. A recursive definition would be like saying "to calculate the factorial of a number, multiply it by the factorial of the number minus one, and to calculate the factorial of the number minus one, use the same rule until you get to the factorial of 1, which is 1". This is similar to a set of Russian nesting dolls, where each doll is defined in terms of a smaller doll of the same type.

# 2. Derivation & Logical Trace
A recursive definition works mechanically by using a [[Base_Case]] to terminate the recursion and a [[Recursive_Case]] that calls itself with a smaller input. The process unfolds by applying the recursive rule to the input, generating a new instance of the function with a reduced problem size, until the base case is reached. The [[Stack_Frame]] is used to store the state of each recursive call, allowing the function to return to previous states and combine the results. The definition of a recursive function typically involves [[Pattern_Matching]] to determine which case to apply. For example, the factorial function can be defined recursively as `fact(n) = n * fact(n-1)` with a base case of `fact(1) = 1`.

# 3. Theorem Constraints & Incompleteness
Recursive definitions are subject to certain constraints, such as ensuring that the recursive case eventually reaches the base case, to avoid [[Infinite_Recursion]]. Additionally, the definition must be [[Well-Defined]] and [[Total]], meaning that it must be possible to apply the definition to any input and obtain a result. However, recursive definitions can also lead to [[Incompleteness_Theorems]], which state that there may be statements that cannot be proved or disproved within a formal system. For instance, the recursive definition of a function may not be able to compute a value for certain inputs, highlighting the need for careful consideration of the domain and range of the function.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Recursive Definition of Factorial}

Let $n$ be a positive integer. The factorial function $\text{fact}(n)$ can be defined recursively as:

\begin{align*}
\text{fact}(n) &= n \cdot \text{fact}(n-1) \\
\text{fact}(1) &= 1
\end{align*}

\subsection{Proof that $\text{fact}(n)$ is well-defined}

We need to show that $\text{fact}(n)$ is well-defined for all positive integers $n$.

\subsubsection{Base Case}

For $n=1$, $\text{fact}(1) = 1$ by definition.

\subsubsection{Recursive Case}

Assume that $\text{fact}(k)$ is well-defined for some positive integer $k$. We need to show that $\text{fact}(k+1)$ is well-defined.

\begin{align*}
\text{fact}(k+1) &= (k+1) \cdot \text{fact}(k) \\
&= (k+1) \cdot k \cdot \text{fact}(k-1) \\
&\quad \vdots \\
&= (k+1) \cdot k \cdot (k-1) \cdots 2 \cdot 1 \\
&= (k+1)!
\end{align*}

Therefore, $\text{fact}(n)$ is well-defined for all positive integers $n$.

\end{document}
```

To read this LaTeX code, start from the top and follow the logical structure of the proof. The `align*` environment is used to typeset the equations, and the `\subsection` and `\subsubsection` commands are used to organize the proof into sections and subsections.

## 5. Walkthrough
Here's a step-by-step exam scenario applying the concept of recursive definition:

1. Define a recursive function `fib(n)` that calculates the $n$-th Fibonacci number, where $\text{fib}(n) = \text{fib}(n-1) + \text{fib}(n-2)$ with base cases $\text{fib}(0) = 0$ and $\text{fib}(1) = 1$.
2. Calculate $\text{fib}(3)$ using the recursive definition:
	* $\text{fib}(3) = \text{fib}(2) + \text{fib}(1)$
	* $\text{fib}(2) = \text{fib}(1) + \text{fib}(0) = 1 + 0 = 1$
	* $\text{fib}(3) = 1 + 1 = 2$
3. Calculate $\text{fib}(4)$ using the recursive definition:
	* $\text{fib}(4) = \text{fib}(3) + \text{fib}(2)$
	* $\text{fib}(3) = 2$ (from step 2)
	* $\text{fib}(2) = 1$ (from step 2)
	* $\text{fib}(4) = 2 + 1 = 3$
4. Verify that the recursive definition of `fib(n)` is well-defined by checking that the base cases are properly defined and that the recursive case eventually reaches the base case.
5. Consider the limitations of the recursive definition, such as the potential for infinite recursion if the base cases are not properly defined.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the base case for the recursive definition of the factorial function?",
    "options": {
      "A": "fact(n) = n * fact(n-1)",
      "B": "fact(1) = 1",
      "C": "fact(0) = 0",
      "D": "fact(n) = fact(n-1) + fact(n-2)"
    },
    "answer": "B",
    "explanation": "The base case for the recursive definition of the factorial function is fact(1) = 1."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The recursive definition of a function must have a [[Base_Case]] to terminate the recursion and a [[Recursive_Case]] that calls itself with a [[Smaller_Input]].",
    "textWithBlanks": "The [[Base_Case]] does X and the [[Recursive_Case]] does Y",
    "answer": [
      "base_case",
      "recursive_case"
    ],
    "explanation": "A recursive definition works mechanically by using a base case to terminate the recursion and a recursive case that calls itself with a smaller input."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the recursive definition of the factorial function.",
    "content": "fact(n) = n * fact(n)",
    "answer": "The bug is that the recursive case does not call itself with a smaller input, leading to infinite recursion. The correct definition is fact(n) = n * fact(n-1).",
    "explanation": "The recursive definition must call itself with a smaller input to eventually reach the base case."
  }
]
```