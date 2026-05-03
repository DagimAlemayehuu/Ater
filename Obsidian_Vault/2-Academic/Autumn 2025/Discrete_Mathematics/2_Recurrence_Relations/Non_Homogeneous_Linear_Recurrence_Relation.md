---

title: Non_Homogeneous_Linear_Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.pdf]]"
source_pages: []
mode: MATH-DISCRETE
read: false
generated: true
prerequisites:
- "[[Linear_Recurrence_Relation]]"

---

## 1. Mental Model

A Non-Homogeneous Linear Recurrence Relation can be thought of as a sequence of blocks where each block's height is determined by the heights of previous blocks and an external factor. This is analogous to a tower of blocks where each block's position is determined by the positions of the blocks below it and an external force applied to it. Just as the external force affects the position of each block in the tower, the external term in the recurrence relation affects the value of each term in the sequence.

## 2. Formal Definition & Structural Trace

A [[Non_Homogeneous_Linear_Recurrence_Relation]] is defined as a recurrence relation of the form $a_n = c_1a_{n-1} + c_2a_{n-2} + \ldots + c_ka_{n-k} + f(n)$, where $c_1, c_2, \ldots, c_k$ are constants and $f(n)$ is a function of $n$. The [[Sequence_Definition]] of such a relation can be expressed using [[Sequence_Notation]] as $a_n = \sum_{i=1}^{k} c_i a_{n-i} + f(n)$. The [[Recursive_Definition]] of the relation implies that each term is defined in terms of previous terms and the external function $f(n)$. The [[Characteristic_Equation]] of the associated [[Homogeneous_Recurrence_Relation]] is obtained by setting $f(n) = 0$. The [[General_Solution]] to the non-homogeneous relation consists of the general solution to the homogeneous relation and a particular solution to the non-homogeneous relation.

## 3. Boundary Cases & Counterexamples

Boundary cases for [[Non_Homogeneous_Linear_Recurrence_Relation]] include when the external function $f(n)$ is zero, in which case the relation reduces to a [[Linear_Homogeneous_Recurrence_Relation]]. Another boundary case is when the recurrence relation has a non-constant coefficient, which is not considered a linear recurrence relation. A counterexample to a proposed solution would be a sequence that satisfies the recurrence relation but not the initial conditions. Failure to account for the external term $f(n)$ can lead to incorrect solutions, highlighting the importance of properly solving [[Non_Homogeneous_Linear_Recurrence_Relation]] using methods such as finding a particular solution and the [[General_Solution]] to the associated homogeneous relation.

## 4. Discrete Proof Trace

### Recurrence Relation: $a_n = 2a_{n-1} + 3$

### Unrolling Table:

| $n$ | $a_n$ | $a_{n-1}$ | $2a_{n-1}$ | $2a_{n-1} + 3$ |
| --- | --- | --- | --- | --- |
| 0   | $a_0$ | -       | -         | -             |
| 1   | $a_1$ | $a_0$   | $2a_0$   | $2a_0 + 3$   |
| 2   | $a_2$ | $a_1$   | $2a_1$   | $2a_1 + 3$   |
| 3   | $a_3$ | $a_2$   | $2a_2$   | $2a_2 + 3$   |

## 5. Walkthrough

1. **Initial Condition**: We start with the given recurrence relation $a_n = 2a_{n-1} + 3$. Let's assume $a_0 = 1$ as our initial condition.

2. **Calculate $a_1$**: Using the recurrence relation, $a_1 = 2a_0 + 3 = 2(1) + 3 = 2 + 3 = 5$.

3. **Calculate $a_2$**: Now, $a_2 = 2a_1 + 3 = 2(5) + 3 = 10 + 3 = 13$.

4. **Calculate $a_3$**: Next, $a_3 = 2a_2 + 3 = 2(13) + 3 = 26 + 3 = 29$.

5. **Pattern Observation**: Observing the pattern, each term $a_n$ can be represented as $a_n = 2^n \cdot a_0 + 3 \cdot (2^{n-1} + 2^{n-2} + \cdots + 2^0)$.

6. **Simplification**: Simplify the expression for $a_n$. The sum $(2^{n-1} + 2^{n-2} + \cdots + 2^0)$ is a geometric series with $n$ terms, first term $1$, and common ratio $2$. Its sum is $\frac{2^n - 1}{2 - 1} = 2^n - 1$. Therefore, $a_n = 2^n \cdot a_0 + 3 \cdot (2^n - 1)$. Substituting $a_0 = 1$, we get $a_n = 2^n + 3 \cdot (2^n - 1) = 2^n + 3 \cdot 2^n - 3 = 4 \cdot 2^n - 3 = 2^{n+2} - 3$.

The unrolling table represents the step-by-step calculation of the terms in the sequence based on the recurrence relation. Each row corresponds to a term in the sequence, showing how it is calculated from the previous term and the external factor.

The walkthrough explains the step-by-step derivation of the solution to the non-homogeneous linear recurrence relation. Each step shows a concrete transformation, starting from the initial condition, calculating subsequent terms, observing a pattern, and finally simplifying the expression for the general term.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "Definition of Non-Homogeneous Linear Recurrence Relation",
    "textWithBlanks": "A Non-Homogeneous Linear Recurrence Relation is a recurrence relation of the form $a_n = c_1a_{n-1} + c_2a_{n-2} + \\ldots + c_ka_{n-k} + f(n)$, where $f(n)$ is a [[Blank1]] term.",
    "answer": ["non-homogeneous"],
    "explanation": "The term 'non-homogeneous' refers to the presence of an external term $f(n)$ that is not a part of the homogeneous recurrence relation."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "Consider a Non-Homogeneous Linear Recurrence Relation with a constant external term $f(n) = c$. If the homogeneous part of the recurrence relation has a characteristic equation with a root of 1, then the particular solution is a constant.",
    "answer": false,
    "explanation": "If the characteristic equation of the homogeneous part has a root of 1, then the particular solution would be of the form $an$ (or $an + b$ for a second-order relation, etc.), not a constant, to avoid duplication with the homogeneous solution."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error in the step to solve the Non-Homogeneous Linear Recurrence Relation.",
    "content": "Given: $a_n = 2a_{n-1} + 3$. Assume a particular solution of the form $a_n^{(p)} = A$. Substituting into the recurrence relation yields $A = 2A + 3$. Solving for $A$ gives $A - 2A = 3 \\Rightarrow -A = 3 \\Rightarrow A = 3$.",
    "answer": "The error is in the solution for A. The correct step should be: $A = 2A + 3 \\Rightarrow A - 2A = 3 \\Rightarrow -A = 3 \\Rightarrow A = -3$.",
    "explanation": "The mistake was in incorrectly solving for $A$, which should be $-3$ instead of $3$."
  }
]

```