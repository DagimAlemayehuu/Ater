---
title: Non_Homogeneous_Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: 2024/25
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 13
mode: MATH-PURE
read: false
generated: true
prerequisites:
- "[[Recurrence_Relation]]"
- "[[Linear_Recurrence_Relation]]"
---

# 1. Mental Model
Imagine you're on a train where the distance traveled each day is determined by the distance traveled the previous day, but with an additional fixed distance that you must travel every day, like a daily delivery. A non-homogeneous recurrence relation is like a formula that calculates the distance traveled each day based on the previous day's distance plus this fixed extra distance. This extra distance represents the "non-homogeneous" part.

# 2. Derivation & Logical Trace
A non-homogeneous recurrence relation is defined as a recurrence relation of the form `a_n = c_1 * a_(n-1) + c_2 * a_(n-2) + ... + c_k * a_(n-k) + f(n)`, where `a_n` is the term we are trying to find, `c_1, c_2, ..., c_k` are constants, and `f(n)` is a function that represents the non-homogeneous part. The solution to such a relation typically involves finding the [[Homogeneous_Solution]] to the associated homogeneous recurrence relation `a_n = c_1 * a_(n-1) + c_2 * a_(n-2) + ... + c_k * a_(n-k)`, and then finding a [[Particular_Solution]] that satisfies the non-homogeneous equation. The [[Superposition_Principle]] is often used to combine these solutions.

# 3. Theorem Constraints & Incompleteness
The existence and uniqueness of solutions to non-homogeneous recurrence relations depend on the [[Initial_Conditions]] provided. If the initial conditions are not properly specified, the solution may not be unique or may not exist. Furthermore, the function `f(n)` must be well-defined for all `n` in the domain of interest. If `f(n)` is not defined for certain values of `n`, the recurrence relation may not have a solution for those values. The [[Characteristic_Equation]] of the associated homogeneous recurrence relation plays a crucial role in determining the form of the homogeneous solution, and consequently, the overall solution to the non-homogeneous recurrence relation.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Non-Homogeneous Recurrence Relation}

Given a non-homogeneous recurrence relation of the form:
\[a_n = c_1 \cdot a_{n-1} + c_2 \cdot a_{n-2} + \ldots + c_k \cdot a_{n-k} + f(n)\]

We aim to prove that the solution to this relation can be expressed as the sum of the homogeneous solution and a particular solution.

\subsection{Step 1: Define Homogeneous and Particular Solutions}

Let $a_n^{(h)}$ be the solution to the associated homogeneous recurrence relation:
\[a_n^{(h)} = c_1 \cdot a_{n-1}^{(h)} + c_2 \cdot a_{n-2}^{(h)} + \ldots + c_k \cdot a_{n-k}^{(h)}\]

And let $a_n^{(p)}$ be a particular solution to the non-homogeneous recurrence relation.

\subsection{Step 2: Verify Homogeneous Solution}

By definition, $a_n^{(h)}$ satisfies the homogeneous recurrence relation.

\subsection{Step 3: Verify Particular Solution}

$a_n^{(p)}$ satisfies the non-homogeneous recurrence relation:
\[a_n^{(p)} = c_1 \cdot a_{n-1}^{(p)} + c_2 \cdot a_{n-2}^{(p)} + \ldots + c_k \cdot a_{n-k}^{(p)} + f(n)\]

\subsection{Step 4: Combine Solutions}

Let $a_n = a_n^{(h)} + a_n^{(p)}$. Substituting into the non-homogeneous recurrence relation:
\[a_n = c_1 \cdot (a_{n-1}^{(h)} + a_{n-1}^{(p)}) + c_2 \cdot (a_{n-2}^{(h)} + a_{n-2}^{(p)}) + \ldots + c_k \cdot (a_{n-k}^{(h)} + a_{n-k}^{(p)}) + f(n)\]

Simplifying yields:
\[a_n = c_1 \cdot a_{n-1}^{(h)} + c_2 \cdot a_{n-2}^{(h)} + \ldots + c_k \cdot a_{n-k}^{(h)} + c_1 \cdot a_{n-1}^{(p)} + c_2 \cdot a_{n-2}^{(p)} + \ldots + c_k \cdot a_{n-k}^{(p)} + f(n)\]

Which confirms that $a_n$ is a solution to the non-homogeneous recurrence relation.

\end{document}
```
To read this LaTeX code, start from the top and follow the logical steps outlined in the proof. Each section builds upon the previous one to demonstrate that the solution to a non-homogeneous recurrence relation can be expressed as the sum of the homogeneous and particular solutions.

## 5. Walkthrough
Consider a non-homogeneous recurrence relation:
\[a_n = 2a_{n-1} + 3a_{n-2} + n\]

Given initial conditions $a_0 = 1$ and $a_1 = 2$.

1. **Find the Homogeneous Solution**: The associated homogeneous recurrence relation is $a_n^{(h)} = 2a_{n-1}^{(h)} + 3a_{n-2}^{(h)}$. The characteristic equation is $r^2 - 2r - 3 = 0$, which factors into $(r - 3)(r + 1) = 0$. Thus, $r = 3$ or $r = -1$, and the homogeneous solution is $a_n^{(h)} = A \cdot 3^n + B \cdot (-1)^n$.

2. **Find a Particular Solution**: Given $f(n) = n$, we guess a particular solution of the form $a_n^{(p)} = Cn + D$. Substituting into the non-homogeneous recurrence relation yields:
\[Cn + D = 2(C(n-1) + D) + 3(C(n-2) + D) + n\]

3. **Solve for C and D**:
\[Cn + D = 2Cn - 2C + 2D + 3Cn - 6C + 3D + n\]
\[Cn + D = 5Cn - 8C + 5D + n\]
Equating coefficients of $n$ and constant terms:
\[C = 5C + 1\]
\[-4C = 1\]
\[C = -\frac{1}{4}\]
And for $D$:
\[D = -8C + 5D\]
\[D = -8(-\frac{1}{4}) + 5D\]
\[D = 2 + 5D\]
\[-4D = 2\]
\[D = -\frac{1}{2}\]

4. **Combine Solutions**: The general solution is $a_n = A \cdot 3^n + B \cdot (-1)^n - \frac{1}{4}n - \frac{1}{2}$.

5. **Apply Initial Conditions**:
- For $n = 0$: $1 = A + B - \frac{1}{2}$, so $A + B = \frac{3}{2}$.
- For $n = 1$: $2 = 3A - B - \frac{1}{4} - \frac{1}{2}$, which simplifies to $3A - B = \frac{11}{4}$.

Solving these equations simultaneously gives $A$ and $B$.

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
      "A": "a_n = c_1 * a_(n-1) + c_2 * a_(n-2) + ... + c_k * a_(n-k)",
      "B": "a_n = c_1 * a_(n-1) + c_2 * a_(n-2) + ... + c_k * a_(n-k) + f(n)",
      "C": "a_n = c_1 * a_(n-1) + f(n)",
      "D": "a_n = f(n)"
    },
    "answer": "B",
    "explanation": "The general form includes both the homogeneous part and the non-homogeneous part f(n)."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The solution to a non-homogeneous recurrence relation is typically the sum of the [[Homogeneous_Solution]] and a [[Particular_Solution]].",
    "textWithBlanks": "The solution to a non-homogeneous recurrence relation is typically the sum of the [[Homogeneous_Solution]] and a [[Particular_Solution]].",
    "answer": [
      "homogeneous_solution",
      "particular_solution"
    ],
    "explanation": "This combines the solutions to the associated homogeneous relation and a specific solution to the non-homogeneous relation."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code/logic for solving a non-homogeneous recurrence relation:",
    "content": "a_n = 2a_(n-1) + 3; // given relation\na_n = A * 2^n + B; // guessed solution",
    "answer": "The guessed solution does not account for the non-homogeneous term properly. A particular solution should be guessed to handle the constant term.",
    "explanation": "The provided logic incorrectly guesses the solution without properly addressing the non-homogeneous part of the recurrence relation."
  }
]
```