---

title: Stratified_Random_Sampling
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.pdf]]"
source_pages:
- 32
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Random_Sampling]]"

---

# 1. Mental Model

Stratified random sampling can be thought of as a library organization system, where the entire collection of books (population) is divided into separate sections or genres (strata) such as fiction, non-fiction, biographies, and so on. Just as a librarian would categorize books into these sections to facilitate easier access and retrieval, stratified random sampling categorizes the population into subgroups to ensure that each subgroup is adequately represented in the sample. This way, the sample is more likely to be representative of the population, just like how the organized library sections help in quickly finding a specific book.

# 2. Statistical Modeling & Inference

In [[Stratified_Random_Sampling]], the [[Population]] is divided into distinct subgroups or strata, and a [[Sample]] is drawn from each stratum using [[Simple_Random_Sampling]] or [[Systematic_Random_Sampling]]. This approach ensures that each subgroup is represented in the sample, reducing [[Sampling_Error]] and providing more precise estimates. The strata are often defined based on characteristics that are relevant to the research question, such as age, sex, or geographic location, which helps in achieving a more representative [[Collection_Of_Data]]. By using [[Stratified_Random_Sampling]], researchers can make more accurate inferences about the [[Population]] and reduce the impact of [[Sampling_Error]] on their analysis. The effectiveness of this method depends on the proper definition of strata and the use of adequate [[Sample]] sizes to represent each subgroup.

# 3. Confounding Variables & Bias

If the strata are not properly defined or if there is a failure to sample from each stratum, [[Stratified_Random_Sampling]] can lead to biased estimates and [[Sampling_Error]]. For instance, if a researcher is studying the average income of a population and fails to include a stratum representing low-income households, the sample may not accurately reflect the population's income distribution. 

| Bias Type | Description | Impact |
| --- | --- | --- |
| Selection Bias | Failure to sample from all strata | Biased estimates |
| Non-Response Bias | Low response rate from certain strata | Inaccurate representation |
| Confounding Bias | Failure to account for stratum-specific variables | Incorrect conclusions | 

In such cases, the sample may not be representative of the population, leading to incorrect conclusions and decisions.

## 4. Probability Distribution

The probability distribution for stratified random sampling can be represented as follows:

| Stratum | Proportion of Population | Sample Size |
| --- | --- | --- |
| 1      | $W_1$                     | $n_1$       |
| 2      | $W_2$                     | $n_2$       |
| ...    | ...                       | ...         |
| $L$    | $W_L$                     | $n_L$       |

The probability of selecting an element from stratum $h$ is given by:
$$
P(h) = W_h = \frac{N_h}{N}
$$
where $N_h$ is the population size of stratum $h$ and $N$ is the total population size.

The table represents the proportion of the population and sample size for each stratum, while the LaTeX equation represents the probability of selecting an element from a particular stratum.

## 5. Walkthrough

Here are the steps to derive the probability distribution for stratified random sampling:

1. Let the population be divided into $L$ strata, with stratum $h$ having $N_h$ elements, where $h = 1, 2, ..., L$.
2. The total population size is $N = \sum_{h=1}^{L} N_h$.
3. The proportion of the population in stratum $h$ is $W_h = \frac{N_h}{N}$.
4. A sample of size $n$ is to be selected from the population using stratified random sampling.
5. The sample size for stratum $h$ is $n_h$, and $\sum_{h=1}^{L} n_h = n$.
6. The probability of selecting an element from stratum $h$ is $P(h) = W_h = \frac{N_h}{N} = \frac{n_h}{n}$, assuming proportional allocation.

---

## 6. The Proving Grounds

```interactive-quiz

[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "In stratified random sampling, the population is divided into subgroups to ensure each subgroup is adequately represented in the sample.",
    "answer": true,
    "explanation": "This statement is true and defines the core concept of stratified random sampling."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher is studying the average income of a city's population, which includes a large number of students, working professionals, and retirees. What happens if the researcher uses stratified random sampling to ensure that each group is represented, but accidentally excludes the retiree group from the sample?",
    "answer": "The sample will not be representative of the entire population, particularly the retiree group, which may have a significantly different income profile compared to the other groups.",
    "explanation": "By excluding one of the strata (retirees), the sample will be biased and may not accurately reflect the overall population's average income."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how stratified random sampling helps in reducing the sampling error compared to simple random sampling.",
    "answer": "Stratified random sampling reduces sampling error by ensuring that each subgroup of the population is adequately represented in the sample. This is particularly useful when the population can be divided into distinct subgroups or strata that have different characteristics. By sampling from each stratum separately, the sample can more accurately reflect the diversity of the population, leading to a more precise estimate of the population parameter. In contrast, simple random sampling may inadvertently oversample or undersample certain subgroups, leading to a higher sampling error.",
    "explanation": "This answer demonstrates an understanding of how stratified random sampling can lead to more accurate estimates by ensuring representation across different subgroups, thereby reducing sampling error."
  }
]

```