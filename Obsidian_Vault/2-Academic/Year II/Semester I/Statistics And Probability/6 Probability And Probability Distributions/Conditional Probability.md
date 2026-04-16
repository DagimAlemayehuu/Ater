---
title: "Conditional_Probability"
type: "Core"
course: "[[Statistics And Probability]]"
semester: "[[Semester I]]"
unit: "6 Probability And Probability Distributions"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.103751"
last_edited_time: "2026-04-16T13:47:45.103752"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[Dependent_and_Independent_Events]] because conditional probability quantifies the very essence of event dependence.
Conditional probability is the probability of an event occurring **given that another event has already occurred**. It essentially narrows down the sample space to only those outcomes where the given event has happened. This is often denoted as $P(B|A)$, which reads as "the probability of event B given event A." A simpler way to think about it is like getting new information: if you know it's raining, what's the probability that you need an umbrella? The "given that it's raining" part changes the initial probability of needing an umbrella.

# The Mental Model
Imagine you have a full deck of cards, and you want to know the probability of drawing a King. That's a straightforward $4/52$.
Now, imagine you *already know* that the card you drew is a face card (King, Queen, or Jack). With this new information, the sample space has effectively shrunk. What's the probability that this card is a King, *given that it's a face card*? Your denominator is no longer 52; it's 12 (the total number of face cards). This "given that" information redefines the universe for your probability calculation.

# Context & Framework
### The Reduced Sample Space: The "Given That" Clause
Conditional probability fundamentally involves a reduction of the sample space. When we calculate the probability of event $B$ given event $A$ (denoted $P(B|A)$), we are effectively considering only those outcomes where $A$ has already occurred. This subset of the original sample space becomes our *new* sample space for evaluating the probability of $B$. The formula for conditional probability is:
$$ \boxed{\displaystyle P(B|A) = \frac{P(A \cap B)}{P(A)}} $$
This formula states that the probability of $B$ given $A$ is the probability of both $A$ and $B$ occurring, divided by the probability of $A$ occurring. It's crucial that $P(A) > 0$. For example, if we consider drawing a card from a deck, the probability of drawing a Queen (Event B) given that the card drawn is a face card (Event A) is $P(B|A) = P(\text{Queen and Face Card}) / P(\text{Face Card}) = (4/52) / (12/52) = 4/12 = 1/3$. This is a direct application of shrinking the sample space to relevant outcomes.

# The Mastery Deep Dive
### Step-by-Step Derivation: Formalizing the Shift
The derivation of the conditional probability formula $P(B|A) = \frac{P(A \cap B)}{P(A)}$ comes directly from our understanding of how event occurrences redefine our universe of possibilities.
1.  **Start with the joint event:** We are interested in the instances where both $A$ and $B$ occur, but *only* within the context of $A$ having occurred. The joint probability $P(A \cap B)$ represents the outcomes common to both events within the *original* sample space.
2.  **Redefine the "total":** When we say "given $A$", we are saying that $A$ is now certain to have happened. Therefore, the "total possible outcomes" relevant to $B$'s occurrence are now limited to just the outcomes within event $A$. The probability $P(A)$ quantifies this new, restricted total.
3.  **Ratio of overlap to new total:** Thus, $P(B|A)$ is the proportion of outcomes where both $A$ and $B$ happen, *relative to* all the outcomes where $A$ happens.
    $$ \begin{aligned}
    & P(B|A) = \frac{P(\text{outcomes where A and B both occur})}{P(\text{outcomes where A occurs})} \\
    & P(B|A) = \frac{P(A \cap B)}{P(A)} \quad \text{(Definition of Conditional Probability)}
    \end{aligned} $$
This formula is robust and applicable to any events $A$ and $B$ where $P(A) > 0$, providing a precise way to update probabilities based on new information.

# Constraints & Limitations
### The "Oops!" List: Confusing $P(B|A)$ with $P(A \cap B)$
A common mistake is to confuse conditional probability $P(B|A)$ with the joint probability $P(A \cap B)$. While they are related, $P(A \cap B)$ is the probability of both events occurring within the *entire* original sample space, whereas $P(B|A)$ is the probability of $B$ occurring *given that A has already happened*, implying a reduced sample space. Forgetting to divide by $P(A)$ (the new sample space's probability) in the conditional probability formula will lead to an incorrect result, often underestimating the true conditional likelihood. Always remember that "given that" means a new denominator is in play.

# Significance & Application
Conditional probability is a cornerstone concept with vast applications, especially in areas where information evolves or decisions are sequential. In medical diagnosis, it's used to calculate the probability of having a disease *given* a positive test result. In financial markets, it helps assess the probability of a stock price increase *given* a positive earnings report. In criminal justice, it aids in determining the likelihood of a suspect's guilt *given* new evidence. It forms the basis for Bayesian inference and machine learning algorithms that update beliefs based on observations, making it an indispensable tool for understanding and navigating uncertainty.

# The Worked Example
A student is selected at random from a university. 60% of the students are female (Event F), and 20% of the students major in Computer Science (Event CS). It is known that 15% of all students are female and major in Computer Science (Event $F \cap CS$). What is the probability that a randomly selected student majors in Computer Science, given that the student is female?

1.  **Identify Probabilities:**
    *   $P(F) = 0.60$ (Probability of being female)
    *   $P(CS) = 0.20$ (Probability of majoring in Computer Science)
    *   $P(F \cap CS) = 0.15$ (Probability of being female AND majoring in Computer Science)
2.  **Define the Conditional Probability needed:** We need to find $P(CS|F)$, the probability of majoring in Computer Science given that the student is female.
3.  **Apply Conditional Probability Formula:**
    $$ \boxed{\displaystyle P(CS|F) = \frac{P(F \cap CS)}{P(F)}} $$
    $$ P(CS|F) = \frac{0.15}{0.60} = 0.25 $$
The probability that a randomly selected student majors in Computer Science, given that the student is female, is 0.25 (25%).

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** Write the formula for the probability of event A given event B.
> **Solution:** $P(A|B) = \frac{P(A \cap B)}{P(B)}$.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** In a city, 30% of adults have a university degree (Event D), and 10% of adults are unemployed (Event U). 5% of adults have a university degree AND are unemployed. What is the probability that a randomly selected unemployed adult has a university degree?
> **Solution:**
> We need to find $P(D|U)$.
> $P(D) = 0.30$
> $P(U) = 0.10$
> $P(D \cap U) = 0.05$
> $P(D|U) = \frac{P(D \cap U)}{P(U)} = \frac{0.05}{0.10} = 0.50$.
> The probability that an unemployed adult has a university degree is 50%.

### Level 3: Mastery (The Crucible)
**The Scenario:** A medical test is designed to detect a certain disease. The probability of having the disease is $P(D) = 0.01$. The probability of a positive test result given you have the disease is $P(T+|D) = 0.95$ (true positive rate). The probability of a positive test result given you do *not* have the disease is $P(T+|D') = 0.02$ (false positive rate). Calculate the probability that a randomly selected person has the disease *given* they tested positive, $P(D|T+)$.
> **Solution:** This requires Bayes' Theorem, which builds on conditional probability.
> First, we need $P(T+)$.
> $P(T+) = P(T+|D)P(D) + P(T+|D')P(D')$
> $P(D') = 1 - P(D) = 1 - 0.01 = 0.99$
> $P(T+) = (0.95)(0.01) + (0.02)(0.99) = 0.0095 + 0.0198 = 0.0293$.
>
> Now, apply the conditional probability formula for $P(D|T+)$:
> $P(D|T+) = \frac{P(D \cap T+)}{P(T+)} = \frac{P(T+|D)P(D)}{P(T+)}$
> $P(D|T+) = \frac{(0.95)(0.01)}{0.0293} = \frac{0.0095}{0.0293} \approx 0.3242$.
>
> The probability of having the disease given a positive test is approximately 32.42%. This highlights that even with a good test, a positive result doesn't guarantee the disease due to low disease prevalence and false positives.

# Key Takeaways
*   Conditional probability $P(B|A)$ is the probability of event B occurring, given that event A has already occurred.
*   The formula is $P(B|A) = P(A \cap B) / P(A)$, effectively narrowing the sample space to $P(A)$.
*   It is crucial for analyzing dependent events and updating probabilities based on new information.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| [[Dependent_and_Independent_Events]] | Quantifies the relationship between dependent events, as $P(B|A) \neq P(B)$ for dependent events. |
| [[Multiplication_Rule_of_Probability]] | Is a core component of the multiplication rule for dependent events.                       |
| [[Introduction_to_Probability]] | Builds upon the fundamental definitions of events and probabilities.                       |
---