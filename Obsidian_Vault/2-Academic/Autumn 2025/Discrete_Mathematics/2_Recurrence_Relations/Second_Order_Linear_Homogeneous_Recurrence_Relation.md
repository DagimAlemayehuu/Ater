---

title: Second_Order_Linear_Homogeneous_Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.pdf]]"
source_pages:
- 19
mode: MATH-DISCRETE
read: false
generated: true
prerequisites:
- "[[Linear_Homogeneous_Recurrence_Relation]]"

---

## 1. Mental Model

A second-order linear homogeneous recurrence relation can be thought of as a game of billiards where each shot's trajectory depends on the previous two shots' positions and directions. Just as the trajectory of a shot is determined by the positions and directions of the two preceding shots, the value of the sequence at any term is determined by the two preceding terms. The coefficients in the recurrence relation play the role of the physical laws governing the billiard table, dictating how each shot's position and direction are calculated from the previous shots.

## 2. Formal Definition & Structural Trace

A [[Second_Order_Linear_Homogeneous_Recurrence_Relation]] is defined by the equation $c_0a_n + c_1a_{n-1} + c_2a_{n-2} = 0$ for $n \geq 2$, where $c_0$, $c_1$, and $c_2$ are constants, and $c_0 \neq 0, c_2 \neq 0$. This equation is a specific case of a [[Linear_Homogeneous_Recurrence_Relation]], which is a [[Homogeneous_Recurrence_Relation]] that can be expressed as a linear combination of previous terms. The [[Characteristic_Equation]] of this recurrence relation is obtained by substituting $a_n = r^n$ into the recurrence relation, yielding $c_0r^2 + c_1r + c_2 = 0$. The [[General_Solution]] to the recurrence relation depends on the roots of the characteristic equation. The [[Unique_Solution]] can be determined if initial conditions $a_0$ and $a_1$ are given.

## 3. Boundary Cases & Counterexamples

When the characteristic equation has repeated roots, the general solution to the [[Second_Order_Linear_Homogeneous_Recurrence_Relation]] takes a specific form that must be accounted for. If $c_0 = 0$ or $c_2 = 0$, the relation does not hold as a second-order linear homogeneous recurrence relation. For instance, if $c_2 = 0$, it becomes a first-order relation. A counterexample to a general solution method would be a relation where the characteristic equation has complex roots, requiring a different approach to find the [[General_Solution]], such as using [[Solving_Linear_Homogeneous_Recurrence_Relations]] techniques.

## 4. Discrete Proof Trace

### Recurrence Relation: $a_n = 3a_{n-1} - 2a_{n-2}$

### Unrolling Table:

| $n$ | $a_n$ | $a_{n-1}$ | $a_{n-2}$ |
| --- | --- | --- | --- |
| 0   | $a_0$ | -     | -     |
| 1   | $a_1$ | $a_0$ | -     |
| 2   | $3a_1 - 2a_0$ | $a_1$ | $a_0$ |
| 3   | $3(3a_1 - 2a_0) - 2a_1$ | $3a_1 - 2a_0$ | $a_1$ |
| ... | ... | ... | ... |

The unrolling table represents the step-by-step calculation of the recurrence relation. Each row shows the values of $a_n$, $a_{n-1}$, and $a_{n-2}$ for a given $n$.

The recurrence relation $a_n = 3a_{n-1} - 2a_{n-2}$ represents how each term in the sequence is calculated from the two preceding terms.

## 5. Walkthrough

1. **Initial Conditions**: We start with a second-order linear homogeneous recurrence relation: $a_n = 3a_{n-1} - 2a_{n-2}$. We are given initial conditions $a_0$ and $a_1$.
2. **Calculate $a_2$**: Using the recurrence relation, we calculate $a_2 = 3a_1 - 2a_0$.
3. **Calculate $a_3$**: Substitute $a_2$ and $a_1$ into the recurrence relation: $a_3 = 3a_2 - 2a_1 = 3(3a_1 - 2a_0) - 2a_1 = 9a_1 - 6a_0 - 2a_1 = 7a_1 - 6a_0$.
4. **Identify Pattern**: Observe the calculations for $a_2$ and $a_3$ to identify a pattern. It seems that $a_n = (2^n + 1)a_0 + (2^n - 1)a_1$ could be a solution.
5. **Verify Base Cases**: Verify that the proposed solution satisfies the base cases: $a_0 = (2^0 + 1)a_0 + (2^0 - 1)a_1 = 2a_0$ and $a_1 = (2^1 + 1)a_0 + (2^1 - 1)a_1 = 3a_0 + a_1$. Adjust the proposed solution to fit: $a_n = (2^n - 1)a_0 + (2^n)a_1$ seems incorrect based on miscalculation; correct approach involves solving characteristic equation.
6. **Solve Characteristic Equation**: The characteristic equation of the recurrence relation is $r^2 - 3r + 2 = 0$. Factoring gives $(r-1)(r-2) = 0$, so $r = 1$ or $r = 2$. Thus, the general solution is $a_n = c_1(1)^n + c_2(2)^n$. Using initial conditions $a_0$ and $a_1$, we find $c_1$ and $c_2$.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "Define a second-order linear homogeneous recurrence relation.",
    "textWithBlanks": "A second-order linear homogeneous recurrence relation is a sequence where each term is defined as [[Blank1]].",
    "answer": ["a_n = c1*a_(n-1) + c2*a_(n-2)"],
    "explanation": "A second-order linear homogeneous recurrence relation is defined as a sequence where each term a_n is a linear combination of the two preceding terms, a_(n-1) and a_(n-2), with constant coefficients c1 and c2."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "Consider a second-order linear homogeneous recurrence relation with constant coefficients. If the characteristic equation has a repeated root, then the general solution is of the form A*r^n + B*n*r^n.",
    "answer": true,
    "explanation": "When the characteristic equation of a second-order linear homogeneous recurrence relation with constant coefficients has a repeated root r, the general solution to the recurrence relation is indeed of the form A*r^n + B*n*r^n, where A and B are constants."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error in the solution step.",
    "content": "Given the recurrence relation: $a_n = 3a_{n-1} - 2a_{n-2}$. Assuming solutions of the form $a_n = r^n$, we get the characteristic equation $r^2 = 3r - 2$. Solving, $(r - 1)(r - 2) = 0$, so $r = 1$ or $r = 2$. The general solution is claimed to be $a_n = C_1(1)^{n-1} + C_2(2)^n$.",
    "answer": "The error is in the general solution; it should be $a_n = C_1(1)^n + C_2(2)^n$.",
    "explanation": "The general solution to the recurrence relation should have the same power of n for both terms, thus $a_n = C_1(1)^n + C_2(2)^n$ is correct."
  }
]

```