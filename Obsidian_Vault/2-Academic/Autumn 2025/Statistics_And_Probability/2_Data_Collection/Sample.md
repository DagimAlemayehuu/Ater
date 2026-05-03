---

title: Sample
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.pdf]]"
source_pages:
- 12
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Population]]"

---

# 1. Mental Model

A sample can be thought of as a miniature representation of a larger population, similar to how a small-scale model of a city represents the city's layout and structure. Just as a model city has a scaled-down version of roads, buildings, and neighborhoods, a sample has a smaller set of individuals that mirror the characteristics of the larger population. This analogy highlights the importance of selecting a representative sample, just as a model city's accuracy relies on its proportional representation of the actual city's features.

# 2. Statistical Modeling & Inference

In statistical analysis, a [[Sample]] is a subset of individuals selected from a [[Population]], which is the entire group of individuals of interest. The process of selecting a [[Sample]] is crucial, as it can be done through various methods, including [[Random_Sampling]], [[Simple_Random_Sampling]], [[Systematic_Random_Sampling]], [[Stratified_Random_Sampling]], and [[Cluster_Random_Sampling]], each with its own advantages and disadvantages. When a [[Sample]] is selected, it is essential to consider the [[Sampling_Error]], which is the difference between the sample statistic and the population parameter. A [[Sample]] is often used when it is impractical or impossible to collect data from the entire [[Population]], known as a [[Census]]. The [[Collection_Of_Data]] process involves selecting a [[Sample]] that accurately represents the [[Population]], which is critical for making inferences about the population.

# 3. Confounding Variables & Bias

If a [[Sample]] is not representative of the [[Population]], it can lead to biased estimates and incorrect conclusions. This can occur when there are [[Convenience_Sampling]] or [[Quota_Sampling]] methods used, which can introduce [[Sampling_Error]]. 

| Selection Method | Potential Bias |
|---|---|
| Convenience Sampling | Over-representation of easily accessible individuals |
| Quota Sampling | Over-representation of certain subgroups |

In such cases, the [[Sample]] may not accurately reflect the characteristics of the [[Population]], leading to flawed statistical analysis and incorrect inferences.

## 4. Probability Distribution

| $X$ | $P(X)$ |
| --- | --- |
| 0    | 0.2    |
| 1    | 0.3    |
| 2    | 0.5    |

$$
E(X) = \sum_{x} xP(x) = 0 \cdot 0.2 + 1 \cdot 0.3 + 2 \cdot 0.5 = 1.3
$$

The probability table represents the distribution of a discrete random variable $X$, where each row corresponds to a possible value of $X$ and its associated probability $P(X)$. The block LaTeX equation calculates the expected value of $X$, denoted as $E(X)$, by summing the product of each value of $X$ and its probability.

## 5. Walkthrough

1. Define a discrete random variable $X$ with possible values $x \in \{0, 1, 2\}$.
2. Assign probabilities to each value of $X$: $P(X=0) = 0.2$, $P(X=1) = 0.3$, and $P(X=2) = 0.5$.
3. Verify that the probabilities satisfy the condition $\sum_{x} P(x) = 1$: $0.2 + 0.3 + 0.5 = 1$.
4. Calculate the expected value of $X$ using the formula $E(X) = \sum_{x} xP(x)$.
5. Substitute the values of $X$ and their probabilities into the formula: $E(X) = 0 \cdot 0.2 + 1 \cdot 0.3 + 2 \cdot 0.5$.
6. Simplify the expression to obtain the expected value: $E(X) = 0 + 0.3 + 1 = 1.3$.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "A sample is a miniature representation of a larger population.",
    "answer": true,
    "explanation": "This statement is true by definition of a sample in statistics."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Given that a researcher wants to study the average income of a city with 1 million residents, but only has resources to collect data from 1000 residents. What happens if the researcher selects only residents from a single neighborhood with a predominantly high-income population?",
    "answer": "The sample will likely be biased and not representative of the city's overall average income.",
    "explanation": "This is because the sample would not accurately reflect the diversity of incomes across the entire city, leading to a biased representation."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how a non-representative sample can affect the validity of statistical inferences made about a population.",
    "answer": "A non-representative sample can lead to biased estimates and incorrect conclusions about the population. This is because the sample's characteristics may not accurately reflect those of the population, resulting in flawed statistical inferences.",
    "explanation": "For instance, if a sample overrepresents a certain subgroup, the results may incorrectly suggest a phenomenon is more prevalent than it actually is in the population."
  }
]

```