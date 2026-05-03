---

title: Population
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.pdf]]"
source_pages:
- 10
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Collection_Of_Data]]"

---

# 1. Mental Model

A population can be thought of as a large library, where every book represents an individual of interest in a study. Just as a library contains a vast collection of books, a population comprises all the individuals that are relevant to a particular research question. The library's catalog system can be seen as analogous to the sampling frame, which is used to identify and select individuals from the population.

# 2. Statistical Modeling & Inference

In statistical investigations, the [[Collection_Of_Data]] process often involves selecting a [[Sample]] from a larger [[Population]], as it is usually impractical to collect data from every individual in the population, which would be equivalent to conducting a [[Census]]. The goal is to use [[Random_Sampling]] methods, such as [[Simple_Random_Sampling]], [[Systematic_Random_Sampling]], [[Stratified_Random_Sampling]], or [[Cluster_Random_Sampling]], to obtain a representative sample that minimizes [[Sampling_Error]]. The [[Advantages_And_Disadvantages_Of_Census_And_Sample_Survey]] must be carefully considered when deciding between these approaches. By understanding the [[Scopes_Of_Statistical_Investigations]] and using appropriate [[Data_Collection_Methods]], researchers can make inferences about the population with a certain degree of accuracy. Effective [[Data_Collection_Methods]] help mitigate issues related to [[Low_Response_Rate]] and [[Response_Rate_Importance]].

# 3. Confounding Variables & Bias

When studying a population, researchers must be aware of potential sources of bias that can affect the validity of their findings. For instance, if a study relies on [[Convenience_Sampling]] or [[Quota_Sampling]], the results may not accurately represent the population due to [[Sampling_Error]]. 

| Bias Type | Description | 
|---|---|
| Selection Bias | Occurs when the sample is not representative of the population. | 
| Non-Response Bias | Arises when certain individuals are less likely to respond. | 

In such cases, the [[Impact_On_Statistical_Analysis]] can be significant, leading to incorrect conclusions about the population. Therefore, it is crucial to carefully evaluate the [[Cost_Comparison]] of different sampling methods and consider their potential limitations, such as [[Questionnaire_Limitations]], to ensure the accuracy and reliability of the findings.

## 4. Probability Distribution

| Outcome | Probability |
| --- | --- |
| 0 | 0.2 |
| 1 | 0.3 |
| 2 | 0.5 |

$$
P(X = x) = 
\begin{cases}
0.2 & \text{if } x = 0 \\
0.3 & \text{if } x = 1 \\
0.5 & \text{if } x = 2 \\
0 & \text{otherwise}
\end{cases}
$$

The markdown table represents a probability distribution over a discrete random variable $X$, where each row corresponds to an outcome and its associated probability. The LaTeX equation defines the probability function $P(X = x)$ for the random variable $X$, which assigns a probability to each possible outcome.

## 5. Walkthrough

1. Define a discrete random variable $X$ that represents the outcome of an experiment, with possible values $x \in \{0, 1, 2\}$.
2. Assign probabilities to each outcome: $P(X = 0) = 0.2$, $P(X = 1) = 0.3$, and $P(X = 2) = 0.5$.
3. Verify that the probabilities satisfy the axioms of probability: $0 \leq P(X = x) \leq 1$ for all $x$, and $\sum_{x} P(X = x) = 1$.
4. Compute the cumulative distribution function (CDF) of $X$: $F_X(x) = P(X \leq x) = \sum_{x' \leq x} P(X = x')$.
5. Evaluate $F_X(1) = P(X \leq 1) = P(X = 0) + P(X = 1) = 0.2 + 0.3 = 0.5$.
6. Confirm that $F_X(x)$ is a non-decreasing function, i.e., $F_X(x_1) \leq F_X(x_2)$ whenever $x_1 < x_2$.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A population in statistical investigation refers to a subset of individuals of interest.",
    "answer": false,
    "explanation": "A population refers to the entire group of individuals of interest in a study, not a subset."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose a researcher wants to study the average income of all adults in a country, but the census data only includes incomes for adults who have a registered phone number. What potential issue arises in this scenario?",
    "answer": "The sampling frame may not accurately represent the population, as it excludes adults without a registered phone number.",
    "explanation": "This scenario presents a potential issue with the sampling frame, which may lead to biased results if not addressed."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how a population can be thought of as a library, and discuss the implications of this analogy for statistical investigation.",
    "answer": "A population can be thought of as a large library where every book represents an individual of interest. Just as a library contains a vast collection of books, a population comprises all individuals relevant to a research question. The library's catalog system is analogous to the sampling frame. This analogy implies that statistical investigation aims to draw a representative sample from the population, just as one would search the library's catalog to find relevant books.",
    "explanation": "This analogy helps to conceptualize the population and the importance of a representative sampling frame in statistical investigation."
  }
]

```