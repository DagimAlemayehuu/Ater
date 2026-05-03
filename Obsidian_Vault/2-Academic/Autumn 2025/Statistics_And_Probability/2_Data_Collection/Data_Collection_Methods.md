---

title: Data_Collection_Methods
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: '[[2_Data_Collection_Hub]]'
source: '[[2.pdf]]'
source_pages: []
mode: MATH-STAT
read: false
generated: true
prerequisites:
- '[[Collection_Of_Data]]'
- '[[Population]]'
- '[[Sample]]'
- '[[Random_Sampling]]'
- '[[Simple_Random_Sampling]]'

---


# 1. Mental Model

A data collection process can be thought of as similar to a fishing expedition, where the population of interest is the entire ocean, and the sample is the catch of the day. Just as a fisherman uses different types of nets (e.g., trawl nets, gillnets) to catch specific types of fish, a data collector uses various methods (e.g., surveys, interviews) to collect data from a specific subset of the population. The mechanism matches in that both involve selecting a representative portion of the whole to make inferences about the entire population.

# 2. Statistical Modeling & Inference

In [[Collection_Of_Data]], researchers aim to gather information from a [[Population]] through methods such as [[Sample]] surveys, which involve selecting a subset of individuals from the population using techniques like [[Random_Sampling]], [[Simple_Random_Sampling]], [[Systematic_Random_Sampling]], [[Stratified_Random_Sampling]], or [[Cluster_Random_Sampling]]. The choice of sampling method affects the [[Sampling_Error]] and the [[Advantages_And_Disadvantages_Of_Census_And_Sample_Survey]]. A [[Census]] attempts to collect data from every member of the population, but this can be impractical for large populations, making [[Sample]] surveys a more feasible option. The [[Scopes_Of_Statistical_Investigations]] and [[Data_Collection_Methods]] must be carefully considered to ensure accurate and reliable results.

# 3. Confounding Variables & Bias

When using various [[Data_Collection_Methods]], researchers must be aware of potential biases, such as those introduced by [[Convenience_Sampling]], [[Quota_Sampling]], or [[Purposive_Sampling]], which can lead to [[Low_Response_Rate]] and [[Impact_On_Statistical_Analysis]]. 

| Method | Potential Bias |
|---|---|
| Convenience Sampling | Selection bias |
| Quota Sampling | Non-response bias |
| Purposive Sampling | Researcher bias |

If not properly addressed, these biases can affect the validity of the results, particularly in [[Geographic_Areas]] with unique characteristics. A thorough understanding of [[Response_Rate_Importance]] and [[Questionnaire_Limitations]] is essential to minimize these risks.

## 4. Probability Distribution

### Markdown Probability Table

| Outcome | Probability |
| --- | --- |
| 0 | 0.4 |
| 1 | 0.3 |
| 2 | 0.3 |

### Block LaTeX Equation

$$
P(X = k) = \begin{cases}
0.4 & \text{if } k = 0 \\
0.3 & \text{if } k = 1 \\
0.3 & \text{if } k = 2 \\
0 & \text{otherwise}
\end{cases}
$$

The markdown probability table represents the possible outcomes of a discrete random variable $X$ and their corresponding probabilities. The block LaTeX equation defines the probability distribution of $X$ using a piecewise function, where $P(X = k)$ gives the probability of each outcome $k$.

## 5. Walkthrough

1. **Define the Random Variable**: Let $X$ be a discrete random variable representing the outcome of an experiment.
2. **Specify the Possible Outcomes**: The possible outcomes of $X$ are 0, 1, and 2.
3. **Assign Probabilities**: Assign probabilities to each outcome: $P(X = 0) = 0.4$, $P(X = 1) = 0.3$, and $P(X = 2) = 0.3$.
4. **Verify the Probability Axiom**: Check that the probabilities satisfy the axiom $\sum_{k} P(X = k) = 1$: $0.4 + 0.3 + 0.3 = 1$.
5. **Write the Probability Distribution**: Express the probability distribution of $X$ using a markdown table and a block LaTeX equation.
6. **Interpret the Results**: The probability distribution of $X$ describes the likelihood of each outcome, allowing us to make probabilistic statements about the experiment.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A data collection process aims to collect data from the entire population of interest.",
    "answer": false,
    "explanation": "A data collection process typically aims to collect data from a representative sample of the population, not the entire population."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose a researcher wants to study the effects of a new medication on patients with a rare disease. The disease affects only 1% of the population. What type of sampling method would be most effective in this scenario?",
    "answer": "Stratified sampling or oversampling the rare disease population",
    "explanation": "In this scenario, a simple random sample may not capture enough cases of the rare disease. Stratified sampling or oversampling the rare disease population would ensure that the sample is representative of the population with the disease."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how the concept of sampling bias can occur in a survey research study.",
    "answer": "Sampling bias occurs when the sample collected is not representative of the population of interest. This can happen if the sampling frame is not accurate, or if certain subgroups are underrepresented or overrepresented in the sample. For example, if a survey is conducted online, it may miss people who do not have access to the internet, leading to a biased sample.",
    "explanation": "Sampling bias can lead to incorrect conclusions about the population. It is essential to carefully design the sampling process to minimize bias and ensure that the sample is representative of the population."
  }
]

```