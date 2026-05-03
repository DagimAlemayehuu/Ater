---

title: Sampling_Error
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.pdf]]"
source_pages:
- 13
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Sample]]"

---

# 1. Mental Model

A fishing net is an apt analogy for understanding sampling error. Just as a fishing net scoops up a subset of fish from a larger lake, a sample represents a subset of individuals from a larger population. The structural components of the concept of sampling error, such as the sample size and the variability of the population, are analogous to the mesh size of the net and the distribution of fish in the lake.

# 2. Statistical Modeling & Inference

The [[Collection_Of_Data]] process involves selecting a [[Sample]] from a [[Population]], which can be achieved through various methods including [[Simple_Random_Sampling]], [[Systematic_Random_Sampling]], [[Stratified_Random_Sampling]], and [[Cluster_Random_Sampling]]. The [[Sampling_Error]] is a critical consideration in statistical analysis, as it represents the discrepancy between the sample statistic and the population parameter. A [[Large_Sample_Size]] can help reduce [[Sampling_Error]], but it is also influenced by the [[Variability]] of the population and the [[Sampling_Method]] used. In contrast, a [[Census]] aims to collect data from the entire [[Population]], eliminating [[Sampling_Error]] but often being more resource-intensive. The [[Advantages_And_Disadvantages_Of_Census_And_Sample_Survey]] must be carefully weighed in the context of [[Scopes_Of_Statistical_Investigations]].

# 3. Confounding Variables & Bias

| Condition | Description | Impact on Sampling Error |
| --- | --- | --- |
| Non-Response | Failure to collect data from a subset of the sample | Increases [[Sampling_Error]] due to potential bias |
| Measurement Error | Inaccurate or imprecise measurement of variables | Increases [[Sampling_Error]] and can lead to incorrect conclusions |
| Selection Bias | Non-random selection of sample participants | Increases [[Sampling_Error]] and can lead to biased estimates |
| Low Response Rate | High rate of non-response or refusal to participate | Increases [[Sampling_Error]] and can lead to biased estimates if not properly addressed | 

When these boundary conditions are not met, the [[Sampling_Error]] can increase, leading to less reliable estimates of the population parameter. If not properly accounted for, these factors can cause the sample statistic to diverge significantly from the true population parameter, rendering the analysis ineffective. The failure states of non-response, measurement error, selection bias, and low response rate can all contribute to increased [[Sampling_Error]], highlighting the importance of careful study design and data collection.

## 4. Probability Distribution

| Outcome | Probability |
| --- | --- |
| 0 | 0.4 |
| 1 | 0.6 |

$$
P(X = x) = 
\begin{cases} 
0.4 & \text{if } x = 0 \\
0.6 & \text{if } x = 1 
\end{cases}
$$

The markdown table represents the probability distribution of a discrete random variable $X$, where each row corresponds to an outcome and its associated probability. The LaTeX equation provides a concise mathematical representation of the probability distribution, defining the probability of each outcome.

## 5. Walkthrough

1. Define the random variable $X$ as the outcome of a single trial, where $X$ can take on values of 0 or 1.
2. Assume that the probability of $X = 0$ is 0.4, and the probability of $X = 1$ is 0.6, which can be represented as $P(X = 0) = 0.4$ and $P(X = 1) = 0.6$.
3. Verify that the probabilities satisfy the condition of a valid probability distribution: $P(X = 0) + P(X = 1) = 0.4 + 0.6 = 1$.
4. Calculate the expected value of $X$, denoted as $E(X)$ or $\mu_X$, using the formula $E(X) = \sum x \cdot P(X = x) = 0 \cdot 0.4 + 1 \cdot 0.6 = 0.6$.
5. Calculate the variance of $X$, denoted as $Var(X)$ or $\sigma_X^2$, using the formula $Var(X) = E(X^2) - [E(X)]^2 = (0^2 \cdot 0.4 + 1^2 \cdot 0.6) - (0.6)^2 = 0.6 - 0.36 = 0.24$.
6. Interpret the results: the expected value $E(X) = 0.6$ represents the long-term average outcome, and the variance $Var(X) = 0.24$ represents the spread or dispersion of the outcomes around the expected value.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Sampling error occurs only when the sample is biased.",
    "answer": false,
    "explanation": "Sampling error occurs due to the random variation in the sample selected from the population, regardless of whether the sample is biased or not."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher wants to estimate the average height of all adults in a country. She collects data from a sample of adults who visited a hospital on a particular day. What is a potential issue with this sampling method?",
    "answer": "The sample may not be representative of the entire population, as hospital visitors may not be a random sample of all adults in the country.",
    "explanation": "This sampling method may introduce selection bias, as hospital visitors may have different characteristics than the general population of adults."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how increasing the sample size affects the sampling error in estimating a population parameter.",
    "answer": "As the sample size increases, the sampling error decreases. This is because a larger sample size provides more information about the population, allowing for a more precise estimate of the population parameter. With a larger sample size, the variability of the sample estimates around the true population parameter decreases, resulting in a smaller sampling error.",
    "explanation": "This is a fundamental concept in statistical inference, and the answer demonstrates an understanding of the relationship between sample size and sampling error."
  }
]

```