---
title: "Solving_First_Order_Homogeneous_Linear_Recurrence_Relations"
type: "Core"
course: "[[Discrete Mathematics]]"
semester: "[[Semester I]]"
unit: "2 Recurrence Relations"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.056757"
last_edited_time: "2026-04-16T13:47:45.056759"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[Homogeneous_Linear_Recurrence_Relations]] and [[Order_of_Recurrence_Relations]] because this note focuses on the simplest case of these relations, where the order is exactly one.
A first-order homogeneous linear recurrence relation with constant coefficients is the simplest type of [[Homogeneous_Linear_Recurrence_Relations]], where the current term $a_n$ depends only on the immediately preceding term $a_{n-1}$. This makes it analogous to simple exponential growth or decay. Think of it like a chain where each link is a fixed multiple of the one before it.

# The Mental Model
Imagine a single-celled organism that reproduces by simply multiplying its current count by a fixed factor every hour. To know the population next hour, you only need to know the population this hour, and the multiplication rate. This direct, one-step dependency defines a first-order relation.

$$ \boxed{\displaystyle c_0a_n + c_1a_{n-1} = 0} $$
$$ \boxed{\displaystyle \text{where } c_0, c_1 \neq 0, \text{ and } n \ge 1} $$

*Note: This LaTeX block presents the canonical form of a first-order homogeneous linear recurrence relation.*

| Symbol        | Name              | Unit           | Analogy                                   |
| :
------------ | :
---------------- | :
------------- | :
---------------------------------------- |
| $a_n$         | Current term      | Value          | Population at current hour                |
| $a_{n-1}$     | Previous term     | Value          | Population at previous hour               |
| $c_0, c_1$    | Constant Coefficients | Multiplier     | Reproduction/decay rate                   |

# Context & Framework
### The Characteristic Equation (or Auxiliary Equation)
The solution to a first-order homogeneous linear recurrence relation, like $c_0a_n + c_1a_{n-1} = 0$, is of the form $a_n = \alpha r^n$, where $\alpha$ is an arbitrary constant and $r$ is the root of the **characteristic equation**. This equation is derived by substituting $a_n = r^n$ into the recurrence relation:
$c_0 r^n + c_1 r^{n-1} = 0$
Dividing by $r^{n-1}$ (assuming $r \neq 0$), we get:
$c_0 r + c_1 = 0$
This linear equation directly gives us the value of $r$. The simplicity of the first-order case means there's always a single, real root for $r$.

### Finding the Unique Solution
Once the general solution $a_n = \alpha r^n$ is found (where $r = -c_1/c_0$), the arbitrary constant $\alpha$ can be determined by applying a single initial condition (e.g., $a_0$ or $a_1$). For instance, if $a_0 = K$, then $K = \alpha r^0 \Rightarrow K = \alpha$. Thus, the unique solution becomes $a_n = K r^n$. This highlights the direct relationship between initial conditions and the constants in the general solution for a [[General_and_Unique_Solutions_of_Recurrence_Relations]].

# The Mastery Deep Dive
### Step-by-Step Derivation: Solving $c_0 a_n + c_1 a_{n-1} = 0$
Let's derive the solution for a general first-order homogeneous linear recurrence relation:
$$ \begin{aligned}
& c_0 a_n + c_1 a_{n-1} = 0 \quad \text{(Given recurrence relation)} \\
& c_0 a_n = -c_1 a_{n-1} \quad \text{(Isolate } a_n) \\
& a_n = -\frac{c_1}{c_0} a_{n-1} \quad \text{(Divide by } c_0)
\end{aligned} $$
Let $r = -\frac{c_1}{c_0}$. Then we have $a_n = r a_{n-1}$.
This implies:
$$ \begin{aligned}
& a_1 = r a_0 \\
& a_2 = r a_1 = r (r a_0) = r^2 a_0 \\
& a_3 = r a_2 = r (r^2 a_0) = r^3 a_0 \\
\end{aligned} $$
By induction, the general solution is $a_n = a_0 r^n$.
This demonstrates that the characteristic equation $c_0 r + c_1 = 0$ (which yields $r = -c_1/c_0$) directly leads to the exponential form of the solution.

### Edge Case Analysis: What if $r = 0$?
If $r = 0$, then from $c_0 r + c_1 = 0$, we must have $c_1 = 0$. The recurrence relation becomes $c_0 a_n = 0$, which implies $a_n = 0$ for all $n$ (assuming $c_0 \neq 0$). The solution $a_n = a_0 (0)^n$ would still hold for $n \ge 1$ (with $0^0$ typically defined as 1), resulting in $a_n = 0$ for $n \ge 1$, and $a_0 = a_0$. This is a trivial case, but the formula remains consistent.

# Constraints & Limitations
### Requirement for $c_0 \neq 0$
A critical constraint in the characteristic equation $c_0 r + c_1 = 0$ is that $c_0$ **must not be zero**. If $c_0 = 0$, the recurrence relation would degenerate to $c_1 a_{n-1} = 0$. If $c_1 \neq 0$, this would simply imply $a_{n-1} = 0$ for all $n-1$, meaning the entire sequence (from $a_0$ onwards) is identically zero. If both $c_0$ and $c_1$ are zero, the recurrence relation becomes trivial and provides no information about the sequence. Thus, the definition inherently assumes $c_0 \neq 0$ to maintain a meaningful relationship between terms.

# Significance & Application
Solving first-order homogeneous linear recurrence relations provides the foundation for understanding more complex recurrence relations. They directly model scenarios involving **exponential growth or decay**, such as unconstrained population growth, radioactive decay, or simple compound interest calculations. These basic models are essential for establishing baselines and understanding fundamental dynamics in various scientific, engineering, and economic contexts. The exponential form of the solution is a recurring motif throughout discrete mathematics.

# The Worked Example
Solve the recurrence relation $a_n = 4a_{n-1}$, for $n \ge 1$ with $a_1 = 3$.

1.  **Rewrite in standard form:** $a_n - 4a_{n-1} = 0$.
    *   Here, $c_0 = 1$ and $c_1 = -4$.

2.  **Form the characteristic equation:** $c_0 r + c_1 = 0 \Rightarrow 1r - 4 = 0$.
    *   Solving for $r$: $r = 4$.

3.  **Write the general solution:** $a_n = \alpha r^n \Rightarrow a_n = \alpha (4)^n$.

4.  **Apply the initial condition $a_1 = 3$ to find $\alpha$:**
    *   $3 = \alpha (4)^1$
    *   $3 = 4\alpha$
    *   $\alpha = \frac{3}{4}$.

5.  **Write the unique solution:** $a_n = \frac{3}{4} (4)^n$, which can also be written as $a_n = 3 \cdot 4^{n-1}$.

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Variable ID:** What form does the characteristic equation take for a first-order homogeneous linear recurrence relation?
> **Solution:** The characteristic equation takes the form of a linear equation, $c_0 r + c_1 = 0$.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Impossible Case:** Consider the recurrence relation $2a_n - 0a_{n-1} = 0$, which simplifies to $2a_n = 0$. If an initial condition is given as $a_0 = 5$, what is the characteristic equation, its root, the general solution, and the unique solution for $a_n$? Explain the implication of $c_1=0$.
> **Solution:**
> *   **Characteristic Equation:** $2r = 0 \Rightarrow r = 0$.
> *   **General Solution:** $a_n = \alpha (0)^n$.
> *   **Applying $a_0 = 5$:** $5 = \alpha (0)^0 \Rightarrow 5 = \alpha \cdot 1 \Rightarrow \alpha = 5$.
> *   **Unique Solution:** $a_n = 5(0)^n$. This means $a_0 = 5$, and for $n \ge 1$, $a_n = 0$.
> *   **Implication of $c_1=0$:** When $c_1=0$, the recurrence relation effectively states that $a_n$ itself must be zero (assuming $c_0 \neq 0$), independent of $a_{n-1}$ for $n \ge 1$. The only term not necessarily zero is the initial term $a_0$.

# Key Takeaways
*   First-order homogeneous linear recurrence relations have a linear characteristic equation ($c_0 r + c_1 = 0$).
*   The general solution is exponential ($a_n = \alpha r^n$), where $r$ is the root of the characteristic equation.
*   A single initial condition is sufficient to determine the unique solution by finding $\alpha$.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                          |
| :
-------------------------- | :
----------------------------------------------------------------- |
| [[Homogeneous_Linear_Recurrence_Relations]] | This is the simplest case within this category of relations.       |
| [[General_and_Unique_Solutions_of_Recurrence_Relations]] | The methods directly lead to these types of solutions.             |
| [[Solving_N_Order_Relations]] | The principles here extend and generalize to higher-order relations. |
---