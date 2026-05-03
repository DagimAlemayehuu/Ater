---
title: Linear_Recurrence_Relation
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
- "[[Recurrence_Relation_Definition]]"
---

# 1. Mental Model
Imagine you have a row of dominoes standing upright. Each domino falls based on the state of a few preceding dominoes. A linear recurrence relation works similarly, where the state of a sequence at a given position `$n$` depends linearly on the states of the sequence at a fixed number of preceding positions.

# 2. Derivation & Logical Trace
A linear recurrence relation is defined as `$c_0a_n + c_1a_{n-1} + c_2a_{n-2} + \cdots + c_ka_{n-k} = f(n)$`, where `$c_0, c_k \neq 0$` and `$1 \leq k \leq n$`. Mechanically, this relation operates by specifying that each term in the sequence `$a_n$` is a [[Linear Combination]] of the previous `$k$` terms, with coefficients `$c_0, c_1, \ldots, c_k$`, plus the function `$f(n)$`. The solution to such a relation typically involves finding the [[Characteristic Equation]] of the homogeneous part and then a particular solution to the non-homogeneous equation, often using methods like [[Generating Functions]].

# 3. Theorem Constraints & Incompleteness
The constraints on a linear recurrence relation include that `$c_0$` and `$c_k$` must be non-zero, ensuring the relation is indeed linear and of a specified order `$k$`. The function `$f(n)$` can significantly affect the solution's form; if `$f(n)$` is a [[Polynomial]] or an [[Exponential Function]], the particular solution can often be found in a similar form. However, if `$f(n)$` is not of a simple form, the solution may involve more complex functions. Boundary conditions are also crucial, as they allow for the determination of the specific solution from the general solution space. Without sufficient initial conditions (typically `$k$` conditions for a `$k$`-order relation), the solution remains incomplete.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Linear Recurrence Relation}

Given a sequence $\{a_n\}$ and constants $c_0, c_1, \ldots, c_k$ with $c_0, c_k \neq 0$, 
a linear recurrence relation is defined as:
$$c_0a_n + c_1a_{n-1} + c_2a_{n-2} + \cdots + c_ka_{n-k} = f(n)$$
for $1 \leq k \leq n$.

\subsection{Proof of Solution Form}

Assume the solution has the form $a_n = r^n$ for some $r$. 
Substituting into the homogeneous part ($f(n) = 0$) yields:
$$c_0r^n + c_1r^{n-1} + \cdots + c_kr^{n-k} = 0$$
Dividing by $r^{n-k}$:
$$c_0r^k + c_1r^{k-1} + \cdots + c_k = 0$$
This is the characteristic equation.

\subsection{Particular Solution}

For a particular solution, assume $a_n = p(n)$ where $p(n)$ is a polynomial of degree $d$. 
Substituting into the full equation:
$$c_0p(n) + c_1p(n-1) + \cdots + c_kp(n-k) = f(n)$$
The degree of the LHS must match $f(n)$.

\end{document}
```

To read this LaTeX code: This is a step-by-step formal proof of the solution form for a linear recurrence relation. The code first defines the relation, then assumes a solution of the form `$a_n = r^n$` and substitutes it into the homogeneous part to derive the characteristic equation.

## 5. Walkthrough
Consider the linear recurrence relation:
$$a_n = 3a_{n-1} + 2a_{n-2} + n$$
with initial conditions `$a_0 = 1$` and `$a_1 = 2$`.

### Steps:
1. **Identify the Recurrence Relation**: 
The given relation is `$a_n - 3a_{n-1} - 2a_{n-2} = n$`.

2. **Solve the Homogeneous Part**:
The characteristic equation is `$r^2 - 3r - 2 = 0$`, 
which factors into `$(r - (3/2 + \sqrt{17}/2))(r - (3/2 - \sqrt{17}/2)) = 0$`, 
yielding roots `$r_1 = \frac{3 + \sqrt{17}}{2}$` and `$r_2 = \frac{3 - \sqrt{17}}{2}$`. 
The homogeneous solution is `$a_n^{(h)} = C_1(\frac{3 + \sqrt{17}}{2})^n + C_2(\frac{3 - \sqrt{17}}{2})^n$`.

3. **Find a Particular Solution**:
Assume `$a_n^{(p)} = An + B$`. 
Substituting into the relation:
$$An + B = 3(A(n-1) + B) + 2(A(n-2) + B) + n$$
Simplifying yields:
$$An + B = (3A + 2A)n + (3B + 2B - 3A - 4A) + n$$
$$An + B = 5An - 7A + 5B + n$$
Equating coefficients:
- For `$n$`: `$A = 5A + 1$` or `$4A = -1$`, so `$A = -\frac{1}{4}$`.
- For constants: `$B = -7A + 5B$` or `$4B = 7A$`, with `$A = -\frac{1}{4}$`, `$B = -\frac{7}{16}$`.

4. **Combine Solutions**:
The general solution is `$a_n = C_1(\frac{3 + \sqrt{17}}{2})^n + C_2(\frac{3 - \sqrt{17}}{2})^n - \frac{1}{4}n - \frac{7}{16}$`.

5. **Apply Initial Conditions**:
- For `$n = 0$`: `$1 = C_1 + C_2 - \frac{7}{16}$`.
- For `$n = 1$`: `$2 = C_1(\frac{3 + \sqrt{17}}{2}) + C_2(\frac{3 - \sqrt{17}}{2}) - \frac{1}{4} - \frac{7}{16}$`.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the general form of a linear recurrence relation?",
    "options": {
      "A": "A sequence where each term is a linear combination of previous terms",
      "B": "A sequence where each term is a product of previous terms",
      "C": "A sequence where each term is a sum of previous terms",
      "D": "A sequence where each term is a difference of previous terms"
    },
    "answer": "A",
    "explanation": "A linear recurrence relation is defined as a sequence where each term is a linear combination of a fixed number of preceding terms."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "The characteristic equation of a linear recurrence relation is obtained by substituting $a_n = [[Blank1]]$ into the homogeneous part of the relation.",
    "textWithBlanks": "The characteristic equation of a linear recurrence relation is obtained by substituting $a_n = [[Blank1]]$ into the homogeneous part of the relation.",
    "answer": [
      "r^n"
    ],
    "explanation": "The characteristic equation is derived by assuming $a_n = r^n$ and substituting into the homogeneous part."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the code for solving a linear recurrence relation.",
    "content": "def solve_recurrence(n, c0, c1, f_n):\n  r = c0 * r + c1 * (r - 1)\n  return r",
    "answer": "The bug is that the function does not correctly implement the recurrence relation and has a recursive call with incorrect parameters. The correct approach should involve finding the characteristic equation and particular solution.",
    "explanation": "The provided code does not accurately represent a method for solving linear recurrence relations and seems to confuse basic algebraic manipulations with recursive function calls."
  }
]
```