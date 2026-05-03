---

title: Characteristic_Equation
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.pdf]]"
source_pages:
- 17
mode: MATH-DISCRETE
read: false
generated: true
prerequisites:
- "[[Homogeneous_Recurrence_Relation]]"

---

## 1. Mental Model

The characteristic equation can be thought of as a genetic blueprint for a sequence, where the roots of the equation determine the genes that make up the sequence's DNA. Just as a genetic code is used to construct an organism, the roots of the characteristic equation are used to construct the terms of a sequence defined by a [[Recurrence_Relation_Definition]]. The coefficients of the characteristic equation serve as the regulatory mechanisms that control the expression of the roots, much like how regulatory genes control the expression of other genes.

## 2. Formal Definition & Structural Trace

A [[Characteristic_Equation]] is a polynomial equation of the form $c_0r^k + c_1r^{k-1} + c_2r^{k-2} + \cdots + c_{k-1}r + c_k = 0$, which is derived from a [[Linear_Homogeneous_Recurrence_Relation]] of order $k$. The equation is used to find the roots that will help in determining the [[General_Solution]] of the recurrence relation. The [[Sequence_Definition]] of a sequence can be expressed in terms of its [[Recursive_Definition]], which can then be transformed into a [[Recurrence_Relation_Definition]] and subsequently into a characteristic equation. Solving the characteristic equation yields the roots needed to construct the [[Unique_Solution]] of the recurrence relation. The solution involves finding the [[General_Solution]] and applying initial conditions.

## 3. Boundary Cases & Counterexamples

When the characteristic equation has repeated roots, the [[General_Solution]] of the recurrence relation takes on a different form than when all roots are distinct. If the characteristic equation has no roots (i.e., it is the zero polynomial), then the recurrence relation may not have a solution in the usual sense. In cases where the recurrence relation is not [[Linear_Homogeneous_Recurrence_Relation|homogeneous]], a different approach is needed, such as finding a particular solution to the [[Non_Homogeneous_Linear_Recurrence_Relation]]. The [[Characteristic_Equation]] provides a crucial link between the recurrence relation and its solution, but its applicability is limited to [[Linear_Homogeneous_Recurrence_Relation|linear_Homogeneous]] cases.

## 4. Discrete Proof Trace

### Characteristic Equation for a Recurrence Relation

Given the recurrence relation: $a_n = 3a_{n-1} - 2a_{n-2}$.

The characteristic equation is obtained by substituting $a_n = r^n$ into the recurrence relation:
$$r^n = 3r^{n-1} - 2r^{n-2}$$

Divide through by $r^{n-2}$:
$$r^2 = 3r - 2$$

Rearrange to get the characteristic equation:
$$r^2 - 3r + 2 = 0$$

## Characteristic Equation Explanation

The characteristic equation $r^2 - 3r + 2 = 0$ represents the genetic blueprint for the sequence, where the roots of the equation determine the terms of the sequence. The coefficients of the characteristic equation serve as regulatory mechanisms that control the expression of the roots.

## 5. Walkthrough

1. **Start with the recurrence relation**: $a_n = 3a_{n-1} - 2a_{n-2}$. This defines how each term in the sequence is generated from the preceding terms.

2. **Substitute $a_n = r^n$ into the recurrence relation**: By assuming that $a_n$ is of the form $r^n$, we get $r^n = 3r^{n-1} - 2r^{n-2}$. This substitution is key to finding the characteristic equation.

3. **Divide through by $r^{n-2}$**: Dividing each term by $r^{n-2}$ (assuming $r \neq 0$) yields $r^2 = 3r - 2$. This step simplifies the equation.

4. **Rearrange to get the characteristic equation**: Rearranging the terms gives $r^2 - 3r + 2 = 0$. This is the characteristic equation.

5. **Solve the characteristic equation**: We solve $r^2 - 3r + 2 = 0$ to find its roots. Factoring gives $(r - 2)(r - 1) = 0$, so $r = 2$ or $r = 1$.

6. **Interpret the roots**: The roots $r = 2$ and $r = 1$ indicate that the general solution to the recurrence relation is of the form $a_n = A(2)^n + B(1)^n$, where $A$ and $B$ are constants determined by initial conditions.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "What is the term for the equation that determines the roots used to construct a sequence defined by a recurrence relation?",
    "textWithBlanks": "The [[Characteristic_Equation]] is used to construct the terms of a sequence defined by a [[Recurrence_Relation_Definition]].",
    "answer": ["Characteristic Equation"],
    "explanation": "The characteristic equation is a fundamental concept in solving recurrence relations, as its roots are used to construct the terms of the sequence."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "The characteristic equation of a recurrence relation has a repeated root if and only if the recurrence relation has a repeated term in its homogeneous solution.",
    "answer": false,
    "explanation": "The characteristic equation having a repeated root actually implies that the homogeneous solution will have terms of the form $a_n = (A + Bn) \\cdot r^n$, where $r$ is the repeated root."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error in the following flawed mathematical step.",
    "content": "The characteristic equation for the recurrence $a_n = 3a_{n-1} + 4a_{n-2}$ is $x^2 - 3x - 4 = 0$. Solving for $x$, we get $x = \\frac{-(-3) \\pm \\sqrt{(-3)^2 - 4(1)(4)}}{2(1)} = \\frac{3 \\pm \\sqrt{9 + 16}}{2} = \\frac{3 \\pm \\sqrt{25}}{2} = \\frac{3 \\pm 5}{2}$. Therefore, the roots are $x = \\frac{3 + 5}{2} = 4$ and $x = \\frac{3 - 5}{2} = -1$.",
    "answer": "The equation should be $x^2 - 3x - 4 = 0$ but it becomes $x^2 + 3x - 4 = 0$ if we were to follow the standard procedure; however, the actual error in calculation here is in writing the equation as is; no error in roots calculation from given equation.",
    "explanation": "The provided characteristic equation $x^2 - 3x - 4 = 0$ and its solution seem correct given the recurrence relation $a_n = 3a_{n-1} + 4a_{n-2}$. The calculation of roots is also correct."
  }
]

```