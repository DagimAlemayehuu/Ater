---

title: Linear_Recurrence_Relation
type: Atomic Note
course: Discrete Mathematics
semester: Autumn 2025
unit: '2'
hub: "[[2_Recurrence_Relations_Hub]]"
source: "[[2_Recurrence_Relations.pdf]]"
source_pages:
- 13
mode: MATH-DISCRETE
read: false
generated: true
prerequisites:
- "[[Recurrence_Relation_Definition]]"

---

## 1. Mental Model

A linear recurrence relation can be thought of as a sequence of numbers where each term is determined by a linear combination of previous terms, similar to a financial budgeting plan where expenses are calculated based on previous expenditures. Just as a budgeting plan has a fixed set of rules (expenses and income) that determine the future financial state, a linear recurrence relation has a fixed set of coefficients that determine the next term in the sequence. The mechanism matches in that both involve a systematic, rule-based approach to calculating future values based on past values.

## 2. Formal Definition & Structural Trace

A [[Linear_Recurrence_Relation]] is defined as a recurrence relation of the form $c_0a_n + c_1a_{n-1} + c_2a_{n-2} + \cdots + c_ka_{n-k} = f(n)$, where $c_0, c_k \neq 0$ and $1 \leq k \leq n$. This relation is termed linear because each term is a linear combination of previous terms and $f(n)$. The [[Sequence_Definition]] of a linear recurrence relation can be expressed using [[Sequence_Notation]] as $a_n = \frac{f(n) - (c_1a_{n-1} + c_2a_{n-2} + \cdots + c_ka_{n-k})}{c_0}$. A [[Recursive_Definition]] provides a basis for computing each term. For a [[Homogeneous_Recurrence_Relation]], $f(n) = 0$, simplifying the relation. The solution to such equations often involves finding the [[Characteristic_Equation]].

## 3. Boundary Cases & Counterexamples

When dealing with linear recurrence relations, boundary cases often involve initial conditions that must be satisfied, such as $a_0$ and $a_1$. For instance, a [[Second_Order_Linear_Homogeneous_Recurrence_Relation]] like $a_n = 5a_{n-1} - 6a_{n-2}$ requires two initial conditions. A failure state can occur if the initial conditions are not properly specified or if the relation is not correctly defined, leading to incorrect solutions. For example, incorrectly solving a [[Non_Homogeneous_Linear_Recurrence_Relation]] could involve overlooking the particular solution that accounts for $f(n)$, resulting in an incorrect [[General_Solution]].

## 4. Discrete Proof Trace

### Linear Recurrence Relation: $a_n = 2a_{n-1} + 3a_{n-2}$

Let's prove by induction that the solution to the recurrence relation $a_n = 2a_{n-1} + 3a_{n-2}$ with initial conditions $a_0 = 1$ and $a_1 = 2$ is $a_n = 3^n - 2^n$.

#### Base Case
- For $n=0$: $a_0 = 3^0 - 2^0 = 1 - 1 = 0$ is incorrect; let's correct that with actual base case values.
- Given $a_0 = 1$ and $a_1 = 2$, let's verify if $a_n = 3^n - 2^n$ holds for $n=0$ and $n=1$:
  - For $n=0$: $3^0 - 2^0 = 1 - 1 = 0$ does not match $a_0 = 1$. Let's correct our approach.

#### Corrected Approach: Direct Proof and Recurrence Unrolling

Given:
- $a_n = 2a_{n-1} + 3a_{n-2}$

Assume a solution of the form $a_n = r^n$:
- $r^n = 2r^{n-1} + 3r^{n-2}$

Divide through by $r^{n-2}$:
- $r^2 = 2r + 3$

## 5. Walkthrough

1. **Formulate the Characteristic Equation**: The characteristic equation of the recurrence relation $a_n = 2a_{n-1} + 3a_{n-2}$ is obtained by substituting $a_n = r^n$ into the recurrence relation, yielding $r^2 = 2r + 3$.

2. **Solve the Characteristic Equation**: Solve $r^2 - 2r - 3 = 0$.
   - Factor: $(r - 3)(r + 1) = 0$
   - Roots: $r = 3$ or $r = -1$

3. **General Solution**: The general solution to the recurrence relation is of the form $a_n = A(3)^n + B(-1)^n$, where $A$ and $B$ are constants.

4. **Apply Initial Conditions**: Given $a_0 = 1$ and $a_1 = 2$:
   - For $n=0$: $1 = A(3)^0 + B(-1)^0 = A + B$
   - For $n=1$: $2 = A(3)^1 + B(-1)^1 = 3A - B$

5. **Solve for A and B**:
   - From $1 = A + B$ and $2 = 3A - B$, adding both equations gives $3 = 4A$ or $A = \frac{3}{4}$.
   - Substituting $A = \frac{3}{4}$ into $1 = A + B$ yields $1 = \frac{3}{4} + B$, hence $B = \frac{1}{4}$.

6. **Specific Solution**: Substituting $A = \frac{3}{4}$ and $B = \frac{1}{4}$ into the general solution gives $a_n = \frac{3}{4}(3)^n + \frac{1}{4}(-1)^n$.

**The artifact represents a step-by-step derivation of a specific solution to a linear recurrence relation using its characteristic equation and initial conditions. Each part, from formulating the characteristic equation to solving for A and B, demonstrates how to systematically solve a linear recurrence relation.**

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "Definition of Linear Recurrence Relation",
    "textWithBlanks": "A linear recurrence relation is a sequence of numbers where each term is determined by a [[Blank1]] combination of previous terms.",
    "answer": ["linear"],
    "explanation": "A linear recurrence relation is defined as a sequence where each term is a linear combination of previous terms."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "A linear recurrence relation can have a non-linear term.",
    "answer": false,
    "explanation": "By definition, a linear recurrence relation only involves linear combinations of previous terms, not non-linear terms."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error in the mathematical step.",
    "content": "Given a linear recurrence relation: $a_n = 2a_{n-1} + 3a_{n-2}$. To find $a_n$, we substitute $a_{n-1} = \\frac{1}{2}a_n$ and get $a_n = 2(\\frac{1}{2}a_n) + 3a_{n-2}$. This simplifies to $a_n = a_n + 3a_{n-2}$. Therefore, $3a_{n-2} = 0$.",
    "answer": "The bug is in the substitution step; it should be $a_{n-2}$ expressed in terms of $a_n$ and $a_{n-1}$, not $a_{n-1}$ in terms of $a_n$. The correct approach would involve characteristic equations.",
    "explanation": "The error lies in incorrectly substituting $a_{n-1}$ in terms of $a_n$ which does not make sense in the context of solving recurrence relations. Typically, one would solve such relations using characteristic equations."
  }
]

```