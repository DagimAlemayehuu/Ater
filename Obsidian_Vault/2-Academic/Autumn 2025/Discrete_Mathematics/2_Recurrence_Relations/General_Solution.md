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
Imagine you have a family of curves on a graph, and each curve represents a specific solution to a problem. The general solution is like a master curve formula that can produce any of those curves by adjusting a few special numbers, called arbitrary constants. Just as different values of $a$ and $b$ in the equation $y = ax + b$ give different lines, the general solution of a recurrence relation gives different sequences by changing its arbitrary constants.

# 2. Derivation & Logical Trace
The general solution to a recurrence relation is derived by first finding the [[Homogeneous Solution]] and then a particular [[Particular Solution]]. The homogeneous solution is found by solving the relation $a_n = r \cdot a_{n-1}$, yielding solutions of the form $a_n^{(h)} = C \cdot r^n$, where $C$ is an arbitrary constant and $r$ is the root of the characteristic equation. For non-homogeneous relations, a particular solution $a_n^{(p)}$ is guessed or derived based on the form of the non-homogeneous term. The general solution is then a combination of these: $a_n = a_n^{(h)} + a_n^{(p)}$. For instance, if the homogeneous solution is $C_1 \cdot 2^n + C_2 \cdot (-1)^n$ and a particular solution is $3n$, the general solution is $a_n = C_1 \cdot 2^n + C_2 \cdot (-1)^n + 3n$, involving [[Superposition]] and [[Linearity]] principles.

# 3. Theorem Constraints & Incompleteness
The general solution must satisfy the original recurrence relation for all $n$. However, it contains [[Arbitrary Constants]] that must be determined by initial conditions to yield a specific solution. If the number of initial conditions matches the number of arbitrary constants, a unique solution can be found. If there are more initial conditions than arbitrary constants, the problem may have no solution. Conversely, if there are fewer initial conditions, the general solution remains, with some [[Degrees Of Freedom]] unspecified. The existence of a general solution assumes that the recurrence relation is [[Linear Recurrence|Linear]] and [[Homogeneous]] or has a solvable non-homogeneous part.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{General Solution of a Recurrence Relation}

Given a linear recurrence relation of the form:
$$a_n = p \cdot a_{n-1} + q \cdot a_{n-2} + f(n)$$

\subsection*{Step 1: Solve the Homogeneous Part}
The homogeneous part of the equation is:
$$a_n^{(h)} = p \cdot a_{n-1}^{(h)} + q \cdot a_{n-2}^{(h)}$$
Assume solutions of the form $a_n^{(h)} = r^n$:
$$r^n = p \cdot r^{n-1} + q \cdot r^{n-2}$$
Simplifying yields the characteristic equation:
$$r^2 - pr - q = 0$$

\subsection*{Step 2: Find the Particular Solution}
For a particular solution $a_n^{(p)}$, assume a solution based on $f(n)$. 
For simplicity, let $f(n) = c$, a constant:
$$a_n^{(p)} = k$$
Substituting into the recurrence relation:
$$k = p \cdot k + q \cdot k + c$$
Solving for $k$:
$$k(1 - p - q) = c$$
$$k = \frac{c}{1 - p - q}$$

\subsection*{Step 3: Combine Solutions}
The general solution is:
$$a_n = a_n^{(h)} + a_n^{(p)} = C_1 \cdot r_1^n + C_2 \cdot r_2^n + \frac{c}{1 - p - q}$$
where $r_1$ and $r_2$ are roots of the characteristic equation.

\end{document}
```

To read this LaTeX code: This is a step-by-step formal proof deriving the general solution for a linear recurrence relation. It begins with the homogeneous part, proceeds to find a particular solution based on a non-homogeneous term, and combines these to form the general solution.

## 5. Walkthrough
Consider the recurrence relation:
$$a_n = 3a_{n-1} - 2a_{n-2} + 4$$
with initial conditions $a_0 = 1$ and $a_1 = 5$.

### Steps:
1. **Solve the Homogeneous Part**: The characteristic equation is:
 $$r^2 - 3r + 2 = 0$$
 Factoring:
 $$(r - 1)(r - 2) = 0$$
 So, $r_1 = 1$ and $r_2 = 2$. The homogeneous solution is:
 $$a_n^{(h)} = C_1 \cdot 1^n + C_2 \cdot 2^n$$

2. **Find the Particular Solution**: Assume $a_n^{(p)} = k$:
 $$k = 3k - 2k + 4$$
 $$k = 4$$
 So, $a_n^{(p)} = 4$.

3. **Combine Solutions**: The general solution is:
 $$a_n = C_1 + C_2 \cdot 2^n + 4$$

4. **Apply Initial Conditions**:
 - For $n = 0$: $1 = C_1 + C_2 + 4$ or $C_1 + C_2 = -3$
 - For $n = 1$: $5 = C_1 + 2C_2 + 4$ or $C_1 + 2C_2 = 1$

5. **Solve for $C_1$ and $C_2$**:
 - Subtracting the first equation from the second: $C_2 = 4$
 - Substituting $C_2 = 4$ into $C_1 + C_2 = -3$: $C_1 = -7$

6. **Specific Solution**: 
 $$a_n = -7 + 4 \cdot 2^n + 4 = -3 + 4 \cdot 2^n$$

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the general form of the homogeneous solution to a second-order linear recurrence relation?",
    "options": {
      "A": "$C_1 \\cdot r_1^n + C_2 \\cdot r_2^n$",
      "B": "$C_1 \\cdot r^n + C_2 \\cdot n \\cdot r^n$",
      "C": "$C_1 \\cdot 1^n + C_2 \\cdot 2^n$",
      "D": "$C_1 \\cdot r_1 + C_2 \\cdot r_2$"
    },
    "answer": "A",
    "explanation": "The homogeneous solution to a second-order linear recurrence relation is of the form $C_1 \\cdot r_1^n + C_2 \\cdot r_2^n$, where $r_1$ and $r_2$ are the roots of the characteristic equation."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The general solution to a recurrence relation is $a_n = C_1 \\cdot 2^n + C_2 \\cdot (-1)^n + 3n$. If $a_0 = 2$ and $a_1 = 5$, the value of $C_1$ is [[Blank1]] and $C_2$ is [[Blank2]].",
    "textWithBlanks": "The general solution to a recurrence relation is $a_n = C_1 \\cdot 2^n + C_2 \\cdot (-1)^n + 3n$. If $a_0 = 2$ and $a_1 = 5$, the value of $C_1$ is [[Blank1]] and $C_2$ is [[Blank2]].",
    "answer": [
      "-1",
      "1"
    ],
    "explanation": "To find $C_1$ and $C_2$, substitute $a_0 = 2$ and $a_1 = 5$ into the general solution. For $n=0$: $2 = C_1 + C_2$. For $n=1$: $5 = 2C_1 - C_2 + 3$. Solving these equations simultaneously yields $C_1 = -1$ and $C_2 = 1$."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code for calculating the general solution of $a_n = 2a_{n-1} + 3$.",
    "content": "def general_solution(n, C1, C2):\n  return C1 * (2 ** n) + C2",
    "answer": "The bug is that the code does not correctly implement the general solution for the given recurrence relation. The general solution should be of the form $a_n = C_1 \\cdot 2^n - 3$. The corrected code should be:\ndef general_solution(n, C1):\n  return C1 * (2 ** n) - 3",
    "explanation": "The provided code lacks a constant term that would come from a particular solution to the non-homogeneous part of the recurrence relation. For $a_n = 2a_{n-1} + 3$, a particular solution is $a_n^{(p)} = -3$. Thus, the general solution should include this term."
  }
]
```