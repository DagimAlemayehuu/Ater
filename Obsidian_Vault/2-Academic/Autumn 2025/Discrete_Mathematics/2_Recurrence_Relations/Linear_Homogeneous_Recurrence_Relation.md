---

title: Linear_Homogeneous_Recurrence_Relation
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
- "[[Homogeneous_Recurrence_Relation]]"

---

## 1. Mental Model

A Linear Homogeneous Recurrence Relation can be thought of as a financial transaction system where the balance at each step is determined by the previous balances, similar to how a recurrence relation defines each term as a function of preceding terms. Just as a specific payment schedule can be represented by a sequence of transactions, a Linear Homogeneous Recurrence Relation represents a sequence where each term is a linear combination of previous terms. The coefficients in the recurrence relation act like fixed transaction fees or interest rates that apply at each step.

## 2. Formal Definition & Structural Trace

A [[Linear_Homogeneous_Recurrence_Relation]] is defined as a sequence $a_n$ that satisfies a recurrence relation of the form $a_n = c_1a_{n-1} + c_2a_{n-2} + \cdots + c_ka_{n-k}$, where $c_1, c_2, \ldots, c_k$ are constants. This relation is [[Homogeneous_Recurrence_Relation|homogeneous]] because it is a linear combination of previous terms without any additional constant term. The [[Characteristic_Equation]] of this recurrence relation is $x^k - c_1x^{k-1} - c_2x^{k-2} - \cdots - c_k = 0$. The [[General_Solution]] to the recurrence relation can be expressed as a linear combination of terms formed by the roots of the characteristic equation. The [[Unique_Solution]] can be determined by the initial conditions of the sequence.

## 3. Boundary Cases & Counterexamples

When the characteristic equation has repeated roots, the general solution involves terms of the form $r^n$ and $nr^n$, where $r$ is a repeated root. If the initial conditions are not provided or are inconsistent, there may not be a unique solution to the recurrence relation. For a [[Second_Order_Linear_Homogeneous_Recurrence_Relation]], if the characteristic equation has no real roots, the sequence's terms may involve complex numbers. A non-homogeneous version of such a relation, like a [[Non_Homogeneous_Linear_Recurrence_Relation]], would have an additional constant term, altering its behavior significantly.

## 4. Discrete Proof Trace

### Recurrence Relation: $a_n = 2a_{n-1} + 3a_{n-2}$

### Unrolling Table:

| $n$ | $a_n$ | $a_{n-1}$ | $a_{n-2}$ |
| --- | --- | --- | --- |
| 0   | $a_0$ | -       | -       |
| 1   | $a_1$ | $a_0$   | -       |
| 2   | $2a_1 + 3a_0$ | $a_1$ | $a_0$ |
| 3   | $2(2a_1 + 3a_0) + 3a_1$ | $2a_1 + 3a_0$ | $a_1$ |
| ... | ... | ... | ... |

The unrolling table represents how each term in the sequence is generated based on the recurrence relation. Each row corresponds to a term in the sequence, with columns showing the term's value and its dependencies.

## 5. Walkthrough

1. **Define the Recurrence Relation**: The given Linear Homogeneous Recurrence Relation is $a_n = 2a_{n-1} + 3a_{n-2}$. This means that to find the value of the sequence at any term $n$, we need the values of the two preceding terms.

2. **Identify Initial Conditions**: Let's assume initial conditions $a_0 = 1$ and $a_1 = 2$. These are necessary to start computing the sequence.

3. **Compute $a_2$**: Using the recurrence relation, $a_2 = 2a_1 + 3a_0 = 2(2) + 3(1) = 4 + 3 = 7$.

4. **Compute $a_3$**: Again, using the recurrence relation, $a_3 = 2a_2 + 3a_1 = 2(7) + 3(2) = 14 + 6 = 20$.

5. **Verify the Sequence**: So far, the sequence is $a_0 = 1$, $a_1 = 2$, $a_2 = 7$, $a_3 = 20$. This step ensures that our calculations are correct.

6. **Generalize the Sequence**: For a Linear Homogeneous Recurrence Relation like $a_n = 2a_{n-1} + 3a_{n-2}$, the solution typically has the form $a_n = r^n$, where $r$ is a root of the characteristic equation $r^2 - 2r - 3 = 0$. Solving this equation gives $(r - 3)(r + 1) = 0$, so $r = 3$ or $r = -1$. Thus, the general solution is $a_n = c_1(3)^n + c_2(-1)^n$, where $c_1$ and $c_2$ are determined by initial conditions.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "Definition of Linear Homogeneous Recurrence Relation",
    "textWithBlanks": "A Linear Homogeneous Recurrence Relation is a recurrence relation of the form $a_n = c_1a_{n-1} + c_2a_{n-2} + \\ldots + c_ka_{n-k}$, where the [[Blank1]] are constants.",
    "answer": ["coefficients"],
    "explanation": "The definition of a Linear Homogeneous Recurrence Relation involves a linear combination of previous terms with constant coefficients."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "A Linear Homogeneous Recurrence Relation of order 2 has a solution of the form $a_n = r^n$ for some constant $r$.",
    "answer": true,
    "explanation": "The characteristic equation of a Linear Homogeneous Recurrence Relation of order 2 is of the form $r^2 - c_1r - c_2 = 0$, which indeed has solutions of the form $a_n = r^n$ for some constant $r$."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error in the following flawed mathematical step.",
    "content": "The characteristic equation of $a_n = 3a_{n-1} - 2a_{n-2}$ is $r^2 + 3r - 2 = 0$. Solving for $r$, we get $r = \\frac{-3 \\pm \\sqrt{9 + 8}}{2} = \\frac{-3 \\pm \\sqrt{17}}{2}$. Therefore, the general solution is $a_n = C_1\\left(\\frac{-3 + \\sqrt{17}}{2}\\right)^n$.",
    "answer": "The bug is that the general solution is incomplete; it should be $a_n = C_1\\left(\\frac{-3 + \\sqrt{17}}{2}\\right)^n + C_2\\left(\\frac{-3 - \\sqrt{17}}{2}\\right)^n$.",
    "explanation": "The characteristic equation has two distinct roots, so the general solution must include both roots."
  }
]

```