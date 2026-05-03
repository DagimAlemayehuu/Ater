---

title: General_Solution
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: '[[2_Recurrence_Relations_Hub]]'
source: '[[2_Recurrence_Relations.pdf]]'
source_pages:
- 15
mode: MATH-DISCRETE
read: false
generated: true
prerequisites:
- '[[Sequence_Definition]]'
- '[[Sequence_Notation]]'
- '[[Recursive_Definition]]'
- '[[Recurrence_Relation_Definition]]'
- '[[Characteristic_Equation]]'

---


## 1. Mental Model

The concept of a general solution in recurrence relations can be analogously understood through the lens of a musical composition. Just as a musical composition can be represented by a sheet of music that allows for various interpretations through different performances (with musicians playing the same notes but with varying expressions), a general solution represents the family of solutions that satisfy a given recurrence relation, with arbitrary constants akin to the expressive variables in a performance. The structure of the general solution, much like the musical score, dictates the overall form and constraints, while the specific values of the arbitrary constants, similar to the nuances of a performance, allow for a range of specific solutions.

## 2. Formal Definition & Structural Trace

A general solution to a recurrence relation is an explicit formula for the terms of the sequence that satisfies the relation, expressed in terms of arbitrary constants. This concept is deeply connected to the [[Sequence_Definition]] and is often denoted using [[Sequence_Notation]]. The process of finding a general solution frequently involves a [[Recursive_Definition]] of the sequence and solving the associated [[Recurrence_Relation_Definition]], particularly for [[Linear_Recurrence_Relation|linear]] and [[Homogeneous_Recurrence_Relation|homogeneous]] cases, through the [[Characteristic_Equation]]. The [[General_Solution]] encompasses all possible solutions, from which a [[Unique_Solution]] can be determined with appropriate initial conditions. This approach is systematically applied in [[Solving_Linear_Homogeneous_Recurrence_Relations]].

## 3. Boundary Cases & Counterexamples

The general solution approach can encounter limitations in certain boundary cases, such as non-homogeneous recurrence relations, where the [[Non_Homogeneous_Linear_Recurrence_Relation]] requires additional particular solutions to complement the homogeneous solution. Failure to properly account for initial conditions can lead to an infinite family of solutions rather than a unique one. Moreover, for [[Second_Order_Linear_Homogeneous_Recurrence_Relation|second-order]] or [[Kth_Order_Linear_Homogeneous_Recurrence_Relation|higher-order]] linear homogeneous recurrence relations, ensuring that the general solution accurately reflects all roots of the characteristic equation is critical. In cases where the characteristic equation has repeated roots, special care must be taken to construct the general solution.

## Discrete Proof Trace

### Recurrence Relation: $T(n) = 2T(n-1) + 1$

### Step-by-Step Discrete Proof

Given: $T(n) = 2T(n-1) + 1$

Goal: Find the general solution.

#### Unrolling the Recurrence Relation

Let's unroll the recurrence relation for a few terms to identify a pattern.

| $n$ | $T(n)$          | $T(n-1)$       | $T(n-2)$       |
|-----|------------------|----------------|----------------|
| 1   | $T(1) = c$        | -              | -              |
| 2   | $T(2) = 2T(1) + 1$| $T(1) = c$     | -              |
| 3   | $T(3) = 2T(2) + 1$| $T(2) = 2c + 1$| $T(1) = c$     |

## Walkthrough

1. **Initial Condition**: Assume $T(1) = c$, where $c$ is a constant.

2. **First Unrolling**: For $n = 2$, $T(2) = 2T(1) + 1 = 2c + 1$.

3. **Second Unrolling**: For $n = 3$, $T(3) = 2T(2) + 1 = 2(2c + 1) + 1 = 4c + 3$.

4. **Hypothesis**: Observe the pattern, $T(n) = 2^{n-1}c + (2^{n-1} - 1)$.

5. **Verification - Base Case**: For $n = 1$, $T(1) = 2^{1-1}c + (2^{1-1} - 1) = c$, which matches our initial condition.

6. **Verification - Inductive Step**: Assume $T(k) = 2^{k-1}c + (2^{k-1} - 1)$ is true. We must show $T(k+1) = 2^k c + (2^k - 1)$.

$T(k+1) = 2T(k) + 1 = 2[2^{k-1}c + (2^{k-1} - 1)] + 1 = 2^kc + 2^k - 2 + 1 = 2^kc + (2^k - 1)$.

Thus, the general solution is $T(n) = 2^{n-1}c + (2^{n-1} - 1)$.

**Explanation**: The recurrence unrolling table shows how the recurrence relation $T(n) = 2T(n-1) + 1$ expands for the first few values of $n$. Each row represents the relation at a different $n$, with $T(n)$ expressed in terms of $T(n-1)$ and $T(n-2)$ where applicable.

The walkthrough explains the step-by-step process of solving the recurrence relation. It starts with an initial condition, then unrolls the recurrence for $n=2$ and $n=3$ to identify a pattern. A hypothesis for the general solution is proposed and verified through a base case and an inductive step.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "What is the term for the family of solutions that satisfy a given recurrence relation?",
    "textWithBlanks": "The [[Blank1]] is a solution that contains arbitrary constants.",
    "answer": ["general solution"],
    "explanation": "The general solution to a recurrence relation is a solution that contains arbitrary constants and encompasses all possible solutions to the relation."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "A general solution to a recurrence relation is unique.",
    "answer": false,
    "explanation": "A general solution to a recurrence relation is not unique because it contains arbitrary constants, leading to a family of solutions."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error in the following mathematical step.",
    "content": "Given a recurrence relation $T(n) = 2T(n-1) + 1$, the general solution is claimed to be $T(n) = 2^n \\cdot C - 1$, where $C$ is a constant.",
    "answer": "The incorrect substitution of the homogeneous solution into the particular solution; correct general solution should be of the form $T(n) = A \\cdot 2^n + B$.",
    "explanation": "The provided solution incorrectly applies the form of the solution to the given recurrence relation. The homogeneous part of the solution is $A \\cdot 2^n$, and a particular solution needs to be found to account for the constant term $+1$. A common guess for the particular solution in such cases is a constant $B$. Therefore, the general solution should be of the form $T(n) = A \\cdot 2^n + B$, not $2^n \\cdot C - 1$."
  }
]

```