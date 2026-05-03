---

title: Recursive_Definition
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: '[[2_Recurrence_Relations_Hub]]'
source: '[[2_Recurrence_Relations.pdf]]'
source_pages:
- 9
mode: MATH-DISCRETE
read: false
generated: true
prerequisites:
- '[[Sequence_Definition]]'
- '[[Recurrence_Relation_Definition]]'
- '[[Linear_Recurrence_Relation]]'
- '[[Homogeneous_Recurrence_Relation]]'
- '[[Non_Homogeneous_Linear_Recurrence_Relation]]'

---


## 1. Mental Model

A recursive definition can be thought of as a set of instructions that are similar to a game of dominoes, where the falling of one domino triggers the falling of the next, with the initial push representing the base case. Just as each domino's fall is determined by the previous one, a recursive definition determines each term in a sequence based on previous terms. The mechanism matches in that both involve a repetitive application of a rule, with the recursive definition applying a rule to earlier values to find present and future values.

## 2. Formal Definition & Structural Trace

A [[Recursive_Definition]] provides a way to define a [[Sequence_Definition]] or a function in terms of itself. This is often achieved through a [[Recurrence_Relation_Definition]], which specifies how to find the next term in a sequence given one or more preceding terms. For a [[Linear_Recurrence_Relation]], the relationship between successive terms is linear, and it can be [[Homogeneous_Recurrence_Relation]] or [[Non_Homogeneous_Linear_Recurrence_Relation]]. Solving these relations often involves finding the [[Characteristic_Equation]] and then determining the [[General_Solution]], from which a [[Unique_Solution]] can be found given appropriate initial conditions. The solution to a [[Linear_Homogeneous_Recurrence_Relation]] can typically be expressed as a linear combination of terms formed from the roots of the characteristic equation.

## 3. Boundary Cases & Counterexamples

Boundary cases for recursive definitions include the base case, which must be defined to prevent infinite recursion, and the case where the recurrence relation does not apply, such as for sequences defined only for positive integers. A failure state can occur if the base case is not properly defined or if the recurrence relation leads to a situation that cannot be resolved, such as division by zero. For [[Second_Order_Linear_Homogeneous_Recurrence_Relation]] and [[Kth_Order_Linear_Homogeneous_Recurrence_Relation]], if the characteristic equation has repeated roots, the solution involves terms that increase linearly with the index, which must be accounted for in the [[General_Solution]]. The process of finding a [[Unique_Solution]] relies on having as many initial conditions as the order of the recurrence relation.

## 4. Discrete Proof Trace

### Recurrence Unrolling Table

Let's consider a simple recursive sequence defined as:
- $a_0 = 2$
- $a_n = 3a_{n-1} + 1$ for $n > 0$

We will unroll this recurrence to find $a_3$.

| $n$ | $a_n$ | Calculation          |
|-----|-------|----------------------|
| 0   | 2     | Given                |
| 1   | 7     | $3 \cdot 2 + 1$      |
| 2   | 22    | $3 \cdot 7 + 1$      |
| 3   | 67    | $3 \cdot 22 + 1$     |

Each part of the table represents a step in the recurrence relation. The first column ($n$) indicates the term number in the sequence, the second column ($a_n$) gives the value of that term, and the third column (Calculation) shows how the value was computed using the recurrence relation.

## 5. Walkthrough

1. **Base Case Identification**: The base case of the recurrence is given as $a_0 = 2$. This provides the starting point for unrolling the recurrence.

2. **First Term Calculation**: To find $a_1$, we substitute $n = 1$ into the recurrence relation: $a_1 = 3a_0 + 1$. Given $a_0 = 2$, we compute $a_1 = 3 \cdot 2 + 1 = 6 + 1 = 7$.

3. **Second Term Calculation**: For $a_2$, we use $a_1$ in the recurrence relation: $a_2 = 3a_1 + 1$. Given $a_1 = 7$, we compute $a_2 = 3 \cdot 7 + 1 = 21 + 1 = 22$.

4. **Third Term Calculation**: To find $a_3$, we apply the recurrence relation again: $a_3 = 3a_2 + 1$. Given $a_2 = 22$, we compute $a_3 = 3 \cdot 22 + 1 = 66 + 1 = 67$.

5. **Verification**: We verify that our calculations are consistent with the recurrence unrolling table provided.

6. **Conclusion**: Through the step-by-step application of the recurrence relation, we have found that $a_3 = 67$. This demonstrates how a recursive definition can be systematically unrolled to find specific terms in a sequence.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "What is the core concept of a recursive definition?",
    "textWithBlanks": "A recursive definition is a method of defining a sequence or function where each term is defined in terms of [[Blank1]]",
    "answer": ["previous terms"],
    "explanation": "This definition is fundamental to understanding recursive definitions, emphasizing that each term in a sequence or function is defined based on earlier terms."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "A recursive definition must have a base case that is never used in the recursive steps.",
    "answer": false,
    "explanation": "A recursive definition requires a base case that stops the recursion. The base case is essential and is used to terminate the recursive calls, making this statement false."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error in the following flawed mathematical step using block LaTeX.",
    "content": "Given a recursive sequence defined by $a_n = 2a_{n-1} + 1$, the solution claims that $a_n = 2^n - 1$ is a valid closed-form expression. The flawed step to verify this is: $$a_n = 2a_{n-1} + 1 = 2(2^{n-1} - 1) + 1 = 2^n - 2 + 1 = 2^n - 1$$",
    "answer": "The bug is that the initial condition or base case was not verified or considered; assuming $a_1 = 1$ fits $2^1 - 1 = 1$, but this verification step was skipped.",
    "explanation": "The provided step seems mathematically correct given the assumed formula; however, a critical error lies in not checking the base case of the recursion or initial conditions to ensure the proposed solution $a_n = 2^n - 1$ aligns with them."
  }
]

```