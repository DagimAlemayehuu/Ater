---

title: Solving_Linear_Homogeneous_Recurrence_Relations
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
- "[[Linear_Homogeneous_Recurrence_Relation]]"

---

## 1. Mental Model

A problem of solving linear homogeneous recurrence relations can be thought of as navigating a graph where each node represents a term in the sequence and the edges represent the relationships between successive terms. Just as in a graph, where the path to a node is determined by the edges and previous nodes, in a linear homogeneous recurrence relation, each term is determined by previous terms and the fixed relationships (coefficients) between them. The characteristic equation of the recurrence relation can be seen as a tool to find a 'shortcut' or a general formula to reach any term without having to traverse every node sequentially.

## 2. Formal Definition & Structural Trace

A linear homogeneous recurrence relation is defined as a sequence [[Sequence_Definition]] that follows the pattern $a_n = c_1a_{n-1} + c_2a_{n-2} + \cdots + c_ka_{n-k}$, where $c_1, c_2, \ldots, c_k$ are constants. This can be expressed using [[Sequence_Notation]] as $a_n = \sum_{i=1}^{k} c_i a_{n-i}$. The [[Recursive_Definition]] of such sequences often leads to a [[Recurrence_Relation_Definition]] that can be solved using its [[Characteristic_Equation]], which is obtained by substituting $a_n = r^n$ into the recurrence relation. Solving this equation yields the [[General_Solution]], from which a [[Unique_Solution]] can be determined with appropriate initial conditions. This process is a key part of [[Solving_Linear_Homogeneous_Recurrence_Relations]].

## 3. Boundary Cases & Counterexamples

When dealing with [[Linear_Homogeneous_Recurrence_Relation]] of order $k$, boundary cases include the initial conditions $a_0, a_1, \ldots, a_{k-1}$, which are crucial for obtaining a [[Unique_Solution]]. Failure to specify these conditions can lead to infinitely many solutions. A [[Second_Order_Linear_Homogeneous_Recurrence_Relation]] like $a_n = a_{n-1} + a_{n-2}$ breaks if initial conditions are not provided, as its general solution involves arbitrary constants. Similarly, for a [[Kth_Order_Linear_Homogeneous_Recurrence_Relation]], not providing $k$ initial conditions can make the solution indeterminate.

## 4. Discrete Proof Trace

### Recurrence Relation: $a_n = 3a_{n-1} + 4a_{n-2}$

### Characteristic Equation: $x^2 - 3x - 4 = 0$

```markdown

```

### Step-by-Step Solution

Solve the characteristic equation:
$$
\begin{aligned}
x^2 - 3x - 4 &= 0 \\
(x - 4)(x + 1) &= 0 \\
x &= 4 \text{ or } x = -1
\end{aligned}
$$

The general solution to the recurrence relation is:
$$
a_n = c_1(4)^n + c_2(-1)^n
$$

```

```

### Explanation

The characteristic equation $x^2 - 3x - 4 = 0$ factors into $(x - 4)(x + 1) = 0$, yielding roots $x = 4$ and $x = -1$. The general solution $a_n = c_1(4)^n + c_2(-1)^n$ represents the family of sequences satisfying the recurrence relation, where $c_1$ and $c_2$ are constants determined by initial conditions.

## 5. Walkthrough

1. **Write Down the Recurrence Relation**: The given recurrence relation is $a_n = 3a_{n-1} + 4a_{n-2}$. This indicates that each term in the sequence is determined by the previous two terms.

2. **Formulate the Characteristic Equation**: The characteristic equation is obtained by substituting $a_n = r^n$ into the recurrence relation, yielding $r^n = 3r^{n-1} + 4r^{n-2}$. Simplifying gives the characteristic equation $r^2 = 3r + 4$ or $r^2 - 3r - 4 = 0$.

3. **Solve the Characteristic Equation**: We solve $r^2 - 3r - 4 = 0$ by factoring:
$$
\begin{aligned}
r^2 - 3r - 4 &= 0 \\
(r - 4)(r + 1) &= 0 \\
r &= 4 \text{ or } r = -1
\end{aligned}
$$

4. **Express the General Solution**: Given distinct roots $4$ and $-1$, the general solution to the recurrence relation is:
$$
a_n = c_1(4)^n + c_2(-1)^n
$$
where $c_1$ and $c_2$ are constants.

5. **Understanding the Solution Components**: The term $c_1(4)^n$ represents a sequence that grows exponentially with $n$, and $c_2(-1)^n$ represents a sequence that alternates between two values.

6. **Determining $c_1$ and $c_2$**: The constants $c_1$ and $c_2$ can be determined if initial conditions $a_0$ and $a_1$ are provided. For example, if $a_0 = 1$ and $a_1 = 3$, we can solve for $c_1$ and $c_2$. Substituting $n = 0$ and $n = 1$ into the general solution gives two equations:
$$
\begin{aligned}
1 &= c_1 + c_2 \\
3 &= 4c_1 - c_2
\end{aligned}
$$
Solving this system of equations yields specific values for $c_1$ and $c_2$.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "fill_in",
    "difficulty": "L1",
    "question": "What is the term used to describe the equation obtained from a linear homogeneous recurrence relation?",
    "textWithBlanks": "The [[Blank1]] equation is obtained from a linear homogeneous recurrence relation.",
    "answer": ["characteristic"],
    "explanation": "The characteristic equation is a crucial step in solving linear homogeneous recurrence relations, as it helps in finding the general solution."
  },
  {
    "id": "q2",
    "type": "true_false",
    "difficulty": "L2",
    "question": "A linear homogeneous recurrence relation of order 3 always has 3 distinct roots in its characteristic equation.",
    "answer": false,
    "explanation": "A linear homogeneous recurrence relation of order 3 may have a characteristic equation with 3 distinct roots, but it can also have repeated roots."
  },
  {
    "id": "q3",
    "type": "debug",
    "difficulty": "L3",
    "question": "Find the error in the following step to solve a linear homogeneous recurrence relation.",
    "content": "Given: $a_n = 3a_{n-1} + 4a_{n-2}$. The characteristic equation is $r^2 - 3r - 4 = 0$. Solving, $(r - 4)(r + 1) = 0$, so $r = 4$ or $r = -1$. The general solution is $a_n = A(4)^n + B(-1)^n$.",
    "answer": "The error is in the characteristic equation. It should be $r^2 - 3r - 4 = 0$ becomes correct but let's verify: the correct step is $r^2 - 3r - 4 = 0$. However, assuming a correct formulation: $a_n = A(-1)^n + B(4)^n$ is actually correct in form given the roots; no error present here; verify equation: it matches.",
    "explanation": "Actually no bug; output matches solution form."
  }
]

```