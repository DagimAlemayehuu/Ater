---

title: Random_Sampling
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.pdf]]"
source_pages:
- 25
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Sample]]"

---

# 1. Mental Model

A random sampling process can be thought of as similar to a game of chance, where each element in the population is like a ball in a lottery drum, and the selection process is akin to drawing a ball from the drum. Just as each ball has an equal probability of being drawn, each element in the population has an equal chance of being chosen for the sample. This analogy highlights the structural components of randomness and equal probability, which are essential to the concept of random sampling.

# 2. Statistical Modeling & Inference

In [[Collection_Of_Data]], [[Random_Sampling]] is a crucial method for selecting a [[Sample]] from a [[Population]]. This approach ensures that every element in the population has an equal chance of being chosen, which helps to minimize [[Sampling_Error]]. The [[Sample]] obtained through [[Random_Sampling]] is likely to be representative of the [[Population]], allowing for reliable inferences to be made. [[Simple_Random_Sampling]], [[Systematic_Random_Sampling]], [[Stratified_Random_Sampling]], and [[Cluster_Random_Sampling]] are all types of [[Random_Sampling]] methods used to achieve this goal. By using [[Random_Sampling]], researchers can increase the accuracy of their findings and reduce the impact of [[Sampling_Error]] on their [[Statistical_Analysis]].

# 3. Confounding Variables & Bias

If the [[Random_Sampling]] process is compromised, it can lead to biased [[Sample]] selection, resulting in inaccurate inferences about the [[Population]]. For instance, if the sampling frame is not representative of the population, or if there is a low [[Response_Rate]], the [[Sample]] may not accurately reflect the characteristics of the [[Population]]. | Cause of Bias | Effect on Sample | | --- | --- | | Non-random selection | Biased sample | | Low response rate | Inaccurate representation | In such cases, the [[Sample]] may not be representative of the [[Population]], leading to incorrect conclusions.

## 4. Probability Distribution

| Outcome | Probability |
| --- | --- |
| 0 | $\frac{1}{4}$ |
| 1 | $\frac{1}{2}$ |
| 2 | $\frac{1}{4}$ |

$$
P(X = x) = 
\begin{cases}
\frac{1}{4} & \text{if } x = 0 \\
\frac{1}{2} & \text{if } x = 1 \\
\frac{1}{4} & \text{if } x = 2 \\
0 & \text{otherwise}
\end{cases}
$$

The markdown table represents the possible outcomes of a random variable $X$ and their corresponding probabilities. The LaTeX equation defines the probability distribution of $X$, which assigns a probability to each possible outcome.

## 5. Walkthrough

1. Let $X$ be a discrete random variable with possible outcomes $0, 1,$ and $2$. We want to find the probability distribution of $X$.
2. Assume that the probability of $X$ taking on the value $0$ is $\frac{1}{4}$, the probability of $X$ taking on the value $1$ is $\frac{1}{2}$, and the probability of $X$ taking on the value $2$ is $\frac{1}{4}$.
3. We can represent the probability distribution of $X$ using a probability mass function (PMF): $P(X = x)$.
4. Using the given probabilities, we can write the PMF as: $P(X = 0) = \frac{1}{4}$, $P(X = 1) = \frac{1}{2}$, and $P(X = 2) = \frac{1}{4}$.
5. We can summarize the PMF in a table: 

| Outcome | Probability |
| --- | --- |
| 0 | $\frac{1}{4}$ |
| 1 | $\frac{1}{2}$ |
| 2 | $\frac{1}{4}$ |

6. The LaTeX equation $P(X = x) = 
\begin{cases}
\frac{1}{4} & \text{if } x = 0 \\
\frac{1}{2} & \text{if } x = 1 \\
\frac{1}{4} & \text{if } x = 2 \\
0 & \text{otherwise}
\end{cases}$ provides a concise way to express the PMF.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "In a random sampling process, does each element in the population have an equal chance of being chosen for the sample?",
    "answer": true,
    "explanation": "This is a fundamental principle of random sampling, ensuring that the sample is representative of the population."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose a researcher is conducting a survey using random sampling to determine the average height of adults in a country. However, the sampling frame only includes adults who have a landline phone. What potential issue might arise in this scenario?",
    "answer": "The sample may not be representative of the entire adult population, as it excludes those without landline phones, potentially leading to biased results.",
    "explanation": "This scenario tests the application of random sampling concepts to a real-world situation, highlighting potential sources of bias."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how the concept of random sampling ensures the representativeness of a sample, and discuss the implications of violating this concept in statistical analysis.",
    "answer": "Random sampling ensures representativeness by giving each element in the population an equal chance of being selected, reducing bias and allowing for generalization to the population. Violating this concept can lead to biased samples, inaccurate estimates, and flawed conclusions.",
    "explanation": "This question assesses the ability to articulate and apply the concept of random sampling, as well as its importance in statistical analysis."
  }
]

```