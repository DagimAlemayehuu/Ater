---

title: Sequence_Definition
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: '[[2_Recurrence_Relations_Hub]]'
source: '[[2_Recurrence_Relations.pdf]]'
source_pages:
- 4
mode: MATH-DISCRETE
read: false
generated: true
prerequisites:
- '[[Sequence_Notation]]'
- '[[Recurrence_Relation_Definition]]'
- '[[Characteristic_Equation]]'
- '[[General_Solution]]'
- '[[Unique_Solution]]'

---


## 1. Mental Model

A sequence definition can be thought of as a library's catalog system, where each book represents a term in the sequence, and the catalog number represents the term's position in the sequence. Just as a library's catalog system allows for the organization and retrieval of books based on their catalog numbers, a sequence definition provides a way to generate and access terms in the sequence based on their index. The mechanism matches in that both involve a mapping from an index (catalog number or term position) to a specific value (book or term).

## 2. Formal Definition & Structural Trace

A [[Sequence_Definition]] is a function whose domain is a subset of integers, typically of the form $n \geq n_0$, where $n_0$ is an integer, often 1. The [[Sequence_Notation]] is used to denote a sequence, where $a_n$ represents the $n$-th term of the sequence. A sequence can be defined [[Recursive_Definition|recursively]] using a [[Recurrence_Relation_Definition]], which specifies a relationship between terms in the sequence. For example, a [[Linear_Recurrence_Relation|linear_Recurrence_Relation]] can be used to define a sequence, and its [[Characteristic_Equation]] can be used to find the [[General_Solution]]. The [[Unique_Solution]] to a recurrence relation can be found using initial conditions.

## 3. Boundary Cases & Counterexamples

When dealing with sequence definitions, boundary cases often arise when considering negative indices or indices less than $n_0$. For instance, the sequence $a_n = \frac{1}{n}$ for $n \geq 1$ is not defined for $n < 1$, and attempting to evaluate $a_{-1}$ would be outside the domain of the sequence. A [[Non_Homogeneous_Linear_Recurrence_Relation]] may have a particular solution that must be considered when finding the general solution. Additionally, a [[Second_Order_Linear_Homogeneous_Recurrence_Relation]] may have a characteristic equation with repeated roots, requiring special handling to find the [[General_Solution]].

## 4. Discrete Proof Trace

### Recurrence Unrolling Table

Given the sequence $a_n = 2a_{n-1} + 3$, with initial condition $a_0 = 1$.

| $n$ | $a_n$ | $2a_{n-1}$ | $2a_{n-1} + 3$ |
| --- | --- | --- | --- |
| 0   | 1     | -       | -             |
| 1   | 5     | 2       | 2*1 + 3 = 5   |
| 2   | 13    | 10      | 2*5 + 3 = 13  |
| 3   | 29    | 26      | 2*13 + 3 = 29 |

LaTeX code for the table:

```latex

\begin{tabular}{| c | c | c | c |}
\hline
$n$ & $a_n$ & $2a_{n-1}$ & $2a_{n-1} + 3$ \\
\hline
0   & 1     & -       & -             \\
1   & 5     & 2       & 2*1 + 3 = 5   \\
2   & 13    & 10      & 2*5 + 3 = 13  \\
3   & 29    & 26      & 2*13 + 3 = 29  \\
\hline
\end{tabular}

```

The recurrence unrolling table represents the sequence $a_n = 2a_{n-1} + 3$ by showing the calculation of each term based on the previous term. Each row corresponds to a term in the sequence, with columns showing the term index $n$, the term value $a_n$, the value of $2a_{n-1}$, and the final calculation $2a_{n-1} + 3$.

## 5. Walkthrough

1. **Initial Condition**: Start with the given initial condition $a_0 = 1$.
2. **Calculate $a_1$**: Using the recurrence relation $a_n = 2a_{n-1} + 3$, substitute $n = 1$ and $a_0 = 1$ to get $a_1 = 2a_0 + 3 = 2*1 + 3 = 5$.
3. **Calculate $a_2$**: Substitute $n = 2$ and $a_1 = 5$ into the recurrence relation to get $a_2 = 2a_1 + 3 = 2*5 + 3 = 13$.
4. **Calculate $a_3$**: Substitute $n = 3$ and $a_2 = 13$ into the recurrence relation to get $a_3 = 2a_2 + 3 = 2*13 + 3 = 29$.
5. **Tabulate Results**: Organize the calculated terms into a table to visualize the sequence and its calculations.
6. **Verify Calculations**: Review each step to ensure that the arithmetic is correct and the recurrence relation is properly applied.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "What is the term used to describe a function that generates a sequence of numbers?",
    "textWithBlanks": "The [[Sequence_Definition]] is a function that generates a sequence of numbers.",
    "answer": ["sequence definition"],
    "explanation": "A sequence definition is a function that generates a sequence of numbers, where each number is associated with a unique index or position in the sequence."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "A sequence definition can have multiple terms with the same value at different indices.",
    "answer": true,
    "explanation": "A sequence definition can indeed have multiple terms with the same value at different indices. For example, the sequence definition $a_n = (-1)^n$ has terms that alternate between -1 and 1."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error in the following mathematical step.",
    "content": "Given a sequence definition $a_n = \\frac{1}{n}$, find the sum $\\sum_{n=1}^{\\infty} a_n$. The flawed step is: $\\sum_{n=1}^{\\infty} \\frac{1}{n} = \\int_{1}^{\\infty} \\frac{1}{x} dx = \\ln|x| \\Big|_{1}^{\\infty} = \\ln(\\infty) - \\ln(1) = \\infty - 0 = \\infty$.",
    "answer": "The bug is that the integral test for series convergence was misapplied; the improper integral $\\int_{1}^{\\infty} \\frac{1}{x} dx$ diverges, which actually indicates that the series $\\sum_{n=1}^{\\infty} \\frac{1}{n}$ diverges, but the conclusion about the series sum being infinity is not properly justified.",
    "explanation": "The series $\\sum_{n=1}^{\\infty} \\frac{1}{n}$ is known as the harmonic series and it diverges, but its sum is not a finite number like $\\infty$. Instead, it diverges to infinity, meaning that it grows without bound. The error in the step provided is notational and conceptual: it suggests an equality to $\\infty$ which might be misleading because it implies a defined value."
  }
]

```