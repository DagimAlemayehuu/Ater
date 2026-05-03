---
title: "Linear_Homogeneous_Recurrence_Relation"
type: "Atomic Note"
course: "Discrete Mathematics"
semester: "2024/25"
unit: "2"
hub: [[2_Recurrence_Relations_Hub]]
source: [[2_Recurrence_Relations.Pdf]]
source_pages:
  - "16"
mode: "MATH-PURE"
read: true
generated: true
prerequisites: [[Linear_Recurrence_Relation]]
---

# 1. Mental Model
Imagine you have a row of dominoes standing upright, and each domino falls based on the state of a few preceding dominoes. A linear homogeneous recurrence relation is like a rule that determines when a domino falls based on a fixed number of previous dominoes, where the rule is the same for all dominoes.

# 2. Derivation & Logical Trace
The general form of a linear homogeneous recurrence relation of order `k` is given by `c0*an + c1*an-1 + c2*an-2 + ... + ck*an-k = 0`, where `ck != 0` and `n >= k`. This equation implies that each term `an` in the sequence is a [[Linear Combination]] of the preceding `k` terms, with coefficients `c0, c1, ..., ck`. The relation is [[Homogeneous]] because all terms are on one side of the equation, and [[Linear]] because the terms are combined using addition and scalar multiplication. The [[Characteristic Equation]] of this recurrence relation is obtained by substituting `an = r^n` into the recurrence relation.

# 3. Theorem Constraints & Incompleteness
The constraints on the coefficients are that `ck != 0`, ensuring that the relation is of order `k`, and `n >= k`, which provides the necessary initial conditions. The boundary conditions, or initial values, of the sequence `a0, a1, ..., ak-1`, must be specified to uniquely determine the sequence. If the characteristic equation has [[Distinct Roots]], the general solution to the recurrence relation can be expressed as a linear combination of terms formed by these roots. However, if there are [[Repeated Roots]], the solution involves terms with polynomial factors. Failure to specify the initial conditions or incorrect specification can lead to an [[Inconsistent System]] of equations.
# 4. Formal Proof Trace
```latex
\documentclass{article}
\usepackage{amsmath}

\begin{document}

\section{Linear Homogeneous Recurrence Relation}

Given a sequence $\{a_n\}$ and a linear homogeneous recurrence relation of order $k$:
\[c_0a_n + c_1a_{n-1} + c_2a_{n-2} + \ldots + c_ka_{n-k} = 0\]

\subsection{Characteristic Equation}

Assume $a_n = r^n$ for some constant $r$. Substituting into the recurrence relation:
\[c_0r^n + c_1r^{n-1} + c_2r^{n-2} + \ldots + c_kr^{n-k} = 0\]

Dividing through by $r^{n-k}$:
\[c_0r^k + c_1r^{k-1} + c_2r^{k-2} + \ldots + c_k = 0\]

This is the characteristic equation.

\subsection{Distinct Roots}

Assume the characteristic equation has $k$ distinct roots $r_1, r_2, \ldots, r_k$. 
Then the general solution to the recurrence relation is:
\[a_n = A_1(r_1)^n + A_2(r_2)^n + \ldots + A_k(r_k)^n\]

where $A_1, A_2, \ldots, A_k$ are constants.

\section{Proof of General Solution}

To prove this solution satisfies the recurrence relation, substitute into the original equation:
\[c_0(A_1(r_1)^n + A_2(r_2)^n + \ldots + A_k(r_k)^n) + \ldots + c_k(A_1(r_1)^{n-k} + A_2(r_2)^{n-k} + \ldots + A_k(r_k)^{n-k}) = 0\]

Using the fact that each $r_i$ satisfies the characteristic equation:
\[= A_1(c_0(r_1)^n + \ldots + c_k(r_1)^{n-k}) + \ldots + A_k(c_0(r_k)^n + \ldots + c_k(r_k)^{n-k}) = 0\]

\end{document}
```

The LaTeX code above provides a step-by-step derivation of the characteristic equation and the general solution to a linear homogeneous recurrence relation. It assumes the characteristic equation has distinct roots and proves that the general solution satisfies the recurrence relation.

---
## 5. Walkthrough
Consider the recurrence relation: $a_n = 5a_{n-1} - 6a_{n-2}$ with initial conditions $a_0 = 1$ and $a_1 = 5$.

### Steps to Solve:

1. **Write down the characteristic equation**: Replace $a_n$ with $r^n$ in the recurrence relation to get $r^n = 5r^{n-1} - 6r^{n-2}$. Dividing through by $r^{n-2}$ gives $r^2 = 5r - 6$.

2. **Solve the characteristic equation**: The equation $r^2 - 5r + 6 = 0$ factors into $(r - 2)(r - 3) = 0$. So, the roots are $r_1 = 2$ and $r_2 = 3$.

3. **Express the general solution**: Since the roots are distinct, the general solution is $a_n = A_1(2)^n + A_2(3)^n$.

4. **Use initial conditions to find $A_1$ and $A_2$**: Given $a_0 = 1$ and $a_1 = 5$, substituting $n = 0$ and $n = 1$ into the general solution gives:
   - For $n = 0$: $1 = A_1 + A_2$
   - For $n = 1$: $5 = 2A_1 + 3A_2$

5. **Solve the system of equations**: From the first equation, $A_1 = 1 - A_2$. Substituting into the second equation:
   \[5 = 2(1 - A_2) + 3A_2\]
   \[5 = 2 - 2A_2 + 3A_2\]
   \[3 = A_2\]
   So, $A_2 = 3$ and $A_1 = 1 - 3 = -2$.

6. **Write down the specific solution**: Substituting $A_1 = -2$ and $A_2 = 3$ into the general solution gives $a_n = -2(2)^n + 3(3)^n$.

---

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "mcq",
    "difficulty": "L1",
    "question": "What is the characteristic equation for the recurrence relation $a_n = 3a_{n-1} - 2a_{n-2}$?",
    "options": {
      "A": " $r^2 - 3r - 2 = 0$",
      "B": " $r^2 + 3r - 2 = 0$",
      "C": " $r^2 - 3r + 2 = 0$",
      "D": " $r^2 + 3r + 2 = 0$"
    },
    "answer": "C",
    "explanation": "The characteristic equation is obtained by substituting $a_n = r^n$ into the recurrence relation."
  },
  {
    "id": "q2",
    "type": "fill_in",
    "difficulty": "L2",
    "question": "For the recurrence relation $a_n = 4a_{n-1} - 4a_{n-2}$, if the characteristic equation has a repeated root $r = 2$, the general solution is of the form $a_n = [[A_1]] \\cdot 2^n + [[A_2]] \\cdot n \\cdot 2^n$.",
    "textWithBlanks": "The general solution to the recurrence relation with a repeated root $r$ is $a_n = A_1 \\cdot r^n + A_2 \\cdot n \\cdot r^n$. For $r = 2$, it becomes $a_n = [[A_1]] \\cdot 2^n + [[A_2]] \\cdot n \\cdot 2^n$.",
    "answer": [
      "A_1",
      "A_2"
    ],
    "explanation": "When there is a repeated root, the solution involves terms with polynomial factors."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the bug in the following code/logic for solving a linear homogeneous recurrence relation.",
    "content": "Given: $a_n = 2a_{n-1} - a_{n-2}$. Assume $a_n = r^n$. Substituting gives $r^n = 2r^{n-1} - r^{n-2}$. Dividing by $r^{n-1}$ yields $r = 2 - 1 = 1$. So, $a_n = A_1(1)^n$. Using $a_0 = 1$, we get $A_1 = 1$. Therefore, $a_n = 1$ for all $n$.",
    "answer": "The bug is in assuming the general solution is $a_n = A_1(1)^n$ without considering the possibility of a second root or the form of the solution for a repeated root. The characteristic equation $r^2 - 2r + 1 = 0$ has a repeated root $r = 1$, so the general solution should be of the form $a_n = A_1 \\cdot 1^n + A_2 \\cdot n \\cdot 1^n = A_1 + A_2n$.",
    "explanation": "The characteristic equation has a repeated root, so the general solution must account for this."
  }
]
```