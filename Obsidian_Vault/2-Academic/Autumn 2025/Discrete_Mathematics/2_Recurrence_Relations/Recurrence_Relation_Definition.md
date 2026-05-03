---
title: "Recurrence_Relation_Definition"
type: "Atomic Note"
course: "Discrete Mathematics"
semester: "Autumn 2025"
unit: "2"
hub:
 - "2_Recurrence_Relations_Hub"
source:
 - "2_Recurrence_Relations.pdf"
source_pages:
 - "10"
mode: "MATH-DISCRETE"
read: false
generated: true
prerequisites:
 - "[[Recursive_Definition]]"
 - "[[Sequence_Notation]]"
 - "[[Linear_Recurrence_Relation]]"
 - "[[Characteristic_Equation]]"
 - "[[General_Solution]]"
---

## 1. Mental Model

A recurrence relation can be thought of as a game of dominoes, where each domino represents a term in the sequence. The relation defines how each domino falls based on the positions and states of previous dominoes, illustrating how each term in the sequence is determined by previous terms. Just as the arrangement of dominoes dictates the sequence of falling dominoes, a recurrence relation dictates the sequence of terms.

## 2. Formal Definition & Structural Trace

A [[Recurrence_Relation_Definition]] for a sequence $\{a_n\}$ is an equation that expresses $a_n$ in terms of one or more previous terms of the sequence, namely $a_0, a_1, \cdots, a_{n-1}$ for all integers $n \geq n_0$. This definition is a form of [[Recursive_Definition]], which allows us to compute each term in the sequence using a [[Sequence_Notation]] that indicates the term's position. The equation itself is a type of [[Linear_Recurrence_Relation]] if it can be expressed as a linear combination of previous terms. Solving such relations often involves finding the [[Characteristic_Equation]], which leads to the [[General_Solution]], and then applying initial conditions to obtain the [[Unique_Solution]]. The study of these relations falls under [[Solving_Linear_Homogeneous_Recurrence_Relations]].

## 3. Boundary Cases & Counterexamples

Boundary cases for recurrence relations include the initial conditions, such as $a_0$ and $a_1$, which are crucial for obtaining a [[Unique_Solution]]. Failure to specify these conditions can result in infinitely many solutions, as the [[General_Solution]] may contain arbitrary constants. For instance, a [[Second_Order_Linear_Homogeneous_Recurrence_Relation]] requires two initial conditions to yield a unique solution. A [[Non_Homogeneous_Linear_Recurrence_Relation]] may have a particular solution that must be added to the homogeneous solution to obtain the general solution.

## 4. Discrete Proof Trace

### Recurrence Relation: $a_n = 2a_{n-1} + 3$

Let's unroll the recurrence relation for a sequence $\{a_n\}$ defined as $a_n = 2a_{n-1} + 3$ with initial condition $a_0 = 1$.

$$
\begin{aligned}
a_1 &= 2a_0 + 3 \\
&= 2(1) + 3 \\
&= 5 \\
a_2 &= 2a_1 + 3 \\
&= 2(5) + 3 \\
&= 13 \\
a_3 &= 2a_2 + 3 \\
&= 2(13) + 3 \\
&= 29 \\
\end{aligned}
$$

| $n$ | $a_n$ |
| --- | --- |
| 0   | 1     |
| 1   | 5     |
| 2   | 13    |
| 3   | 29    |

The recurrence unrolling table represents the sequence values obtained by iteratively applying the recurrence relation. Each row corresponds to a term in the sequence, with $n$ indicating the term index and $a_n$ being the term value.

The LaTeX step-by-step discrete proof shows how each term in the sequence is calculated using the recurrence relation. It demonstrates the process of unrolling the recurrence relation to obtain the sequence values.

## 5. Walkthrough

1. **Initial Condition**: Start with the initial condition $a_0 = 1$.
2. **First Term Calculation**: Calculate $a_1$ using the recurrence relation: $a_1 = 2a_0 + 3 = 2(1) + 3 = 5$.
3. **Second Term Calculation**: Calculate $a_2$ using the recurrence relation and $a_1$: $a_2 = 2a_1 + 3 = 2(5) + 3 = 13$.
4. **Third Term Calculation**: Calculate $a_3$ using the recurrence relation and $a_2$: $a_3 = 2a_2 + 3 = 2(13) + 3 = 29$.
5. **Recurrence Unrolling Table**: Construct a table to organize the calculated terms: 

   | $n$ | $a_n$ |
   | --- | --- |
   | 0   | 1     |
   | 1   | 5     |
   | 2   | 13    |
   | 3   | 29    |

6. **Verification**: Verify that each term is correctly calculated based on the recurrence relation and previous terms.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "Complete the definition of a recurrence relation.",
    "textWithBlanks": "A recurrence relation is a mathematical equation that defines a sequence of values, where each term is determined by [[Blank1]] terms.",
    "answer": ["previous"],
    "explanation": "A recurrence relation defines each term in a sequence as a function of previous terms."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "A recurrence relation can have multiple base cases.",
    "answer": true,
    "explanation": "A recurrence relation can indeed have multiple base cases, which are the initial values of the sequence that are used to start the recursion."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error in the following flawed mathematical step.",
    "content": "Given the recurrence relation $T(n) = 2T(n-1) + 1$, the solution is claimed to be $T(n) = 2^n - 1$. The flawed step is: $T(n) = 2T(n-1) + 1 = 2(2^{n-1} + 1) - 1 = 2^n + 1 - 1 = 2^n$.",
    "answer": "The bug is the incorrect substitution of $T(n-1)$; it should be $T(n) = 2T(n-1) + 1 = 2(2^{n-1} - 1) + 1 = 2^n - 2 + 1 = 2^n - 1$.",
    "explanation": "The error lies in the substitution of $T(n-1)$ with $2^{n-1} + 1$ instead of $2^{n-1} - 1$, leading to an incorrect solution."
  }
]

```