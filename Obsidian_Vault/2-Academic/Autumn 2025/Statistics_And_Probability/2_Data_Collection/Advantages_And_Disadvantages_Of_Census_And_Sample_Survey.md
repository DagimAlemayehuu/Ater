---

title: Advantages_And_Disadvantages_Of_Census_And_Sample_Survey
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
- '[[Population]]'
- '[[Collection_Of_Data]]'
- '[[Census]]'
- '[[Sample]]'
- '[[Large_Sample_Sizes]]'

---


# 1. Mental Model

The concept of census and sample surveys can be likened to a game of archery, where the goal is to hit the target accurately. Just as an archer must consider the distance, wind, and arrow trajectory to hit the bullseye, a statistician must consider the [[Population]], sampling method, and sample size to accurately estimate population parameters. In this analogy, the population is like the target, and the sample is like the arrow, which must be carefully aimed and launched to gather representative data.

# 2. Statistical Modeling & Inference

When conducting a [[Collection_Of_Data]], researchers often face a trade-off between [[Census]] and [[Sample]] surveys. A census involves collecting data from every member of the [[Population]], which can be time-consuming and costly, but provides [[Large_Sample_Sizes]] and eliminates [[Sampling_Error]]. In contrast, a sample survey involves collecting data from a subset of the population, which can be more cost-effective and faster, but introduces [[Sampling_Error]] and requires careful consideration of [[Random_Sampling]] methods, such as [[Simple_Random_Sampling]], [[Systematic_Random_Sampling]], [[Stratified_Random_Sampling]], or [[Cluster_Random_Sampling]]. The choice between census and sample surveys depends on the [[Scopes_Of_Statistical_Investigations]], [[Data_Collection_Methods]], and [[Response_Rate]], as well as the potential impact of [[Low_Response_Rate]] on [[Statistical_Analysis]]. By understanding the [[Advantages_And_Disadvantages_Of_Census_And_Sample_Survey]], researchers can make informed decisions about the most suitable approach for their study.

# 3. Confounding Variables & Bias

When using sample surveys, researchers must be aware of potential biases and confounding variables that can affect the results. For instance, if the sampling method is not [[Random_Sampling]], it may introduce [[Convenience_Sampling]] or [[Quota_Sampling]] bias, leading to inaccurate estimates of population parameters. Additionally, a low [[Response_Rate]] can also introduce bias, as non-respondents may differ systematically from respondents. If not properly addressed, these biases can lead to incorrect conclusions and decisions, highlighting the importance of careful study design and [[Data_Collection_Methods]] to minimize [[Impact_On_Statistical_Analysis]].

## 4. Probability Distribution

| Probability | $X$ | $P(X = x)$ |
| --- | --- | --- |
| 0.2 | 1 | 0.2 |
| 0.3 | 2 | 0.3 |
| 0.5 | 3 | 0.5 |

$$
E(X) = \sum_{x} xP(X=x) = 1(0.2) + 2(0.3) + 3(0.5) = 2.3
$$

The probability table represents the distribution of a discrete random variable $X$, where each row corresponds to a possible value of $X$ and its associated probability. The block LaTeX equation calculates the expected value of $X$, which is a measure of the central tendency of the distribution.

## 5. Walkthrough

1. Define the problem: We are given a discrete random variable $X$ with a probability distribution and asked to calculate its expected value.
2. Write down the probability distribution: The probability distribution of $X$ is given by $P(X = 1) = 0.2$, $P(X = 2) = 0.3$, and $P(X = 3) = 0.5$.
3. Recall the formula for the expected value: The expected value of $X$ is given by $E(X) = \sum_{x} xP(X=x)$.
4. Plug in the values: Substitute the values of $X$ and their associated probabilities into the formula: $E(X) = 1(0.2) + 2(0.3) + 3(0.5)$.
5. Perform the calculation: Evaluate the expression: $E(X) = 0.2 + 0.6 + 1.5 = 2.3$.
6. Interpret the result: The expected value of $X$ is $2.3$, which represents the long-run average value of $X$ if the experiment is repeated many times.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A census involves collecting data from a subset of the population.",
    "answer": false,
    "explanation": "A census involves collecting data from the entire population, not a subset."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher wants to estimate the average income of a city's residents. However, the city's population is highly skewed, with a small number of extremely wealthy individuals. What type of sampling method would be most suitable to ensure accurate estimates?",
    "answer": "Stratified sampling would be most suitable to ensure accurate estimates.",
    "explanation": "Stratified sampling involves dividing the population into subgroups and sampling from each subgroup. This method is particularly useful when the population is highly skewed, as it ensures that the sample is representative of the population's diverse subgroups."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how a sample survey can be more cost-effective than a census, but also more prone to sampling errors. Provide an example to illustrate your points.",
    "answer": "A sample survey can be more cost-effective than a census because it involves collecting data from a smaller subset of the population, which reduces the costs associated with data collection and processing. However, this also makes it more prone to sampling errors, as the sample may not be representative of the population. For example, if a sample survey is conducted to estimate the average income of a city's residents, but the sample only includes residents from a specific neighborhood, the estimates may not accurately reflect the income levels of the entire city.",
    "explanation": "This answer demonstrates an understanding of the trade-offs between cost-effectiveness and accuracy in sample surveys compared to censuses."
  }
]

```