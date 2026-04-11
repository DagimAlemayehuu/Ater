---
title: Tree_Diagrams
created_at: '2026-01-18T11:11:52Z'
last_modified: '2026-01-18T11:11:52Z'
deployment_batch_id: AI_GENERATED_BATCH
uid: ffe6430d-b479-4c3c-bbf1-aefd1ed552d8
type: Core
course: Statistics_And_Probability
year: Year_II
semester: Semester_I
credits: 3
original_source: Lecture_Slides
aliases: 
- Probability_Trees
- Event_Diagrams
unit: 6_Probability_And_Probability_Distributions
parent: Introduction_To_Probability
---

# Definition
Before proceeding, ensure you master [[Introduction_to_Probability]] and [[Multiplication_Rule_of_Probability]] because tree diagrams visually organize the outcomes and probabilities of sequential or multi-stage experiments.
Tree diagrams are graphical tools used to list all possible outcomes of a sequence of events and to calculate their associated probabilities. Each "branch" of the tree represents a possible outcome of an event, and the probability of that outcome is written along the branch. The structure allows for easy visualization of how probabilities multiply along paths (sequences of events) and add across branches (alternative outcomes). A simpler way to think about it: it's like a decision tree for chance, where each choice or step has a probability, and you can trace all the possible "stories" or paths to see their overall likelihood.

# The Mental Model
Imagine you're navigating a path through a forest. At each junction, you have a choice (or a random event occurs, like a coin flip). Each path segment represents an outcome, and its "width" (or a label next to it) is the probability of taking that path. A tree diagram helps you map out every single possible route from start to finish, showing you the likelihood of ending up at any particular destination. To find the probability of a specific full route, you "multiply" the widths of the path segments you took. To find the probability of reaching any of several destinations, you "add" the total probabilities of those routes.

# Context & Framework
### Mapping Sequential Outcomes: The Visual Flow of Probability
Tree diagrams are exceptionally useful for visualizing and calculating probabilities in **multi-stage experiments**—where an experiment consists of a sequence of two or more simpler experiments. Each stage of the experiment is represented by a set of branches originating from a node (or decision point).
*   **Branches:** Each branch represents a possible outcome of an event, and its length or label often indicates its probability.
*   **Nodes:** The points where branches split represent the occurrence of an event.
*   **Paths:** A complete path from the starting point (root) to an end point (leaf) represents a sequence of outcomes, constituting a composite outcome of the entire experiment.

To calculate the probability of a specific sequence of events (a path), you **multiply the probabilities along the branches** of that path (Multiplication Rule of Probability).
To calculate the probability of an event that can occur through several different sequences, you **add the probabilities of all the paths** that lead to that event (Addition Rule of Probability, typically for mutually exclusive paths).
The sum of probabilities for all branches stemming from a single node must equal 1. Similarly, the sum of probabilities for all end-point paths must equal 1.

# The Mastery Deep Dive
### Constructing the Narrative: Step-by-Step Visualization
The process of constructing a tree diagram is a methodical application of sequential event analysis.
1.  **Start Node:** Begin with a single "root" node representing the start of the experiment.
2.  **First Stage Branches:** From the root, draw branches for each possible outcome of the first event. Label each branch with its probability.
3.  **Subsequent Stages:** From the end of each first-stage branch, draw new branches for the outcomes of the second event. These branches are labeled with their *conditional probabilities* (if events are dependent) or their unconditional probabilities (if events are independent).
4.  **Endpoint Outcomes:** Continue this process for all stages of the experiment. The ends of the final branches represent all possible composite outcomes of the experiment.
5.  **Path Probabilities:** To find the probability of each complete sequence of outcomes (each "path"), multiply the probabilities along the branches from the start to that endpoint.
6.  **Event Probabilities:** To find the probability of a specific event (e.g., "at least one head"), identify all paths that lead to that event and sum their individual path probabilities.

Tree diagrams are particularly powerful because they visually enforce the rules of probability, making it harder to forget conditional probabilities or to misapply the multiplication/addition rules. They are a visual "engineer's blueprint" for calculating complex probabilities by breaking them down into manageable, sequential steps.

# Constraints & Limitations
### The "Oops!" List: Mislabeling Branches
A common error in tree diagrams is incorrectly labeling the probabilities along the branches, especially for dependent events. If the events are "without replacement," the probabilities for the second set of branches MUST be conditional probabilities, reflecting the reduced sample space after the first event. Forgetting to update these probabilities is a critical flaw. Another pitfall is failing to ensure that the probabilities stemming from any single node sum to 1, indicating a missed or misidentified outcome. Always double-check that "going down" branches sums to 1 and "going across" branches multiplies for path probabilities.

# Significance & Application
Tree diagrams are a highly versatile and intuitive tool for probabilistic analysis, essential across various fields. In business, they help model decision-making under uncertainty, such as analyzing the potential outcomes and probabilities of different investment strategies. In quality control, they can map the probability of multiple defects occurring in a production line. In genetics, they illustrate the inheritance patterns of traits over generations. Their visual nature makes complex sequential probabilities more accessible and less prone to calculation errors, serving as a powerful aid for both understanding and communicating probabilistic scenarios.

# The Worked Example
An urn contains 3 red balls and 2 blue balls. You draw two balls without replacement. Construct a tree diagram and use it to find the probability of drawing one red and one blue ball.

**1. First Draw:**
*   From start, branch to "Red (R)" with $P(R_1) = 3/5$.
*   From start, branch to "Blue (B)" with $P(B_1) = 2/5$.

**2. Second Draw (Conditional Probabilities, since without replacement):**
*   From "Red (R)" (meaning 2 R, 2 B left):
    *   Branch to "Red (R)" with $P(R_2|R_1) = 2/4 = 1/2$.
    *   Branch to "Blue (B)" with $P(B_2|R_1) = 2/4 = 1/2$.
*   From "Blue (B)" (meaning 3 R, 1 B left):
    *   Branch to "Red (R)" with $P(R_2|B_1) = 3/4$.
    *   Branch to "Blue (B)" with $P(B_2|B_1) = 1/4$.

**3. Calculate Path Probabilities (Multiply along branches):**
*   Path 1 (R, R): $P(R_1 \cap R_2) = (3/5) \times (2/4) = 6/20$.
*   Path 2 (R, B): $P(R_1 \cap B_2) = (3/5) \times (2/4) = 6/20$.
*   Path 3 (B, R): $P(B_1 \cap R_2) = (2/5) \times (3/4) = 6/20$.
*   Path 4 (B, B): $P(B_1 \cap B_2) = (2/5) \times (1/4) = 2/20$.

**4. Find Probability of "One Red and One Blue" (Add relevant path probabilities):**
This event includes Path 2 (R, B) and Path 3 (B, R).
$P(\text{One Red and One Blue}) = P(R_1 \cap B_2) + P(B_1 \cap R_2) = 6/20 + 6/20 = 12/20 = 3/5$.

```mermaid
graph TD
    Start --> A[First Draw: Red (3/5)]
    Start --> B[First Draw: Blue (2/5)]

    A --> C[Second Draw: Red (2/4)]
    A --> D[Second Draw: Blue (2/4)]

    B --> E[Second Draw: Red (3/4)]
    B --> F[Second Draw: Blue (1/4)]

    C -- "P(R,R) = (3/5)*(2/4) = 6/20" --> RR_Outcome((RR))
    D -- "P(R,B) = (3/5)*(2/4) = 6/20" --> RB_Outcome((RB))
    E -- "P(B,R) = (2/5)*(3/4) = 6/20" --> BR_Outcome((BR))
    F -- "P(B,B) = (2/5)*(1/4) = 2/20" --> BB_Outcome((BB))
```
```text
// Scenario 1: Drawing two balls without replacement.
// Output:
// (A visual flow chart representing the tree diagram for drawing two balls without replacement.)
// Start node branches to "First Draw: Red (3/5)" and "First Draw: Blue (2/5)".
// From "First Draw: Red (3/5)", branches to "Second Draw: Red (2/4)" and "Second Draw: Blue (2/4)".
// From "First Draw: Blue (2/5)", branches to "Second Draw: Red (3/4)" and "Second Draw: Blue (1/4)".
// Each end node shows the calculated path probability (e.g., P(R,R) = 6/20).
//
// The visual diagram illustrates the sequential choices and their associated conditional probabilities, leading to the joint probabilities of each outcome sequence.
```
*Note: This `flowchart TD` illustrates a probability tree, showing sequential events and their conditional probabilities along each path. `RR` means two reds, `RB` means red then blue, etc.*

# The Proving Ground
*Test your mastery. Cover the solutions below to test yourself first.*

### Level 1: The Sanity Check (Verification)
**The Question:** In a tree diagram, what mathematical operation do you perform on the probabilities along a single path to find the probability of that sequence of events?
> **Solution:** Multiply.

### Level 2: The Crucible (Mastery & Edge Cases)
**The Scenario:** A football team has two remaining matches. The probability of winning (W) is 0.3, drawing (D) is 0.5, and losing (L) is 0.2. The outcome of the first match does not affect the probability of the second match's outcome.
(a) Draw a tree diagram showing all possible outcomes for the two matches.
(b) Calculate the probability that the team wins exactly one match.
> **Solution:**
> (a) (Tree Diagram would be similar to the Worked Example structure but with 3 branches at each stage).
>
> **First Match (M1):**
>     - Win (W1): 0.3
>     - Draw (D1): 0.5
>     - Lose (L1): 0.2
>
> **Second Match (M2) - from each M1 outcome (probabilities are independent):**
>     - From W1: W2 (0.3), D2 (0.5), L2 (0.2)
>     - From D1: W2 (0.3), D2 (0.5), L2 (0.2)
>     - From L1: W2 (0.3), D2 (0.5), L2 (0.2)
>
> **Paths & Probabilities:**
>     - WW: 0.3 * 0.3 = 0.09
>     - WD: 0.3 * 0.5 = 0.15
>     - WL: 0.3 * 0.2 = 0.06
>     - DW: 0.5 * 0.3 = 0.15
>     - DD: 0.5 * 0.5 = 0.25
>     - DL: 0.5 * 0.2 = 0.10
>     - LW: 0.2 * 0.3 = 0.06
>     - LD: 0.2 * 0.5 = 0.10
>     - LL: 0.2 * 0.2 = 0.04
>
> (b) Winning exactly one match means the paths (W,D), (W,L), (D,W), (L,W).
> $P(\text{exactly one win}) = P(WD) + P(WL) + P(DW) + P(LW) = 0.15 + 0.06 + 0.15 + 0.06 = 0.42$.

### Level 3: Mastery (The Crucible)
**The Scenario:** A factory produces chips. Machine A produces 60% of the chips, and Machine B produces 40%. 2% of chips from Machine A are defective, while 3% of chips from Machine B are defective. You pick a chip at random. Construct a tree diagram to illustrate this process, and then, using the diagram, calculate the probability that the chip is defective.
> **Solution:**
> **Stage 1 (Machine Selection):**
>     - Branch to Machine A: $P(A) = 0.60$
>     - Branch to Machine B: $P(B) = 0.40$
>
> **Stage 2 (Defective/Non-Defective - conditional on machine):**
>     - From Machine A:
>         - Defective (D): $P(D|A) = 0.02$
>         - Non-Defective (ND): $P(ND|A) = 0.98$
>     - From Machine B:
>         - Defective (D): $P(D|B) = 0.03$
>         - Non-Defective (ND): $P(ND|B) = 0.97$
>
> **Paths & Probabilities:**
>     - A and D: $P(A \cap D) = P(A) \times P(D|A) = 0.60 \times 0.02 = 0.012$
>     - A and ND: $P(A \cap ND) = P(A) \times P(ND|A) = 0.60 \times 0.98 = 0.588$
>     - B and D: $P(B \cap D) = P(B) \times P(D|B) = 0.40 \times 0.03 = 0.012$
>     - B and ND: $P(B \cap ND) = P(B) \times P(ND|B) = 0.40 \times 0.97 = 0.388$
>
> **Probability of Defective Chip:** Add probabilities of paths leading to Defective (D).
> $P(D) = P(A \cap D) + P(B \cap D) = 0.012 + 0.012 = 0.024$.
>
> This scenario demonstrates a "disaster drill" where tracking probabilities through a tree diagram helps identify the overall defect rate from multiple sources.

# Key Takeaways
*   Tree diagrams visually represent sequences of events and their probabilities, ideal for multi-stage experiments.
*   Path probabilities are found by multiplying probabilities along branches.
*   Event probabilities are found by summing the probabilities of all paths leading to that event.

# Knowledge Graph Connections
| Concept                     | Connection / Relationship                                                                   |
| :
-------------------------- | :
------------------------------------------------------------------------------------------ |
| [[Introduction_to_Probability]] | Visually organizes the sample space, outcomes, and events of multi-stage experiments.      |
| [[Multiplication_Rule_of_Probability]] | Directly applies this rule along branches to calculate the probability of sequences of events. |
| [[Conditional_Probability]] | Effectively shows conditional probabilities on subsequent branches, given prior outcomes.    |
| [[Dependent_and_Independent_Events]] | Clearly illustrates how probabilities change (or don't change) depending on the nature of events. |
---