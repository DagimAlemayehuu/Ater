---

title: Cluster_Random_Sampling
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.pdf]]"
source_pages:
- 34
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Random_Sampling]]"

---

# 1. Mental Model

The concept of Cluster Random Sampling can be analogously understood through the lens of a library's cataloging system. Just as a library organizes books into clusters or sections based on subject matter, and then selects a subset of these sections to focus on, Cluster Random Sampling involves dividing a population into clusters and then randomly selecting some of these clusters to be included in the study. This method ensures that the selected clusters are representative of the population, much like how the selected sections of the library are representative of the library's overall collection.

# 2. Statistical Modeling & Inference

In [[Cluster_Random_Sampling]], the population is divided into clusters, and a random selection of these clusters is chosen for the [[Sample]]. This approach is particularly useful when the population is spread across a large geographic area, making it impractical to sample from the entire [[Population]]. The [[Sampling_Error]] associated with Cluster Random Sampling can be affected by the homogeneity of the clusters; if the clusters are highly heterogeneous, the [[Sample]] may not accurately represent the [[Population]]. The method is a form of [[Random_Sampling]], which helps in reducing [[Sampling_Error]] and ensuring that the [[Collection_Of_Data]] is representative. By using Cluster Random Sampling, researchers can make inferences about the [[Population]] with a certain degree of accuracy, depending on the [[Sample]] size and the [[Response_Rate]].

# 3. Confounding Variables & Bias

Cluster Random Sampling can be susceptible to bias if the clusters are not properly defined or if there are significant differences between the clusters. For instance, if a researcher is studying the average income across different regions and selects clusters that are predominantly urban or rural, the results may not accurately reflect the [[Population]]'s overall income distribution. If the clusters are not representative, this can lead to [[Convenience_Sampling]] bias, where certain groups are over- or underrepresented. The boundary condition for this bias is that the clusters must be defined in a way that minimizes [[Systematic_Random_Sampling]] errors and ensures that the [[Sample]] is a true reflection of the [[Population]]'s characteristics. 

| Cluster Type | Description | Potential Bias |
| --- | --- | --- |
| Urban | High-income areas | Overrepresentation of high-income individuals |
| Rural | Low-income areas | Underrepresentation of high-income individuals | 

In cases where clusters are not well-defined, the method may inadvertently lead to [[Quota_Sampling]] or [[Purposive_Sampling]] biases, which can severely impact the validity of the [[Data_Collection_Methods]].

## 4. Probability Distribution

### Markdown Probability Table

| Cluster | Probability |
| --- | --- |
| 1    | $P(C_1)$  |
| 2    | $P(C_2)$  |
| ...  | ...        |
| $k$  | $P(C_k)$  |

### Block LaTeX Equation

$$
\sum_{i=1}^{k} P(C_i) = 1
$$

The markdown probability table represents the clusters in the population and their corresponding probabilities. Each row represents a cluster, and the probability column represents the chance of selecting that cluster.

The block LaTeX equation represents the fact that the probabilities of all clusters must sum to 1, ensuring that the probability distribution is valid.

## 5. Walkthrough

1. **Define the population and clusters**: Let the population be denoted as $P$, and let it be divided into $k$ clusters, denoted as $C_1, C_2, ..., C_k$.
2. **Assign probabilities to clusters**: Assign a probability to each cluster, denoted as $P(C_1), P(C_2), ..., P(C_k)$, which represents the chance of selecting that cluster.
3. **Ensure probabilities sum to 1**: The probabilities of all clusters must sum to 1, which can be expressed as $\sum_{i=1}^{k} P(C_i) = 1$.
4. **Randomly select clusters**: Randomly select a subset of clusters from the population, using the probabilities assigned in step 2.
5. **Calculate the probability of selection**: For each selected cluster $C_i$, calculate the probability of selection, which is simply $P(C_i)$.
6. **Make inferences about the population**: Use the data from the selected clusters to make inferences about the population, taking into account the probabilities of selection.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "In Cluster Random Sampling, the population is first divided into clusters and then a random sample of these clusters is selected.",
    "answer": true,
    "explanation": "This statement is true as it accurately describes the process of Cluster Random Sampling."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher is studying the average income of a city's residents using Cluster Random Sampling. The city is divided into neighborhoods, and 5 out of 20 neighborhoods are randomly selected. However, instead of including all residents in the selected neighborhoods, the researcher only includes residents living on the main street of each selected neighborhood. What happens?",
    "answer": "The sample may not be representative of the city's residents as a whole, as it excludes residents living in other parts of the selected neighborhoods.",
    "explanation": "By only including residents living on the main street of each selected neighborhood, the sample may be biased towards residents with higher or lower incomes than the average resident in the city, leading to inaccurate conclusions."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how Cluster Random Sampling can be used to estimate the average height of students in a large university.",
    "answer": "Cluster Random Sampling can be used by first dividing the university's students into clusters, such as individual dormitories or academic departments. Then, a random sample of these clusters is selected, and the heights of all students within the selected clusters are measured. The average height of students in the selected clusters can be used to estimate the average height of students in the entire university.",
    "explanation": "This method ensures that the sample is representative of the university's students, as the clusters are randomly selected and all students within the selected clusters are included. However, it's essential to consider potential sources of bias, such as differences in height between students in different clusters."
  }
]

```