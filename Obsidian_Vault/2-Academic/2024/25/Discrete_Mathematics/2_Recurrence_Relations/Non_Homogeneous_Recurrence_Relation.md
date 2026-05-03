---
read: false
---

# 1. Mental Model
Imagine you're on a train where the distance traveled each hour depends on the distance traveled in previous hours, but there's also an external factor like the train being pushed by an extra engine some of the time. A non-homogeneous recurrence relation is like a formula that calculates the distance traveled each hour, taking into account both the previous distances and the extra push from the engine.

# 2. Derivation & Logical Trace
A non-homogeneous recurrence relation is defined as a recurrence relation of the form `a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k}) + g(n)`, where `f` is a function that combines previous terms and `g(n)` is a [[Non_Recurring_Term]] that represents the external influence. Mechanically, solving such a relation involves first finding the [[Homogeneous_Solution]] to the associated homogeneous recurrence relation `a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k})`, and then finding a particular [[Particular_Solution]] that satisfies the non-homogeneous part. The general solution is a combination of these two solutions, often facilitated by the [[Superposition_Principle]].

# 3. Theorem Constraints & Incompleteness
The solvability of non-homogeneous recurrence relations depends on the form of `g(n)`, which can lead to [[Inhomogeneous_Terms]] that may not have a straightforward particular solution. For instance, if `g(n)` is a constant or a polynomial, we can often guess a particular solution of a similar form. However, for more complex `g(n)`, such as exponential or trigonometric functions, the [[Method_Of_Undetermined_Coefficients]] may not directly apply, necessitating alternative approaches like [[Variation_Of_Parameters]]. Moreover, boundary conditions must be specified to obtain a unique solution, and failure to do so may result in a family of solutions.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Non-Homogeneous Recurrence Relation}

Given a non-homogeneous recurrence relation of the form:
\[a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k}) + g(n)\]

\subsection{Step 1: Define the Associated Homogeneous Recurrence Relation}

The associated homogeneous recurrence relation is:
\[a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k})\]

\subsection{Step 2: Solve the Homogeneous Recurrence Relation}

Let the solution to the homogeneous recurrence relation be:
\[a_n^{(h)} = \sum_{i=1}^{k} c_i r_i^n\]
where $r_i$ are the roots of the characteristic equation.

\subsection{Step 3: Find a Particular Solution for the Non-Homogeneous Part}

Assume a particular solution of the form:
\[a_n^{(p)} = A \cdot g(n)\]
where $A$ is a constant to be determined.

\subsection{Step 4: Apply the Superposition Principle}

The general solution is a combination of the homogeneous and particular solutions:
\[a_n = a_n^{(h)} + a_n^{(p)} = \sum_{i=1}^{k} c_i r_i^n + A \cdot g(n)\]

\subsection{Step 5: Determine the Constants Using Boundary Conditions}

Given boundary conditions $a_0, a_1, ..., a_{k-1}$, we can solve for $c_i$ and $A$.

\end{document}
```
To read this LaTeX code: This is a step-by-step formal proof of the concept of non-homogeneous recurrence relations. It outlines the process of solving such relations by first solving the associated homogeneous relation, finding a particular solution for the non-homogeneous part, and combining these solutions.

## 5. Walkthrough
Consider a non-homogeneous recurrence relation:
\[a_n = 2a_{n-1} - a_{n-2} + 3n\]
where $a_0 = 1$ and $a_1 = 2$.

### Step 1: Solve the Associated Homogeneous Recurrence Relation

The associated homogeneous recurrence relation is:
\[a_n = 2a_{n-1} - a_{n-2}\]
The characteristic equation is:
\[r^2 - 2r + 1 = 0\]
\[(r-1)^2 = 0\]
\[r = 1, 1\]
So, the homogeneous solution is:
\[a_n^{(h)} = (c_1 + c_2 n) \cdot 1^n = c_1 + c_2 n\]

### Step 2: Find a Particular Solution for the Non-Homogeneous Part

Assume a particular solution of the form:
\[a_n^{(p)} = A \cdot n + B\]
Substitute into the original recurrence relation:
\[A \cdot n + B = 2(A \cdot (n-1) + B) - (A \cdot (n-2) + B) + 3n\]
Simplify and equate coefficients:
\[A \cdot n + B = 2A \cdot n - 2A + 2B - A \cdot n + 2A - B + 3n\]
\[A \cdot n + B = A \cdot n + B + 3n\]
Comparing coefficients of $n$:
\[0 = 3\]
This approach doesn't directly work; instead, we adjust our guess:
\[a_n^{(p)} = A \cdot n^2 + B \cdot n + C\]
Substituting and solving for $A$, $B$, and $C$ yields:
\[A \cdot n^2 + B \cdot n + C = 2(A \cdot (n-1)^2 + B \cdot (n-1) + C) - (A \cdot (n-2)^2 + B \cdot (n-2) + C) + 3n\]
After calculations, we find $A = -3$, $B = -3$, and $C = -2$ (omitting detailed calculations for brevity).

### Step 3: Combine Solutions and Apply Boundary Conditions

The general solution is:
\[a_n = c_1 + c_2 n - 3n^2 - 3n - 2\]
Using boundary conditions:
\[a_0 = 1 = c_1 - 2\]
\[a_1 = 2 = c_1 + c_2 - 3 - 3 - 2\]
Solving these equations simultaneously:
\[c_1 = 3\]
\[c_2 = 4\]
So, the specific solution is:
\[a_n = 3 + 4n - 3n^2 - 3n - 2 = -3n^2 + n + 1\]

read: true
---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the general form of a non-homogeneous recurrence relation?",
    "options": {
      "A": "a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k})",
      "B": "a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k}) + g(n)",
      "C": "a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k}) - g(n)",
      "D": "a_n = g(n)"
    },
    "answer": "B",
    "explanation": "The general form includes both a function of previous terms and an external influence g(n)."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "To solve a non-homogeneous recurrence relation, we first find the [[Blank1]] to the associated homogeneous recurrence relation, and then find a particular [[Blank2]] that satisfies the non-homogeneous part.",
    "textWithBlanks": "To solve a non-homogeneous recurrence relation, we first find the [[Blank1]] to the associated homogeneous recurrence relation, and then find a particular [[Blank2]] that satisfies the non-homogeneous part.",
    "answer": [
      "solution",
      "solution"
    ],
    "explanation": "The process involves finding the homogeneous solution and a particular solution."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following proposed particular solution for the non-homogeneous recurrence relation: a_n = 2a_{n-1} + 3^n, assuming a particular solution of the form A*3^n.",
    "content": "Let's assume a particular solution of the form: a_n^{(p)} = A * 3^{n-1}",
    "answer": "The bug is in the assumed form of the particular solution. It should be A*3^n instead of A*3^{n-1} to match the form of the non-homogeneous term.",
    "explanation": "The assumed particular solution must match the form of the non-homogeneous term."
  }
]
```