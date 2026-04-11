---
title: Derangements
created_at: '2025-12-08T05:33:18Z'
last_modified: '2025-12-08T05:33:18Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 05a45262-f8e9-40aa-a26d-73f4f5ba19bb
type: Foundational
course: Discrete_Mathematics
year: Year_II
semester: Semester_I
credits: 3
original_source: Lecture_Slides_Counting_Principles
aliases: []
unit: 1_Counting_Principles
---

# Definition
Before proceeding, ensure you master [[Permutations]] and [[Inclusion_Exclusion_Principle]].
A derangement is a permutation of a set of distinct objects such that **none of the objects appear in their original or "natural" position**. It's a specific type of permutation problem where the goal is to find arrangements where no element is fixed. The concept is often encountered in problems involving misaddressed letters, hats being returned to the wrong people, or items being placed incorrectly. A simpler way to think about it is like a game of musical chairs where no one ends up in their original seat.

# The Mental Model
Imagine you have 3 distinct letters (L1, L2, L3) and 3 corresponding envelopes (E1, E2, E3), where L1 belongs in E1, L2 in E2, etc. A derangement would be any way of putting the letters into the envelopes such that *no* letter ends up in its correct envelope. For instance, L1 in E2, L2 in E3, L3 in E1 is a derangement. L1 in E1, L2 in E3, L3 in E2 is *not* a derangement because L1 is in its correct place.

$$ \boxed{\displaystyle D_n = n! \left( \frac{1}{0!} - \frac{1}{1!} + \frac{1}{2!} - \frac{1}{3!} + \dots + (-1)^n \frac{1}{n!} \right)} $$

| Symbol | Name                 | Unit    | Analogy                                  |
| :
----- | :
------------------- | :
------ | :
--------------------------------------- |
| $D_n$  | Number of Derangements | Number  | Total ways to misplace letters.          |
| $n$    | Total Objects        | Integer | Number of letters or items.              |
| $n!$   | n Factorial          | Number  | All possible linear arrangements.        |
| $\frac{1}{k!}$ | Reciprocal Factorial | Number  | Part of the alternating series.          |
| $(-1)^n$ | Alternating Sign Term | Factor  | Ensures alternating positive/negative terms. |

# Context & Framework
### Anatomy of the Formula (Who is Who?)
The formula for derangements of $n$ objects, $D_n$, is derived using the [[Inclusion_Exclusion_Principle]]. It starts with the total number of permutations ($n!$) and then systematically subtracts arrangements where at least one object is in its correct place, then adds back arrangements where at least two objects are in their correct places (because they were subtracted too many times), and so on. The series $\left( \frac{1}{0!} - \frac{1}{1!} + \frac{1}{2!} - \frac{1}{3!} + \dots + (-1)^n \frac{1}{n!} \right)$ is essentially a truncated Taylor series expansion of $e^{-1}$, demonstrating the connection between combinatorics and analysis.

# The Mastery Deep Dive
### Let's Plug in Numbers (Watch it Work)
Let's find the number of derangements for 3 objects.
*   $n = 3$
$D_3 = 3! \left( \frac{1}{0!} - \frac{1}{1!} + \frac{1}{2!} - \frac{1}{3!} \right)$
$D_3 = 6 \left( 1 - 1 + \frac{1}{2} - \frac{1}{6} \right)$
$D_3 = 6 \left( \frac{3}{6} - \frac{1}{6} \right)$
$D_3 = 6 \left( \frac{2}{6} \right) = 2$

The 2 derangements of {1, 2, 3} are:
*   {2, 3, 1} (1 is not in pos 1, 2 not in pos 2, 3 not in pos 3)
*   {3, 1, 2} (1 is not in pos 1, 2 not in pos 2, 3 not in pos 3)

### The "Oops!" List: Where Everyone Fails
A common mistake is to miscalculate the terms in the series, especially with the alternating signs. Another error is confusing derangements with general permutations or permutations with restrictions that are not "no element in its original position." Forgetting that the formula applies to *distinct* objects is also a pitfall. For small $n$, it's sometimes easier to list them out and count, but for larger $n$, the formula is indispensable.

# Constraints & Limitations
### The "Oops!" List: Where Everyone Fails
The derangement formula is strictly for finding permutations where **no object is in its original position**, and it assumes all objects are **distinct**. It does not directly account for situations where *exactly k* objects are in their original position, or where some objects are indistinguishable. Solving problems with these variations often requires a combination of the derangement formula and binomial coefficients (e.g., choose `k` items to be in place, then derange the remaining `n-k` items). The formula also becomes more computationally intensive for very large `n` if one were to manually calculate all factorial terms.

# Significance & Application
Derangements have applications in various fields:
*   **Probability**: Calculating the probability that no element of a permutation stays in its original position (e.g., the probability that no one gets their own hat back).
*   **Cryptography**: In some simple substitution ciphers, a derangement ensures that no character maps to itself.
*   **Computer Science**: In algorithms dealing with shuffling or randomizing elements, particularly when avoiding fixed points is a requirement.
*   **Discrete Mathematics**: A classical problem often used to illustrate the power of the [[Inclusion_Exclusion_Principle]].

# The Worked Example
**Scenario:** A teacher distributes 4 distinct test papers back to 4 distinct students. In how many ways can the teacher return the papers such that *no student receives their own paper*?

**Solution:**
This is a derangement problem with $n=4$.
Using the derangement formula:
$D_4 = 4! \left( \frac{1}{0!} - \frac{1}{1!} + \frac{1}{2!} - \frac{1}{3!} + \frac{1}{4!} \right)$
$D_4 = 24 \left( 1 - 1 + \frac{1}{2} - \frac{1}{6} + \frac{1}{24} \right)$
$D_4 = 24 \left( \frac{12}{24} - \frac{4}{24} + \frac{1}{24} \right)$
$D_4 = 24 \left( \frac{9}{24} \right)$
$D_4 = 9$

Alternatively, for small $n$, we can use the recursive relation $D_n = (n-1)(D_{n-1} + D_{n-2})$ with $D_0=1, D_1=0$.
$D_2 = 1(D_1+D_0) = 1(0+1) = 1$
$D_3 = 2(D_2+D_1) = 2(1+0) = 2$
$D_4 = 3(D_3+D_2) = 3(2+1) = 3 \times 3 = 9$.

$$ \boxed{\displaystyle \text{Number of ways} = D_4 = 9} $$

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** For a set of 2 distinct objects {A, B}, what are the derangements?
> **Solution:** There is only 1 derangement: {B, A}. (D2 = 1)

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** A secret Santa exchange involves 5 friends (F1, F2, F3, F4, F5), and each friend's name is placed in a hat. Each friend draws a name, but no one should draw their own name.
1.  Calculate the number of ways the names can be drawn such that no one draws their own name.
2.  Now, imagine that exactly two specific friends, F1 and F2, *do* draw their own names, and the remaining 3 friends draw names that are *not* their own. Explain how to solve this modified problem by combining derangements with combinations.
3.  A novice tries to calculate the solution to question 1 by simply taking $5!$ and subtracting 1 (for the correct permutation). Explain why this approach is fundamentally flawed and significantly underestimates the true number of derangements.
> **Solution:**
> 1.  This is a derangement problem with $n=5$.
>     $D_5 = 5! \left( \frac{1}{0!} - \frac{1}{1!} + \frac{1}{2!} - \frac{1}{3!} + \frac{1}{4!} - \frac{1}{5!} \right)$
>     $D_5 = 120 \left( 1 - 1 + \frac{1}{2} - \frac{1}{6} + \frac{1}{24} - \frac{1}{120} \right)$
>     $D_5 = 120 \left( \frac{60}{120} - \frac{20}{120} + \frac{5}{120} - \frac{1}{120} \right)$
>     $D_5 = 120 \left( \frac{44}{120} \right) = 44$ ways.
> 2.  **Constraint Analysis (F1 and F2 draw their own names):**
>     *   First, choose 2 friends who *will* draw their own names. Here, F1 and F2 are specified, so there's only $\binom{2}{2} = 1$ way to choose them.
>     *   These 2 friends are "fixed."
>     *   The remaining 3 friends (F3, F4, F5) must now draw names such that *none* of them draw their own name. This is a derangement of 3 objects ($D_3$).
>     *   $D_3 = 2$.
>     *   Total ways = (Ways to choose 2 fixed friends) $\times$ (Ways to derange the remaining 3) = $1 \times 2 = 2$ ways.
> 3.  Taking $5! - 1$ would yield $120 - 1 = 119$. This is fundamentally flawed because it only subtracts the single case where *everyone* gets their own name back. It does not account for the many other permutations where *some* (but not all) people get their own name back. The concept of derangement is about *none* being in their original place, which is much more restrictive than simply "not everyone in their original place." The approach significantly overcounts permutations where some elements are fixed, leading to a massive overestimation of possible derangements.

# Key Takeaways
*   `Derangements` are permutations where no object appears in its original position.
*   The formula `D_n` is derived using the `Inclusion-Exclusion Principle`.
*   It is specifically for `distinct` objects with `no` fixed points.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| [[Permutations]]            | Derangements are a specific type of permutation with a strong restriction.                  |
| [[Inclusion_Exclusion_Principle]] | The formula for derangements is derived directly from the Inclusion-Exclusion Principle.    |
| Factorials              | Factorials are a core component of the derangement formula.                                 |
| Probability_Theory      | Derangements are used to calculate probabilities of no matches in random assignments.       |
---