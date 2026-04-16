---
title: "CC2131_1_Counting_Principles_Possible_Questions"
type: "Questions"
course: "[[Discrete Mathematics]]"
semester: "[[Semester I]]"
unit: "1 Counting Principles"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.067952"
last_edited_time: "2026-04-16T13:47:45.067953"
last_edited_by: "LifeOs AI Agent"
---

# Part I: The Conceptual Mastery Ladder
*Progress through these levels for every atomic concept. Do not move to the next concept until you can answer Level 3.*

## [[Basic_Counting_Principles]]
### Level 1: Understanding (The Basics)
1.  **The Fact Check:** Explain the fundamental conditions under which the Addition Principle is applied versus the conditions for applying the Multiplication Principle.
### Level 2: Competence (Application)
2.  **The Sort:** A student needs to select a course. There are 6 engineering courses and 5 business courses. If the student can only enroll in *one* course, how many choices do they have? If they must enroll in *both* one engineering course and one business course, how many choices do they have?
### Level 3: Mastery (The Crucible)
3.  **The Impostor:** You are tasked with counting the number of ways to pick a fruit, where you can choose either an apple (3 types) or a banana (2 types). If you apply the Multiplication Principle, what error would occur, and why?

## [[Addition_Principle]]
### Level 1: Understanding (The Basics)
4.  **The Variable ID:** When using the Addition Principle, what crucial characteristic must the tasks or events possess for the formula $n_1 + n_2 + \dots + n_m$ to be correctly applied?
### Level 2: Competence (Application)
5.  **The Standard Solver:** A store sells two brands of laptops: Brand A offers 7 models, and Brand B offers 4 models. How many distinct laptop choices are available if a customer buys only one laptop?
### Level 3: Mastery (The Crucible)
6.  **The Impossible Case:** Consider selecting a pet, where you can choose from 5 types of dogs or 3 types of cats. If 2 of the dog types are also considered "lap pets," which overlap with 1 type of cat, explain why a simple addition of dog types and cat types would be incorrect for finding the total number of pet choices if "lap pets" are the focus.

## [[Multiplication_Principle]]
### Level 1: Understanding (The Basics)
7.  **The Variable ID:** In the context of the Multiplication Principle, what does each factor $n_i$ represent in the product $n_1 \times n_2 \times \dots \times n_m$?
### Level 2: Competence (Application)
8.  **The Standard Solver:** A car dealership offers 3 different car models, with 4 exterior color options for each model, and 2 interior trim levels for each color. How many different configurations of cars are possible?
### Level 3: Mastery (The Crucible)
9.  **The Impossible Case:** A chef is designing a three-course meal: appetizer, main course, and dessert. There are 6 appetizer choices, 8 main course choices, and 5 dessert choices. However, if a specific appetizer is chosen, 2 main course options become unavailable. Explain how this dependency impacts the calculation using the Multiplication Principle and how to adjust for it.

## [[Permutations_and_Combinations]]
### Level 1: Understanding (The Basics)
10. **The Fact Check:** When arranging distinct objects, how do you determine if the problem requires a permutation or a combination?
### Level 2: Competence (Application)
11. **The Sort:** You have 6 different books.
    (a) In how many ways can you arrange 4 of these books on a shelf?
    (b) In how many ways can you choose 4 of these books to take with you on a trip?
### Level 3: Mastery (The Crucible)
12. **The Impostor:** A coding challenge asks to generate all possible unique sequences of 3 characters from a set of 5 distinct characters. If a developer uses a combination function instead of a permutation, describe the type of output they would get (e.g., fewer, more, different structure) and why it would be incorrect for the problem statement.

## [[Permutations]]
### Level 1: Understanding (The Basics)
13. **The Variable ID:** What is the significance of the term "order of selection matters" in the definition of a permutation?
### Level 2: Competence (Application)
14. **The Standard Solver:** A photography club has 12 members. How many different ways can a president, vice-president, and secretary be chosen from the members?
### Level 3: Mastery (The Crucible)
15. **The Impossible Case:** If a problem involves selecting items from a group and the question explicitly states that a particular set of items are *indistinguishable*, explain why directly applying the permutation formula for distinct objects would yield an inflated and incorrect count.

## [[Permutations_without_Repeating_Objects]]
### Level 1: Understanding (The Basics)
16. **The Variable ID:** In the formula $P(n,r) = \frac{n!}{(n-r)!}$, define `n` and `r` and explain why `(n-r)!` is in the denominator.
### Level 2: Competence (Application)
17. **The Standard Solver:** A band has 7 songs. How many different setlists can they create if they perform 4 songs and each song is played only once?
### Level 3: Mastery (The Crucible)
18. **The Impossible Case:** You are creating unique identifiers of length 4 using 3 available distinct characters. Explain why using the permutation formula for non-repeating objects would lead to an impossibility in this scenario.

## [[Permutations_with_Repeating_Objects]]
### Level 1: Understanding (The Basics)
19. **The Variable ID:** What does the exponent 'r' signify in the formula $n^r$ for permutations with repetition?
### Level 2: Competence (Application)
20. **The Standard Solver:** A digital lock has 4 digits. If each digit can be any number from 0 to 9, how many different lock combinations are possible if digits can be repeated?
### Level 3: Mastery (The Crucible)
21. **The Broken System:** A developer needs to create all possible 3-character strings using alphanumeric characters (26 letters + 10 digits = 36). If they mistakenly use the formula for permutations without repetition, describe how this would fail to generate all valid strings and lead to an incomplete dataset.

## [[Distinguishable_Permutations]]
### Level 1: Understanding (The Basics)
22. **The Variable ID:** In the formula $P(n : n_1, n_2, \dots, n_r) = \frac{n!}{n_1!n_2!\dots n_r!}$, what does $n_1, n_2, \dots, n_r$ represent?
### Level 2: Competence (Application)
23. **The Standard Solver:** How many distinct arrangements can be made from the letters of the word "MATHEMATICS"?
### Level 3: Mastery (The Crucible)
24. **The Impossible Case:** You are given 10 marbles: 3 red, 3 blue, and 4 green. If you incorrectly apply the permutation formula for *distinct* objects (n!) to find the number of arrangements, explain why this leads to an overcount and what factor is missed.

## [[Circular_Permutation]]
### Level 1: Understanding (The Basics)
25. **The Variable ID:** What is the fundamental difference in treating arrangements in a circle versus a line, and why is `(n-1)!` used for simple circular permutations?
### Level 2: Competence (Application)
26. **The Standard Solver:** In how many different ways can 6 unique keys be arranged on a circular key ring?
### Level 3: Mastery (The Crucible)
27. **The Impossible Case:** Ten people are to be seated around a circular table. If two specific people, John and Jane, insist on sitting *next* to each other, explain how this constraint changes the calculation from a simple circular permutation of 10 people.

## [[Combinations]]
### Level 1: Understanding (The Basics)
28. **The Variable ID:** Define 'n' and 'r' in the context of `C(n,r)`, and explain why the order of selection is irrelevant.
### Level 2: Competence (Application)
29. **The Standard Solver:** A committee of 4 people is to be chosen from a group of 10 qualified candidates. How many different committees can be formed?
### Level 3: Mastery (The Crucible)
30. **The Impossible Case:** If you are forming a team for a relay race, where the order of runners matters, explain why using the combination formula to select the runners would lead to an incomplete solution for the problem.

## [[Binomial_Expansion]]
### Level 1: Understanding (The Basics)
31. **The Variable ID:** In the binomial expansion of $(a+b)^n$, what does the term `r` represent in $\binom{n}{r}a^{n-r}b^r$?
### Level 2: Competence (Application)
32. **The Standard Solver:** Find the third term in the expansion of $(x+y)^5$.
### Level 3: Mastery (The Crucible)
33. **The Impossible Case:** A student attempts to find a specific term in a binomial expansion but forgets to consider the coefficients of 'a' and 'b' if they are not 1 (e.g., $(2x-3y)^4$). Explain how this oversight leads to an incorrect term value.

## [[Pascal_s_Triangle]]
### Level 1: Understanding (The Basics)
34. **The Element ID:** Describe the rule for generating the numbers in Pascal's Triangle.
### Level 2: Competence (Application)
35. **The Flow Chart:** Draw the first 5 rows of Pascal's Triangle.
### Level 3: Mastery (The Crucible)
36. **The Friction Point:** A user is trying to find the coefficients for $(a+b)^7$ using Pascal's Triangle. If they incorrectly construct row 6, explain how this error would propagate and affect their attempt to find the coefficients for row 7.

## [[Pascal_s_Identity]]
### Level 1: Understanding (The Basics)
37. **The Fact Check:** State Pascal's Identity in words, without using mathematical symbols.
### Level 2: Competence (Application)
38. **The Standard Solver:** Using Pascal's Identity, express $\binom{7}{3}$ as the sum of two other binomial coefficients.
### Level 3: Mastery (The Crucible)
39. **The Impossible Case:** A student attempts to prove Pascal's Identity using a scenario involving selecting items from a group. If they fail to consider the two mutually exclusive cases (either including a specific item or not including it), explain why their proof would be incomplete.

## [[Distribution_of_Distinguishable_Balls_into_Distinguishable_Boxes]]
### Level 1: Understanding (The Basics)
40. **The Variable ID:** For the problem of distributing `m` distinguishable balls into `n` distinguishable boxes (with empty boxes allowed), what does the formula $n^m$ represent?
### Level 2: Competence (Application)
41. **The Standard Solver:** In how many ways can 3 distinct letters be placed into 4 distinct mailboxes, where any mailbox can be empty?
### Level 3: Mastery (The Crucible)
42. **The Impossible Case:** If you are distributing 5 distinct gifts among 3 distinct children, but each child *must* receive at least one gift, explain why the direct application of $n^m$ would lead to an overcount, as it allows for empty boxes.

## [[Distribution_of_Indistinguishable_Balls_into_Distinguishable_Boxes]]
### Level 1: Understanding (The Basics)
43. **The Variable ID:** In the formula $\binom{m+n-1}{n-1}$ (or $\binom{m+n-1}{m}$), what do 'm' and 'n' represent in the context of distributing indistinguishable balls into distinguishable boxes?
### Level 2: Competence (Application)
44. **The Standard Solver:** How many ways are there to distribute 5 identical candies among 3 children, where a child may receive zero candies?
### Level 3: Mastery (The Crucible)
45. **The Impossible Case:** If the problem requires distributing 6 identical pens to 4 distinct students, but with the additional constraint that *each student must receive at least one pen*, explain how this constraint alters the problem from a direct application of the standard formula.

## [[Distribution_of_Distinguishable_Balls_into_Indistinguishable_Boxes]]
### Level 1: Understanding (The Basics)
46. **The Variable ID:** In problems involving distributing distinguishable balls into indistinguishable boxes, why is it significantly more complex than when boxes are distinguishable?
### Level 2: Competence (Application)
47. **The Standard Solver:** How many ways can 4 distinct books be placed into 2 identical (indistinguishable) boxes, such that no box is empty?
### Level 3: Mastery (The Crucible)
48. **The Impossible Case:** Explain why using only Stirling numbers of the second kind for distributing distinguishable items into indistinguishable containers might be insufficient if the problem also includes conditions about empty containers.

## [[Derangements]]
### Level 1: Understanding (The Basics)
49. **The Fact Check:** What is a derangement? Provide a simple example with 3 items.
### Level 2: Competence (Application)
50. **The Standard Solver:** Calculate the number of derangements for a set of 4 distinct objects.
### Level 3: Mastery (The Crucible)
51. **The Impossible Case:** If you are arranging 5 letters (A, B, C, D, E) such that at least one letter is in its original position, explain why the derangement formula ($D_n$) would not directly solve this problem, and what additional steps would be needed.

## [[Inclusion_Exclusion_Principle]]
### Level 1: Understanding (The Basics)
52. **The Fact Check:** When is the Inclusion-Exclusion Principle necessary, and what problem does it solve that simple addition or subtraction cannot?
### Level 2: Competence (Application)
53. **The Standard Solver:** In a class of 30 students, 18 play football, 12 play basketball, and 7 play both. How many students play at least one sport?
### Level 3: Mastery (The Crucible)
54. **The Impossible Case:** A survey of 100 students shows that 40 like coffee, 30 like tea, and 20 like juice. If 15 like coffee and tea, 10 like tea and juice, 5 like coffee and juice, and 2 like all three, explain how to find the number of students who like *none* of the beverages.

## [[Pigeonhole_Principle]]
### Level 1: Understanding (The Basics)
55. **The Fact Check:** State the basic Pigeonhole Principle.
### Level 2: Competence (Application)
56. **The Standard Solver:** A bag contains socks of 3 colors: red, blue, and green. How many socks must you draw (without looking) to be sure you have a pair of socks of the same color?
### Level 3: Mastery (The Crucible)
57. **The Impossible Case:** A professor wants to ensure that at least two students in a class of 25 received the same grade on a 10-point quiz (grades 0-10). Explain why the Pigeonhole Principle guarantees this, and identify the "pigeons" and "pigeonholes."

## [[Generalized_Pigeonhole_Principle]]
### Level 1: Understanding (The Basics)
58. **The Fact Check:** State the Generalized Pigeonhole Principle in the form "If $kn+1$ pigeons are placed into $n$ pigeonholes..."
### Level 2: Competence (Application)
59. **The Standard Solver:** What is the minimum number of students needed in a class to guarantee that at least 3 students were born in the same month?
### Level 3: Mastery (The Crucible)
60. **The Impossible Case:** You are drawing cards from a standard 52-card deck. How many cards must you draw to guarantee that you have at least 4 cards of the same suit? Justify your answer using the Generalized Pigeonhole Principle.

# Part II: Unit Synthesis (The Final Boss)
*These questions require combining multiple concepts from the unit to solve a complex problem.*

### Integrated Scenario: The Digital Security Challenge
**The Setup:** A new digital lock system requires a 6-character password using uppercase English letters (A-Z) and digits (0-9). The system has two security levels:
1.  **Level 1 (Basic):** Characters can be repeated.
2.  **Level 2 (Advanced):** All characters must be distinct.
Additionally, for both levels, the password must either start with a letter OR contain at least one digit in the first three positions.
**The Constraints:**
(a) The lock system needs to support a minimum of 100 million unique Level 1 passwords.
(b) The system administrator wants to know the probability of a randomly chosen Level 2 password having no repeated characters (if repetitions were allowed).
**The Challenge:**
(a) Calculate the total number of possible passwords for Level 1, satisfying all conditions.
(b) Calculate the total number of possible passwords for Level 2, satisfying all conditions.
(c) Explain which counting principles (e.g., Multiplication Principle, Inclusion-Exclusion, Permutations with/without repetition) were crucial in solving parts (a) and (b), detailing how they were applied.