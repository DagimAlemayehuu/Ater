---
title: "Distinguishable_Permutations"
type: "Core"
course: "[[Discrete Mathematics]]"
semester: "[[Semester I]]"
unit: "1 Counting Principles"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.065192"
last_edited_time: "2026-04-16T13:47:45.065193"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[Permutations]] and Factorials.
Distinguishable permutations refer to the number of unique ordered arrangements that can be formed from a set of `n` objects where some of these objects are identical (indistinguishable). Unlike standard permutations that assume all objects are distinct, this method accounts for the repeated objects by dividing out the permutations of those identical items, preventing overcounting. A simpler way to think about it is like arranging letter tiles for the word "APPLE": swapping the two 'P's doesn't create a new word.

# The Mental Model
Imagine you have a set of colored beads: 3 red, 2 blue, and 1 green. If you arrange them in a line, swapping the positions of two red beads doesn't create a new, visually different arrangement. The formula for distinguishable permutations adjusts for these internal, non-unique arrangements.

$$ \boxed{\displaystyle P(n : n_1, n_2, \dots, n_r) = \frac{n!}{n_1!n_2!\dots n_r!}} $$

| Symbol                          | Name                   | Unit    | Analogy                                  |
| :
------------------------------ | :
--------------------- | :
------ | :
--------------------------------------- |
| $P(n : n_1, n_2, \dots, n_r)$   | Number of Permutations | Number  | Total unique arrangements of beads.      |
| $n$                             | Total Objects          | Integer | Total number of beads.                   |
| $n_i$                           | Count of Identical Object Type $i$ | Integer | Number of red beads, blue beads, etc.    |
| $n!$                            | n Factorial            | Number  | All possible arrangements if all beads were distinct. |
| $n_1!n_2!\dots n_r!$            | Product of Factorials  | Number  | The overcounted arrangements due to identical objects. |

# Context & Framework
### Anatomy of the Formula (Who is Who?)
The formula $P(n : n_1, n_2, \dots, n_r) = \frac{n!}{n_1!n_2!\dots n_r!}$ is a modification of the basic permutation formula. Here, `n` is the total number of objects. The terms $n_1, n_2, \dots, n_r$ represent the counts of each group of identical objects. For example, if you have the word "BOOK", $n=4$, $n_O=2$, $n_B=1$, $n_K=1$. The numerator `n!` calculates the permutations as if all objects were distinct. The denominator divides this by the factorial of the count of each type of identical object. This division cancels out the overcounting that occurs because swapping identical objects does not create a new arrangement.

# The Mastery Deep Dive
### Let's Plug in Numbers (Watch it Work)
Consider the word "MISSISSIPPI".
*   Total number of letters ($n$): 11
*   Count of 'M' ($n_M$): 1
*   Count of 'I' ($n_I$): 4
*   Count of 'S' ($n_S$): 4
*   Count of 'P' ($n_P$): 2
Using the formula for distinguishable permutations:
$$ \boxed{\displaystyle \begin{aligned}
P(11 : 1, 4, 4, 2) &= \frac{11!}{1!4!4!2!} \\
&= \frac{39,916,800}{1 \times (24) \times (24) \times (2)} \\
&= \frac{39,916,800}{1152} \\
&= 34,650 \quad \text{(Distinct arrangements)}
\end{aligned}} $$

### The "Oops!" List: Where Everyone Fails
A common mistake is applying the standard permutation formula $P(n,n) = n!$ (which assumes all objects are distinct) to problems with identical objects. This will lead to a significant overcount. Forgetting to divide by the factorials of the counts of each repeated object type is the primary error. For example, for "BOB", $n=3$, $n_B=2$, $n_O=1$. If $3! = 6$ is used, it counts B1OB2 and B2OB1 as distinct, which they are not. The correct calculation is $\frac{3!}{2!1!} = 3$.

# Constraints & Limitations
### The "Oops!" List: Where Everyone Fails
This formula is specifically designed for situations where some objects within the set are **identical** but the positions they occupy are distinct. It assumes that the objects *between different groups* are distinguishable (e.g., a red ball is distinguishable from a blue ball), but objects *within the same group* are indistinguishable (e.g., one red ball is indistinguishable from another red ball). If all objects are distinct, this formula simplifies to $n!$ (as all $n_i!$ would be $1! = 1$). It does not apply to situations involving selections (combinations) or arrangements in a circle directly without further adjustment.

# Significance & Application
Distinguishable permutations are used in various practical scenarios:
*   **Word Formation**: Calculating the number of unique words or letter arrangements from a set of letters, some of which are repeated.
*   **Signal Theory**: Determining the number of distinct signals that can be formed using flags of different colors, where multiple flags of the same color are available.
*   **Genetic Sequences**: Analyzing sequences of biological units where some units are identical.
*   **Computer Science**: In areas like hash function design or data scrambling, where unique patterns are generated from a limited set of recurring elements.

# The Worked Example
**Scenario:** A factory produces flags using 10 fabric pieces. They use 3 red pieces, 4 blue pieces, and 3 yellow pieces. How many different vertical signals can be made using all 10 fabric pieces?

**Solution:**
*   Total number of fabric pieces ($n$): 10
*   Number of red pieces ($n_R$): 3
*   Number of blue pieces ($n_B$): 4
*   Number of yellow pieces ($n_Y$): 3
Since the pieces of the same color are indistinguishable, we use the formula for distinguishable permutations.

$$ \boxed{\displaystyle \begin{aligned}
P(10 : 3, 4, 3) &= \frac{10!}{3!4!3!} \\
&= \frac{3,628,800}{(6) \times (24) \times (6)} \\
&= \frac{3,628,800}{864} \\
&= 4,200 \quad \text{(Different vertical signals)}
\end{aligned}} $$

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** How many distinct arrangements can be made from the letters of the word "LEVEL"?
> **Solution:** Total letters ($n=5$). 'L' appears 2 times, 'E' appears 2 times, 'V' appears 1 time.
> $\frac{5!}{2!2!1!} = \frac{120}{2 \times 2 \times 1} = \frac{120}{4} = 30$ distinct arrangements.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** You have a set of 12 marbles: 5 red, 4 blue, and 3 green.
1.  How many distinct ways can you arrange all 12 marbles in a line?
2.  Now, imagine you want to arrange only the 5 red marbles and 4 blue marbles. How many distinct arrangements are possible using only these 9 marbles? Explain why the 'green' marbles are not factored into your calculation.
3.  A novice tries to calculate the arrangements for question 1 by multiplying $12!$ by some factor to correct for distinctness. Explain why this approach is fundamentally flawed and demonstrates a misunderstanding of how the factorial in the denominator works for identical objects.
> **Solution:**
> 1.  Total marbles ($n=12$). Red ($n_R=5$), Blue ($n_B=4$), Green ($n_G=3$).
>     $\frac{12!}{5!4!3!} = \frac{479,001,600}{(120) \times (24) \times (6)} = \frac{479,001,600}{17,280} = 27,720$ distinct arrangements.
> 2.  Total marbles to arrange ($n=9$ - 5 red + 4 blue). Red ($n_R=5$), Blue ($n_B=4$). Green marbles are not arranged, so they don't contribute to the permutations of the *selected subset*.
>     $\frac{9!}{5!4!} = \frac{362,880}{(120) \times (24)} = \frac{362,880}{2880} = 126$ distinct arrangements.
> 3.  Multiplying $12!$ by some factor to correct for distinctness is incorrect. The $n!$ in the numerator already assumes all objects are distinct. The division by $n_i!$ for each group of identical objects is precisely what *removes* the overcounting. If a novice were to multiply $12!$ by anything, they would further inflate the count, moving further away from the correct answer. The division inherently performs the correction, not multiplication.

# Key Takeaways
*   `Distinguishable Permutations` accounts for identical objects within a set.
*   The formula divides `n!` by the factorial of the count of each repeated object type.
*   This method prevents overcounting arrangements that are visually identical due to repeated objects.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| [[Permutations]]            | Distinguishable permutations are a specific type of permutation for sets with identical items. |
| Factorials              | Factorials are central to the calculation, both in the numerator and denominator.           |
| [[Permutations_without_Repeating_Objects]] | This concept is an extension to permutations where all objects are distinct.              |
| [[Multiplication_Principle]] | The underlying logic is still rooted in multiplying choices, with adjustments for identical items. |
---