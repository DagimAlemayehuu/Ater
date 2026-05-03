---
title: Disadvantage_Of_Sample
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 21
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Sample]]"
---

# 1. Mental Model
Imagine you're trying to guess the favorite ice cream flavor of all the kids in a big school. If you only ask your friends in your class, you might get a skewed answer because your class might have a lot of chocolate lovers, but the whole school might actually prefer vanilla. This is similar to the disadvantage of a sample: it might not accurately represent the whole group it's supposed to represent.

# 2. Statistical Modeling & Inference
The disadvantage of a sample arises because it is a subset of the population, and [[Sampling_Error]] can occur when the sample is not representative of the population. Mechanically, this happens because the sample mean, $\bar{x}$, is used to estimate the population mean, $\mu$, but $\bar{x}$ can vary from sample to sample due to [[Random_Sampling]] and [[Sampling_Variance]]. When we use a sample to make inferences about a population, we rely on [[Statistical_Convergence]], but if the sample is biased, our estimates can be off.

# 3. Confounding Variables & Bias
The disadvantage of a sample is particularly problematic when [[Confounding_Variables]] are present, which can lead to [[Selection_Bias]] and [[Nonresponse_Bias]]. For instance, if a sample is collected through a survey that only reaches people with a certain level of access to technology, it may not accurately represent the views of those without such access. Furthermore, if the sampling frame is flawed, it can lead to [[Frame_Error]], which can further exacerbate the disadvantage of a sample. In order to mitigate these issues, it's essential to carefully design the sampling strategy and ensure that the sample is representative of the population.
# 4. Probability Distribution
```markdown
| Sample Size | Sample Mean | Probability |
| --- | --- | --- |
| 10 | 5.2 | 0.1 |
| 10 | 5.5 | 0.3 |
| 10 | 5.8 | 0.4 |
| 10 | 6.1 | 0.2 |
```
To read this table: it represents a probability distribution of sample means for a given sample size of 10. Each row shows a possible sample mean, its value, and the probability of obtaining that sample mean. This table illustrates how sample means can vary due to random sampling.

## 5. Walkthrough
Let's say we want to estimate the average height of all students in a university. We take a random sample of 100 students and calculate their average height to be 175.2 cm.

1. **Define the population and sample**: The population is all students in the university, and the sample is the 100 students we randomly selected.
2. **Calculate the sample mean**: The sample mean height is 175.2 cm.
3. **Understand the sampling error**: Due to random sampling, the sample mean can vary from the true population mean. Let's assume the true population mean height is 175.5 cm.
4. **Calculate the sampling variance**: The sampling variance of the sample mean is 10.25 cm^2.
5. **Determine the standard error**: The standard error of the sample mean is the square root of the sampling variance, which is √10.25 = 3.2 cm.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "The disadvantage of a sample is that it can be too large to handle.",
    "answer": "False",
    "explanation": "The disadvantage of a sample is that it may not accurately represent the population."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher wants to estimate the average income of all households in a city. She takes a sample of 500 households from a low-income neighborhood. What is the likely issue with her sample?",
    "answer": "The sample may not be representative of the entire city's households, as it only comes from a low-income neighborhood.",
    "explanation": "This sample may suffer from selection bias, as it only represents a subset of the population."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how to mitigate the disadvantage of a sample when estimating the average height of all students in a university.",
    "answer": "To mitigate the disadvantage of a sample, ensure that the sample is randomly selected and representative of the population. Use stratified sampling or oversampling to capture subgroups. Additionally, calculate the sampling variance and standard error to quantify the uncertainty of the estimate.",
    "explanation": "A well-designed sampling strategy and consideration of sampling errors can help mitigate the disadvantage of a sample."
  }
]
```