---

title: Kth_Order_Linear_Homogeneous_Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.pdf]]"
source_pages:
- 22
mode: MATH-DISCRETE
read: false
generated: true
prerequisites:
- "[[Linear_Homogeneous_Recurrence_Relation]]"

---

## 1. Mental Model

A Kth Order Linear Homogeneous Recurrence Relation can be thought of as a sequence of values where each term is determined by a linear combination of the previous k terms, similar to a [[Sequence_Definition]] where each element depends on a fixed number of preceding elements. This is analogous to a graph where each node has a fixed number of incoming edges from previous nodes, specifically a [[Kth_Order_Linear_Homogeneous_Recurrence_Relation]] can be visualized as a graph with a structure that repeats every k nodes. The coefficients of the linear combination can be seen as weights on these edges.

## 2. Formal Definition & Structural Trace

A Kth Order Linear Homogeneous Recurrence Relation is defined as a sequence [[Sequence_Notation]] that satisfies the [[Recursive_Definition]]: $c_0a_n + c_1a_{n-1} + c_2a_{n-2} + \cdots + c_ka_{n-k} = 0$ for $n \geq k$, which is a specific type of [[Recurrence_Relation_Definition]] known as a [[Linear_Recurrence_Relation]] and more specifically a [[Homogeneous_Recurrence_Relation]]. The [[Characteristic_Equation]] of this recurrence relation is obtained by substituting $a_n = r^n$ into the recurrence relation, yielding $c_0r^n + c_1r^{n-1} + \cdots + c_kr^{n-k} = 0$. The [[General_Solution]] to the recurrence relation can be expressed in terms of the roots of the characteristic equation.

## 3. Boundary Cases & Counterexamples

When dealing with a Kth Order Linear Homogeneous Recurrence Relation, boundary cases occur when the initial conditions are not provided or are inconsistent, leading to a non-[[Unique_Solution]]. For instance, if $k=2$ and the recurrence relation is $a_n = 3a_{n-1} - 2a_{n-2}$, but the initial conditions $a_0$ and $a_1$ are not specified, there are infinitely many solutions. A counterexample to a flawed solution would be incorrectly solving the [[Characteristic_Equation]] $r^2 - 3r + 2 = 0$ as $r^2 = 3r - 2$, which would incorrectly imply roots of $r = 1$ and $r = 2$, leading to an incorrect [[General_Solution]].

## 4. Discrete Proof Trace

### Recurrence Relation: $a_n = 3a_{n-1} + 2a_{n-2}$

### Unrolling Table:

| $n$ | $a_n$ | $a_{n-1}$ | $a_{n-2}$ |
| --- | --- | --- | --- |
| 2   | $3a_1 + 2a_0$ | $a_1$ | $a_0$ |
| 3   | $3(3a_1 + 2a_0) + 2a_1$ | $3a_1 + 2a_0$ | $a_1$ |
| 4   | $3(3(3a_1 + 2a_0) + 2a_1) + 2(3a_1 + 2a_0)$ | $3(3a_1 + 2a_0) + 2a_1$ | $3a_1 + 2a_0$ |

The unrolling table represents the recurrence relation $a_n = 3a_{n-1} + 2a_{n-2}$ for the first few terms, showing how each term depends on the two preceding terms. Each row corresponds to a specific term in the sequence, with columns for the term number, the term itself, and the two preceding terms.

## 5. Walkthrough

1. **Given Recurrence Relation**: $a_n = 3a_{n-1} + 2a_{n-2}$. This means that to find the $n$th term, we need the $(n-1)$th and $(n-2)$th terms.

2. **Initial Conditions Needed**: To solve this recurrence relation, we typically need initial conditions such as $a_0$ and $a_1$. Let's assume $a_0 = 1$ and $a_1 = 2$ for simplicity.

3. **Calculate $a_2$**: Using the recurrence relation, $a_2 = 3a_1 + 2a_0 = 3(2) + 2(1) = 6 + 2 = 8$.

4. **Calculate $a_3$**: Now, $a_3 = 3a_2 + 2a_1 = 3(8) + 2(2) = 24 + 4 = 28$.

5. **Calculate $a_4$**: Then, $a_4 = 3a_3 + 2a_2 = 3(28) + 2(8) = 84 + 16 = 100$.

6. **Generalizing the Solution**: The solution to the recurrence relation can often be expressed in a closed form, $a_n = A(r_1)^n + B(r_2)^n$, where $r_1$ and $r_2$ are the roots of the characteristic equation $x^2 - 3x - 2 = 0$. Solving this equation: $(x - (3/2 + \sqrt{17}/2))(x - (3/2 - \sqrt{17}/2)) = 0$, yields roots $r_1 = (3 + \sqrt{17})/2$ and $r_2 = (3 - \sqrt{17})/2$. Therefore, $a_n = A((3 + \sqrt{17})/2)^n + B((3 - \sqrt{17})/2)^n$. Using initial conditions to solve for $A$ and $B$ gives specific values.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "Definition of Kth Order Linear Homogeneous Recurrence Relation",
    "textWithBlanks": "A Kth Order Linear Homogeneous Recurrence Relation is a sequence where each term is a linear combination of the [[Blank1]] preceding terms.",
    "answer": ["k"],
    "explanation": "By definition, a Kth Order Linear Homogeneous Recurrence Relation depends on k previous terms."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "A 2nd Order Linear Homogeneous Recurrence Relation can have a characteristic equation with only one root.",
    "answer": true,
    "explanation": "This is possible and leads to a repeated root in the characteristic equation."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error in the mathematical step.",
    "content": "The characteristic equation of a 2nd order linear homogeneous recurrence relation $a_n = 3a_{n-1} - 2a_{n-2}$ is given by $r^2 - 3r - 2 = 0$.",
    "answer": "The correct characteristic equation should be $r^2 - 3r + 2 = 0$. The error is the wrong sign in front of the 2.",
    "explanation": "The given recurrence relation $a_n = 3a_{n-1} - 2a_{n-2}$ should have a characteristic equation of $r^2 - 3r + 2 = 0$, not $r^2 - 3r - 2 = 0$."
  }
]

```