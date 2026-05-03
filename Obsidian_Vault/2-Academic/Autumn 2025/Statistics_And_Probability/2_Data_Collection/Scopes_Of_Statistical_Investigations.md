---

title: Scopes_Of_Statistical_Investigations
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
- '[[Sample]]'
- '[[Sampling_Error]]'
- '[[Simple_Random_Sampling]]'

---


# 1. Mental Model

A statistical investigation is akin to a navigation system, where the scope of the investigation is like the map that delineates the boundaries of the terrain to be explored. Just as a map highlights key features such as roads, landmarks, and geographical constraints, the scope of a statistical investigation delineates the [[Population]] and identifies the key variables to be measured. The precision of the navigation system, much like the scope of the investigation, determines the accuracy of the findings.

# 2. Statistical Modeling & Inference

The process of conducting a statistical investigation involves several critical steps, including [[Collection_Of_Data]] from a [[Sample]] that is representative of the [[Population]]. The choice of [[Sampling_Error]] minimization technique, such as [[Simple_Random_Sampling]], [[Systematic_Random_Sampling]], [[Stratified_Random_Sampling]], or [[Cluster_Random_Sampling]], is crucial in ensuring that the [[Sample]] is free from bias. A well-planned [[Data_Collection_Methods]] approach helps to mitigate issues related to [[Low_Response_Rate]] and [[Response_Rate_Importance]], ultimately impacting the [[Impact_On_Statistical_Analysis]]. The effectiveness of the investigation also depends on the [[Advantages_And_Disadvantages_Of_Census_And_Sample_Survey]] and the [[Scopes_Of_Statistical_Investigations]], which guide the selection of the most suitable [[Sampling]] method. By understanding these concepts, researchers can design investigations that yield reliable and generalizable results.

# 3. Confounding Variables & Bias

When the scope of a statistical investigation is not properly defined, it can lead to biases in the [[Sample]], such as those encountered in [[Convenience_Sampling]] or [[Quota_Sampling]]. These biases can result in [[Sampling_Error]] and compromise the validity of the findings. | Source of Bias | Description | Impact | 

| --- | --- | --- | 
| Selection Bias | Systematic error in choosing samples | Inaccurate representation of the population | 
| Information Bias | Error in measuring or collecting data | Inaccurate conclusions | 

In such cases, the investigation may fail to account for critical confounding variables, leading to flawed conclusions.

## 4. Probability Distribution

| Outcome | Probability |
| --- | --- |
| 0 | 0.2 |
| 1 | 0.5 |
| 2 | 0.3 |

$$
P(X = x) = 
\begin{cases}
0.2 & \text{if } x = 0 \\
0.5 & \text{if } x = 1 \\
0.3 & \text{if } x = 2 \\
0 & \text{otherwise}
\end{cases}
$$

The markdown table represents the probability distribution of a discrete random variable $X$, where each row corresponds to an outcome and its associated probability. The LaTeX equation defines the probability function $P(X = x)$, which assigns a probability to each possible outcome $x$.

## 5. Walkthrough

1. Define the sample space of the random variable $X$: $\mathcal{X} = \{0, 1, 2\}$.
2. Assign probabilities to each outcome in the sample space: $P(X = 0) = 0.2$, $P(X = 1) = 0.5$, and $P(X = 2) = 0.3$.
3. Verify that the probabilities satisfy the axioms of probability: $0 \leq P(X = x) \leq 1$ for all $x \in \mathcal{X}$ and $\sum_{x \in \mathcal{X}} P(X = x) = 1$.
4. Compute the cumulative distribution function (CDF) of $X$: $F_X(x) = P(X \leq x)$.
5. Evaluate the CDF at each outcome: $F_X(0) = 0.2$, $F_X(1) = 0.7$, and $F_X(2) = 1$.
6. Express the probability function $P(X = x)$ in terms of the CDF: $P(X = x) = F_X(x) - F_X(x-1)$ for $x \in \mathcal{X}$.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The scope of a statistical investigation defines the population being studied.",
    "answer": true,
    "explanation": "The scope of a statistical investigation indeed delineates the population and key variables to be measured, making this statement true."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "An investigator aims to assess the impact of a new teaching method on student performance across an entire school district, but only has access to data from a single school. What happens?",
    "answer": "The investigation's scope is limited to the single school, which may not be representative of the entire district.",
    "explanation": "The investigation's findings may not be generalizable to the entire district due to potential differences between schools."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how a poorly defined scope can affect the validity and reliability of a statistical investigation.",
    "answer": "A poorly defined scope can lead to biased sampling, omitted variables, and misinterpretation of results, ultimately compromising the validity and reliability of the investigation.",
    "explanation": "A well-defined scope is crucial to ensure that the investigation measures what it intends to, and that the results are applicable to the population of interest."
  }
]

```