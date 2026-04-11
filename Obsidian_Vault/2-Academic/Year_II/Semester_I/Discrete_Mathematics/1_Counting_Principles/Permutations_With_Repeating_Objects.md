---
title: Permutations_With_Repeating_Objects
created_at: '2025-12-08T05:29:24Z'
last_modified: '2025-12-08T05:29:24Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: 84899fa4-5283-4d66-9ebd-bd5173c472ee
type: Core
course: Discrete_Mathematics
year: Year_II
semester: Semester_I
credits: 3
original_source: Lecture_Slides_Counting_Principles
aliases: []
unit: 1_Counting_Principles
parent: Permutations
---

# Definition
Before proceeding, ensure you master [[Permutations]] and [[Multiplication_Principle]].
Permutations with repeating objects refers to the number of ordered arrangements that can be formed by selecting `r` objects from a set of `n` distinct objects, where each object can be used **multiple times** (i.e., selection with replacement). This is a straightforward application of the Multiplication Principle, as the number of choices remains constant for each position or stage of selection. A simpler way to think about it is like a combination lock where you can reuse the same digit multiple times (e.g., 2-2-2 is a valid code).

# The Mental Model
Imagine you are creating a 3-character security code using the digits 0-9. For the first character, you have 10 options. For the second, you still have 10 options because you can repeat digits. For the third, you again have 10 options. Each choice is independent, and the pool of available options never shrinks.

$$ \boxed{\displaystyle P_{repeat}(n,r) = n \times n \times \dots \times n \quad \text{(r times)} = n^r} $$

| Symbol          | Name                 | Unit    | Analogy                                  |
| :
-------------- | :
------------------- | :
------ | :
--------------------------------------- |
| $P_{repeat}(n,r)$ | Number of Permutations | Number  | Total ordered arrangements of codes.     |
| $n$             | Total Objects        | Integer | Total distinct digits (0-9).             |
| $r$             | Objects Selected     | Integer | Length of the security code.             |
| $n^r$           | n to the power of r  | Number  | All possible codes with repetition.      |

# Context & Framework
### Anatomy of the Formula (Who is Who?)
The formula for permutations with repetition is $n^r$. Here, `n` represents the total number of distinct types of items available for selection, and `r` represents the number of items being selected (i.e., the length of the arrangement). The formula is a direct consequence of the [[Multiplication_Principle]]: for each of the `r` positions in the arrangement, there are always `n` independent choices, as items can be chosen multiple times. This forms the basis for scenarios like generating passwords or license plates where characters can be repeated.

# The Mastery Deep Dive
### Let's Plug in Numbers (Watch it Work)
Let's find the number of possible 4-digit PINs, where each digit can be any number from 0-9.
*   Total distinct digits ($n$): 10 (0, 1, 2, 3, 4, 5, 6, 7, 8, 9)
*   Length of the PIN ($r$): 4
Since digits can be repeated:
$P_{repeat}(10,4) = 10^4 = 10 \times 10 \times 10 \times 10 = 10,000$ possible PINs.

### The "Oops!" List: Where Everyone Fails
The most common error is confusing this with [[Permutations_without_Repeating_Objects]]. If a problem explicitly states that items *cannot* be repeated, using $n^r$ will lead to a significant overcount. For instance, if forming a 3-digit number from digits 1-5 *without repetition*, the answer is $P(5,3)=60$. If $5^3=125$ were mistakenly used, it would include many invalid numbers (e.g., 111, 112). Always verify if repetition is allowed.

# Constraints & Limitations
### The "Oops!" List: Where Everyone Fails
This formula is applicable only when items are **distinct in type** and **repetition is explicitly allowed**. If the available items are not distinct (e.g., letters in the word "APPLE"), then [[Distinguishable_Permutations]] is the correct formula to use. If repetition is not allowed, then [[Permutations_without_Repeating_Objects]] (P(n,r)) should be applied. Misinterpreting the repetition constraint is a critical mistake in applying this counting technique.

# Significance & Application
Permutations with repeating objects are widely used in:
*   **Security Systems**: Calculating the number of possible passwords, PINs, and access codes.
*   **Coding and Naming**: Generating unique identifiers, product codes, or variable names in programming languages where characters can be reused.
*   **Data Representation**: Determining the number of possible binary strings of a certain length.
*   **Sampling with Replacement**: In statistics, analyzing scenarios where drawing an item doesn't remove it from the pool for subsequent draws.

# The Worked Example
**Scenario:** A company is creating 3-character internal identification codes for its employees. Each character can be any uppercase English letter (A-Z) or any digit (0-9). Repetition of characters is allowed. How many unique employee IDs are possible?

**Solution:**
*   Total number of distinct characters ($n$): 26 letters + 10 digits = 36 characters
*   Length of the ID code ($r$): 3
Since repetition of characters is allowed:

$$ \boxed{\displaystyle \begin{aligned}
P_{repeat}(36,3) &= 36^3 \\
&= 36 \times 36 \times 36 \\
&= 46,656 \quad \text{(Unique employee IDs)}
\end{aligned}} $$

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** A multiple-choice quiz has 5 questions, and each question has 4 possible answers. How many different ways can a student answer the quiz?
> **Solution:** $4^5 = 1,024$ ways.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** A new social media platform requires usernames to be 5 characters long. Usernames can only consist of lowercase English letters (a-z).
1.  How many different usernames are possible if character repetition is allowed?
2.  Now, the platform introduces a new rule: usernames can contain character repetition, but the first character *must* be a vowel (a, e, i, o, u). Explain how this constraint affects the calculation and determine the number of possible usernames.
3.  A cybersecurity analyst is testing a system where 4-digit PINs are allowed to have repeating digits. If they mistakenly use the formula for permutations *without* repetition to calculate the possible PINs, explain why their estimate for the search space would be significantly smaller than the actual number and why this is a critical security oversight.
> **Solution:**
> 1.  Total distinct characters ($n$): 26. Length of username ($r$): 5. Repetition allowed.
>     $26^5 = 11,881,376$ usernames.
> 2.  **Constraint Analysis:**
>     *   First character (vowel): 5 choices (a, e, i, o, u).
>     *   Remaining 4 characters (any lowercase letter, repetition allowed): $26^4$ choices.
>     *   Total usernames: $5 \times 26^4 = 5 \times 456,976 = 2,284,880$ usernames.
> 3.  If a system allows 4-digit PINs with repetition (0-9), the actual number of PINs is $10^4 = 10,000$. If the analyst mistakenly uses permutations *without* repetition, they would calculate $P(10,4) = \frac{10!}{(10-4)!} = 10 \times 9 \times 8 \times 7 = 5,040$. This estimate is significantly smaller than the actual $10,000$ possible PINs. This is a critical security oversight because the analyst would underestimate the true search space an attacker would need to explore, potentially leading to a false sense of security or miscalculated brute-force attack times.

# Key Takeaways
*   `Permutations with Repeating Objects` involves selecting and arranging items where each item can be used multiple times.
*   The number of choices remains constant for each position.
*   The formula is $n^r$.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| [[Permutations]]            | This is a specific type of permutation where repetition is allowed.                         |
| [[Multiplication_Principle]] | The formula is a direct application of the Multiplication Principle with constant choices.  |
| [[Permutations_without_Repeating_Objects]] | This concept is distinguished from permutations where repetition is *not* allowed.          |
| Factorials              | Factorials are not directly used in the formula, unlike permutations without repetition.    |
---