---

title: Systematic_Random_Sampling
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.pdf]]"
source_pages:
- 30
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Random_Sampling]]"

---

# 1. Mental Model

A systematic random sampling process can be likened to a music playlist shuffling mechanism, where every kth song is selected for a mix. In this analogy, the playlist represents the population, and the kth song selection interval corresponds to the sampling interval. Just as the music playlist has a structured sequence of songs, systematic random sampling involves selecting samples based on a fixed interval or system (e.g., every 10th item), thereby ensuring a spread across the entire population.

# 2. Statistical Modeling & Inference

Systematic random sampling is a method where the sampling frame is ordered in some way and then every kth element is selected; for instance, if we want to [[Collection_Of_Data]] from a [[Population]] of students, we might choose every 10th student from an alphabetical list. This approach can be more efficient than [[Simple_Random_Sampling]] when dealing with large datasets, as it ensures a [[Sample]] that is spread out across the [[Population]], potentially reducing [[Sampling_Error]]. However, it's crucial to ensure that the list isn't ordered in a way that creates a pattern that could bias the [[Sample]], such as ordering by age or grade level. The method requires a [[Random_Sampling]] start point to avoid bias, and the interval (k) is determined by the desired [[Sample]] size and the [[Population]] size. A key consideration is that [[Systematic_Random_Sampling]] can be susceptible to biases if there's a periodic pattern in the [[Population]] that aligns with the sampling interval.

# 3. Confounding Variables & Bias

In systematic random sampling, a critical concern is that if the [[Population]] list has a periodic pattern that matches the sampling interval (k), it could introduce bias; for example, if a list of employees is ordered by department and every 5th employee is selected, but departments change every 5 employees, certain departments might be overrepresented. This issue can be mitigated by randomizing the start point of the sample or using a different sampling method like [[Stratified_Random_Sampling]]. If not properly accounted for, such biases can significantly impact the [[Impact_On_Statistical_Analysis]], leading to incorrect conclusions. Moreover, systematic sampling might not be suitable for [[Scopes_Of_Statistical_Investigations]] where the population list is not readily available or lacks a clear ordering.

## 4. Probability Distribution

| Outcome | Probability |
| --- | --- |
| 0 | $\frac{1}{5}$ |
| 1 | $\frac{1}{5}$ |
| 2 | $\frac{1}{5}$ |
| 3 | $\frac{1}{5}$ |
| 4 | $\frac{1}{5}$ |

$$
P(X = k) = \frac{1}{5}, \quad k = 0, 1, 2, 3, 4
$$

The markdown table represents the possible outcomes and their corresponding probabilities in a systematic random sampling process, where each outcome has an equal chance of occurring. The LaTeX equation defines the probability distribution of the random variable $X$, which takes on values $k$ with a probability of $\frac{1}{5}$.

## 5. Walkthrough

1. Define the population size $N$ and the sample size $n$, where $n = \frac{N}{k}$ and $k$ is the sampling interval.
2. Let $X$ be a random variable representing the outcome of the systematic random sampling process, and assume $X$ takes on values $0, 1, ..., k-1$ with equal probability.
3. The probability of selecting any particular outcome $i$ is $\frac{1}{k}$, since there are $k$ possible outcomes and each has an equal chance of being selected: $P(X = i) = \frac{1}{k}$.
4. For a specific example with $k=5$, the probability distribution of $X$ is given by $P(X = k) = \frac{1}{5}$ for $k = 0, 1, 2, 3, 4$.
5. To calculate the expected value of $X$, we use the formula $E(X) = \sum_{k=0}^{4} k \cdot P(X=k) = \sum_{k=0}^{4} k \cdot \frac{1}{5}$.
6. Evaluating the sum yields $E(X) = 0 \cdot \frac{1}{5} + 1 \cdot \frac{1}{5} + 2 \cdot \frac{1}{5} + 3 \cdot \frac{1}{5} + 4 \cdot \frac{1}{5} = \frac{10}{5} = 2$.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "In systematic random sampling, the sampling interval is fixed.",
    "answer": true,
    "explanation": "Systematic random sampling involves selecting samples based on a fixed interval or system, ensuring a spread across the population."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "Suppose a researcher wants to sample 1000 student records from a university database that contains 10,000 records. If the researcher uses systematic random sampling with a sampling interval of 10, but the database is ordered by student ID in a cyclical pattern (e.g., alphabetical order by last name), what potential issue might arise?",
    "answer": "The sample may not be representative of the population due to the cyclical ordering of the database, potentially leading to biased results.",
    "explanation": "If the database is ordered in a cyclical pattern and the sampling interval aligns with this pattern, it could result in a sample that does not adequately represent the population, as certain subgroups may be over- or underrepresented."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how systematic random sampling can be used to select a sample of 500 households from a list of 5000 households, ensuring that every household has an equal chance of being selected.",
    "answer": "To select a sample of 500 households from a list of 5000 households using systematic random sampling, first, calculate the sampling interval by dividing the total number of households (5000) by the desired sample size (500), which equals 10. Then, randomly select a starting household from the list. Finally, select every 10th household from the list, beginning with the randomly selected household. This ensures that every household has an equal chance of being selected, as each household has a 1 in 10 chance of being chosen.",
    "explanation": "Systematic random sampling provides a methodical approach to selecting samples from a large population, ensuring that the sample is spread out and representative. By using a fixed interval (in this case, 10), the method guarantees that every household has an equal probability of selection, reducing bias and increasing the reliability of the sample for statistical analysis."
  }
]

```