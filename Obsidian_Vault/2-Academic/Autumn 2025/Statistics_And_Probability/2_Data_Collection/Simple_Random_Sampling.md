---

title: Simple_Random_Sampling
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.pdf]]"
source_pages:
- 29
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Random_Sampling]]"

---

# 1. Mental Model

A Simple Random Sampling process can be thought of as analogous to drawing colored balls from a large urn. In this analogy, each element in the population corresponds to a ball in the urn, and the process of randomly selecting a sample is like drawing a ball without replacement, where every ball has an equal chance of being selected. This mechanism matches the structural component of equal probability of selection for each element in the population and the random process of selection.

# 2. Statistical Modeling & Inference

In [[Simple_Random_Sampling]], every member of the [[Population]] has an equal chance of being included in the [[Sample]], which is a crucial aspect of [[Collection_Of_Data]]. This method helps in minimizing [[Sampling_Error]] by ensuring that the selection process is free from bias, thereby making the sample representative of the [[Population]]. The process involves using [[Random_Sampling]] techniques to select a subset of individuals from the population, which allows for the estimation of population parameters with a certain degree of accuracy. A key consideration in [[Simple_Random_Sampling]] is the determination of [[Large_Sample_Sizes]] to achieve reliable estimates. The method's effectiveness can be influenced by factors such as [[Response_Rate]] and [[Low_Response_Rate]], which can impact the [[Impact_On_Statistical_Analysis]].

# 3. Confounding Variables & Bias

If the sample is not properly randomized, it may lead to biases in the estimation of population parameters, which can result in incorrect conclusions. For instance, if a [[Convenience_Sampling]] method is used instead of [[Simple_Random_Sampling]], it may introduce [[Sampling_Error]] due to the non-random selection process. 

| Bias Type | Description | Effect on Analysis |
| --- | --- | --- |
| Selection Bias | Occurs when sample not representative | Leads to inaccurate conclusions |
| Non-Response Bias | Occurs when low response rate | Affects generalizability of results | 

In such cases, the [[Advantages_And_Disadvantages_Of_Census_And_Sample_Survey]] must be carefully evaluated to ensure that the chosen method provides reliable and accurate results.

## 4. Probability Distribution

### Markdown Probability Table

| Outcome | Probability |
|---------|-------------|
| 0       | 0.4         |
| 1       | 0.6         |

### Block LaTeX Equation

$$
P(X = x) = 
\begin{cases} 
0.4 & \text{if } x = 0 \\
0.6 & \text{if } x = 1 
\end{cases}
$$

The markdown probability table represents the possible outcomes of a random variable $X$ and their associated probabilities. The block LaTeX equation provides a concise mathematical representation of the probability distribution of $X$.

## 5. Walkthrough

1. Define a random variable $X$ that represents the outcome of a simple random sampling process, where $X$ can take on values of 0 or 1.
2. Assume that the probability of $X = 0$ is 0.4, and the probability of $X = 1$ is 0.6, which can be represented as $P(X = 0) = 0.4$ and $P(X = 1) = 0.6$.
3. Verify that the probabilities satisfy the condition of a valid probability distribution: $P(X = 0) + P(X = 1) = 0.4 + 0.6 = 1$.
4. Express the probability distribution of $X$ using a markdown probability table.
5. Represent the probability distribution of $X$ using a block LaTeX equation.
6. Confirm that the LaTeX equation and markdown table convey the same information about the probability distribution of $X$.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "In Simple Random Sampling, does every element in the population have an equal chance of being selected?",
    "answer": true,
    "explanation": "This is a fundamental principle of Simple Random Sampling, ensuring that the sample is representative of the population."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose you are tasked with sampling a list of 1000 students to survey about their course satisfaction. The list includes 600 undergraduate and 400 graduate students. Using Simple Random Sampling, what is the probability that the first 5 students selected are all graduate students?",
    "answer": "The probability of selecting a graduate student on the first draw is 400/1000 = 0.4. Since the sampling is done without replacement, the probability changes with each draw. However, for the first 5 draws, the probability that all are graduate students is (400/1000) * (399/999) * (398/998) * (397/997) * (396/996).",
    "explanation": "This scenario tests the application of Simple Random Sampling to a specific situation, requiring the calculation of probabilities for a sequence of events without replacement."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how Simple Random Sampling ensures that a sample is representative of the population, focusing on the role of randomness and equal probability of selection.",
    "answer": "Simple Random Sampling ensures a sample is representative by giving every element in the population an equal chance of being selected. This randomness helps in minimizing bias and ensures that the sample's characteristics closely reflect those of the population. The method does not guarantee that the sample will perfectly mirror the population, but it provides a systematic way to achieve a high degree of representativeness.",
    "explanation": "This question assesses the understanding of the core concept of Simple Random Sampling and its implications for achieving a representative sample."
  }
]

```