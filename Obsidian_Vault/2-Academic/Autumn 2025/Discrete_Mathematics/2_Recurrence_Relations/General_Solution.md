---
title: General_Solution
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 15
mode: MATH-PURE
read: false
generated: true
---

# 1. Mental Model
Imagine you have a family of curves on a graph, and each curve represents a specific solution to a problem. The general solution is like a master curve formula that can produce any of those curves, by just adjusting some knobs (called arbitrary constants). It's like having a single recipe that can make many different cakes, by changing the ingredients (the constants) slightly.

# 2. Derivation & Logical Trace
The general solution to a recurrence relation is derived by first finding the [[Homogeneous Solution]] and then adding a [[Particular Solution]] to it. The homogeneous solution is obtained by solving the homogeneous recurrence relation, which is the original relation with all terms set to zero. The particular solution is a solution that satisfies the non-homogeneous part of the relation. The general solution is then expressed as a linear combination of the homogeneous and particular solutions, with [[Arbitrary Constants]] that can be determined by the initial conditions. This process relies on the [[Superposition Principle]] to combine the solutions.

# 3. Theorem Constraints & Incompleteness
The general solution is subject to certain constraints, such as the requirement that the arbitrary constants be determined by the initial conditions of the problem. If the initial conditions are not specified, the general solution will have [[Free Variables]] that cannot be determined. Additionally, the general solution may not be unique, and different forms of the solution may be possible. The [[Existence And Uniqueness Theorem]] provides conditions under which a unique general solution exists, but these conditions may not always be met. In such cases, the general solution may not be well-defined or may have multiple possible forms.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{General Solution to a Recurrence Relation}

Given a recurrence relation of the form:
\[a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k})\]

We can derive the general solution as follows:

\subsection*{Step 1: Find the Homogeneous Solution}

Solve the homogeneous recurrence relation:
\[a_n^{(h)} = f(a_{n-1}^{(h)}, a_{n-2}^{(h)}, ..., a_{n-k}^{(h)})\]

This has solutions of the form:
\[a_n^{(h)} = r^n\]

Substituting into the homogeneous relation gives:
\[r^n = f(r^{n-1}, r^{n-2}, ..., r^{n-k})\]

Simplifying yields the characteristic equation:
\[r^k - f(r^{k-1}, r^{k-2}, ..., 1) = 0\]

Let the roots be $r_1, r_2, ..., r_k$. Then the homogeneous solution is:
\[a_n^{(h)} = c_1r_1^n + c_2r_2^n + ... + c_kr_k^n\]

\subsection*{Step 2: Find a Particular Solution}

Assume a particular solution of the form:
\[a_n^{(p)} = A \cdot g(n)\]

where $g(n)$ is a guess function. Substitute into the original recurrence relation to find $A$.

\subsection*{Step 3: Combine Solutions}

The general solution is a linear combination of the homogeneous and particular solutions:
\[a_n = a_n^{(h)} + a_n^{(p)} = c_1r_1^n + c_2r_2^n + ... + c_kr_k^n + A \cdot g(n)\]

The arbitrary constants $c_1, c_2, ..., c_k$ can be determined by the initial conditions.

\end{document}
```
To read this LaTeX code, start from the top and follow the step-by-step derivation of the general solution to a recurrence relation. The code is divided into three main sections: finding the homogeneous solution, finding a particular solution, and combining the solutions.

## 5. Walkthrough
Consider the recurrence relation:
\[a_n = 3a_{n-1} + 2a_{n-2} + n\]

with initial conditions $a_0 = 1$ and $a_1 = 2$.

### Step 1: Find the Homogeneous Solution

The homogeneous recurrence relation is:
\[a_n^{(h)} = 3a_{n-1}^{(h)} + 2a_{n-2}^{(h)}\]

The characteristic equation is:
\[r^2 - 3r - 2 = 0\]

Factoring yields:
\[(r - (3/2 + \sqrt{17}/2))(r - (3/2 - \sqrt{17}/2)) = 0\]

So, the roots are $r_1 = (3 + \sqrt{17})/2$ and $r_2 = (3 - \sqrt{17})/2$. The homogeneous solution is:
\[a_n^{(h)} = c_1((3 + \sqrt{17})/2)^n + c_2((3 - \sqrt{17})/2)^n\]

### Step 2: Find a Particular Solution

Guess a particular solution of the form:
\[a_n^{(p)} = An + B\]

Substituting into the original recurrence relation yields:
\[An + B = 3(A(n-1) + B) + 2(A(n-2) + B) + n\]

Simplifying and equating coefficients gives:
\[A = -1/2, B = -1/2\]

So, the particular solution is:
\[a_n^{(p)} = -\frac{1}{2}n - \frac{1}{2}\]

### Step 3: Combine Solutions and Apply Initial Conditions

The general solution is:
\[a_n = c_1((3 + \sqrt{17})/2)^n + c_2((3 - \sqrt{17})/2)^n - \frac{1}{2}n - \frac{1}{2}\]

Applying the initial conditions:
\[a_0 = 1 = c_1 + c_2 - \frac{1}{2}\]
\[a_1 = 2 = c_1((3 + \sqrt{17})/2) + c_2((3 - \sqrt{17})/2) - 1 - \frac{1}{2}\]

Solving for $c_1$ and $c_2$ yields:
\[c_1 = \frac{3 + \sqrt{17}}{2\sqrt{17}}, c_2 = -\frac{3 - \sqrt{17}}{2\sqrt{17}}\]

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the purpose of the homogeneous solution in finding the general solution to a recurrence relation?",
    "options": {
      "A": "To satisfy the non-homogeneous part of the relation",
      "B": "To satisfy the initial conditions",
      "C": "To provide a solution to the homogeneous part of the relation",
      "D": "To guess the particular solution"
    },
    "answer": "C",
    "explanation": "The homogeneous solution provides a solution to the homogeneous part of the relation."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The general solution to a recurrence relation is a linear combination of the [[Homogeneous Solution]] and the [[Particular Solution]]. The [[Arbitrary Constants]] in the general solution are determined by the [[Initial Conditions]].",
    "textWithBlanks": "The general solution to a recurrence relation is a linear combination of the [[Homogeneous Solution]] and the [[Particular Solution]]. The [[Arbitrary Constants]] in the general solution are determined by the [[Initial Conditions]].",
    "answer": [
      "homogeneous solution",
      "particular solution",
      "arbitrary constants",
      "initial conditions"
    ],
    "explanation": "The general solution combines both homogeneous and particular solutions and uses initial conditions to find arbitrary constants."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code for finding the general solution to a recurrence relation:",
    "content": "def general_solution(a, b, n):\n  homogeneous_solution = a**n + b**n\n  particular_solution = 1\n  return homogeneous_solution + particular_solution",
    "answer": "The bug is that the code does not correctly calculate the homogeneous solution and does not account for arbitrary constants. Also, the particular solution is assumed to be a constant, which may not be correct for all recurrence relations.",
    "explanation": "The code oversimplifies the calculation of the homogeneous and particular solutions and ignores the need for arbitrary constants."
  }
]
```