---
title: "Addition_Rule_Of_Probability"
type: "Core"
course: "[[Statistics And Probability]]"
semester: "[[Semester I]]"
unit: "6 Probability And Probability Distributions"
status: "Not Started"
confidence: ""
study_date: ""
generated: "true"
last_synced: "2026-04-16T13:47:45.102676"
last_edited_time: "2026-04-16T13:47:45.102677"
last_edited_by: "LifeOs AI Agent"
---

# Definition
Before proceeding, ensure you master [[Mutually_Exclusive_and_Non_Mutually_Exclusive_Events]] because the form of the addition rule depends critically on whether events can occur simultaneously.
The Addition Rule of Probability is used to find the probability that **at least one** of two or more events occurs. It addresses scenarios involving the "OR" conjunction. There are two primary forms of the rule, depending on whether the events are mutually exclusive or non-mutually exclusive. A simpler way to think about it: if you want to know the chance of either event A happening OR event B happening, the Addition Rule helps you calculate that total probability. It's like asking "What's the chance of rain or snow today?"

# The Mental Model
Imagine two buckets of colored balls. Bucket A has red and blue, Bucket B has yellow and green. If you want to know the probability of drawing a red ball from Bucket A OR a yellow ball from Bucket B, you can simply add their probabilities because these are separate, distinct actions (mutually exclusive in this context).
Now, imagine a single bucket with red, blue, and striped balls (red and blue stripes). If you want to know the probability of drawing a red ball OR a blue ball, you need to be careful not to double-count the striped balls. This is where the general addition rule comes in, accounting for the "overlap."

# Context & Framework
### The Disjoint Sum: Mutually Exclusive Events
When two events, $A$ and $B$, are **mutually exclusive** (meaning they cannot occur at the same time, so $A \cap B = \emptyset$), the probability that either $A$ or $B$ occurs is simply the sum of their individual probabilities. This is because there is no overlap to account for.
$$ \boxed{\displaystyle P(A \text{ or } B) = P(A \cup B) = P(A) + P(B)} $$
This rule extends to more than two mutually exclusive events. For example, if you're rolling a die, the probability of rolling a 1 or a 6 is $P(1) + P(6) = 1/6 + 1/6 = 2/6 = 1/3$. The formal justification comes from the axioms of probability which state that the probability of the union of disjoint events is the sum of their probabilities.

### The Overlapping Adjustment: Non-Mutually Exclusive Events
When two events, $A$ and $B$, are **non-mutually exclusive** (meaning they can occur at the same time, so $A \cap B \neq \emptyset$), simply adding their probabilities would double-count the outcomes that are common to both events. To correct for this double-counting, the probability of their intersection (the outcomes where both $A$ and $B$ occur) must be subtracted.
$$ \boxed{\displaystyle P(A \text{ or } B) = P(A \cup B) = P(A) + P(B) - P(A \cap B)} $$
This is the general form of the Addition Rule and is always applicable. If events are mutually exclusive, then $P(A \cap B) = 0$, and the formula simplifies to the specific rule for mutually exclusive events. For example, the probability of drawing a red card or a King from a standard deck requires subtracting the probability of drawing a red King to avoid counting those cards twice.

# The Mastery Deep Dive
### Step-by-Step Derivation: The Set Theory Foundation
The Addition Rule can be rigorously understood through basic set theory principles. For any two events $A$ and $B$ in a sample space $S$:
1.  **Start with the intuitive sum:** When we add $P(A) + P(B)$, we are essentially summing the "sizes" of the two sets of outcomes corresponding to $A$ and $B$.
2.  **Identify the overlap:** If $A$ and $B$ overlap (i.e., they are non-mutually exclusive), then the outcomes in their intersection ($A \cap B$) are counted once as part of $P(A)$ and again as part of $P(B)$. This means the intersection has been counted twice.
3.  **Correct for double-counting:** To get the correct probability of $A$ or $B$ occurring (the union, $A \cup B$), we must subtract the probability of the overlap (the intersection, $A \cap B$) once.
    $$ \begin{aligned}
    & P(A \cup B) = P(A) + P(B) - P(A \cap B) \quad \text{(General Addition Rule)}
    \end{aligned} $$
    This is because $n(A \cup B) = n(A) + n(B) - n(A \cap B)$ from set theory.
4.  **Special case for mutually exclusive events:** If $A$ and $B$ are mutually exclusive, then there is no overlap; their intersection is empty, so $P(A \cap B) = 0$. In this case, the general rule simplifies to:
    $$ \begin{aligned}
    & P(A \cup B) = P(A) + P(B) - 0 \\
    & P(A \cup B) = P(A) + P(B) \quad \text{(Addition Rule for Mutually Exclusive Events)}
    \end{aligned} $$
This systematic derivation ensures that the probability of the union of events is accurately calculated, regardless of whether they share outcomes.

# Constraints & Limitations
### The "Oops!" List: Forgetting the Overlap
The most common error when applying the Addition Rule is forgetting to subtract the intersection when events are non-mutually exclusive. This leads to an inflated probability (greater than 1, or simply incorrect) for the union of events. For example, calculating the probability of "drawing a red card OR a face card" and simply adding $P(Red) + P(Face)$ without subtracting $P(Red \cap Face)$ will yield an incorrect result because red face cards would be counted twice. Always verify whether events are mutually exclusive before applying the simpler rule.

# Significance & Application
The Addition Rule is a cornerstone of probability theory, with profound implications across various disciplines. In quality control, it's used to calculate the probability of a product having *at least one* of several possible defects. In medical diagnosis, it helps determine the likelihood of a patient having *either* symptom A *or* symptom B. Financial analysts use it to assess the probability of a portfolio experiencing *either* a market downturn *or* a specific company's stock drop. Fundamentally, this rule provides the mathematical basis for combining probabilities of different events to make comprehensive inferences about complex scenarios, enabling more robust risk assessments and decision-making.

# The Worked Example
**Scenario 1: Mutually Exclusive Events**
A company manufactures light bulbs. The probability that a bulb is defective in wiring (Event W) is 0.02, and the probability that it is defective in its filament (Event F) is 0.03. These types of defects are mutually exclusive (a bulb cannot have both). What is the probability that a randomly selected bulb has a wiring defect OR a filament defect?

1.  Identify Events:
    *   Event W: Bulb has wiring defect, $P(W) = 0.02$.
    *   Event F: Bulb has filament defect, $P(F) = 0.03$.
2.  Determine if Mutually Exclusive: Yes, stated as mutually exclusive.
3.  Apply Addition Rule for Mutually Exclusive Events:
    $$ \boxed{\displaystyle P(W \cup F) = P(W) + P(F)} $$
    $$ P(W \cup F) = 0.02 + 0.03 = 0.05 $$
The probability that a bulb has a wiring defect OR a filament defect is 0.05 (5%).

**Scenario 2: Non-Mutually Exclusive Events**
In a survey of college students, 40% read newspaper A (Event A), 30% read newspaper B (Event B), and 10% read both (Event $A \cap B$). What is the probability that a randomly selected student reads newspaper A OR newspaper B?

1.  Identify Events and Probabilities:
    *   Event A: Reads newspaper A, $P(A) = 0.40$.
    *   Event B: Reads newspaper B, $P(B) = 0.30$.
    *   Intersection: Reads both, $P(A \cap B) = 0.10$.
2.  Determine if Mutually Exclusive: No, $P(A \cap B) \neq 0$.
3.  Apply General Addition Rule:
    $$ \boxed{\displaystyle P(A \cup B) = P(A) + P(B) - P(A \cap B)} $$
    $$ P(A \cup B) = 0.40 + 0.30 - 0.10 = 0.60 $$
The probability that a student reads newspaper A OR newspaper B is 0.60 (60%).

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** If events $X$ and $Y$ are mutually exclusive, write the formula for $P(X \text{ or } Y)$.
> **Solution:** $P(X \text{ or } Y) = P(X) + P(Y)$.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** A card is drawn from a standard 52-card deck. Let event $A$ be "drawing a face card" (Jack, Queen, King) and event $B$ be "drawing a red card."
(a) Determine if events A and B are mutually exclusive.
(b) Calculate $P(A \cup B)$, the probability of drawing a face card or a red card.
> **Solution:**
> (a) No, events A and B are not mutually exclusive. There are 6 red face cards (King of Hearts, King of Diamonds, Queen of Hearts, Queen of Diamonds, Jack of Hearts, Jack of Diamonds) that are common to both events. Therefore, $P(A \cap B) = 6/52$.
> (b) $P(A) = 12/52$ (4 Jacks, 4 Queens, 4 Kings).
> $P(B) = 26/52$ (26 red cards).
> $P(A \cap B) = 6/52$ (6 red face cards).
> Using the general Addition Rule:
> $P(A \cup B) = P(A) + P(B) - P(A \cap B) = 12/52 + 26/52 - 6/52 = 32/52 = 8/13$.

# Key Takeaways
*   The Addition Rule calculates the probability of at least one of two or more events occurring.
*   For mutually exclusive events, $P(A \cup B) = P(A) + P(B)$.
*   For non-mutually exclusive events, $P(A \cup B) = P(A) + P(B) - P(A \cap B)$ to correct for double-counting shared outcomes.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| [[Mutually_Exclusive_and_Non_Mutually_Exclusive_Events]] | The choice of Addition Rule formula is directly dependent on this classification of events. |
| [[Introduction_to_Probability]] | Relies on the fundamental definitions of events and their probabilities.                   |
| [[Conditional_Probability]] | Can be used in conjunction with the Addition Rule to solve complex problems.               |
---