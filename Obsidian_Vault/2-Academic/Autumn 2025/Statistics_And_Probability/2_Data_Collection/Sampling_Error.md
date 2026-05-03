---
title: Sampling_Error
type: Atomic Note
course: Statistics And Probability
semester: Autumn 2025
unit: '2'
hub: "[[2_Data_Collection_Hub]]"
source: "[[2.Pdf]]"
source_pages:
- 13
mode: MATH-STAT
read: false
generated: true
prerequisites:
- "[[Sample]]"
---

# 1. Mental Model
Imagine you're trying to guess the average height of all the students in your school by measuring the heights of just a few of your friends. If your friends happen to be on the basketball team, you might think the average height is much taller than it really is. This mistake is similar to sampling error, which occurs when the characteristics of the sample don't perfectly represent the characteristics of the whole group.

# 2. Statistical Modeling & Inference
Sampling error arises from the variability that occurs when different samples are taken from the same population, resulting in different estimates of the population parameter. This error is a fundamental aspect of [[Statistical_Inference]], as it affects the accuracy of estimates obtained from sample data. Mechanically, sampling error is related to the [[Law_Of_Large_Numbers]], which states that as the sample size increases, the sample mean will converge to the population mean. However, even with large samples, [[Sampling_Variance]] can still occur, leading to discrepancies between the sample statistic and the population parameter. The magnitude of sampling error can be quantified using [[Standard_Error]], which is a measure of the variability of the sample statistic.

# 3. Confounding Variables & Bias
Sampling error can be exacerbated by confounding variables, such as [[Selection_Bias]], which occurs when the sample is not representative of the population due to non-random selection. For instance, if a survey is conducted only online, it may miss people who don't have internet access, leading to biased results. Additionally, [[Non_Response_Bias]] can also contribute to sampling error, as certain groups may be more likely to respond or not respond to a survey. To mitigate these issues, researchers use techniques like [[Stratified_Sampling]] and [[Random_Sampling]] to ensure that the sample is representative of the population. However, even with these techniques, sampling error can still occur, and researchers must account for it when interpreting results.
# 4. Probability Distribution
```markdown
| Sample Statistic | Probability |
| --- | --- |
| 175.2 | 0.1 |
| 176.1 | 0.2 |
| 177.0 | 0.3 |
| 177.9 | 0.2 |
| 178.8 | 0.1 |
| 179.7 | 0.1 |
```
This probability distribution represents the possible sample means of a population with a mean height of 177.5 cm and a standard deviation of 5 cm. The table shows the probability of obtaining each sample mean from a random sample of 10 individuals.

## 5. Walkthrough
Here's a step-by-step walkthrough of a scenario:

1. **Define the population and parameter of interest**: The population consists of all students in a school, and the parameter of interest is the average height of all students.
2. **Take a random sample**: A random sample of 10 students is taken from the population.
3. **Calculate the sample mean**: The heights of the 10 students are measured, and the sample mean is calculated to be 177.2 cm.
4. **Calculate the standard error**: The standard deviation of the population is known to be 5 cm. Using this information, the standard error of the sample mean is calculated to be 1.58 cm.
5. **Determine the probability of the sample mean**: Using the probability distribution table above, the probability of obtaining a sample mean of 177.2 cm is determined to be approximately 0.25.

---

## 6. The Proving Grounds

```interactive-quiz
[
  {
    "id": "q1",
    "type": "true_false",
    "difficulty": "L1",
    "question": "Sampling error occurs due to the variability that occurs when different samples are taken from the same population.",
    "answer": "True",
    "explanation": "Sampling error arises from the variability that occurs when different samples are taken from the same population, resulting in different estimates of the population parameter."
  },
  {
    "id": "q2",
    "type": "scenario",
    "difficulty": "L2",
    "question": "A researcher takes a random sample of 20 students from a population of 1000 students to estimate the average height. If the sample mean is 175.5 cm and the standard error is 2.1 cm, what is the probability that the true population mean is between 173.4 cm and 177.6 cm?",
    "answer": "0.95",
    "explanation": "Using the standard error and the sample mean, we can construct a confidence interval to estimate the population mean. Assuming a normal distribution, the 95% confidence interval is given by the sample mean ± 1.96 × standard error."
  },
  {
    "id": "q3",
    "type": "writing",
    "difficulty": "L3",
    "question": "Explain how sampling error can be reduced in a study. Provide an example of a technique used to minimize sampling error.",
    "answer": "Sampling error can be reduced by increasing the sample size, using stratified sampling or random sampling, and minimizing non-response bias. For example, a researcher can use stratified sampling to ensure that the sample is representative of the population by dividing the population into subgroups and taking a random sample from each subgroup.",
    "explanation": "This question requires the student to demonstrate an understanding of sampling error and techniques to minimize it. The answer should discuss the importance of sample size, stratified sampling, and random sampling in reducing sampling error."
  }
]
```