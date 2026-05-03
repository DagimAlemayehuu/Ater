---
title: Non_Homogeneous_Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.Pdf]]"
source_pages:
- 13
mode: MATH-PURE
read: false
generated: true
prerequisites:
- "[[Linear_Recurrence_Relation]]"
---

# 1. Mental Model
Imagine you're on a train where the distance traveled each day is determined by the distance traveled the previous day, but with an additional fixed distance that represents a daily bonus. If the bonus distance changes every day, you have a non-homogeneous recurrence relation. This concept helps in modeling sequences where each term is defined recursively as a function of previous terms and an external, varying factor.

# 2. Derivation & Logical Trace
A non-homogeneous recurrence relation is defined as $a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k}) + g(n)$, where $f$ is a function that defines the recursive part, and $g(n)$ is a function that represents the external, non-recursive part. The solution to such relations typically involves finding the [[Homogeneous_Solution]] to the associated homogeneous recurrence relation $a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k})$, and then finding a [[Particular_Solution]] that satisfies the non-homogeneous part. The [[Superposition_Principle]] may be applied to combine these solutions. The process often requires [[Characteristic_Equation]] to solve for the homogeneous part.

# 3. Theorem Constraints & Incompleteness
The solvability of non-homogeneous recurrence relations depends on the form of $g(n)$. For instance, if $g(n)$ is a polynomial or an exponential function, there are systematic methods to find a particular solution. However, not all non-homogeneous recurrence relations have solutions that can be expressed in [[Closed-Form_Expression]]. The [[Initial_Conditions]] play a crucial role in determining the unique solution. In some cases, the relation may not have a solution that can be easily expressed or computed, leading to [[Incompleteness]] in the solution space. The constraints on $g(n)$ and the [[Recurrence_Relation]] itself dictate the existence and form of solutions.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Non-Homogeneous Recurrence Relation}

Given a non-homogeneous recurrence relation:
$$a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k}) + g(n)$$

\subsection*{Step 1: Define the Associated Homogeneous Recurrence Relation}

The associated homogeneous recurrence relation is:
$$a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k})$$

\subsection*{Step 2: Solve the Homogeneous Part}

The solution to the homogeneous part is denoted as $a_n^{(h)}$ and can be found using the characteristic equation.

\subsection*{Step 3: Find a Particular Solution}

Assume a particular solution $a_n^{(p)}$ that satisfies the non-homogeneous part. The form of $a_n^{(p)}$ depends on $g(n)$.

\subsection*{Step 4: Apply the Superposition Principle}

The general solution $a_n$ is the sum of $a_n^{(h)}$ and $a_n^{(p)}$:
$$a_n = a_n^{(h)} + a_n^{(p)}$$

\subsection*{Step 5: Determine the Constants Using Initial Conditions}

Given initial conditions $a_0, a_1, ..., a_{k-1}$, we can determine the constants in $a_n^{(h)}$ and $a_n^{(p)}$.

\end{document}
```
To read this LaTeX code: This is a step-by-step formal proof of the concept of non-homogeneous recurrence relations. It outlines the process of solving such relations by first solving the associated homogeneous recurrence relation, finding a particular solution to the non-homogeneous part, and then combining these solutions.

## 5. Walkthrough
Consider the non-homogeneous recurrence relation:
$$a_n = 2a_{n-1} + 3^n$$
with initial condition $a_0 = 1$.

### Step 1: Solve the Homogeneous Part
The associated homogeneous recurrence relation is:
$$a_n = 2a_{n-1}$$
The characteristic equation is $r - 2 = 0$, which has one root $r = 2$. Thus, the solution to the homogeneous part is:
$$a_n^{(h)} = c \cdot 2^n$$

### Step 2: Find a Particular Solution
Given $g(n) = 3^n$, assume a particular solution of the form:
$$a_n^{(p)} = A \cdot 3^n$$
Substitute into the recurrence relation:
$$A \cdot 3^n = 2(A \cdot 3^{n-1}) + 3^n$$
Solving for $A$:
$$A \cdot 3^n = \frac{2}{3}A \cdot 3^n + 3^n$$
$$A \cdot 3^n - \frac{2}{3}A \cdot 3^n = 3^n$$
$$\frac{1}{3}A \cdot 3^n = 3^n$$
$$A = 3$$
So, $a_n^{(p)} = 3 \cdot 3^n = 3^{n+1}$.

### Step 3: Combine Solutions
The general solution is:
$$a_n = a_n^{(h)} + a_n^{(p)} = c \cdot 2^n + 3^{n+1}$$

### Step 4: Apply Initial Conditions
Given $a_0 = 1$:
$$1 = c \cdot 2^0 + 3^{0+1} = c + 3$$
$$c = -2$$
Thus, the specific solution is:
$$a_n = -2 \cdot 2^n + 3^{n+1}$$

### Step 5: Verify the Solution
Let's verify for $n = 1$:
$$a_1 = -2 \cdot 2^1 + 3^{1+1} = -4 + 9 = 5$$
And using the recurrence relation:
$$a_1 = 2a_0 + 3^1 = 2 \cdot 1 + 3 = 5$$
The solution is correct.

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
      "A": "$a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k})$",
      "B": "$a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k}) + g(n)$",
      "C": "$a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k}) \\cdot g(n)$",
      "D": "$a_n = f(a_{n-1}, a_{n-2}, ..., a_{n-k}) - g(n)$"
    },
    "answer": "B",
    "explanation": "The general form includes an external function $g(n)$."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The solution to a non-homogeneous recurrence relation typically involves finding the [[Homogeneous_Solution]] to the associated homogeneous recurrence relation and a [[Particular_Solution]] that satisfies the [[Non-Homogeneous_Part]].",
    "textWithBlanks": "The solution involves finding the [[Homogeneous_Solution]] and a [[Particular_Solution]] to satisfy the [[Non-Homogeneous_Part]].",
    "answer": [
      "homogeneous_solution",
      "particular_solution",
      "non-homogeneous_part"
    ],
    "explanation": "Understanding the components of the solution."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code for solving a non-homogeneous recurrence relation.",
    "content": "def solve_recurrence_relation():\n  # Assume g(n) = 3^n\n  A = 2\n  return A * 3**n",
    "answer": "The bug is that $A$ is not solved for correctly and $n$ is not defined. The correct approach involves solving for $A$ using the recurrence relation.",
    "explanation": "The code incorrectly assumes $A = 2$ without derivation and doesn't account for $n$."
  }
]
```